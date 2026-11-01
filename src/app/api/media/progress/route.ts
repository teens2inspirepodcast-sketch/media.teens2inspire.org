import { NextRequest, NextResponse } from 'next/server';
import { getContext, hasActiveEntitlement } from '@/lib/auth';
import { resolveViewerProfileId } from '@/lib/viewer-profile';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function viewer() {
  const context = await getContext();
  if (!context.user || !hasActiveEntitlement(context.profile, context.user.id)) return null;
  const viewerProfileId = await resolveViewerProfileId(context.supabase, context.user.id, context.profile);
  return { ...context, viewerProfileId };
}

/** Playback positions are scoped to the signed-in account and selected Family profile. */
export async function GET(request: NextRequest) {
  const session = await viewer();
  if (!session) return NextResponse.json({ error: 'Please sign in with an active membership.' }, { status: 401 });
  const contentId = request.nextUrl.searchParams.get('contentId') || '';
  if (!UUID.test(contentId)) return NextResponse.json({ error: 'Invalid content ID.' }, { status: 400 });
  const { data, error } = await session.supabase.from('media_playback_bookmarks')
    .select('position_seconds,duration_seconds,completed')
    .eq('user_id', session.user!.id).eq('profile_id', session.viewerProfileId)
    .eq('content_id', contentId).maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to load your playback position.' }, { status: 500 });
  return NextResponse.json({ positionSeconds: Number(data?.position_seconds || 0), durationSeconds: Number(data?.duration_seconds || 0), completed: Boolean(data?.completed) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  const session = await viewer();
  if (!session) return NextResponse.json({ error: 'Please sign in with an active membership.' }, { status: 401 });
  let payload: Record<string, unknown>;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const contentId = String(payload.contentId || '');
  const position = Number(payload.positionSeconds);
  const duration = Number(payload.durationSeconds);
  if (!UUID.test(contentId) || !Number.isFinite(position) || !Number.isFinite(duration) || position < 0 || duration < 0 || position > 864000 || duration > 864000) {
    return NextResponse.json({ error: 'Invalid playback position.' }, { status: 400 });
  }
  const { data: item, error: contentError } = await session.supabase.from('content')
    .select('id').eq('id', contentId).eq('status', 'published').in('type', ['video','podcast']).maybeSingle();
  if (contentError || !item) return NextResponse.json({ error: 'Content unavailable.' }, { status: 404 });
  const isCompleted = payload.completed === true || (duration > 10 && position >= duration - 3);
  const { error } = await session.supabase.from('media_playback_bookmarks').upsert({
    user_id: session.user!.id,
    profile_id: session.viewerProfileId,
    content_id: contentId,
    position_seconds: Number(Math.min(position, duration || position).toFixed(2)),
    duration_seconds: Number(duration.toFixed(2)),
    completed: isCompleted,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,profile_id,content_id' });
  if (error) return NextResponse.json({ error: 'Unable to save your progress.' }, { status: 500 });
  return NextResponse.json({ saved: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
