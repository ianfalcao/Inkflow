// ==========================================================================
// INKFLOW — Mock Data: Users
// Defines clients, artists, and admin accounts.
// Includes their specific data like appointments, quotes, and reviews.
// ==========================================================================

export const mockUsers = [
  {
    id: 'usr-admin',
    name: 'Admin InkFlow',
    email: 'admin@inkflow.com',
    password: 'password123',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?u=admin',
    createdAt: '2025-01-01T10:00:00Z',
    favorites: [],
    following: []
  },
  {
    id: 'usr-client1',
    name: 'Mariana Lima',
    email: 'mariana@example.com',
    password: 'password123',
    role: 'client',
    avatar: 'https://i.pravatar.cc/150?u=mariana',
    createdAt: '2026-02-15T14:30:00Z',
    favorites: ['tat-201', 'tat-203'], // array of tattoo IDs
    following: ['art-001', 'art-002'], // array of artist IDs
    // Extended client data (normally in separate relational tables)
    appointments: [
      {
        id: 'apt-001',
        artistId: 'art-001',
        artistName: 'Lucas Andrade',
        date: '2026-10-28T14:00:00Z',
        status: 'confirmed',
        description: 'Blackwork Antíbraço'
      }
    ],
    quotes: [
      {
        id: 'qte-001',
        artistId: 'art-001',
        artistName: 'Lucas Andrade',
        date: '2026-10-10T09:00:00Z',
        status: 'answered',
        description: 'Blackwork Antíbraço'
      }
    ]
  },
  {
    id: 'usr-client2',
    name: 'Pedro Costa',
    email: 'pedro@example.com',
    password: 'password123',
    role: 'client',
    avatar: 'https://i.pravatar.cc/150?u=pedro',
    createdAt: '2026-05-20T08:15:00Z',
    favorites: [],
    following: [],
    appointments: [],
    quotes: []
  },
  {
    id: 'usr-artist1',
    name: 'Lucas Andrade',
    email: 'lucas@ink.com',
    password: 'password123',
    role: 'artist',
    avatar: 'https://i.pravatar.cc/150?u=lucas',
    createdAt: '2025-11-10T09:20:00Z',
    favorites: [],
    following: [],
    // Extended artist data (quotes/appointments received)
    quotesReceived: [
       {
        id: 'qte-001',
        clientId: 'usr-client1',
        clientName: 'Mariana Lima',
        date: '2026-10-10T09:00:00Z',
        status: 'answered',
        description: 'Blackwork Antíbraço'
      }
    ],
    appointmentsReceived: [
      {
        id: 'apt-001',
        clientId: 'usr-client1',
        clientName: 'Mariana Lima',
        date: '2026-10-28T14:00:00Z',
        status: 'confirmed',
        description: 'Blackwork Antíbraço'
      }
    ]
  },
  {
    id: 'usr-artist2',
    name: 'Camila Rocha',
    email: 'camila@ink.com',
    password: 'password123',
    role: 'artist',
    avatar: 'https://i.pravatar.cc/150?u=camila',
    createdAt: '2026-01-05T11:45:00Z',
    favorites: [],
    following: [],
    quotesReceived: [],
    appointmentsReceived: []
  }
];

// Helper to seed this data
import API from '../utils/api.js';
export function seedUsers() {
  API.seed('users', mockUsers);
}
