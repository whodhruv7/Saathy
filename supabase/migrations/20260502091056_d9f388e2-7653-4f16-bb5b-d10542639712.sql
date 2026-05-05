
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: users read own"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Profiles: users update own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Profiles: users insert own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Usage counters: tracks per-user per-mode request count and reset window
CREATE TABLE public.usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, mode)
);

CREATE INDEX usage_counters_user_idx ON public.usage_counters(user_id);

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usage: users read own"
ON public.usage_counters FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Atomic increment with 24h reset; returns the new count and the cap
CREATE OR REPLACE FUNCTION public.increment_usage(_mode TEXT, _cap INT)
RETURNS TABLE (allowed BOOLEAN, new_count INT, cap INT, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  rec public.usage_counters%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert if missing
  INSERT INTO public.usage_counters (user_id, mode, count, window_start)
  VALUES (uid, _mode, 0, now())
  ON CONFLICT (user_id, mode) DO NOTHING;

  -- Reset window if expired
  UPDATE public.usage_counters
    SET count = 0, window_start = now(), updated_at = now()
    WHERE user_id = uid AND mode = _mode AND window_start < now() - INTERVAL '24 hours';

  -- Lock + read
  SELECT * INTO rec FROM public.usage_counters
    WHERE user_id = uid AND mode = _mode FOR UPDATE;

  IF rec.count >= _cap THEN
    RETURN QUERY SELECT FALSE, rec.count, _cap, rec.window_start + INTERVAL '24 hours';
    RETURN;
  END IF;

  UPDATE public.usage_counters
    SET count = count + 1, updated_at = now()
    WHERE user_id = uid AND mode = _mode
    RETURNING count INTO rec.count;

  RETURN QUERY SELECT TRUE, rec.count, _cap, rec.window_start + INTERVAL '24 hours';
END;
$$;
