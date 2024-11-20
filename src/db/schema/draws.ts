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
  DROP PROCEDURE IF EXISTS pick_draw_winner;

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
    v_total_tickets INTEGER;
    v_random_ticket INTEGER;
BEGIN
    -- Get draw info
    SELECT fundraiser_id, draw_date 
    INTO v_fundraiser_id, v_draw_date
    FROM draws 
    WHERE id = p_draw_id 
    FOR UPDATE;

    -- Basic validations
    IF v_draw_date != CURRENT_DATE THEN
        RAISE EXCEPTION 'Draw can only be processed on the scheduled date';
    END IF;

    IF EXISTS (SELECT 1 FROM draws WHERE id = p_draw_id AND supporter_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Winner already selected for this draw';
    END IF;

    -- Get winning ticket number at random
    SELECT array_position(ticket_numbers, v_random_ticket), s.id, s.first_name, s.last_name, s.email
    INTO p_selected_supporter_id, p_first_name, p_last_name, p_email
    FROM orders o
    JOIN supporters s ON s.id = o.supporter_id
    WHERE o.fundraiser_id = v_fundraiser_id
    AND o.stripe_payment_status = 'succeeded'
    ORDER BY random()
    LIMIT 1;

    IF p_selected_supporter_id IS NULL THEN
        RAISE EXCEPTION 'No tickets found for this fundraiser';
    END IF;

    -- Record the winner
    UPDATE draws
    SET supporter_id = p_selected_supporter_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_draw_id;
END;
$$;`

export type Draw = InferSelectModel<typeof draws>;
export type NewDraw = InferInsertModel<typeof draws>;
