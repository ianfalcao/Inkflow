// ==========================================================================
// INKFLOW — Storage Service
// Wraps localStorage with typed JSON get/set and collection helpers.
// Designed for drop-in replacement with a remote persistence layer later.
// ==========================================================================

const StorageService = {
  /**
   * Retrieves a value from localStorage, parsed from JSON.
   * @param {string} key
   * @param {*} fallback — returned when key is missing or unparseable
   * @returns {*}
   */
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  /**
   * Stores a value as JSON string.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  /**
   * Removes a key entirely.
   * @param {string} key
   */
  remove(key) {
    localStorage.removeItem(key);
  },

  /**
   * Appends an item to an array stored under `key`.
   * Creates the array if it doesn't exist.
   * @param {string} key
   * @param {*} item
   */
  push(key, item) {
    const arr = this.get(key, []);
    arr.push(item);
    this.set(key, arr);
  },

  /**
   * Finds an item by `id` in the array at `key` and merges `patch` into it.
   * @param {string} key
   * @param {string} id
   * @param {object} patch
   * @returns {boolean} true if item was found and updated
   */
  update(key, id, patch) {
    const arr = this.get(key, []);
    const idx = arr.findIndex(item => item.id === id);
    if (idx === -1) return false;
    arr[idx] = { ...arr[idx], ...patch };
    this.set(key, arr);
    return true;
  },

  /**
   * Removes an item by `id` from the array at `key`.
   * @param {string} key
   * @param {string} id
   * @returns {boolean} true if item was found and removed
   */
  delete(key, id) {
    const arr = this.get(key, []);
    const filtered = arr.filter(item => item.id !== id);
    if (filtered.length === arr.length) return false;
    this.set(key, filtered);
    return true;
  },

  /**
   * Toggles an id in a Set-like array (favorites, following, etc.).
   * @param {string} key
   * @param {string} id
   * @returns {boolean} true if id is now present, false if removed
   */
  toggle(key, id) {
    const arr = this.get(key, []);
    const idx = arr.indexOf(id);
    if (idx === -1) {
      arr.push(id);
      this.set(key, arr);
      return true;
    }
    arr.splice(idx, 1);
    this.set(key, arr);
    return false;
  },

  /**
   * Checks if an id exists in a Set-like array.
   * @param {string} key
   * @param {string} id
   * @returns {boolean}
   */
  has(key, id) {
    return this.get(key, []).includes(id);
  },

  /**
   * Clears all InkFlow keys (prefixed or all).
   */
  clearAll() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('inkflow_'));
    keys.forEach(k => localStorage.removeItem(k));
  }
};

export default StorageService;
