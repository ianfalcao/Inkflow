// ==========================================================================
// INKFLOW — DOM Utilities
// Shared helpers for element creation, toasts, modals, rendering, and animations.
// ==========================================================================

/**
 * querySelector shortcut.
 * @param {string} selector
 * @param {Element} [scope=document]
 * @returns {Element|null}
 */
export const $ = (selector, scope = document) => scope.querySelector(selector);

/**
 * querySelectorAll shortcut — returns a real Array.
 * @param {string} selector
 * @param {Element} [scope=document]
 * @returns {Element[]}
 */
export const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/**
 * Creates a DOM element with attributes and children.
 * @param {string} tag
 * @param {object} [attrs={}] — key/value pairs; 'class' and 'className' both work
 * @param {(string|Element)[]} [children=[]]
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className' || key === 'class') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'innerHTML') {
      el.innerHTML = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Element) {
      el.appendChild(child);
    }
  }
  return el;
}

// ---------------------------------------------------------------------------
// TOAST NOTIFICATIONS
// ---------------------------------------------------------------------------
let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = createElement('div', { class: 'toast-container', id: 'toast-container' });
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Shows a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type='info']
 * @param {number} [durationMs=3500]
 */
export function showToast(message, type = 'info', durationMs = 3500) {
  const container = ensureToastContainer();
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const toast = createElement('div', { class: `toast toast--${type}` }, [
    createElement('span', { class: 'toast__icon' }, [icons[type] || 'ℹ']),
    createElement('span', { class: 'toast__message' }, [message]),
  ]);
  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // Fallback removal
    setTimeout(() => toast.remove(), 500);
  }, durationMs);
}

// ---------------------------------------------------------------------------
// MODAL SYSTEM
// ---------------------------------------------------------------------------
let modalOverlay = null;

function ensureModalOverlay() {
  if (!modalOverlay) {
    modalOverlay = createElement('div', {
      class: 'modal-overlay',
      id: 'modal-overlay',
      onClick: (e) => { if (e.target === modalOverlay) closeModal(); }
    });
    document.body.appendChild(modalOverlay);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('modal-overlay--active')) {
        closeModal();
      }
    });
  }
  return modalOverlay;
}

/**
 * Opens a modal with the given content.
 * @param {Element|string} content — DOM element or HTML string
 * @param {object} [options={}]
 * @param {string} [options.size='md'] — 'sm', 'md', 'lg', 'xl', 'full'
 * @param {Function} [options.onClose] — called when modal closes
 */
export function openModal(content, options = {}) {
  const overlay = ensureModalOverlay();
  const { size = 'md', onClose } = options;

  overlay.innerHTML = '';
  const modalBox = createElement('div', { class: `modal modal--${size}` }, [
    createElement('button', {
      class: 'modal__close',
      type: 'button',
      'aria-label': 'Fechar',
      onClick: () => closeModal()
    }, ['✕']),
    createElement('div', { class: 'modal__body' }),
  ]);

  const body = $('.modal__body', modalBox);
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }

  overlay._onClose = onClose || null;
  overlay.appendChild(modalBox);
  overlay.classList.add('modal-overlay--active');
  document.body.classList.add('body--modal-open');
}

/**
 * Closes the currently open modal.
 */
export function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove('modal-overlay--active');
  document.body.classList.remove('body--modal-open');
  if (typeof modalOverlay._onClose === 'function') {
    modalOverlay._onClose();
    modalOverlay._onClose = null;
  }
}

// ---------------------------------------------------------------------------
// CONFIRM DIALOG
// ---------------------------------------------------------------------------

/**
 * Shows a confirmation dialog and returns a Promise<boolean>.
 * @param {string} title
 * @param {string} message
 * @param {object} [opts]
 * @param {string} [opts.confirmText='Confirmar']
 * @param {string} [opts.cancelText='Cancelar']
 * @param {'danger'|'primary'} [opts.variant='primary']
 * @returns {Promise<boolean>}
 */
export function confirmDialog(title, message, opts = {}) {
  const { confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'primary' } = opts;

  return new Promise((resolve) => {
    const content = createElement('div', { class: 'confirm-dialog' }, [
      createElement('h3', { class: 'confirm-dialog__title' }, [title]),
      createElement('p', { class: 'confirm-dialog__message' }, [message]),
      createElement('div', { class: 'confirm-dialog__actions' }, [
        createElement('button', {
          class: 'btn btn--outline',
          type: 'button',
          onClick: () => { closeModal(); resolve(false); }
        }, [cancelText]),
        createElement('button', {
          class: `btn btn--${variant}`,
          type: 'button',
          onClick: () => { closeModal(); resolve(true); }
        }, [confirmText]),
      ]),
    ]);
    openModal(content, { size: 'sm', onClose: () => resolve(false) });
  });
}

// ---------------------------------------------------------------------------
// RENDERING HELPERS
// ---------------------------------------------------------------------------

/**
 * Renders a list of items into a container using a template function.
 * Clears the container first.
 * @param {Element|string} container — element or selector
 * @param {Array} items
 * @param {Function} templateFn — (item, index) => Element
 */
export function renderCards(container, items, templateFn) {
  const el = typeof container === 'string' ? $(container) : container;
  if (!el) return;
  el.innerHTML = '';
  items.forEach((item, i) => {
    const card = templateFn(item, i);
    if (card) el.appendChild(card);
  });
}

/**
 * Appends items to a container (for load-more patterns).
 * @param {Element|string} container
 * @param {Array} items
 * @param {Function} templateFn
 */
export function appendCards(container, items, templateFn) {
  const el = typeof container === 'string' ? $(container) : container;
  if (!el) return;
  items.forEach((item, i) => {
    const card = templateFn(item, i);
    if (card) el.appendChild(card);
  });
}

/**
 * Toggles the loading state on a container.
 * @param {string} loadingId — id of the loading element
 * @param {boolean} isLoading
 */
export function toggleLoading(loadingId, isLoading) {
  const el = document.getElementById(loadingId);
  if (el) el.hidden = !isLoading;
}

/**
 * Toggles the empty state on a container.
 * @param {string} emptyId — id of the empty-state element
 * @param {boolean} isEmpty
 */
export function toggleEmpty(emptyId, isEmpty) {
  const el = document.getElementById(emptyId);
  if (el) el.hidden = !isEmpty;
}

// ---------------------------------------------------------------------------
// UTILITY FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Debounce a function.
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
export function debounce(fn, ms = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Formats a date string to locale-aware display.
 * @param {string|Date} dateStr
 * @param {object} [options]
 * @returns {string}
 */
export function formatDate(dateStr, options = {}) {
  const defaults = { day: '2-digit', month: 'short', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('pt-BR', { ...defaults, ...options });
}

/**
 * Formats a date to relative time (e.g., "há 2 horas").
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const intervals = [
    { label: 'ano', seconds: 31536000 },
    { label: 'mês', seconds: 2592000 },
    { label: 'semana', seconds: 604800 },
    { label: 'dia', seconds: 86400 },
    { label: 'hora', seconds: 3600 },
    { label: 'minuto', seconds: 60 },
  ];
  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count >= 1) {
      const plural = count > 1 ? (label === 'mês' ? 'meses' : label + 's') : label;
      return `há ${count} ${plural}`;
    }
  }
  return 'agora mesmo';
}

/**
 * Generates a simple unique ID.
 * @param {string} [prefix='']
 * @returns {string}
 */
export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Sets up IntersectionObserver-based scroll animations.
 * Elements with `data-animate` will get `animated` class when visible.
 */
export function initScrollAnimations() {
  const targets = $$('[data-animate]');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  targets.forEach(el => observer.observe(el));
}

/**
 * Parses URL query parameters.
 * @returns {URLSearchParams}
 */
export function getQueryParams() {
  return new URLSearchParams(window.location.search);
}
