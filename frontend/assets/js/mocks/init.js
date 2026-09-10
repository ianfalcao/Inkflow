// Shared prototype data initialization, independent of the first page visited.
import { seedUsers } from './users.js';
import { seedArtists } from './artists.js';
import { seedTattoos } from './tattoos.js';
import { seedStyles } from './styles.js';
import { seedPosts } from './posts.js';

export function initMocks() {
  seedUsers();
  seedArtists();
  seedTattoos();
  seedStyles();
  seedPosts();
}
