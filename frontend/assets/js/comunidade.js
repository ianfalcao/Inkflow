// ==========================================================================
// INKFLOW — Community Page Script
// Handles the forum feed, category filtering, and post creation.
// ==========================================================================

import API from './utils/api.js';
import AuthService from './utils/auth.js';
import {
  $,
  $$,
  renderCards,
  createElement,
  toggleLoading,
  toggleEmpty,
  openModal,
  closeModal,
  showToast,
  timeAgo,
  generateId
} from './utils/dom.js';

// DOM Elements
const postsContainer = $('#posts-container');
const categoryLinks = $$('#category-filter a');
const sortSelect = $('#sort-posts');
const btnCreateTopic = $('#btn-create-topic');
const createTopicTemplate = $('#create-topic-template');

// State
let allPosts = [];
let currentCategory = '';
let currentSort = 'recent';

/**
 * Initializes the community page.
 */
async function init() {
  AuthService.updateHeaderUI();
  setupEventListeners();
  await loadPosts();
}

/**
 * Sets up event listeners.
 */
function setupEventListeners() {
  // Category filtering
  categoryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update active state
      categoryLinks.forEach(l => l.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      currentCategory = e.currentTarget.dataset.category || '';
      renderPosts();
    });
  });

  // Sorting
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderPosts();
    });
  }

  // Create Topic
  if (btnCreateTopic && createTopicTemplate) {
    btnCreateTopic.addEventListener('click', () => {
      const user = AuthService.getCurrentUser();
      if (!user) {
        showToast('Faça login para criar um tópico', 'warning');
        setTimeout(() => window.location.href = '../../auth/login/index.html', 1500);
        return;
      }
      
      openModal(createTopicTemplate.innerHTML, { size: 'md' });
      
      // Setup form inside modal
      setTimeout(() => {
        const form = $('#create-topic-form');
        if (form) {
          form.addEventListener('submit', handleCreateTopic);
        }
      }, 0);
    });
  }
}

/**
 * Loads posts from the API.
 */
async function loadPosts() {
  toggleLoading('posts-loading', true);
  toggleEmpty('posts-empty', false);
  if (postsContainer) postsContainer.innerHTML = '';
  
  try {
    allPosts = await API.get('posts');
    renderPosts();
  } catch (err) {
    console.error('Failed to load posts', err);
  } finally {
    toggleLoading('posts-loading', false);
  }
}

/**
 * Filters, sorts, and renders the posts.
 */
function renderPosts() {
  if (!postsContainer) return;
  
  // Filter
  let filtered = allPosts;
  if (currentCategory) {
    filtered = allPosts.filter(p => p.category === currentCategory);
  }
  
  // Sort
  if (currentSort === 'recent') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (currentSort === 'popular') {
    filtered.sort((a, b) => b.likes - a.likes);
  }
  
  toggleEmpty('posts-empty', filtered.length === 0);
  
  renderCards(postsContainer, filtered, (post) => {
    return createElement('article', { class: 'topic-card' }, [
      createElement('div', { style: 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;' }, [
         createElement('span', { class: 'tag tag--sm' }, [post.category]),
         createElement('span', { style: 'color: var(--color-text-muted); font-size: var(--font-size-sm);' }, [timeAgo(post.createdAt)])
      ]),
      createElement('h3', { style: 'margin-bottom: 0.5rem;' }, [
         createElement('a', { 
           href: '#', 
           onClick: (e) => { e.preventDefault(); openPostDetail(post); } 
         }, [post.title])
      ]),
      createElement('p', { style: 'color: var(--color-text-muted); margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;' }, [post.content]),
      createElement('div', { class: 'topic-card__meta', style: 'display: flex; gap: 1rem; color: var(--color-text-muted); font-size: var(--font-size-sm);' }, [
        createElement('span', {}, [
          'Postado por ',
          createElement('strong', {}, [`@${post.authorName.replace(/\s+/g, '').toLowerCase()}`])
        ]),
        createElement('span', {}, [`💬 ${post.comments?.length || 0} respostas`]),
        createElement('span', {}, [`❤️ ${post.likes} curtidas`])
      ])
    ]);
  });
}

/**
 * Handles the topic creation form submission.
 */
async function handleCreateTopic(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  
  const user = AuthService.getCurrentUser();
  if (!user) return;
  
  const newPost = {
    id: generateId('post-'),
    authorId: user.id,
    authorName: user.name,
    category: formData.get('category'),
    title: formData.get('title'),
    content: formData.get('content'),
    likes: 0,
    createdAt: new Date().toISOString(),
    comments: []
  };
  
  try {
    await API.post('posts', newPost);
    allPosts.unshift(newPost); // Add to top
    renderPosts();
    closeModal();
    showToast('Tópico criado com sucesso!', 'success');
  } catch (err) {
    showToast('Erro ao criar tópico', 'error');
  }
}

/**
 * Opens a detailed view of a post with comments.
 */
function openPostDetail(post) {
  const content = createElement('div', { class: 'post-detail', style: 'max-height: 80vh; overflow-y: auto; padding-right: 1rem;' }, [
    createElement('span', { class: 'tag' }, [post.category]),
    createElement('h2', { style: 'margin: 1rem 0;' }, [post.title]),
    createElement('div', { style: 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; color: var(--color-text-muted);' }, [
       createElement('span', {}, [post.authorName]),
       createElement('span', {}, ['•']),
       createElement('span', {}, [timeAgo(post.createdAt)])
    ]),
    createElement('p', { style: 'font-size: var(--font-size-md); line-height: 1.6; margin-bottom: 2rem;' }, [post.content]),
    
    // Actions
    createElement('div', { style: 'display: flex; gap: 1rem; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); padding: 1rem 0; margin-bottom: 2rem;' }, [
      createElement('button', { 
        class: 'btn btn--outline btn--sm',
        onClick: async (e) => {
          post.likes++;
          await API.put('posts', post.id, { likes: post.likes });
          e.currentTarget.innerHTML = `❤️ Curtido (${post.likes})`;
          e.currentTarget.disabled = true;
          renderPosts();
        }
      }, [`🤍 Curtir (${post.likes})`])
    ]),
    
    // Comments section
    createElement('h3', { style: 'margin-bottom: 1rem;' }, [`Respostas (${post.comments?.length || 0})`]),
    createElement('div', { class: 'comments-list', style: 'display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;' }, 
      (post.comments || []).map(comment => createElement('div', { style: 'background: var(--color-bg-tertiary); padding: 1rem; border-radius: var(--radius-sm);' }, [
        createElement('div', { style: 'display: flex; justify-content: space-between; margin-bottom: 0.5rem;' }, [
          createElement('strong', {}, [comment.authorName]),
          createElement('span', { style: 'color: var(--color-text-muted); font-size: var(--font-size-xs);' }, [timeAgo(comment.createdAt)])
        ]),
        createElement('p', {}, [comment.content])
      ]))
    ),
    
    // Add comment form
    createElement('form', { 
      id: 'add-comment-form', 
      onSubmit: async (e) => {
        e.preventDefault();
        const user = AuthService.getCurrentUser();
        if (!user) {
          showToast('Faça login para comentar', 'warning');
          return;
        }
        
        const text = e.target.querySelector('textarea').value;
        const newComment = {
          id: generateId('com-'),
          postId: post.id,
          authorName: user.name,
          content: text,
          createdAt: new Date().toISOString()
        };
        
        post.comments = post.comments || [];
        post.comments.push(newComment);
        await API.put('posts', post.id, { comments: post.comments });
        
        // Refresh modal
        closeModal();
        openPostDetail(post);
        renderPosts();
      }
    }, [
      createElement('textarea', { class: 'input', rows: '3', placeholder: 'Adicione uma resposta...', required: true, style: 'margin-bottom: 1rem;' }),
      createElement('button', { class: 'btn btn--primary', type: 'submit' }, ['Responder'])
    ])
  ]);
  
  openModal(content, { size: 'lg' });
}

// Boot
document.addEventListener('DOMContentLoaded', init);
