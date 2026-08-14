// ==========================================================================
// INKFLOW — Homepage Script
// Handles the main exploration gallery, filters, and featured artists.
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
  openModal,
  initScrollAnimations
} from './utils/dom.js';

// Seed initial data if missing (Prototype only)
import { seedTattoos } from './data/tatuagens.js';
import { seedArtists } from './data/artistas.js';
import { seedUsers } from './data/usuarios.js';
seedUsers();
seedArtists();
seedTattoos();

// DOM Elements
const header = $('#main-header');
const mobileMenuBtn = $('#mobile-menu-btn');
const mainNav = $('#main-nav');
const filterForm = $('#explorar-filter-form');
const worksContainer = $('#works-container');
const sortSelect = $('#sort-select');
const totalWorksCount = $('#total-works');
const featuredArtistsContainer = $('#featured-artists-container');

// State
let allTattoos = [];
let currentTattoos = [];

/**
 * Initializes the homepage.
 */
async function init() {
  AuthService.updateHeaderUI();
  initScrollAnimations();
  setupEventListeners();
  
  await loadFeaturedArtists();
  await loadTattoos();
}

/**
 * Sets up all event listeners for the homepage.
 */
function setupEventListeners() {
  // Mobile Menu
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mainNav.classList.toggle('nav--open');
      document.body.classList.toggle('body--no-scroll');
    });
  }

  // Navbar Scroll
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    }, { passive: true });
  }

  // Search & Filter (Debounced)
  if (filterForm) {
    filterForm.addEventListener('submit', (e) => e.preventDefault()); // Prevent normal submit
    
    const inputs = $$('input, select', filterForm);
    inputs.forEach(input => {
      input.addEventListener('input', debounce(async () => {
        await applyFilters();
      }, 400));
    });
  }

  // Sort
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortTattoos();
      renderGallery();
    });
  }
}

/**
 * Loads featured artists and renders them in the carousel.
 */
async function loadFeaturedArtists() {
  if (!featuredArtistsContainer) return;
  
  try {
    // Get top artists by rating
    const artists = await API.get('artists');
    const featured = artists.sort((a, b) => b.rating - a.rating).slice(0, 5);
    
    renderCards(featuredArtistsContainer, featured, (artist) => {
      return createElement('article', { 
        class: 'artist-card', 
        style: 'min-width: 280px; flex-shrink: 0; background: var(--color-bg-tertiary); border-radius: var(--radius-md); padding: var(--space-md); text-align: center;' 
      }, [
        createElement('div', { class: 'artist-card__avatar-wrap', style: 'margin-bottom: var(--space-sm);' }, [
          createElement('img', { 
            src: artist.avatar, 
            alt: artist.name, 
            class: 'artist-card__avatar', 
            style: 'width: 80px; height: 80px; border-radius: 50%; object-fit: cover;' 
          }),
          artist.verified ? createElement('span', { class: 'badge badge--verified', style: 'position: absolute; bottom: 0; right: 50%; transform: translateX(35px); background: var(--color-success); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px;' }, ['✓']) : null
        ].filter(Boolean)),
        createElement('h3', { class: 'artist-card__name', style: 'font-size: var(--font-size-lg); margin-bottom: var(--space-2xs);' }, [artist.name]),
        createElement('p', { class: 'artist-card__location', style: 'color: var(--color-text-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-sm);' }, [`📍 ${artist.city}, ${artist.state}`]),
        createElement('div', { class: 'artist-card__tags', style: 'display: flex; gap: var(--space-xs); justify-content: center; flex-wrap: wrap; margin-bottom: var(--space-md);' }, 
          artist.styles.slice(0, 2).map(style => createElement('span', { class: 'tag tag--xs', style: 'background: var(--color-bg-secondary); padding: 4px 8px; border-radius: var(--radius-sm); font-size: 11px;' }, [style]))
        ),
        createElement('a', { href: `../artists/index.html?id=${artist.id}`, class: 'btn btn--outline btn--block' }, ['Ver Perfil'])
      ]);
    });
  } catch (err) {
    console.error('Failed to load featured artists', err);
  }
}

/**
 * Loads all tattoos from the API.
 */
async function loadTattoos() {
  toggleLoading('works-loading', true);
  toggleEmpty('works-empty', false);
  if (worksContainer) worksContainer.innerHTML = '';
  
  try {
    allTattoos = await API.get('tattoos');
    await applyFilters(); // Initial render with empty filters
  } catch (err) {
    console.error('Failed to load tattoos', err);
  } finally {
    toggleLoading('works-loading', false);
  }
}

/**
 * Applies current form filters to the tattoo list.
 */
async function applyFilters() {
  if (!filterForm) return;
  
  const formData = new FormData(filterForm);
  const q = formData.get('q')?.toLowerCase() || '';
  const style = formData.get('style') || '';
  const bodyPart = formData.get('body_part') || '';
  
  // Client-side filtering for immediate feedback
  currentTattoos = allTattoos.filter(tat => {
    let match = true;
    
    if (q) {
      match = match && (
        tat.title.toLowerCase().includes(q) || 
        tat.artistName.toLowerCase().includes(q) ||
        tat.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (style) {
      match = match && tat.style === style;
    }
    if (bodyPart) {
      match = match && tat.bodyPart === bodyPart;
    }
    
    return match;
  });
  
  sortTattoos();
  renderGallery();
}

/**
 * Sorts the currentTattoos array based on the selected option.
 */
function sortTattoos() {
  if (!sortSelect) return;
  const sortBy = sortSelect.value;
  
  if (sortBy === 'recent') {
    currentTattoos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'popular') {
    currentTattoos.sort((a, b) => b.likes - a.likes);
  } else if (sortBy === 'trending') {
    currentTattoos.sort((a, b) => b.views - a.views);
  }
}

/**
 * Renders the tattoo gallery grid.
 */
function renderGallery() {
  if (!worksContainer) return;
  
  if (totalWorksCount) {
    totalWorksCount.textContent = currentTattoos.length;
  }
  
  toggleEmpty('works-empty', currentTattoos.length === 0);
  
  // Basic rendering. Ideally, we'd have a true Masonry layout.
  // We use the CSS Grid defined in style.css (.gallery-grid)
  
  renderCards(worksContainer, currentTattoos, (tat) => {
    // Check if favorited by current user
    const user = AuthService.getCurrentUser();
    const isFavorited = user ? StorageService.has(`favorites_${user.id}`, tat.id) : false;
    
    const card = createElement('article', { class: 'tattoo-card', 'data-tattoo-id': tat.id }, [
      createElement('button', { 
        class: 'tattoo-card__modal-trigger', 
        type: 'button',
        onClick: () => openTattooModal(tat)
      }, [
        createElement('img', { src: tat.imageUrl, alt: tat.title, class: 'tattoo-card__img', loading: 'lazy' }),
        createElement('div', { class: 'tattoo-card__overlay' }, [
          createElement('span', { class: 'tattoo-card__zoom-icon' }, ['🔍'])
        ])
      ]),
      createElement('div', { class: 'tattoo-card__info', style: 'display: flex; justify-content: space-between; align-items: center; padding: 12px;' }, [
        createElement('div', {}, [
           createElement('a', { href: `../artists/index.html?id=${tat.artistId}`, class: 'tattoo-card__artist', style: 'font-weight: bold; display: block;' }, [tat.artistName]),
           createElement('span', { class: 'tag tag--xs', style: 'margin-top: 4px; display: inline-block;' }, [tat.style])
        ]),
        createElement('button', { 
          class: `btn-favorite ${isFavorited ? 'is-active' : ''}`, 
          style: 'background: none; border: none; cursor: pointer; font-size: 20px;',
          onClick: (e) => toggleFavorite(tat.id, e.currentTarget)
        }, [isFavorited ? '❤️' : '🤍'])
      ])
    ]);
    
    return card;
  });
}

/**
 * Toggles a tattoo in the user's favorites.
 */
function toggleFavorite(tattooId, btnElement) {
  const user = AuthService.getCurrentUser();
  if (!user) {
    // Prompt login
    openModal('<div style="padding:20px;text-align:center"><h3>Ops!</h3><p>Faça login para salvar suas inspirações favoritas.</p><br><a href="../../auth/login/index.html" class="btn btn--primary">Fazer Login</a></div>');
    return;
  }
  
  const isNowFav = StorageService.toggle(`favorites_${user.id}`, tattooId);
  btnElement.textContent = isNowFav ? '❤️' : '🤍';
  btnElement.classList.toggle('is-active', isNowFav);
}

/**
 * Opens the image modal for a specific tattoo.
 */
function openTattooModal(tat) {
  const content = createElement('div', { class: 'tattoo-detail', style: 'display: flex; flex-direction: column; gap: 20px;' }, [
    createElement('img', { src: tat.imageUrl, alt: tat.title, style: 'width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px;' }),
    createElement('div', { class: 'tattoo-detail__info' }, [
      createElement('h2', { style: 'margin-bottom: 8px;' }, [tat.title]),
      createElement('p', { style: 'color: var(--color-text-muted); margin-bottom: 16px;' }, [tat.description]),
      createElement('div', { style: 'display: flex; gap: 10px; margin-bottom: 20px;' }, [
        createElement('span', { class: 'tag' }, [tat.style]),
        createElement('span', { class: 'tag' }, [tat.bodyPart])
      ]),
      createElement('a', { href: `../artists/index.html?id=${tat.artistId}`, class: 'btn btn--primary' }, [`Conhecer ${tat.artistName}`])
    ])
  ]);
  
  openModal(content, { size: 'lg' });
}

// Boot
document.addEventListener('DOMContentLoaded', init);
