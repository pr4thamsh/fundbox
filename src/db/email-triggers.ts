import { sql } from "drizzle-orm";

export const createOrderEmailTrigger = sql.raw(`
    CREATE OR REPLACE FUNCTION notify_order_email()
    RETURNS TRIGGER AS $$
    DECLARE
        notification_data JSONB;
        supporter_info RECORD;
        fundraiser_info RECORD;
    BEGIN
        -- Only send email if payment status is 'succeeded'
        IF NEW.stripe_payment_status = 'succeeded' THEN
            -- Get supporter and fundraiser information
            SELECT s.first_name, s.last_name, s.email
            INTO supporter_info
            FROM supporters s
            WHERE s.id = NEW.supporter_id;
    
            SELECT f.title, f.price_per_ticket
            INTO fundraiser_info
            FROM fundraisers f
            WHERE f.id = NEW.fundraiser_id;
    
            -- Build email data
            notification_data = jsonb_build_object(
                'type', 'order_confirmation',
                'supporter_email', supporter_info.email,
                'supporter_name', supporter_info.first_name || ' ' || supporter_info.last_name,
                'fundraiser_title', fundraiser_info.title,
                'ticket_numbers', NEW.ticket_numbers,
                'amount', NEW.amount,
                'price_per_ticket', fundraiser_info.price_per_ticket,
                'order_id', NEW.id
            );
    
            -- Insert into pending_emails instead of pg_notify
            INSERT INTO pending_emails (email_data, status)
            VALUES (notification_data, 'pending');
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `);
