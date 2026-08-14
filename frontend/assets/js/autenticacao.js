// ==========================================================================
// INKFLOW — Authentication Script (Login)
// Handles login form validation, password visibility, and session creation.
// ==========================================================================

import AuthService from './utils/auth.js';
import { $, showToast } from './utils/dom.js';

// DOM Elements
const loginForm = $('#login-form');
const emailInput = $('#login-email');
const passwordInput = $('#login-password');
const btnTogglePassword = $('#toggle-password');
const errorContainer = $('#login-error');

/**
 * Initializes the login page.
 */
function init() {
  // If already logged in, redirect away from login page
  if (AuthService.isLoggedIn()) {
    redirectBasedOnRole(AuthService.getCurrentUser().role);
    return;
  }
  
  setupEventListeners();
}

/**
 * Sets up event listeners.
 */
function setupEventListeners() {
  if (btnTogglePassword && passwordInput) {
    btnTogglePassword.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      // Basic visual toggle for the icon
      btnTogglePassword.textContent = isPassword ? '🙈' : '👁️'; 
      btnTogglePassword.title = isPassword ? 'Ocultar senha' : 'Mostrar senha';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleLogin();
    });
  }
  
  // Clear error on input
  if (emailInput && passwordInput) {
    emailInput.addEventListener('input', hideError);
    passwordInput.addEventListener('input', hideError);
  }
}

/**
 * Handles the login process.
 */
async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  // Basic HTML5 validation should catch most, but double check
  if (!email || !password) {
    showError('Por favor, preencha todos os campos.');
    return;
  }
  
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  try {
    submitBtn.textContent = 'Entrando...';
    submitBtn.disabled = true;
    hideError();
    
    const user = await AuthService.login(email, password);
    
    showToast(`Bem-vindo de volta, ${user.name.split(' ')[0]}!`, 'success');
    
    // Slight delay for UX
    setTimeout(() => {
      redirectBasedOnRole(user.role);
    }, 800);
    
  } catch (err) {
    showError(err.message || 'E-mail ou senha incorretos.');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

/**
 * Shows an inline error message.
 */
function showError(message) {
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
  }
}

/**
 * Hides the inline error message.
 */
function hideError() {
  if (errorContainer) {
    errorContainer.style.display = 'none';
  }
}

/**
 * Redirects the user to their respective dashboard.
 */
function redirectBasedOnRole(role) {
  if (role === 'admin') {
    window.location.href = '../../dashboard/admin/index.html';
  } else if (role === 'artist') {
    window.location.href = '../../dashboard/artist/index.html';
  } else {
    window.location.href = '../../dashboard/client/index.html';
  }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
