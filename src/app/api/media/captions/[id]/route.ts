import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Same-origin, session-authenticated WebVTT response. Caption files stay in a private bucket. */
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: privateHeaders });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401, headers: privateHeaders });
  const [{ data: content }, { data: profile }] = await Promise.all([
    supabase.from('content').select('caption_path,member_only,status').eq('id', id).eq('status', 'published').maybeSingle(),
    supabase.from('profiles').select('membership_status').eq('id', user.id).maybeSingle(),
  ]);
  if (!content || !content.caption_path || !/^captions\/[a-f0-9-]{36}\.vtt$/.test(content.caption_path)) return NextResponse.json({ error: 'Captions unavailable' }, { status: 404, headers: privateHeaders });
  if (content.member_only && profile?.membership_status !== 'active') return NextResponse.json({ error: 'Membership required' }, { status: 403, headers: privateHeaders });
  const { data, error } = await supabase.storage.from('media-captions').download(content.caption_path);
  if (error || !data) return NextResponse.json({ error: 'Captions unavailable' }, { status: 404, headers: privateHeaders });
  return new NextResponse(await data.text(), { status: 200, headers: { ...privateHeaders, 'Content-Type': 'text/vtt; charset=utf-8', 'Content-Security-Policy': "default-src 'none'" } });
}
