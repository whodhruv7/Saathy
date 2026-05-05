
REVOKE ALL ON FUNCTION public.increment_usage(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_usage(TEXT, INT) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
