import { destinationDetails, type Destination } from '@/lib/destinations';

export function DestinationBadge({ destination }: { destination: Destination | null }) {
  if (!destination) return <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">—</span>;
  const detail = destinationDetails[destination];
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-navy"><span aria-hidden="true">{detail.icon}</span>{detail.label}</span>;
}
