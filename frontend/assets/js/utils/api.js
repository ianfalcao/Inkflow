// ==========================================================================
// INKFLOW — API Abstraction Layer
// Reads/writes from localStorage now. Replace internals with fetch() for
// Spring Boot + PostgreSQL integration later.
// ==========================================================================

import StorageService from './storage.js';

// Key prefix for all InkFlow data collections
const PREFIX = 'inkflow_';

/**
 * Simulates async network delay for realistic UX testing.
 * @param {number} [ms=150]
 * @returns {Promise<void>}
 */
function simulateLatency(ms = 150) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const API = {
  /**
   * Retrieves items from a resource collection with optional filters.
   * Future: GET /api/v1/{resource}?params
   *
   * @param {string} resource — e.g. 'artists', 'tattoos', 'users'
   * @param {object} [params={}] — filter key/value pairs
   * @returns {Promise<Array>}
   */
  async get(resource, params = {}) {
    await simulateLatency();
    let items = StorageService.get(PREFIX + resource, []);

    // Apply filters
    for (const [key, value] of Object.entries(params)) {
      if (value === '' || value === null || value === undefined) continue;

      items = items.filter(item => {
        const field = item[key];
        if (field === undefined) return true;

        // Array field — check if includes value
        if (Array.isArray(field)) {
          return Array.isArray(value)
            ? value.some(v => field.includes(v))
            : field.includes(value);
        }

        // String field — case-insensitive partial match
        if (typeof field === 'string' && typeof value === 'string') {
          return field.toLowerCase().includes(value.toLowerCase());
        }

        // Boolean / Number — strict equality
        return field === value;
      });
    }

    return items;
  },

  /**
   * Retrieves a single item by ID.
   * Future: GET /api/v1/{resource}/{id}
   *
   * @param {string} resource
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async getById(resource, id) {
    await simulateLatency();
    const items = StorageService.get(PREFIX + resource, []);
    return items.find(item => item.id === id) || null;
  },

  /**
   * Creates a new item in a resource collection.
   * Future: POST /api/v1/{resource}
   *
   * @param {string} resource
   * @param {object} body — item data (id should be included)
   * @returns {Promise<object>} the created item
   */
  async post(resource, body) {
    await simulateLatency();
    StorageService.push(PREFIX + resource, body);
    return body;
  },

  /**
   * Updates an existing item by ID.
   * Future: PUT /api/v1/{resource}/{id}
   *
   * @param {string} resource
   * @param {string} id
   * @param {object} body — partial update fields
   * @returns {Promise<boolean>}
   */
  async put(resource, id, body) {
    await simulateLatency();
    return StorageService.update(PREFIX + resource, id, body);
  },

  /**
   * Deletes an item by ID.
   * Future: DELETE /api/v1/{resource}/{id}
   *
   * @param {string} resource
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(resource, id) {
    await simulateLatency();
    return StorageService.delete(PREFIX + resource, id);
  },

  /**
   * Seeds a resource collection with initial data if it's empty.
   * Only runs once — no-op if data already exists.
   *
   * @param {string} resource
   * @param {Array} data
   */
  seed(resource, data) {
    const key = PREFIX + resource;
    const existing = StorageService.get(key, null);
    if (!existing || existing.length === 0) {
      StorageService.set(key, data);
    }
  },

  /**
   * Force-reseeds a resource (for development/reset).
   * @param {string} resource
   * @param {Array} data
   */
  reseed(resource, data) {
    StorageService.set(PREFIX + resource, data);
  },

  /**
   * Returns all items count for a resource.
   * @param {string} resource
   * @returns {Promise<number>}
   */
  async count(resource) {
    const items = StorageService.get(PREFIX + resource, []);
    return items.length;
  }
};

export default API;
