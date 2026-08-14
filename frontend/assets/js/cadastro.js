// ==========================================================================
// INKFLOW — Registration Script
// Handles user registration, role toggling, and form validation.
// ==========================================================================

import API from './utils/api.js';
import AuthService from './utils/auth.js';
import { $, $$, showToast, generateId } from './utils/dom.js';

// DOM Elements
const registerForm = $('#register-form');
const roleRadios = $$('input[name="account_type"]');
const artistFields = $('#artist-fields');
const errorContainer = $('#register-error');
const passwordInput = $('#reg-password');
const confirmPasswordInput = $('#reg-password-confirm');
const styleCheckboxes = $$('input[name="styles[]"]');

/**
 * Initializes the registration page.
 */
function init() {
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
  // Role toggling
  roleRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isArtist = e.target.value === 'artist';
      if (artistFields) {
        artistFields.style.display = isArtist ? 'block' : 'none';
        
        // Toggle required attributes for artist fields
        $('#reg-city').required = isArtist;
        $('#reg-state').required = isArtist;
      }
    });
  });
  
  // Style checkboxes limit (max 3)
  styleCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const checkedCount = $$('input[name="styles[]"]:checked').length;
      if (checkedCount > 3) {
        cb.checked = false;
        showToast('Selecione no máximo 3 estilos.', 'warning');
      }
    });
  });

  // Form submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleRegistration();
    });
  }
}

/**
 * Handles the registration process.
 */
async function handleRegistration() {
  hideError();
  
  const formData = new FormData(registerForm);
  const password = formData.get('password');
  const confirmPassword = formData.get('password_confirm');
  const email = formData.get('email').trim().toLowerCase();
  const role = formData.get('account_type');
  
  // Validate passwords match
  if (password !== confirmPassword) {
    showError('As senhas não coincidem.');
    return;
  }
  
  // Validate styles if artist
  if (role === 'artist') {
    const styles = formData.getAll('styles[]');
    if (styles.length === 0) {
      showError('Selecione pelo menos 1 estilo principal.');
      return;
    }
  }
  
  const submitBtn = registerForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  try {
    submitBtn.textContent = 'Criando conta...';
    submitBtn.disabled = true;
    
    // Check if email already exists (mock validation)
    const existingUsers = await API.get('users', { email });
    if (existingUsers.length > 0) {
      throw new Error('Este e-mail já está em uso.');
    }
    
    // Create new user object
    const newUser = {
      id: generateId('usr-'),
      name: formData.get('name').trim(),
      email: email,
      password: password, // In reality, never store plaintext passwords
      role: role,
      avatar: 'https://i.pravatar.cc/150?u=' + email, // Mock avatar
      createdAt: new Date().toISOString(),
      favorites: [],
      following: []
    };
    
    if (role === 'client') {
      newUser.appointments = [];
      newUser.quotes = [];
    } else if (role === 'artist') {
      newUser.quotesReceived = [];
      newUser.appointmentsReceived = [];
      
      // Also create an artist profile
      const newArtist = {
        id: generateId('art-'),
        userId: newUser.id,
        name: newUser.name,
        avatar: newUser.avatar,
        bio: '',
        city: formData.get('city').trim(),
        state: formData.get('state').trim().toUpperCase(),
        styles: formData.getAll('styles[]'),
        rating: 0,
        reviewCount: 0,
        verified: false, // Pending approval
        priceRange: '$$',
        completedWorks: 0
      };
      
      await API.post('artists', newArtist);
    }
    
    // Save user
    await API.post('users', newUser);
    
    // Auto-login
    await AuthService.login(email, password);
    
    if (role === 'artist') {
      showToast('Conta criada! Seu perfil de artista está em análise.', 'success', 5000);
    } else {
      showToast('Conta criada com sucesso!', 'success');
    }
    
    setTimeout(() => {
      redirectBasedOnRole(role);
    }, 1500);
    
  } catch (err) {
    showError(err.message || 'Erro ao criar conta. Tente novamente.');
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
