// Edit this file to change what the public page shows.
export const profile = {
  name: 'Urvi Tours & Travells',
  tagline: 'Car rental and outstation cabs',
  bio: 'Pick a car, tell us your trip, and we will call you back with the fare. Clean cars, experienced drivers, fair per-km rates.',
  initials: 'UT', // shown in the avatar circle. Or set photo: '/profile.jpg' (put the file in client/public)
  photo: '',
  instagram: 'https://instagram.com/your_instagram_handle',
  phone: '919876543210', // country code + number, digits only
  whatsapp: '919876543210',
  whatsappText: 'Hi! I found you on Instagram and want to book a car.',
};

// Types of booking. `value` is stored in the database, `label` is shown to people.
export const tripTypes = [
  { value: 'one_way', label: 'One way' },
  { value: 'round_trip', label: 'Round trip' },
  { value: 'local', label: 'Local / hourly' },
  { value: 'airport', label: 'Airport transfer' },
];
export const tripLabel = (v) => tripTypes.find((t) => t.value === v)?.label || v;

// Suggested car types in the admin "Add car" form (admin can also type their own)
export const carTypes = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Tempo Traveller', 'Luxury', 'Mini Bus'];
