-- Harden the SECURITY DEFINER profile settings function against search_path shadowing.
-- All referenced objects are schema-qualified; this is a behavior-preserving security hardening.
CREATE OR REPLACE FUNCTION public.update_my_profile_settings(p_display_name text, p_profile_color text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF char_length(trim(coalesce(p_display_name, ''))) < 1
     OR char_length(trim(p_display_name)) > 80 THEN
    RAISE EXCEPTION 'Name must be 1–80 characters';
  END IF;
  IF p_profile_color IS NULL OR p_profile_color !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'Invalid profile color';
  END IF;
  UPDATE public.profiles
  SET display_name = trim(p_display_name),
      profile_color = upper(p_profile_color),
      updated_at = now()
  WHERE id = (SELECT auth.uid());
END;
$function$;
