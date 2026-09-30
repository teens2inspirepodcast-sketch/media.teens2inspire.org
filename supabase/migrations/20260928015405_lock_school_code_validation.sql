-- School-code preflight is now performed in the server route with the server-only
-- service-role client. The authenticated redemption RPC remains available; anon
-- callers no longer get a hash-validity oracle via the Data API.
REVOKE EXECUTE ON FUNCTION public.validate_school_code(text) FROM anon;
