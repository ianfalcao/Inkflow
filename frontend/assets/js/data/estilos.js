// ==========================================================================
// INKFLOW — Mock Data: Styles
// Catalog of tattoo styles.
// ==========================================================================

export const mockStyles = [
  {
    slug: 'blackwork',
    name: 'Blackwork',
    description: 'Uso marcante de tinta preta sólida, contraste forte e formas geométricas ou ilustrativas.',
    imageUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&q=80',
    artistCount: 45,
    tattooCount: 1200,
    relatedStyles: ['dotwork', 'fineline']
  },
  {
    slug: 'fineline',
    name: 'Fine Line',
    description: 'Traços finos, precisos e delicados, ideal para desenhos minimalistas e detalhismo sutil.',
    imageUrl: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=800&q=80',
    artistCount: 82,
    tattooCount: 3400,
    relatedStyles: ['minimalist', 'microrealism']
  },
  {
    slug: 'realismo',
    name: 'Realismo',
    description: 'Técnica que reproduz fotografias e imagens reais com alto nível de detalhe e sombreamento.',
    imageUrl: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800&q=80',
    artistCount: 30,
    tattooCount: 850,
    relatedStyles: ['portrait', 'surrealism']
  }
];

import API from '../utils/api.js';
export function seedStyles() {
  API.seed('styles', mockStyles);
}
