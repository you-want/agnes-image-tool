-- This app uses the existing yanhuofood WeChat issuer and account database.
-- Apply to that SAME Supabase project; never change its WeChat callback URL.
DO $$
BEGIN
  IF to_regclass('public.app_accounts') IS NULL
     OR to_regclass('public.wechat_login_codes') IS NULL THEN
    RAISE EXCEPTION 'Apply this migration to the existing yanhuofood authentication database (app_accounts and wechat_login_codes are required).';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.agnes_sessions (
  token_hash TEXT PRIMARY KEY CHECK (length(token_hash) = 64),
  user_id UUID NOT NULL REFERENCES public.app_accounts(user_id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agnes_sessions_user_idx ON public.agnes_sessions(user_id);
CREATE INDEX IF NOT EXISTS agnes_sessions_expiry_idx ON public.agnes_sessions(expires_at);

CREATE TABLE IF NOT EXISTS public.agnes_login_attempts (
  client_hash TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.agnes_daily_usage (
  day DATE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video', 'chat')),
  user_id UUID NOT NULL REFERENCES public.app_accounts(user_id) ON DELETE CASCADE,
  submissions INTEGER NOT NULL DEFAULT 0 CHECK (submissions >= 0),
  PRIMARY KEY (day, kind, user_id)
);

CREATE TABLE IF NOT EXISTS public.agnes_video_tasks (
  task_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_accounts(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agnes_video_tasks_user_idx ON public.agnes_video_tasks(user_id);

ALTER TABLE public.agnes_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agnes_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agnes_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agnes_video_tasks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agnes_sessions, public.agnes_login_attempts, public.agnes_daily_usage, public.agnes_video_tasks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agnes_sessions, public.agnes_login_attempts, public.agnes_daily_usage, public.agnes_video_tasks TO service_role;

CREATE OR REPLACE FUNCTION public.agnes_take_login_attempt(p_client_hash TEXT)
RETURNS TABLE(allowed BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_attempts INTEGER;
BEGIN
  IF p_client_hash IS NULL OR length(p_client_hash) <> 64 THEN
    RETURN QUERY SELECT false;
    RETURN;
  END IF;
  INSERT INTO public.agnes_login_attempts AS existing(client_hash)
  VALUES (p_client_hash)
  ON CONFLICT (client_hash) DO UPDATE SET
    attempts = CASE WHEN existing.window_started_at <= now() - interval '10 minutes' THEN 1 ELSE existing.attempts + 1 END,
    window_started_at = CASE WHEN existing.window_started_at <= now() - interval '10 minutes' THEN now() ELSE existing.window_started_at END
  RETURNING attempts INTO v_attempts;
  RETURN QUERY SELECT v_attempts <= 8;
END;
$$;

CREATE OR REPLACE FUNCTION public.agnes_take_daily_quota(
  p_user_id UUID, p_kind TEXT, p_user_limit INTEGER, p_global_limit INTEGER
)
RETURNS TABLE(allowed BOOLEAN, reason TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_day DATE := (now() AT TIME ZONE 'Asia/Shanghai')::date;
  v_user_count BIGINT;
  v_total BIGINT;
BEGIN
  IF p_kind IS NULL OR p_kind NOT IN ('image', 'video', 'chat')
     OR p_user_limit IS NULL OR p_global_limit IS NULL
     OR p_user_limit < 0 OR p_global_limit < 0 THEN
    RAISE EXCEPTION 'Invalid quota parameters';
  END IF;

  -- Serialize the same day/kind across ALL server instances. A single
  -- transaction checks both limits and increments, so concurrent calls cannot
  -- overspend the global budget or a user's last available submission.
  PERFORM pg_advisory_xact_lock(hashtextextended('agnes-quota:' || v_day::text || ':' || p_kind, 0));

  -- Recheck the live account inside the quota transaction as well.
  IF NOT EXISTS (
    SELECT 1 FROM public.app_accounts
    WHERE user_id = p_user_id AND wechat_openid IS NOT NULL
      AND wechat_status = 'following' AND disabled_at IS NULL
  ) THEN
    RETURN QUERY SELECT false, 'access_denied'::text;
    RETURN;
  END IF;
  SELECT COALESCE(sum(submissions), 0) INTO v_total
    FROM public.agnes_daily_usage WHERE day = v_day AND kind = p_kind;
  IF v_total >= p_global_limit THEN
    RETURN QUERY SELECT false, 'global_limit'::text;
    RETURN;
  END IF;
  SELECT COALESCE(sum(submissions), 0) INTO v_user_count
    FROM public.agnes_daily_usage WHERE day = v_day AND kind = p_kind AND user_id = p_user_id;
  IF v_user_count >= p_user_limit THEN
    RETURN QUERY SELECT false, 'user_limit'::text;
    RETURN;
  END IF;
  INSERT INTO public.agnes_daily_usage(day, kind, user_id, submissions)
  VALUES (v_day, p_kind, p_user_id, 1)
  ON CONFLICT (day, kind, user_id) DO UPDATE SET submissions = agnes_daily_usage.submissions + 1;
  RETURN QUERY SELECT true, 'allowed'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.agnes_cleanup_auth_artifacts()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.agnes_sessions WHERE expires_at < now();
  DELETE FROM public.agnes_login_attempts WHERE window_started_at < now() - interval '1 day';
  DELETE FROM public.agnes_daily_usage WHERE day < (now() AT TIME ZONE 'Asia/Shanghai')::date - 90;
  DELETE FROM public.agnes_video_tasks WHERE created_at < now() - interval '90 days';
END;
$$;

REVOKE ALL ON FUNCTION public.agnes_take_login_attempt(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.agnes_take_daily_quota(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.agnes_cleanup_auth_artifacts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agnes_take_login_attempt(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.agnes_take_daily_quota(UUID, TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.agnes_cleanup_auth_artifacts() TO service_role;
