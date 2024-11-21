import {
  pgTable as table,
  integer,
  varchar,
  date,
  serial,
} from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";
import { fundraisers } from "./fundraisers";
import { supporters } from "./supporters";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";

export const draws = table("draws", {
  id: serial("id").primaryKey(),
  drawDate: date("draw_date"),
  prize: varchar("prize"),
  fundraiserId: integer("fundraiser_id").references(() => fundraisers.id, {
    onDelete: "cascade",
  }),
  supporterId: integer("supporter_id").references(() => supporters.id),
  ...timestamps,
});

export const createPickWinnerProcedure = sql`
  CREATE OR REPLACE PROCEDURE pick_draw_winner(
    IN p_draw_id INTEGER,
    INOUT p_selected_supporter_id INTEGER,
    INOUT p_first_name VARCHAR,
    INOUT p_last_name VARCHAR,
    INOUT p_email VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_fundraiser_id INTEGER;
    v_draw_date DATE;
    v_random_ticket INTEGER;
    v_total_tickets INTEGER;
    v_winning_ticket INTEGER;
BEGIN
    -- Get draw info and lock the row
    SELECT d.fundraiser_id, d.draw_date, f.tickets_sold
    INTO v_fundraiser_id, v_draw_date, v_total_tickets
    FROM draws d
    JOIN fundraisers f ON f.id = d.fundraiser_id
    WHERE d.id = p_draw_id
    FOR UPDATE OF d;
    
    -- Validate draw exists
    IF v_fundraiser_id IS NULL THEN
        RAISE EXCEPTION 'Draw not found';
    END IF;

    -- Check if draw date is valid
    IF v_draw_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Draw date is in the future';
    END IF;

    -- Check if winner already selected
    IF EXISTS (SELECT 1 FROM draws WHERE id = p_draw_id AND supporter_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Winner already selected for this draw';
    END IF;

    -- Verify tickets exist
    IF v_total_tickets = 0 THEN
        RAISE EXCEPTION 'No tickets sold for this fundraiser';
    END IF;

    -- Select a random ticket number
    v_random_ticket := floor(random() * v_total_tickets) + 1;

    -- Find the winning ticket owner
    WITH ticket_ranges AS (
        SELECT 
            o.supporter_id,
            s.first_name,
            s.last_name,
            s.email,
            o.ticket_numbers
        FROM orders o
        JOIN supporters s ON s.id = o.supporter_id
        WHERE o.fundraiser_id = v_fundraiser_id
        AND o.stripe_payment_status = 'succeeded'
    )
    SELECT 
        supporter_id,
        first_name,
        last_name,
        email
    INTO 
        p_selected_supporter_id,
        p_first_name,
        p_last_name,
        p_email
    FROM ticket_ranges
    WHERE v_random_ticket = ANY(ticket_numbers)
    LIMIT 1;

    -- Verify winner was found
    IF p_selected_supporter_id IS NULL THEN
        RAISE EXCEPTION 'Failed to select winner';
    END IF;

    -- Record the winner
    UPDATE draws
    SET supporter_id = p_selected_supporter_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_draw_id;

    -- Commit the transaction
    COMMIT;
END;
$$;`

export type Draw = InferSelectModel<typeof draws>;
export type NewDraw = InferInsertModel<typeof draws>;
