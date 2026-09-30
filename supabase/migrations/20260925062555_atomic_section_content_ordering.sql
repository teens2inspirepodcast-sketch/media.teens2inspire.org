CREATE OR REPLACE FUNCTION public.replace_section_content(p_section_id uuid, p_content_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  DELETE FROM public.section_content WHERE section_id = p_section_id;
  INSERT INTO public.section_content(section_id, content_id, display_order)
  SELECT p_section_id, content_id, row_number() OVER () - 1
  FROM unnest(COALESCE(p_content_ids, ARRAY[]::uuid[])) WITH ORDINALITY AS chosen(content_id, requested_order)
  ORDER BY requested_order;
END;
$$;
REVOKE ALL ON FUNCTION public.replace_section_content(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_section_content(uuid, uuid[]) TO authenticated;
