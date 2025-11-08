-- =====================================================
-- Re-enable Ticket Status Notification Trigger
-- Date: 2025-02-08
-- Description: Re-enables the trigger for ticket status
--              change notifications
-- =====================================================

-- Drop the trigger if it exists (in case it was disabled)
DROP TRIGGER IF EXISTS create_ticket_status_notification_trigger ON tickets;

-- Re-create the trigger
CREATE TRIGGER create_ticket_status_notification_trigger
    AFTER UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION create_ticket_status_notification();

-- Verify the trigger was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'create_ticket_status_notification_trigger'
    ) THEN
        RAISE NOTICE 'Trigger create_ticket_status_notification_trigger has been successfully enabled';
    ELSE
        RAISE EXCEPTION 'Failed to create trigger create_ticket_status_notification_trigger';
    END IF;
END $$;
