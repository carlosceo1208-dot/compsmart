
CREATE OR REPLACE FUNCTION public.cleanup_old_telemetry()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage_deleted INTEGER;
  v_errors_deleted INTEGER;
BEGIN
  DELETE FROM public.usage_events
  WHERE created_at < (now() - INTERVAL '90 days');
  GET DIAGNOSTICS v_usage_deleted = ROW_COUNT;

  DELETE FROM public.error_logs
  WHERE created_at < (now() - INTERVAL '90 days');
  GET DIAGNOSTICS v_errors_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'usage_events_deleted', v_usage_deleted,
    'error_logs_deleted', v_errors_deleted,
    'executed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_telemetry() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_old_telemetry() FROM authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_telemetry() FROM anon;
GRANT EXECUTE ON FUNCTION public.cleanup_old_telemetry() TO service_role;
