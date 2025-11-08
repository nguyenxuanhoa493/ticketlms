-- =====================================================
-- Update Ticket Status Notification Format
-- Date: 2025-02-08
-- Description: Updates notification title and message format
--              for ticket status changes with bold name and tag
-- =====================================================

CREATE OR REPLACE FUNCTION create_ticket_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    updater_name TEXT;
    status_text TEXT;
    status_badge TEXT;
BEGIN
    -- Only trigger if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        BEGIN
            -- Get updater's name (may be null if updated by system)
            SELECT full_name INTO updater_name
            FROM profiles
            WHERE id = auth.uid();

            -- Map status to Vietnamese text (match with ticket badge labels)
            status_text := CASE NEW.status::text
                WHEN 'open' THEN 'Mở'
                WHEN 'in_progress' THEN 'Đang làm'
                WHEN 'closed' THEN 'Đã đóng'
                ELSE NEW.status::text
            END;

            -- Create status badge with styling
            status_badge := '<span class="status-badge status-' || NEW.status::text || '">' || status_text || '</span>';

            -- Create notification for ticket creator (if different from updater)
            IF NEW.created_by IS NOT NULL AND NEW.created_by != COALESCE(auth.uid(), NEW.created_by) THEN
                INSERT INTO notifications (
                    user_id,
                    type,
                    title,
                    message,
                    ticket_id,
                    created_by
                ) VALUES (
                    NEW.created_by,
                    'ticket_status_changed',
                    'Ticket ' || NEW.title,
                    '<strong>' || COALESCE(updater_name, 'Hệ thống') || '</strong>' || 
                    ' đã chuyển trạng thái ' || status_badge,
                    NEW.id,
                    auth.uid()
                );
            END IF;

            -- Also notify assigned user if different from creator and updater
            IF NEW.assigned_to IS NOT NULL 
               AND NEW.assigned_to != NEW.created_by 
               AND NEW.assigned_to != COALESCE(auth.uid(), NEW.assigned_to) THEN
                INSERT INTO notifications (
                    user_id,
                    type,
                    title,
                    message,
                    ticket_id,
                    created_by
                ) VALUES (
                    NEW.assigned_to,
                    'ticket_status_changed',
                    'Ticket ' || NEW.title,
                    '<strong>' || COALESCE(updater_name, 'Hệ thống') || '</strong>' || 
                    ' đã chuyển trạng thái ' || status_badge,
                    NEW.id,
                    auth.uid()
                );
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error but don't block the ticket update
                RAISE WARNING 'Failed to create ticket status notification: %', SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was updated
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'create_ticket_status_notification'
    ) THEN
        RAISE NOTICE 'Function create_ticket_status_notification has been successfully updated';
    ELSE
        RAISE EXCEPTION 'Failed to update function create_ticket_status_notification';
    END IF;
END $$;
