// ==========================================================================
// INKFLOW — Admin Dashboard Script
// Handles the administration area logic.
// ==========================================================================

import API from './utils/api.js';
import AuthService from './utils/auth.js';
import {
  $,
  $$,
  createElement,
  showToast,
  confirmDialog,
  formatDate
} from './utils/dom.js';

// DOM Elements
const userGreeting = $('#user-greeting');
const sidebarLinks = $$('.dashboard-nav__item');
const sections = $$('.dashboard-section');

// Stats Elements
const statUsers = $('#stat-users');
const statArtists = $('#stat-artists');
const statPosts = $('#stat-posts');

// Containers
const usersTableBody = $('#users-table-body');
const artistsTableBody = $('#artists-table-body');
const approvalsTableBody = $('#approvals-table-body');
const postsTableBody = $('#posts-table-body');
const searchUsersInput = $('#search-users');

// State
let currentUser = null;
let allUsers = [];
let allArtists = [];
let allPosts = [];

/**
 * Initializes the dashboard.
 */
async function init() {
  // Guard route
  AuthService.requireAuth('admin');
  currentUser = AuthService.getCurrentUser();
  
  if (!currentUser) return;
  
  if (userGreeting) userGreeting.textContent = `Olá, ${currentUser.name}`;
  
  setupNavigation();
  setupEventListeners();
  
  // Load initial data
  await refreshData();
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
  if (searchUsersInput) {
    searchUsersInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = allUsers.filter(u => u.email.toLowerCase().includes(term) || u.name.toLowerCase().includes(term));
      renderUsers(filtered);
    });
  }
}

// ---------------------------------------------------------------------------
// DATA LOADING
// ---------------------------------------------------------------------------

async function refreshData() {
  try {
    allUsers = await API.get('users');
    allArtists = await API.get('artists');
    allPosts = await API.get('posts');
    
    updateStats();
    renderUsers(allUsers);
    renderArtists();
    renderApprovals();
    renderPosts();
  } catch (err) {
    console.error('Failed to load admin data', err);
    showToast('Erro ao carregar dados do painel.', 'error');
  }
}

function updateStats() {
  if (statUsers) statUsers.textContent = allUsers.length;
  if (statArtists) statArtists.textContent = allArtists.length;
  if (statPosts) statPosts.textContent = allPosts.length;
}

// ---------------------------------------------------------------------------
// RENDERING & ACTIONS
// ---------------------------------------------------------------------------

function renderUsers(usersToRender) {
  if (!usersTableBody) return;
  usersTableBody.innerHTML = '';
  
  usersToRender.forEach(user => {
    // Prevent deleting self
    const isSelf = user.id === currentUser.id;
    
    usersTableBody.appendChild(createElement('tr', {}, [
      createElement('td', {}, [user.id.substring(0,8)]),
      createElement('td', {}, [user.name]),
      createElement('td', {}, [user.email]),
      createElement('td', {}, [
         createElement('span', { class: 'badge', style: 'background: var(--color-bg-secondary);' }, [user.role])
      ]),
      createElement('td', {}, [formatDate(user.createdAt)]),
      createElement('td', {}, [
        isSelf ? createElement('span', { style: 'color: var(--color-text-muted);' }, ['(Você)']) :
        createElement('button', {
          class: 'btn btn--danger btn--xs',
          onClick: () => deleteUser(user.id, user.name)
        }, ['Excluir'])
      ])
    ]));
  });
}

async function deleteUser(id, name) {
  const confirmed = await confirmDialog('Excluir Usuário', `Tem certeza que deseja excluir ${name}? Esta ação não pode ser desfeita.`, { variant: 'danger' });
  if (!confirmed) return;
  
  try {
    await API.delete('users', id);
    // Cleanup related data (cascade delete mock)
    const relatedArtist = allArtists.find(a => a.userId === id);
    if (relatedArtist) {
      await API.delete('artists', relatedArtist.id);
    }
    
    showToast(`Usuário ${name} excluído.`, 'success');
    await refreshData();
  } catch (err) {
    showToast('Erro ao excluir usuário.', 'error');
  }
}

function renderArtists() {
  if (!artistsTableBody) return;
  artistsTableBody.innerHTML = '';
  
  allArtists.forEach(artist => {
    artistsTableBody.appendChild(createElement('tr', {}, [
      createElement('td', {}, [artist.name]),
      createElement('td', {}, [`${artist.city}/${artist.state}`]),
      createElement('td', {}, [artist.styles.join(', ')]),
      createElement('td', {}, [
        artist.verified 
          ? createElement('span', { class: 'badge badge--verified', style: 'background: var(--color-success);' }, ['Sim'])
          : createElement('span', { class: 'badge', style: 'background: var(--color-warning); color: black;' }, ['Pendente'])
      ]),
      createElement('td', {}, [
        createElement('button', { class: 'btn btn--outline btn--xs' }, ['Ver Perfil'])
      ])
    ]));
  });
}

function renderApprovals() {
  if (!approvalsTableBody) return;
  approvalsTableBody.innerHTML = '';
  
  const pending = allArtists.filter(a => !a.verified);
  
  if (pending.length === 0) {
    approvalsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Não há artistas pendentes de aprovação.</td></tr>';
    return;
  }
  
  pending.forEach(artist => {
    // Find associated user
    const user = allUsers.find(u => u.id === artist.userId) || { email: 'desconhecido', createdAt: new Date() };
    
    approvalsTableBody.appendChild(createElement('tr', {}, [
      createElement('td', {}, [artist.name]),
      createElement('td', {}, [user.email]),
      createElement('td', {}, [formatDate(user.createdAt)]),
      createElement('td', {}, [
        createElement('button', { 
          class: 'btn btn--success btn--xs', 
          style: 'margin-right: 0.5rem;',
          onClick: () => approveArtist(artist.id, artist.name)
        }, ['Aprovar']),
        createElement('button', { 
          class: 'btn btn--danger btn--xs',
          onClick: () => rejectArtist(artist.id, artist.name)
        }, ['Rejeitar'])
      ])
    ]));
  });
}

async function approveArtist(id, name) {
  const confirmed = await confirmDialog('Aprovar Artista', `Deseja aprovar o perfil de ${name}? Eles ganharão o selo de verificado e aparecerão nas buscas.`, { confirmText: 'Aprovar', variant: 'success' });
  if (!confirmed) return;
  
  try {
    await API.put('artists', id, { verified: true });
    showToast(`${name} aprovado com sucesso!`, 'success');
    await refreshData();
  } catch (err) {
    showToast('Erro ao aprovar artista.', 'error');
  }
}

async function rejectArtist(id, name) {
  const confirmed = await confirmDialog('Rejeitar Artista', `Deseja rejeitar e remover o perfil de artista de ${name}? A conta de usuário não será excluída.`, { confirmText: 'Rejeitar', variant: 'danger' });
  if (!confirmed) return;
  
  try {
    await API.delete('artists', id);
    showToast(`Perfil de ${name} rejeitado.`, 'info');
    await refreshData();
  } catch (err) {
    showToast('Erro ao rejeitar artista.', 'error');
  }
}

function renderPosts() {
  if (!postsTableBody) return;
  postsTableBody.innerHTML = '';
  
  // Sort recent first
  const sortedPosts = [...allPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  sortedPosts.forEach(post => {
    postsTableBody.appendChild(createElement('tr', {}, [
      createElement('td', {}, [
        createElement('span', { class: 'tag tag--sm' }, [post.category])
      ]),
      createElement('td', {}, [post.title]),
      createElement('td', {}, [post.authorName]),
      createElement('td', {}, [post.likes.toString()]),
      createElement('td', {}, [
        createElement('button', { 
          class: 'btn btn--danger btn--xs',
          onClick: () => deletePost(post.id)
        }, ['Excluir'])
      ])
    ]));
  });
}

async function deletePost(id) {
  const confirmed = await confirmDialog('Excluir Tópico', 'Tem certeza que deseja excluir esta discussão?', { variant: 'danger' });
  if (!confirmed) return;
  
  try {
    await API.delete('posts', id);
    showToast('Tópico excluído.', 'success');
    await refreshData();
  } catch (err) {
    showToast('Erro ao excluir tópico.', 'error');
  }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
