// ==========================================================================
// INKFLOW — Artist Dashboard Script
// Handles the private artist dashboard logic.
// ==========================================================================

import API from './utils/api.js';
import AuthService from './utils/auth.js';
import {
  $,
  $$,
  renderCards,
  createElement,
  openModal,
  closeModal,
  showToast,
  generateId,
  formatDate
} from './utils/dom.js';

// DOM Elements
const userGreeting = $('#user-greeting');
const sidebarLinks = $$('.dashboard-nav__item');
const sections = $$('.dashboard-section');
const btnUpload = $('#btn-upload-work');
const uploadTemplate = $('#upload-modal-template');

// Stats Elements
const statViews = $('#stat-views');
const statWorks = $('#stat-works');
const statRating = $('#stat-rating');
const statQuotes = $('#stat-quotes');

// Containers
const portfolioGrid = $('#portfolio-grid');
const agendaTableBody = $('#agenda-table-body');
const quotesTableBody = $('#quotes-table-body');
const settingsForm = $('#artist-settings-form');

// State
let currentUser = null;
let artistProfile = null;
let artistTattoos = [];

/**
 * Initializes the dashboard.
 */
async function init() {
  // 1. Guard route
  AuthService.requireAuth('artist');
  currentUser = AuthService.getCurrentUser();
  
  if (!currentUser) return; // Should be handled by guard, but just in case
  
  if (userGreeting) userGreeting.textContent = `Olá, ${currentUser.name.split(' ')[0]}`;
  
  // 2. Fetch artist profile data
  try {
    const profiles = await API.get('artists', { userId: currentUser.id });
    artistProfile = profiles[0];
  } catch (err) {
    console.error('Error fetching artist profile', err);
  }
  
  setupNavigation();
  setupEventListeners();
  
  // Load initial data
  await Promise.all([
    loadStats(),
    loadPortfolio(),
    loadAgenda(),
    loadQuotes(),
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
  if (btnUpload && uploadTemplate) {
    btnUpload.addEventListener('click', () => {
      openModal(uploadTemplate.innerHTML, { size: 'md' });
      
      setTimeout(() => {
        const form = $('#upload-work-form');
        if (form) {
          form.addEventListener('submit', handleUploadWork);
        }
      }, 0);
    });
  }
  
  if (settingsForm) {
    settingsForm.addEventListener('submit', handleUpdateSettings);
  }
}

// ---------------------------------------------------------------------------
// DATA LOADING
// ---------------------------------------------------------------------------

async function loadStats() {
  if (!artistProfile) return;
  
  if (statWorks) statWorks.textContent = artistProfile.completedWorks || 0;
  if (statRating) statRating.textContent = artistProfile.rating.toFixed(1) || '0.0';
  if (statViews) statViews.textContent = artistProfile.followers || 0; // Mocking views with followers
  if (statQuotes) statQuotes.textContent = currentUser.quotesReceived?.length || 0;
}

async function loadPortfolio() {
  if (!artistProfile || !portfolioGrid) return;
  
  try {
    artistTattoos = await API.get('tattoos', { artistId: artistProfile.id });
    
    renderCards(portfolioGrid, artistTattoos, (tat) => {
      return createElement('article', { class: 'tattoo-card', style: 'position: relative;' }, [
        createElement('img', { src: tat.imageUrl, alt: tat.title, class: 'tattoo-card__img' }),
        createElement('div', { class: 'tattoo-card__info' }, [
          createElement('h4', {}, [tat.title]),
          createElement('span', { class: 'tag tag--xs' }, [tat.style])
        ]),
        createElement('button', {
          class: 'btn btn--danger btn--xs',
          style: 'position: absolute; top: 10px; right: 10px;',
          onClick: () => deleteWork(tat.id)
        }, ['✕'])
      ]);
    });
  } catch (err) {
    console.error('Failed to load portfolio', err);
  }
}

async function loadAgenda() {
  if (!agendaTableBody || !currentUser.appointmentsReceived) return;
  
  const apps = currentUser.appointmentsReceived.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  agendaTableBody.innerHTML = '';
  apps.forEach(app => {
    agendaTableBody.appendChild(createElement('tr', {}, [
      createElement('td', {}, [app.clientName]),
      createElement('td', {}, [app.description]),
      createElement('td', {}, [formatDate(app.date, { hour: '2-digit', minute: '2-digit' })]),
      createElement('td', {}, [
        createElement('span', { class: 'badge badge--verified', style: 'background: var(--color-success);' }, ['Confirmado'])
      ]),
      createElement('td', {}, [
        createElement('button', { class: 'btn btn--outline btn--xs' }, ['Detalhes'])
      ])
    ]));
  });
}

async function loadQuotes() {
  if (!quotesTableBody || !currentUser.quotesReceived) return;
  
  const quotes = currentUser.quotesReceived.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  quotesTableBody.innerHTML = '';
  quotes.forEach(quote => {
    quotesTableBody.appendChild(createElement('tr', {}, [
      createElement('td', {}, [quote.clientName]),
      createElement('td', {}, [quote.description]),
      createElement('td', {}, [formatDate(quote.date)]),
      createElement('td', {}, [quote.status]),
      createElement('td', {}, [
        createElement('button', { class: 'btn btn--primary btn--xs' }, ['Responder'])
      ])
    ]));
  });
}

function loadSettings() {
  if (!artistProfile || !settingsForm) return;
  
  const bioInput = $('#set-bio');
  const instaInput = $('#set-instagram');
  
  if (bioInput) bioInput.value = artistProfile.bio || '';
  if (instaInput) instaInput.value = artistProfile.instagram || '';
}

// ---------------------------------------------------------------------------
// ACTIONS
// ---------------------------------------------------------------------------

async function handleUploadWork(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  if (!artistProfile) return;
  
  const newTattoo = {
    id: generateId('tat-'),
    artistId: artistProfile.id,
    artistName: artistProfile.name,
    title: formData.get('title'),
    description: '',
    imageUrl: formData.get('imageUrl'),
    style: formData.get('style'),
    bodyPart: formData.get('bodyPart'),
    size: 'Média',
    likes: 0,
    views: 0,
    createdAt: new Date().toISOString(),
    tags: []
  };
  
  try {
    await API.post('tattoos', newTattoo);
    closeModal();
    showToast('Obra adicionada com sucesso!', 'success');
    await loadPortfolio();
    
    // Update stats locally
    artistProfile.completedWorks++;
    await API.put('artists', artistProfile.id, { completedWorks: artistProfile.completedWorks });
    loadStats();
    
  } catch (err) {
    showToast('Erro ao salvar obra.', 'error');
  }
}

async function deleteWork(id) {
  if (confirm('Tem certeza que deseja remover esta obra do portfólio?')) {
    try {
      await API.delete('tattoos', id);
      showToast('Obra removida.', 'success');
      
      // Update stats locally
      artistProfile.completedWorks = Math.max(0, artistProfile.completedWorks - 1);
      await API.put('artists', artistProfile.id, { completedWorks: artistProfile.completedWorks });
      
      await loadPortfolio();
      loadStats();
    } catch (err) {
      showToast('Erro ao remover obra.', 'error');
    }
  }
}

async function handleUpdateSettings(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  if (!artistProfile) return;
  
  try {
    const patch = {
      bio: formData.get('bio'),
      instagram: formData.get('instagram')
    };
    
    await API.put('artists', artistProfile.id, patch);
    artistProfile = { ...artistProfile, ...patch };
    showToast('Configurações salvas!', 'success');
  } catch (err) {
    showToast('Erro ao salvar configurações.', 'error');
  }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
