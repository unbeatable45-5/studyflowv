
CREATE TABLE public.flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic text NOT NULL,
  card_front text NOT NULL,
  card_back text NOT NULL,
  ease_factor real NOT NULL DEFAULT 2.5,
  interval_days integer NOT NULL DEFAULT 0,
  repetitions integer NOT NULL DEFAULT 0,
  next_review_at timestamp with time zone NOT NULL DEFAULT now(),
  last_reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own flashcard reviews"
ON public.flashcard_reviews FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcard reviews"
ON public.flashcard_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcard reviews"
ON public.flashcard_reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcard reviews"
ON public.flashcard_reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
