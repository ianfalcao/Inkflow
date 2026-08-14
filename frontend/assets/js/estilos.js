// ==========================================================================
// INKFLOW — Styles Page Script
// Handles the styles directory and individual style details.
// ==========================================================================

import API from './utils/api.js';
import AuthService from './utils/auth.js';
import {
  $,
  $$,
  renderCards,
  createElement,
  toggleEmpty,
  debounce,
  openModal,
  getQueryParams
} from './utils/dom.js';

// DOM Elements
const searchInput = $('#style-search');
const searchContainer = $('#styles-search-container');
const stylesGrid = $('#styles-grid');
const stylesEmpty = $('#styles-empty');

const detailContainer = $('#style-detail-container');
const detailContent = $('#style-detail-content');
const detailArtistsGrid = $('#style-artists-grid');
const detailTattoosGrid = $('#style-tattoos-grid');
const btnBack = $('#btn-back-styles');

// State
let allStyles = [];
let currentStyles = [];

/**
 * Initializes the styles page.
 */
async function init() {
  AuthService.updateHeaderUI();
  setupEventListeners();
  await loadStyles();
  
  const params = getQueryParams();
  const slug = params.get('slug');
  if (slug) {
    await showStyleDetail(slug);
  } else {
    showStylesList();
  }
}

/**
 * Sets up event listeners.
 */
function setupEventListeners() {
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      const q = searchInput.value.toLowerCase();
      currentStyles = allStyles.filter(s => s.name.toLowerCase().includes(q));
      renderStylesList();
    }, 300));
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => {
      // Update URL without reloading
      const url = new URL(window.location);
      url.searchParams.delete('slug');
      window.history.pushState({}, '', url);
      showStylesList();
    });
  }
}

/**
 * Loads all styles.
 */
async function loadStyles() {
  try {
    allStyles = await API.get('styles');
    currentStyles = [...allStyles];
  } catch (err) {
    console.error('Failed to load styles', err);
  }
}

/**
 * Shows the grid of all styles.
 */
function showStylesList() {
  if (detailContainer) detailContainer.hidden = true;
  if (stylesGrid) stylesGrid.hidden = false;
  if (searchContainer) searchContainer.hidden = false;
  
  renderStylesList();
}

/**
 * Renders the styles list to the DOM.
 */
function renderStylesList() {
  if (!stylesGrid) return;
  
  toggleEmpty('styles-empty', currentStyles.length === 0);
  
  renderCards(stylesGrid, currentStyles, (style) => {
    return createElement('article', { class: 'style-card-large' }, [
      createElement('img', { src: style.imageUrl, alt: `Estilo ${style.name}` }),
      createElement('div', { class: 'style-card-large__content' }, [
        createElement('h2', {}, [style.name]),
        createElement('p', {}, [style.description]),
        createElement('div', { style: 'margin-bottom: 1rem; color: var(--color-text-muted); font-size: var(--font-size-sm);' }, [
          `${style.artistCount} artistas • ${style.tattooCount} trabalhos`
        ]),
        createElement('button', { 
          class: 'btn btn--outline',
          onClick: () => {
            const url = new URL(window.location);
            url.searchParams.set('slug', style.slug);
            window.history.pushState({}, '', url);
            showStyleDetail(style.slug);
          }
        }, [`Explorar ${style.name}`])
      ])
    ]);
  });
}

/**
 * Shows the detail view for a specific style.
 */
async function showStyleDetail(slug) {
  const style = allStyles.find(s => s.slug === slug);
  if (!style) {
    showStylesList();
    return;
  }
  
  if (stylesGrid) stylesGrid.hidden = true;
  if (searchContainer) searchContainer.hidden = true;
  if (stylesEmpty) stylesEmpty.hidden = true;
  if (detailContainer) detailContainer.hidden = false;

  // Render header
  if (detailContent) {
    detailContent.innerHTML = '';
    detailContent.appendChild(
      createElement('div', { style: 'background: var(--color-bg-tertiary); padding: 2rem; border-radius: var(--radius-md); text-align: center; margin-bottom: 2rem;' }, [
        createElement('h2', { style: 'font-size: var(--font-size-3xl); margin-bottom: 1rem;' }, [style.name]),
        createElement('p', { style: 'font-size: var(--font-size-lg); max-width: 800px; margin: 0 auto;' }, [style.description])
      ])
    );
  }

  // Load and render artists
  try {
    const artists = await API.get('artists', { styles: style.slug });
    const topArtists = artists.sort((a, b) => b.rating - a.rating).slice(0, 3);
    
    renderCards(detailArtistsGrid, topArtists, (artist) => {
      return createElement('article', { class: 'artist-card', style: 'background: var(--color-bg-tertiary); padding: var(--space-md); border-radius: var(--radius-md); text-align: center;' }, [
        createElement('img', { src: artist.avatar, alt: artist.name, style: 'width: 80px; height: 80px; border-radius: 50%; margin-bottom: var(--space-sm); object-fit: cover;' }),
        createElement('h4', { style: 'margin-bottom: var(--space-xs);' }, [artist.name]),
        createElement('p', { style: 'color: var(--color-text-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-sm);' }, [`📍 ${artist.city}, ${artist.state}`]),
        createElement('a', { href: `../artists/index.html?id=${artist.id}`, class: 'btn btn--outline btn--sm' }, ['Ver Perfil'])
      ]);
    });
  } catch (err) {
    console.error('Failed to load artists for style', err);
  }

  // Load and render tattoos
  try {
    const tattoos = await API.get('tattoos', { style: style.slug });
    
    renderCards(detailTattoosGrid, tattoos, (tat) => {
      return createElement('article', { class: 'tattoo-card' }, [
        createElement('button', { 
          class: 'tattoo-card__modal-trigger', 
          type: 'button',
          onClick: () => openTattooModal(tat)
        }, [
          createElement('img', { src: tat.imageUrl, alt: tat.title, class: 'tattoo-card__img', loading: 'lazy' })
        ]),
        createElement('div', { class: 'tattoo-card__info', style: 'padding: 12px;' }, [
           createElement('a', { href: `../artists/index.html?id=${tat.artistId}`, style: 'font-weight: bold;' }, [tat.artistName])
        ])
      ]);
    });
  } catch (err) {
    console.error('Failed to load tattoos for style', err);
  }
}

/**
 * Reuses the modal logic for viewing a tattoo.
 */
function openTattooModal(tat) {
  const content = createElement('div', { class: 'tattoo-detail', style: 'display: flex; flex-direction: column; gap: 20px;' }, [
    createElement('img', { src: tat.imageUrl, alt: tat.title, style: 'width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px;' }),
    createElement('div', { class: 'tattoo-detail__info' }, [
      createElement('h2', { style: 'margin-bottom: 8px;' }, [tat.title]),
      createElement('p', { style: 'color: var(--color-text-muted); margin-bottom: 16px;' }, [tat.description]),
      createElement('a', { href: `../artists/index.html?id=${tat.artistId}`, class: 'btn btn--primary' }, [`Conhecer ${tat.artistName}`])
    ])
  ]);
  
  openModal(content, { size: 'lg' });
}

// Boot
document.addEventListener('DOMContentLoaded', init);
