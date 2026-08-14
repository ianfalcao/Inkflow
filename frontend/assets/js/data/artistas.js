// ==========================================================================
// INKFLOW — Mock Data: Artists
// Extended public profile information for artists.
// ==========================================================================

export const mockArtists = [
  {
    id: 'art-001',
    userId: 'usr-artist1',
    name: 'Lucas Andrade',
    avatar: 'https://i.pravatar.cc/150?u=lucas',
    coverImage: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&q=80',
    bio: 'Especialista em Blackwork e ilustrações sombrias. Mais de 5 anos transformando ideias em tinta.',
    city: 'São Paulo',
    state: 'SP',
    styles: ['blackwork', 'oldschool'],
    rating: 4.9,
    reviewCount: 128,
    verified: true,
    priceRange: '$$', // $, $$, $$$, $$$$
    instagram: '@lucastattoo',
    portfolio: 'lucasink.com',
    followers: 1450,
    completedWorks: 320
  },
  {
    id: 'art-002',
    userId: 'usr-artist2',
    name: 'Camila Rocha',
    avatar: 'https://i.pravatar.cc/150?u=camila',
    coverImage: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=800&q=80',
    bio: 'Fine line e realismo delicado. Tatuagens botânicas e homenagens com traços super finos.',
    city: 'Rio de Janeiro',
    state: 'RJ',
    styles: ['fineline', 'realismo'],
    rating: 4.8,
    reviewCount: 85,
    verified: true,
    priceRange: '$$$',
    instagram: '@camila.ink',
    portfolio: '',
    followers: 2100,
    completedWorks: 190
  },
  {
    id: 'art-003',
    userId: 'usr-artist3', // Assuming a user exists
    name: 'Diego Souza',
    avatar: 'https://i.pravatar.cc/150?u=diego',
    coverImage: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800&q=80',
    bio: 'Cores vibrantes e anime. Otaku de carteirinha.',
    city: 'Curitiba',
    state: 'PR',
    styles: ['anime', 'aquarela'],
    rating: 4.7,
    reviewCount: 42,
    verified: false,
    priceRange: '$',
    instagram: '@diego.otaku.ink',
    portfolio: '',
    followers: 500,
    completedWorks: 80
  }
];

import API from '../utils/api.js';
export function seedArtists() {
  API.seed('artists', mockArtists);
}
