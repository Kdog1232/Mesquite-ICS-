import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const noStoreHeaders = { 'Cache-Control': 'no-store' };

const requiredEnvironmentVariables = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_STAFF_EMAIL',
  'SUPABASE_STAFF_PASSWORD',
  'CAMPUS_ACCESS_PASSWORD',
] as const;

type RequiredEnvironmentVariable = (typeof requiredEnvironmentVariables)[number];

function getServerConfiguration(): Record<RequiredEnvironmentVariable, string> | null {
  const configuration = {} as Record<RequiredEnvironmentVariable, string>;

  for (const variableName of requiredEnvironmentVariables) {
    const value = process.env[variableName];
    if (typeof value !== 'string' || value.length === 0) {
      // Never include environment variable values in runtime logs.
      console.error(`Missing required environment variable: ${variableName}`);
      return null;
    }
    configuration[variableName] = value;
  }

  return configuration;
}

function isValidSupabaseProjectUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && /^[a-z0-9]+\.supabase\.co$/.test(url.hostname)
      && url.port === ''
      && url.username === ''
      && url.password === ''
      && url.pathname === '/'
      && url.search === ''
      && url.hash === '';
  } catch {
    return false;
  }
}

function passwordsMatch(candidate: string, expected: string) {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const configuration = getServerConfiguration();
  if (!configuration) {
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 500, headers: noStoreHeaders });
  }

  const supabaseUrl = configuration.NEXT_PUBLIC_SUPABASE_URL;
  if (!isValidSupabaseProjectUrl(supabaseUrl)) {
    console.error('Invalid Supabase project URL in NEXT_PUBLIC_SUPABASE_URL');
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 500, headers: noStoreHeaders });
  }

  let campusPassword = '';
  try {
    const body = await request.json() as { campusPassword?: unknown };
    if (typeof body.campusPassword === 'string') campusPassword = body.campusPassword;
  } catch {
    // Invalid request bodies are handled like an incorrect password.
  }

  if (!passwordsMatch(campusPassword, configuration.CAMPUS_ACCESS_PASSWORD)) {
    return NextResponse.json({ error: 'Incorrect campus password.' }, { status: 401, headers: noStoreHeaders });
  }

  let serverClient: ReturnType<typeof createClient>;
  try {
    serverClient = createClient(supabaseUrl, configuration.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  } catch {
    console.error('Supabase server client configuration failed');
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 500, headers: noStoreHeaders });
  }

  try {
    const { data, error } = await serverClient.auth.signInWithPassword({
      email: configuration.SUPABASE_STAFF_EMAIL,
      password: configuration.SUPABASE_STAFF_PASSWORD,
    });
    if (error || !data.session) {
      console.error('Supabase staff authentication failed', error?.message ?? 'No session returned');
      return NextResponse.json({ error: 'Supabase staff credentials are invalid.' }, { status: 401, headers: noStoreHeaders });
    }

    return NextResponse.json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    }, { headers: noStoreHeaders });
  } catch {
    console.error('Supabase staff authentication request failed unexpectedly');
    return NextResponse.json({ error: 'Authentication service is unavailable.' }, { status: 500, headers: noStoreHeaders });
  }
}
