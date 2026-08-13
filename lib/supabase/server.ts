import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';
export function createClient(){const jar=cookies();return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll(){return jar.getAll()},setAll(values){try{values.forEach(({name,value,options})=>jar.set(name,value,options))}catch{}}}})}
export async function requireUser(){const db=createClient();const {data:{user}}=await db.auth.getUser();return user;}
export async function getRole(){const db=createClient();const {data}=await db.rpc('current_user_role');return data;}
