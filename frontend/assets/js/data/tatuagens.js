// ==========================================================================
// INKFLOW — Mock Data: Tattoos
// Portfolio items linked to artists.
// ==========================================================================

export const mockTattoos = [
  {
    id: 'tat-201',
    artistId: 'art-001',
    artistName: 'Lucas Andrade',
    title: 'Crânio e Rosas Blackwork',
    description: 'Projeto exclusivo para fechamento de antebraço.',
    imageUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&q=80', // Replace with real tattoo images if possible
    style: 'blackwork',
    bodyPart: 'braco',
    size: '15cm',
    likes: 342,
    views: 1200,
    createdAt: '2026-07-10T10:00:00Z',
    tags: ['caveira', 'rosa', 'sombrio']
  },
  {
    id: 'tat-202',
    artistId: 'art-002',
    artistName: 'Camila Rocha',
    title: 'Borboleta Fine Line',
    description: 'Traço super fino no pulso. Cicatrização perfeita.',
    imageUrl: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=800&q=80',
    style: 'fineline',
    bodyPart: 'mao',
    size: '5cm',
    likes: 850,
    views: 2100,
    createdAt: '2026-08-01T14:30:00Z',
    tags: ['borboleta', 'delicado', 'pulso']
  },
  {
    id: 'tat-203',
    artistId: 'art-003',
    artistName: 'Diego Souza',
    title: 'Goku Super Saiyajin',
    description: 'Fechamento de perna com cores sólidas.',
    imageUrl: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800&q=80',
    style: 'anime',
    bodyPart: 'perna',
    size: '20cm',
    likes: 120,
    views: 450,
    createdAt: '2026-06-15T09:15:00Z',
    tags: ['dbz', 'goku', 'colorido']
  }
];

import API from '../utils/api.js';
export function seedTattoos() {
  API.seed('tattoos', mockTattoos);
}
