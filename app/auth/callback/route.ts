import {NextResponse} from 'next/server';import {createClient} from '@/lib/supabase/server';
export async function GET(request:Request){const url=new URL(request.url),code=url.searchParams.get('code');if(code)await createClient().auth.exchangeCodeForSession(code);return NextResponse.redirect(new URL('/',url.origin))}
