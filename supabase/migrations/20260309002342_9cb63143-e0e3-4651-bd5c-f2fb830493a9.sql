-- Create comments table for group discussions
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_content_id UUID NOT NULL REFERENCES public.shared_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments for shared content in groups they're members of
CREATE POLICY "Users can view comments in their groups"
ON public.comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_content sc
    JOIN public.group_memberships gm ON gm.group_id = sc.group_id
    WHERE sc.id = comments.shared_content_id
      AND gm.user_id = auth.uid()
  )
);

-- Users can insert comments in groups they're members of
CREATE POLICY "Users can comment in their groups"
ON public.comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.shared_content sc
    JOIN public.group_memberships gm ON gm.group_id = sc.group_id
    WHERE sc.id = comments.shared_content_id
      AND gm.user_id = auth.uid()
  )
);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_comments_shared_content ON public.comments(shared_content_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;