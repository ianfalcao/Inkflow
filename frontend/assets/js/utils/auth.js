// ==========================================================================
// INKFLOW — Authentication Service
// Manages user sessions, role-based access control, and UI updates based on login state.
// ==========================================================================

import StorageService from './storage.js';
import API from './api.js';

const SESSION_KEY = 'inkflow_session';

const AuthService = {
  /**
   * Logs in a user.
   * Future: Will call POST /api/v1/auth/login and store JWT.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} The user object if successful.
   * @throws {Error} If credentials are invalid.
   */
  async login(email, password) {
    const users = await API.get('users', { email });
    const user = users[0];

    if (!user || user.password !== password) {
      throw new Error('E-mail ou senha incorretos.');
    }

    // In a real app, we'd store a JWT token here, not the raw user object (especially not the password!)
    // For this prototype, we store the user object (minus password) to simulate a session.
    const sessionUser = { ...user };
    delete sessionUser.password;
    
    StorageService.set(SESSION_KEY, sessionUser);
    return sessionUser;
  },

  /**
   * Logs out the current user.
   */
  logout() {
    StorageService.remove(SESSION_KEY);
    window.location.href = '../../pages/home/index.html';
  },

  /**
   * Returns the currently logged-in user object, or null if not logged in.
   * @returns {object|null}
   */
  getCurrentUser() {
    return StorageService.get(SESSION_KEY, null);
  },

  /**
   * Checks if a user is currently logged in.
   * @returns {boolean}
   */
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  /**
   * Protects a route, requiring a specific role (or just being logged in).
   * Redirects to login if the requirement is not met.
   * @param {string} [requiredRole] - 'client', 'artist', 'admin'. If omitted, just requires any login.
   */
  requireAuth(requiredRole) {
    const user = this.getCurrentUser();

    if (!user) {
      // Not logged in, redirect to login
      window.location.href = '../../auth/login/index.html';
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      // Logged in, but wrong role. Redirect to their proper dashboard or home.
      if (user.role === 'admin') {
         window.location.href = '../../dashboard/admin/index.html';
      } else if (user.role === 'artist') {
         window.location.href = '../../dashboard/artist/index.html';
      } else {
         window.location.href = '../../dashboard/client/index.html';
      }
    }
  },

  /**
   * Updates the header UI based on login state (e.g., swapping "Login/Register" for "Dashboard/Logout").
   * Assumes standard class names for header actions.
   */
  updateHeaderUI() {
    const headerActions = document.querySelector('.header__actions');
    if (!headerActions) return;

    const user = this.getCurrentUser();

    if (user) {
      let dashboardUrl = '../../dashboard/client/index.html';
      if (user.role === 'artist') dashboardUrl = '../../dashboard/artist/index.html';
      if (user.role === 'admin') dashboardUrl = '../../dashboard/admin/index.html';

      headerActions.innerHTML = `
        <a href="${dashboardUrl}" class="btn btn--outline">Meu Painel</a>
        <button id="logout-btn" class="btn btn--primary">Sair</button>
      `;

      document.getElementById('logout-btn')?.addEventListener('click', () => {
        this.logout();
      });
    }
  }
};

export default AuthService;
