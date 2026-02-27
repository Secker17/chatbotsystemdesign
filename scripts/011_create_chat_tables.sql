-- Chat Sessions Table
-- Tracks user sessions with the chatbot
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
    user_identifier VARCHAR(255) NOT NULL, -- Can be email, user ID, or any identifier
    user_name VARCHAR(100), -- Display name for the user
    is_active BOOLEAN DEFAULT true, -- Whether the session is currently active
    message_count INTEGER DEFAULT 0, -- Number of messages in this session
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Last activity timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
-- Stores individual messages within sessions
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'bot')), -- Who sent the message
    content TEXT NOT NULL, -- Message content
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')), -- Type of message
    metadata JSONB, -- Additional metadata (file info, image URLs, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_chatbot_id ON chat_sessions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_identifier ON chat_sessions(user_identifier);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_active ON chat_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_activity ON chat_sessions(last_activity DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- RLS (Row Level Security) Policies
-- Enable RLS on both tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy for chat_sessions
-- Users can only access sessions for their own chatbot
CREATE POLICY "Users can view their own chatbot sessions" ON chat_sessions
    FOR ALL USING (
        chatbot_id IN (
            SELECT id FROM chatbots 
            WHERE workspace_id = auth.uid()
        )
    );

-- Policy for chat_messages
-- Users can only access messages from their own chatbot sessions
CREATE POLICY "Users can view their own chatbot messages" ON chat_messages
    FOR ALL USING (
        session_id IN (
            SELECT id FROM chat_sessions 
            WHERE chatbot_id IN (
                SELECT id FROM chatbots 
                WHERE workspace_id = auth.uid()
            )
        )
    );

-- Comments
COMMENT ON TABLE chat_sessions IS 'Tracks individual user chat sessions with chatbots';
COMMENT ON TABLE chat_messages IS 'Stores individual chat messages within sessions';

COMMENT ON COLUMN chat_sessions.user_identifier IS 'Unique identifier for the user (email, ID, etc.)';
COMMENT ON COLUMN chat_sessions.user_name IS 'Display name shown in chat interface';
COMMENT ON COLUMN chat_sessions.is_active IS 'Whether the session is currently active';
COMMENT ON COLUMN chat_sessions.message_count IS 'Total number of messages in this session';
COMMENT ON COLUMN chat_sessions.last_activity IS 'Timestamp of last message or interaction';

COMMENT ON COLUMN chat_messages.sender IS 'Who sent the message: user or bot';
COMMENT ON COLUMN chat_messages.content IS 'The actual message content';
COMMENT ON COLUMN chat_messages.message_type IS 'Type of message: text, image, or file';
COMMENT ON COLUMN chat_messages.metadata IS 'Additional data like file URLs, image info, etc.';
