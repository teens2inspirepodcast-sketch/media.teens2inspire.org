CREATE OR REPLACE FUNCTION public.replace_content_sections(p_content_id uuid, p_section_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  DELETE FROM public.section_content WHERE content_id = p_content_id;
  INSERT INTO public.section_content(section_id, content_id, display_order)
  SELECT section_id, p_content_id, row_number() OVER () - 1
  FROM unnest(COALESCE(p_section_ids, ARRAY[]::uuid[])) WITH ORDINALITY AS chosen(section_id, requested_order)
  ORDER BY requested_order;
END;
$$;
REVOKE ALL ON FUNCTION public.replace_content_sections(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_content_sections(uuid, uuid[]) TO authenticated;
