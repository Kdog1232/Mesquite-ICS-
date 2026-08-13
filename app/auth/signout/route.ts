import {NextResponse} from 'next/server';import {createClient} from '@/lib/supabase/server';
export async function POST(request:Request){await createClient().auth.signOut();return NextResponse.redirect(new URL('/login',request.url),303)}
