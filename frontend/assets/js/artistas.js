// ==========================================================================
// INKFLOW — Artists Page Script
// Handles the artist search, filters, sorting and rendering.
// ==========================================================================

import API from './utils/api.js';
import AuthService from './utils/auth.js';
import StorageService from './utils/storage.js';
import {
  $,
  $$,
  renderCards,
  createElement,
  toggleLoading,
  toggleEmpty,
  debounce,
  openModal
} from './utils/dom.js';

// DOM Elements
const filterForm = $('#artist-filter-form');
const artistsGrid = $('#artists-grid');
const sortSelect = $('#artist-sort');
const artistsCount = $('#artists-count');

// State
let allArtists = [];
let currentArtists = [];

/**
 * Initializes the artists page.
 */
async function init() {
  AuthService.updateHeaderUI();
  setupEventListeners();
  await loadArtists();
}

/**
 * Sets up event listeners.
 */
function setupEventListeners() {
  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      applyFilters();
    });

    const textInputs = $$('input[type="text"], input[type="search"]', filterForm);
    textInputs.forEach(input => {
      input.addEventListener('input', debounce(() => applyFilters(), 400));
    });

    const selects = $$('select, input[type="checkbox"]', filterForm);
    selects.forEach(input => {
      input.addEventListener('change', () => applyFilters());
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortArtists();
      renderArtists();
    });
  }
}

/**
 * Loads all artists from the API.
 */
async function loadArtists() {
  toggleLoading('artists-loading', true);
  toggleEmpty('artists-empty', false);
  if (artistsGrid) artistsGrid.innerHTML = '';

  try {
    allArtists = await API.get('artists');
    applyFilters();
  } catch (err) {
    console.error('Failed to load artists', err);
  } finally {
    toggleLoading('artists-loading', false);
  }
}

/**
 * Applies filters from the form to the artist list.
 */
function applyFilters() {
  if (!filterForm) return;

  const formData = new FormData(filterForm);
  const q = formData.get('q')?.toLowerCase() || '';
  const state = formData.get('state') || '';
  const city = formData.get('city')?.toLowerCase() || '';
  const styles = formData.getAll('style[]'); // Checkboxes
  const verifiedOnly = formData.get('verified_only') === 'true';
  const rating = formData.get('rating') ? parseFloat(formData.get('rating')) : 0;
  const price = formData.get('price') || '';

  currentArtists = allArtists.filter(artist => {
    let match = true;

    if (q) {
      match = match && artist.name.toLowerCase().includes(q);
    }
    if (state) {
      match = match && artist.state === state;
    }
    if (city) {
      match = match && artist.city.toLowerCase().includes(city);
    }
    if (styles.length > 0) {
      match = match && styles.some(s => artist.styles.includes(s));
    }
    if (verifiedOnly) {
      match = match && artist.verified;
    }
    if (rating > 0) {
      match = match && artist.rating >= rating;
    }
    if (price) {
      match = match && artist.priceRange === price;
    }

    return match;
  });

  sortArtists();
  renderArtists();
}

/**
 * Sorts the artists array based on selected criteria.
 */
function sortArtists() {
  if (!sortSelect) return;
  const sortBy = sortSelect.value;

  if (sortBy === 'rating') {
    currentArtists.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'recent') {
    // Assuming higher ID means newer, or fallback to name if no date available
    currentArtists.sort((a, b) => b.id.localeCompare(a.id));
  } else if (sortBy === 'name') {
    currentArtists.sort((a, b) => a.name.localeCompare(b.name));
  }
}

/**
 * Renders the filtered and sorted artist cards.
 */
function renderArtists() {
  if (!artistsGrid) return;

  if (artistsCount) {
    artistsCount.textContent = currentArtists.length;
  }

  toggleEmpty('artists-empty', currentArtists.length === 0);

  renderCards(artistsGrid, currentArtists, (artist) => {
    const user = AuthService.getCurrentUser();
    const isFollowing = user ? StorageService.has(`following_${user.id}`, artist.id) : false;

    return createElement('article', { class: 'artist-card', 'data-artist-id': artist.id }, [
      createElement('div', { class: 'artist-card__avatar-wrap' }, [
        createElement('img', { src: artist.avatar, alt: artist.name, class: 'artist-card__avatar' }),
        artist.verified ? createElement('span', { class: 'badge badge--verified' }, ['✓']) : null
      ]),
      createElement('div', { class: 'artist-card__body' }, [
        createElement('h3', { class: 'artist-card__name', style: 'display: flex; justify-content: space-between; align-items: center;' }, [
          artist.name,
          createElement('button', {
            class: `btn-follow ${isFollowing ? 'is-active' : ''}`,
            style: `background: none; border: none; cursor: pointer; color: ${isFollowing ? 'var(--color-accent)' : 'var(--color-text-muted)'};`,
            onClick: (e) => toggleFollow(artist.id, e.currentTarget)
          }, [isFollowing ? 'Seguindo' : 'Seguir'])
        ]),
        createElement('p', { class: 'artist-card__location', style: 'margin-bottom: 4px;' }, [`📍 ${artist.city}, ${artist.state}`]),
        createElement('div', { style: 'display: flex; justify-content: space-between; margin-bottom: 12px; font-size: var(--font-size-sm);' }, [
           createElement('span', { style: 'color: var(--color-warning);' }, [`⭐ ${artist.rating} (${artist.reviewCount})`]),
           createElement('span', { style: 'color: var(--color-success); font-weight: bold;' }, [artist.priceRange])
        ]),
        createElement('div', { class: 'artist-card__tags', style: 'margin-bottom: 16px;' },
          artist.styles.map(style => createElement('span', { class: 'tag tag--sm' }, [style]))
        ),
        createElement('a', { href: `index.html?id=${artist.id}`, class: 'btn btn--outline btn--block' }, ['Ver Perfil'])
      ])
    ]);
  });
}

/**
 * Toggles follow state for an artist.
 */
function toggleFollow(artistId, btnElement) {
  const user = AuthService.getCurrentUser();
  if (!user) {
    openModal('<div style="padding:20px;text-align:center"><h3>Ops!</h3><p>Faça login para seguir seus tatuadores favoritos.</p><br><a href="../../auth/login/index.html" class="btn btn--primary">Fazer Login</a></div>');
    return;
  }

  const isNowFollowing = StorageService.toggle(`following_${user.id}`, artistId);
  btnElement.textContent = isNowFollowing ? 'Seguindo' : 'Seguir';
  btnElement.style.color = isNowFollowing ? 'var(--color-accent)' : 'var(--color-text-muted)';
}

// Boot
document.addEventListener('DOMContentLoaded', init);
