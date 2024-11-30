import { sql } from "drizzle-orm";

export const createPickWinnerProcedure = sql.raw(`
    DROP FUNCTION pick_draw_winner(integer);
    CREATE OR REPLACE FUNCTION pick_draw_winner(p_draw_id INTEGER)
    RETURNS TABLE (
        supporter_id INTEGER,
        first_name VARCHAR,
        last_name VARCHAR,
        email VARCHAR,
        winning_ticket_number INTEGER
    ) 
    LANGUAGE plpgsql
    AS $$
    DECLARE
        v_fundraiser_id INTEGER;
        v_draw_date DATE;
        v_random_ticket INTEGER;
        v_total_tickets INTEGER;
        v_selected_supporter_id INTEGER;
        v_first_name VARCHAR;
        v_last_name VARCHAR;
        v_email VARCHAR;
        v_available_tickets INTEGER[];
    BEGIN
        -- Get draw info and lock the row
        SELECT d.fundraiser_id, d.draw_date, f.tickets_sold
        INTO v_fundraiser_id, v_draw_date, v_total_tickets
        FROM draws d
        JOIN fundraisers f ON f.id = d.fundraiser_id
        WHERE d.id = p_draw_id
        FOR UPDATE OF d;
        
        RAISE NOTICE 'Fundraiser ID: %, Total Tickets: %', v_fundraiser_id, v_total_tickets;

        SELECT array_agg(DISTINCT ticket_num::integer ORDER BY ticket_num::integer)
        INTO v_available_tickets
        FROM (
            SELECT unnest(ticket_numbers) as ticket_num
            FROM orders o
            WHERE o.fundraiser_id = v_fundraiser_id
            AND o.stripe_payment_status = 'succeeded'
        ) t;
        
        RAISE NOTICE 'Available ticket numbers: %', v_available_tickets;

        -- Validate draw exists
        IF v_fundraiser_id IS NULL THEN
            RAISE EXCEPTION 'Draw not found';
        END IF;

        -- Check if draw date is valid
        IF v_draw_date > CURRENT_DATE THEN
            RAISE EXCEPTION 'Draw date is in the future';
        END IF;

        -- Check if winner already selected
        IF EXISTS (SELECT 1 FROM draws d WHERE d.id = p_draw_id AND d.supporter_id IS NOT NULL) THEN
            RAISE EXCEPTION 'Winner already selected for this draw';
        END IF;

        -- Verify tickets exist
        IF array_length(v_available_tickets, 1) IS NULL THEN
            RAISE EXCEPTION 'No tickets sold for this fundraiser';
        END IF;

        -- Select a random ticket from the available tickets
        WITH shuffled_tickets AS (
            SELECT unnest(v_available_tickets) as ticket_num,
                random() as random_order
            FROM generate_series(1, array_length(v_available_tickets, 1))
        )
        SELECT ticket_num INTO v_random_ticket
        FROM shuffled_tickets
        ORDER BY random_order
        LIMIT 1;
        
        RAISE NOTICE 'Selected random ticket: % from available tickets: %', 
            v_random_ticket, 
            v_available_tickets;

        -- Find the winning ticket owner
        WITH ticket_ranges AS (
            SELECT 
                o.supporter_id as tr_supporter_id,
                s.first_name as tr_first_name,
                s.last_name as tr_last_name,
                s.email as tr_email,
                o.ticket_numbers
            FROM orders o
            JOIN supporters s ON s.id = o.supporter_id
            WHERE o.fundraiser_id = v_fundraiser_id
            AND o.stripe_payment_status = 'succeeded'
        )
        SELECT 
            tr_supporter_id,
            tr_first_name,
            tr_last_name,
            tr_email
        INTO 
            v_selected_supporter_id,
            v_first_name,
            v_last_name,
            v_email
        FROM ticket_ranges
        WHERE v_random_ticket = ANY(ticket_numbers)
        LIMIT 1;

        RAISE NOTICE 'Selected supporter ID: % (%, %)', 
            COALESCE(v_selected_supporter_id::text, '<none>'),
            COALESCE(v_first_name, '<none>'),
            COALESCE(v_last_name, '<none>');

        -- Verify winner was found
        IF v_selected_supporter_id IS NULL THEN
            RAISE EXCEPTION 'Failed to select winner for ticket %', v_random_ticket;
        END IF;

        -- Record the winner
        UPDATE draws d
        SET supporter_id = v_selected_supporter_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE d.id = p_draw_id;

        -- Return the result with the winning ticket number
        RETURN QUERY 
        SELECT 
            v_selected_supporter_id as supporter_id,
            v_first_name as first_name,
            v_last_name as last_name,
            v_email as email,
            v_random_ticket as winning_ticket_number;
    END;
    $$;`);
