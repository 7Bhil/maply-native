export const CATEGORIES = [
  { id: 'restaurant', label: 'Restaurant', emoji: '🍕', color: '#f97316' },
  { id: 'cafe',       label: 'Café',       emoji: '☕', color: '#a87352' },
  { id: 'culture',    label: 'Culture',    emoji: '🏛️', color: '#8b5cf6' },
  { id: 'nature',     label: 'Nature',     emoji: '🌳', color: '#22c55e' },
  { id: 'shopping',   label: 'Shopping',   emoji: '🛍️', color: '#ec4899' },
  { id: 'sport',      label: 'Sport',      emoji: '🏋️', color: '#3b82f6' },
  { id: 'hotel',      label: 'Hébergement',emoji: '🏨', color: '#14b8a6' },
  { id: 'other',      label: 'Autre',      emoji: '📍', color: '#6366f1' },
];

export const getCategoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
