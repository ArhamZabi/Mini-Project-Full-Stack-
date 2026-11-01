/* ==========================================================
   storage.js - LocalStorage helper functions
   Data stays in THIS browser only and is not secure storage.
   ========================================================== */

const Storage = {
  KEY: "triageDemoCases",

  // Read all saved cases (returns an array)
  getCases() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Could not read saved cases:", error);
      return [];
    }
  },

  // Find one case by id (or null)
  getCase(id) {
    return this.getCases().find(function (c) { return c.id === id; }) || null;
  },

  // Add a case, or replace it if one with the same id already exists
  // Returns true if it was saved, false if not
  saveCase(caseObject) {
    const cases = this.getCases();
    const index = cases.findIndex(function (c) { return c.id === caseObject.id; });
    if (index === -1) cases.push(caseObject);
    else cases[index] = caseObject;
    return this._write(cases);
  },

  // Remove one case by its id
  deleteCase(id) {
    const cases = this.getCases().filter(function (c) { return c.id !== id; });
    return this._write(cases);
  },

  // Remove everything
  clearAll() {
    localStorage.removeItem(this.KEY);
  },

  // Internal helper
  _write(cases) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(cases));
      return true;
    } catch (error) {
      console.error("Could not save cases:", error);
      return false;
    }
  }
};