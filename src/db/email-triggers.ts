import { sql } from "drizzle-orm";

export const createOrderEmailTrigger = sql.raw(`
CREATE OR REPLACE FUNCTION notify_order_email()
RETURNS TRIGGER AS $$
DECLARE
    notification_data JSONB;
    supporter_info RECORD;
    fundraiser_info RECORD;
BEGIN
    RAISE NOTICE 'Trigger fired for order ID: %', NEW.id;
    RAISE NOTICE 'Payment status: %', NEW.stripe_payment_status;

    -- Only send email if payment status is 'succeeded'
    IF NEW.stripe_payment_status = 'succeeded' THEN
        RAISE NOTICE 'Payment succeeded, fetching supporter info for ID: %', NEW.supporter_id;
        
        -- Get supporter information
        SELECT s.first_name, s.last_name, s.email
        INTO supporter_info
        FROM supporters s
        WHERE s.id = NEW.supporter_id;
        
        IF supporter_info IS NULL THEN
            RAISE NOTICE 'No supporter found for ID: %', NEW.supporter_id;
            RETURN NEW;
        END IF;
        RAISE NOTICE 'Found supporter: % %', supporter_info.first_name, supporter_info.last_name;

        -- Get fundraiser information
        RAISE NOTICE 'Fetching fundraiser info for ID: %', NEW.fundraiser_id;
        SELECT f.title, f.price_per_ticket
        INTO fundraiser_info
        FROM fundraisers f
        WHERE f.id = NEW.fundraiser_id;
        
        IF fundraiser_info IS NULL THEN
            RAISE NOTICE 'No fundraiser found for ID: %', NEW.fundraiser_id;
            RETURN NEW;
        END IF;
        RAISE NOTICE 'Found fundraiser: %', fundraiser_info.title;

        -- Build notification data
        RAISE NOTICE 'Building notification data';
        notification_data = jsonb_build_object(
            'type', 'order_confirmation',
            'supporter_email', supporter_info.email,
            'supporter_name', supporter_info.first_name || ' ' || supporter_info.last_name,
            'fundraiser_title', fundraiser_info.title,
            'ticket_numbers', NEW.ticket_numbers,
            'amount', NEW.amount,
            'price_per_ticket', fundraiser_info.price_per_ticket,
            'order_id', NEW.id,
            'created_at', NEW.created_at
        );

        -- Send notification
        RAISE NOTICE 'Sending notification with data: %', notification_data::text;
        PERFORM pg_notify('email_events', notification_data::text);
        RAISE NOTICE 'Notification sent successfully';
    ELSE
        RAISE NOTICE 'Payment status is not succeeded, skipping email';
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in trigger: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_order_email ON orders;

-- Create trigger for new orders
CREATE TRIGGER trigger_order_email
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_email();
`);
