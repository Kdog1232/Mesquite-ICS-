export const DESTINATIONS = ['RESTROOM', 'NURSE', 'FRONT_OFFICE', 'SERVICES', 'WATER', 'ADMINISTRATOR', 'OTHER'] as const;

export type Destination = (typeof DESTINATIONS)[number];

export const destinationDetails: Record<Destination, { label: string; icon: string }> = {
  RESTROOM: { label: 'Restroom', icon: '🚻' },
  NURSE: { label: 'Nurse', icon: '✚' },
  FRONT_OFFICE: { label: 'Front Office', icon: '🏫' },
  SERVICES: { label: 'Services', icon: '🤝' },
  WATER: { label: 'Water', icon: '💧' },
  ADMINISTRATOR: { label: 'Administrator', icon: '👤' },
  OTHER: { label: 'Other', icon: '📍' },
};

export function isDestination(value: unknown): value is Destination {
  return typeof value === 'string' && DESTINATIONS.includes(value as Destination);
}

export function destinationLabel(destination: Destination | null) {
  return destination ? destinationDetails[destination].label : 'Legacy / Unspecified';
}
