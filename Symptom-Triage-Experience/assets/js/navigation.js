/* ==========================================================
   navigation.js - Moves between views (pages)
   Any button with data-nav="viewName" will work automatically.
   ========================================================== */

const Nav = {
  views: ["home", "patient", "questionnaire", "results", "dashboard"],

  // Which top-menu item should look "active" for each view
  groupFor: {
    home: "home",
    patient: "assessment",
    questionnaire: "assessment",
    results: "assessment",
    dashboard: "dashboard"
  },

  go(name) {
    if (this.views.indexOf(name) === -1) return;

    AppState.currentView = name;
    UI.showView(name);

    // Highlight the correct top-menu item
    const activeGroup = this.groupFor[name];
    document.querySelectorAll(".nav-link").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.group === activeGroup);
    });

    window.scrollTo(0, 0);

    // Tell other files that the view changed (app.js listens to this)
    document.dispatchEvent(new CustomEvent("viewchange", { detail: name }));
  },

  // Attach click handlers to every [data-nav] button
  bindButtons() {
    document.querySelectorAll("[data-nav]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        Nav.go(btn.dataset.nav);
      });
    });
  }
};