import { useEffect, useRef } from 'react';
import { DESTINATIONS, destinationDetails, type Destination } from '@/lib/destinations';

export function DestinationSelector({ studentName, busy, onSelect, onCancel }: { studentName: string; busy: boolean; onSelect: (destination: Destination) => void; onCancel: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialog.current?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [busy, onCancel]);

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="destination-title" tabIndex={-1} className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{studentName}</p>
      <h2 id="destination-title" className="mt-1 text-2xl font-black text-navy">WHERE IS THIS STUDENT GOING?</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DESTINATIONS.map(destination => { const detail = destinationDetails[destination]; return <button key={destination} disabled={busy} onClick={() => onSelect(destination)} className="min-h-20 rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-black uppercase text-navy transition hover:border-gold hover:bg-amber-50 disabled:opacity-50"><span className="mr-2 text-xl" aria-hidden="true">{detail.icon}</span>{detail.label}</button>; })}
      </div>
      <button disabled={busy} onClick={onCancel} className="mt-4 min-h-12 w-full rounded-xl border-2 border-navy font-black text-navy disabled:opacity-50">CANCEL</button>
    </div>
  </div>;
}
