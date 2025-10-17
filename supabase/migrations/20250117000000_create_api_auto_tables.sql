-- Create api_auto_folders table
CREATE TABLE IF NOT EXISTS public.api_auto_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.api_auto_folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_auto_flows table
CREATE TABLE IF NOT EXISTS public.api_auto_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    flow_type TEXT NOT NULL, -- 'clone_program', 'create_users', etc.
    folder_id UUID REFERENCES public.api_auto_folders(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}', -- Flow configuration
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_auto_execution_history table
CREATE TABLE IF NOT EXISTS public.api_auto_execution_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID NOT NULL REFERENCES public.api_auto_flows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inputs JSONB DEFAULT '{}',
    outputs JSONB DEFAULT '{}',
    status TEXT NOT NULL, -- 'success', 'failed', 'running'
    error_message TEXT,
    execution_time INTEGER, -- in milliseconds
    request_history JSONB DEFAULT '[]', -- Store all API calls made
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_auto_folders_user_id ON public.api_auto_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_api_auto_folders_parent_id ON public.api_auto_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_api_auto_flows_user_id ON public.api_auto_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_api_auto_flows_folder_id ON public.api_auto_flows(folder_id);
CREATE INDEX IF NOT EXISTS idx_api_auto_flows_flow_type ON public.api_auto_flows(flow_type);
CREATE INDEX IF NOT EXISTS idx_api_auto_execution_history_flow_id ON public.api_auto_execution_history(flow_id);
CREATE INDEX IF NOT EXISTS idx_api_auto_execution_history_user_id ON public.api_auto_execution_history(user_id);

-- Enable Row Level Security
ALTER TABLE public.api_auto_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_auto_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_auto_execution_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_auto_folders
CREATE POLICY "Users can view their own folders"
    ON public.api_auto_folders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
    ON public.api_auto_folders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
    ON public.api_auto_folders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
    ON public.api_auto_folders FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for api_auto_flows
CREATE POLICY "Users can view their own flows"
    ON public.api_auto_flows FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flows"
    ON public.api_auto_flows FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flows"
    ON public.api_auto_flows FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flows"
    ON public.api_auto_flows FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for api_auto_execution_history
CREATE POLICY "Users can view their own execution history"
    ON public.api_auto_execution_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own execution history"
    ON public.api_auto_execution_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_api_auto_folders_updated_at
    BEFORE UPDATE ON public.api_auto_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_auto_flows_updated_at
    BEFORE UPDATE ON public.api_auto_flows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
