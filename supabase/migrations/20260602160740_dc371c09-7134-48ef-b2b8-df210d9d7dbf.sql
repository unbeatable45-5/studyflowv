CREATE TABLE public.exam_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mode TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  topics_weak TEXT[] NOT NULL DEFAULT '{}',
  topics_strong TEXT[] NOT NULL DEFAULT '{}',
  recommended_focus TEXT,
  time_used_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_sessions TO authenticated;
GRANT ALL ON public.exam_sessions TO service_role;

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exam sessions"
ON public.exam_sessions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exam sessions"
ON public.exam_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exam sessions"
ON public.exam_sessions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_exam_sessions_user_created ON public.exam_sessions(user_id, created_at DESC);