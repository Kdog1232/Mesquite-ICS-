import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const noStoreHeaders = { 'Cache-Control': 'no-store' };

function passwordsMatch(candidate: string, expected: string) {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  let campusPassword = '';
  try {
    const body = await request.json() as { campusPassword?: unknown };
    if (typeof body.campusPassword === 'string') campusPassword = body.campusPassword;
  } catch {
    // Invalid request bodies are handled like an incorrect password.
  }

  const expectedPassword = process.env.CAMPUS_ACCESS_PASSWORD;
  if (!expectedPassword || !passwordsMatch(campusPassword, expectedPassword)) {
    return NextResponse.json({ error: 'Incorrect campus password.' }, { status: 401, headers: noStoreHeaders });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.SUPABASE_STAFF_EMAIL;
  const password = process.env.SUPABASE_STAFF_PASSWORD;
  if (!url || !anonKey || !email || !password) {
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 500, headers: noStoreHeaders });
  }

  const serverClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await serverClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return NextResponse.json({ error: 'Unable to sign in. Please try again.' }, { status: 500, headers: noStoreHeaders });
  }

  return NextResponse.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  }, { headers: noStoreHeaders });
}
