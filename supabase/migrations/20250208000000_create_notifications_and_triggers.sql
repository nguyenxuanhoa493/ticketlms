-- =====================================================
-- Create Notifications Table and Triggers
-- Date: 2025-02-08
-- Description: Creates notifications table and automatic
--              triggers for comment replies and ticket status changes
-- =====================================================

-- ===========================================
-- 1. CREATE NOTIFICATION TYPE ENUM
-- ===========================================
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'ticket_status_changed',
        'ticket_commented',
        'comment_replied'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===========================================
-- 2. CREATE NOTIFICATIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_ticket_id ON notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_comment_id ON notifications(comment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 3. RLS POLICIES FOR NOTIFICATIONS
-- ===========================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
    ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
    ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications"
    ON notifications
    FOR DELETE
    USING (user_id = auth.uid());

-- ===========================================
-- 4. FUNCTION TO CREATE COMMENT NOTIFICATIONS
-- ===========================================
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    ticket_creator_id UUID;
    parent_comment_creator_id UUID;
    commenter_name TEXT;
    ticket_title TEXT;
BEGIN
    -- Get commenter's name
    SELECT full_name INTO commenter_name
    FROM profiles
    WHERE id = NEW.user_id;

    -- Get ticket info
    SELECT created_by, title INTO ticket_creator_id, ticket_title
    FROM tickets
    WHERE id = NEW.ticket_id;

    -- If this is a reply to another comment
    IF NEW.parent_id IS NOT NULL THEN
        -- Get the parent comment creator
        SELECT user_id INTO parent_comment_creator_id
        FROM comments
        WHERE id = NEW.parent_id;

        -- Create notification for parent comment creator (if not the same user)
        IF parent_comment_creator_id IS NOT NULL AND parent_comment_creator_id != NEW.user_id THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                ticket_id,
                comment_id,
                created_by
            ) VALUES (
                parent_comment_creator_id,
                'comment_replied',
                'Có người trả lời bình luận của bạn',
                commenter_name || ' đã trả lời bình luận của bạn trong ticket "' || ticket_title || '"',
                NEW.ticket_id,
                NEW.id,
                NEW.user_id
            );
        END IF;

        -- Also notify ticket creator if different from comment replier and parent comment creator
        IF ticket_creator_id IS NOT NULL 
           AND ticket_creator_id != NEW.user_id 
           AND ticket_creator_id != parent_comment_creator_id THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                ticket_id,
                comment_id,
                created_by
            ) VALUES (
                ticket_creator_id,
                'ticket_commented',
                'Có bình luận mới trong ticket của bạn',
                commenter_name || ' đã bình luận trong ticket "' || ticket_title || '"',
                NEW.ticket_id,
                NEW.id,
                NEW.user_id
            );
        END IF;

    ELSE
        -- This is a direct comment on the ticket (not a reply)
        -- Notify ticket creator (if not the same user)
        IF ticket_creator_id IS NOT NULL AND ticket_creator_id != NEW.user_id THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                ticket_id,
                comment_id,
                created_by
            ) VALUES (
                ticket_creator_id,
                'ticket_commented',
                'Có bình luận mới trong ticket của bạn',
                commenter_name || ' đã bình luận trong ticket "' || ticket_title || '"',
                NEW.ticket_id,
                NEW.id,
                NEW.user_id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to comments table
DROP TRIGGER IF EXISTS create_comment_notification_trigger ON comments;
CREATE TRIGGER create_comment_notification_trigger
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION create_comment_notification();

-- ===========================================
-- 5. FUNCTION TO CREATE TICKET STATUS NOTIFICATIONS
-- ===========================================
CREATE OR REPLACE FUNCTION create_ticket_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    updater_name TEXT;
    status_text TEXT;
BEGIN
    -- Only trigger if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        BEGIN
            -- Get updater's name (may be null if updated by system)
            SELECT full_name INTO updater_name
            FROM profiles
            WHERE id = auth.uid();

            -- Map status to Vietnamese text (only for display in notification message)
            status_text := CASE NEW.status::text
                WHEN 'open' THEN 'Mở'
                WHEN 'in_progress' THEN 'Đang xử lý'
                WHEN 'closed' THEN 'Đã đóng'
                ELSE NEW.status::text
            END;

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
                    'Trạng thái ticket của bạn đã thay đổi',
                    COALESCE(updater_name || ' đã thay đổi', 'Trạng thái đã thay đổi') || 
                    ' trạng thái ticket "' || NEW.title || '" thành "' || status_text || '"',
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
                    'Trạng thái ticket được giao cho bạn đã thay đổi',
                    COALESCE(updater_name || ' đã thay đổi', 'Trạng thái đã thay đổi') || 
                    ' trạng thái ticket "' || NEW.title || '" thành "' || status_text || '"',
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

-- Attach trigger to tickets table
DROP TRIGGER IF EXISTS create_ticket_status_notification_trigger ON tickets;
CREATE TRIGGER create_ticket_status_notification_trigger
    AFTER UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION create_ticket_status_notification();

-- ===========================================
-- 6. GRANT PERMISSIONS
-- ===========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
