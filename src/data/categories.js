export const CATEGORIES = [
  { id: 'restaurant', label: 'Restaurant', emoji: '🍕', color: '#ff6b6b', icon: 'restaurant-outline' },
  { id: 'cafe',       label: 'Café',       emoji: '☕', color: '#a87352', icon: 'cafe-outline' },
  { id: 'culture',    label: 'Culture',    emoji: '🏛️', color: '#be4bdb', icon: 'library-outline' },
  { id: 'nature',     label: 'Nature',     emoji: '🌳', color: '#51cf66', icon: 'leaf-outline' },
  { id: 'shopping',   label: 'Shopping',   emoji: '🛍️', color: '#fcc419', icon: 'cart-outline' },
  { id: 'sport',      label: 'Sport',      emoji: '🏋️', color: '#339af0', icon: 'fitness-outline' },
  { id: 'hotel',      label: 'Hébergement',emoji: '🏨', color: '#20c997', icon: 'bed-outline' },
  { id: 'transport',  label: 'Transport',  emoji: '🚉', color: '#4dabf7', icon: 'bus-outline' },
  { id: 'health',     label: 'Santé',      emoji: '🏥', color: '#ff8787', icon: 'medical-outline' },
  { id: 'education',  label: 'Éducation',  emoji: '🎓', color: '#fab005', icon: 'school-outline' },
  { id: 'work',       label: 'Travail',    emoji: '💼', color: '#adb5bd', icon: 'briefcase-outline' },
  { id: 'fun',        label: 'Divertissement', emoji: '🎡', color: '#da77f2', icon: 'game-controller-outline' },
  { id: 'parking',    label: 'Parking',    emoji: '🅿️', color: '#868e96', icon: 'car-outline' },
  { id: 'home',       label: 'Maison',     emoji: '🏠', color: '#ff922b', icon: 'home-outline' },
  { id: 'other',      label: 'Autre',      emoji: '📍', color: '#6366f1', icon: 'location-outline' },
];

export const getCategoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
