// ==========================================================================
// INKFLOW — Client Dashboard Script
// Handles the private client dashboard logic.
// ==========================================================================

import API from './utils/api.js';
import AuthService from './utils/auth.js';
import StorageService from './utils/storage.js';
import {
  $,
  $$,
  renderCards,
  createElement,
  showToast,
  formatDate
} from './utils/dom.js';

// DOM Elements
const userGreeting = $('#user-greeting');
const sidebarLinks = $$('.dashboard-nav__item');
const sections = $$('.dashboard-section');

// Stats Elements
const statNextApp = $('#stat-next-app');
const statActiveQuotes = $('#stat-active-quotes');
const statSavedArtists = $('#stat-saved-artists');

// Containers
const appointmentsTableBody = $('#appointments-table-body');
const quotesTableBody = $('#quotes-table-body');
const favTattoosGrid = $('#fav-tattoos-grid');
const favArtistsGrid = $('#fav-artists-grid');
const settingsForm = $('#client-settings-form');

// State
let currentUser = null;

/**
 * Initializes the dashboard.
 */
async function init() {
  // 1. Guard route
  AuthService.requireAuth('client');
  currentUser = AuthService.getCurrentUser();
  
  if (!currentUser) return; 
  
  if (userGreeting) userGreeting.textContent = `Olá, ${currentUser.name.split(' ')[0]}`;
  
  setupNavigation();
  setupEventListeners();
  
  // Load initial data
  await Promise.all([
    loadStats(),
    loadAppointments(),
    loadQuotes(),
    loadFavorites(),
    loadSettings()
  ]);
}

/**
 * Sets up sidebar navigation to toggle sections.
 */
function setupNavigation() {
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = e.currentTarget.dataset.section;
      if (!targetId) return;
      
      // Update active link
      sidebarLinks.forEach(l => l.classList.remove('dashboard-nav__item--active'));
      e.currentTarget.classList.add('dashboard-nav__item--active');
      
      // Update active section
      sections.forEach(sec => {
        sec.style.display = sec.id === `sec-${targetId}` ? 'block' : 'none';
        sec.classList.toggle('active', sec.id === `sec-${targetId}`);
      });
      
      // Update title
      const titleEl = $('#dashboard-title');
      if (titleEl) titleEl.textContent = e.currentTarget.textContent.replace(/[^\w\sÀ-ÿ]/g, '').trim();
    });
  });
}

function setupEventListeners() {
  if (settingsForm) {
    settingsForm.addEventListener('submit', handleUpdateSettings);
  }
}

// ---------------------------------------------------------------------------
// DATA LOADING
// ---------------------------------------------------------------------------

async function loadStats() {
  if (!currentUser) return;
  
  // Next appointment
  const apps = (currentUser.appointments || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  const next = apps.find(a => new Date(a.date) > new Date());
  if (statNextApp) {
    statNextApp.textContent = next ? formatDate(next.date, { hour: '2-digit', minute: '2-digit' }) : 'Nenhuma';
  }
  
  // Active quotes
  const activeQ = (currentUser.quotes || []).filter(q => q.status !== 'completed' && q.status !== 'rejected');
  if (statActiveQuotes) statActiveQuotes.textContent = activeQ.length;
  
  // Saved Artists
  const savedArtistsIds = StorageService.get(`following_${currentUser.id}`, []);
  if (statSavedArtists) statSavedArtists.textContent = savedArtistsIds.length;
}

async function loadAppointments() {
  if (!appointmentsTableBody || !currentUser.appointments) return;
  
  const apps = currentUser.appointments.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  appointmentsTableBody.innerHTML = '';
  apps.forEach(app => {
    appointmentsTableBody.appendChild(createElement('tr', {}, [
      createElement('td', {}, [app.artistName]),
      createElement('td', {}, [app.description]),
      createElement('td', {}, [formatDate(app.date, { hour: '2-digit', minute: '2-digit' })]),
      createElement('td', {}, [
        createElement('span', { class: 'badge badge--verified', style: 'background: var(--color-success);' }, [app.status])
      ]),
      createElement('td', {}, [
        createElement('button', { class: 'btn btn--outline btn--xs' }, ['Detalhes'])
      ])
    ]));
  });
}

async function loadQuotes() {
  if (!quotesTableBody || !currentUser.quotes) return;
  
  const quotes = currentUser.quotes.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  quotesTableBody.innerHTML = '';
  quotes.forEach(quote => {
    quotesTableBody.appendChild(createElement('tr', {}, [
      createElement('td', {}, [quote.artistName]),
      createElement('td', {}, [quote.description]),
      createElement('td', {}, [formatDate(quote.date)]),
      createElement('td', {}, [quote.status]),
      createElement('td', {}, [
        createElement('button', { class: 'btn btn--primary btn--xs' }, ['Ver Resposta'])
      ])
    ]));
  });
}

async function loadFavorites() {
  if (!currentUser) return;
  
  // Load favorited tattoos
  if (favTattoosGrid) {
    const favTattooIds = StorageService.get(`favorites_${currentUser.id}`, []);
    if (favTattooIds.length === 0) {
      favTattoosGrid.innerHTML = '<p style="grid-column: 1/-1;">Nenhuma tatuagem salva.</p>';
    } else {
      const allTattoos = await API.get('tattoos');
      const favTattoos = allTattoos.filter(t => favTattooIds.includes(t.id));
      
      renderCards(favTattoosGrid, favTattoos, (tat) => {
        return createElement('article', { class: 'tattoo-card' }, [
          createElement('img', { src: tat.imageUrl, alt: tat.title, class: 'tattoo-card__img' }),
          createElement('div', { class: 'tattoo-card__info' }, [
            createElement('h4', {}, [tat.title]),
            createElement('a', { href: `../../pages/artists/index.html?id=${tat.artistId}` }, [tat.artistName])
          ])
        ]);
      });
    }
  }
  
  // Load followed artists
  if (favArtistsGrid) {
    const followedArtistIds = StorageService.get(`following_${currentUser.id}`, []);
    if (followedArtistIds.length === 0) {
      favArtistsGrid.innerHTML = '<p style="grid-column: 1/-1;">Você não segue nenhum artista.</p>';
    } else {
      const allArtists = await API.get('artists');
      const followedArtists = allArtists.filter(a => followedArtistIds.includes(a.id));
      
      renderCards(favArtistsGrid, followedArtists, (artist) => {
        return createElement('article', { class: 'artist-card', style: 'background: var(--color-bg-tertiary); padding: var(--space-md); border-radius: var(--radius-md); text-align: center;' }, [
          createElement('img', { src: artist.avatar, alt: artist.name, style: 'width: 80px; height: 80px; border-radius: 50%; margin-bottom: var(--space-sm); object-fit: cover;' }),
          createElement('h4', { style: 'margin-bottom: var(--space-xs);' }, [artist.name]),
          createElement('a', { href: `../../pages/artists/index.html?id=${artist.id}`, class: 'btn btn--outline btn--sm' }, ['Ver Perfil'])
        ]);
      });
    }
  }
}

function loadSettings() {
  if (!currentUser || !settingsForm) return;
  
  const nameInput = $('#set-name');
  const avatarInput = $('#set-avatar');
  
  if (nameInput) nameInput.value = currentUser.name || '';
  if (avatarInput) avatarInput.value = currentUser.avatar || '';
}

// ---------------------------------------------------------------------------
// ACTIONS
// ---------------------------------------------------------------------------

async function handleUpdateSettings(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  if (!currentUser) return;
  
  try {
    const patch = {
      name: formData.get('name'),
      avatar: formData.get('avatar')
    };
    
    await API.put('users', currentUser.id, patch);
    
    // Update local session
    currentUser = { ...currentUser, ...patch };
    StorageService.set('inkflow_session', currentUser);
    
    if (userGreeting) userGreeting.textContent = `Olá, ${currentUser.name.split(' ')[0]}`;
    
    showToast('Configurações salvas!', 'success');
  } catch (err) {
    showToast('Erro ao salvar configurações.', 'error');
  }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
