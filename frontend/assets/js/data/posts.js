// ==========================================================================
// INKFLOW — Mock Data: Posts
// Community forum posts and comments.
// ==========================================================================

export const mockPosts = [
  {
    id: 'post-101',
    authorId: 'usr-client2',
    authorName: 'Pedro Costa',
    category: 'Cicatrização',
    title: 'Pode treinar musculação 3 dias após fazer tattoo no braço?',
    content: 'Fiz uma tattoo no antebraço faz 3 dias, já está descascando um pouco. Posso voltar pra academia se não treinar braço?',
    likes: 12,
    createdAt: '2026-08-10T15:30:00Z',
    comments: [
      {
        id: 'com-01',
        postId: 'post-101',
        authorName: 'Lucas Andrade',
        content: 'Cara, o ideal é esperar pelo menos 7 dias. O suor excessivo e o ambiente da academia podem causar infecção. Melhor não arriscar.',
        createdAt: '2026-08-10T16:00:00Z'
      },
      {
         id: 'com-02',
         postId: 'post-101',
         authorName: 'Mariana Lima',
         content: 'Eu treinei perna depois de 4 dias quando fiz no braço e foi de boa, mas limpei bem depois.',
         createdAt: '2026-08-11T09:15:00Z'
      }
    ]
  },
  {
    id: 'post-102',
    authorId: 'usr-artist2',
    authorName: 'Camila Rocha',
    category: 'Dicas para Artistas',
    title: 'Qual a melhor marca de agulha para traço super fino?',
    content: 'Pessoal que faz fine line, qual agulha vocês recomendam para um traço bem consistente de 3RL?',
    likes: 24,
    createdAt: '2026-08-12T10:00:00Z',
    comments: []
  }
];

import API from '../utils/api.js';
export function seedPosts() {
  API.seed('posts', mockPosts);
}
