import Link from 'next/link';

export function Header({ onSignOut }: { onSignOut: () => void }) {
  return <header className="bg-navy text-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6"><div><p className="text-2xl font-black tracking-wide sm:text-3xl">MESQUITE ICS</p><p className="text-sm font-bold tracking-[.16em] text-gold sm:text-base">HALLWAY MONITOR TRACKER</p><p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-300">PK–12 LIVE STUDENT STATUS</p></div><div className="flex items-center gap-3"><Link href="/daily-log" className="rounded-lg border border-white/50 px-4 py-2 font-bold">DAILY LOG</Link><button onClick={onSignOut} className="rounded-lg bg-white px-4 py-2 font-black text-navy">SIGN OUT</button></div></div></header>;
}
