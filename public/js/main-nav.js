/* ============================================================
   Suththa.org — main-nav.js
   Shared header navigation + theme toggle + mobile drawer
   ============================================================ */
(function () {
  "use strict";

  const store = Suththa.store;

  function currentPage() {
    const p = location.pathname.split("/").pop() || "index.html";
    return p == "index.html" ? "reader" : p.replace(".html", "");
  }

  function renderNav() {
    const nav = document.getElementById("main-nav");
    if (!nav) return;

    const page = currentPage();

    const items = [
      { id: "reader", href: "./index.html", label: "කියවන්න" },
      { id: "dictionary", href: "./dictionary.html", label: "ශබ්දකෝෂය" },
      { id: "note", href: "./note.html", label: "සටහන්" },
      { id: "bookmark", href: "./bookmark.html", label: "තරු සලකුණු" },
    ];

    // ---------------------------------------------------------
    // NAVBAR
    // ---------------------------------------------------------

    let html = '<header class="app-header">';

    // Reader book-tree button
    if (page == "reader") {
      html +=
        '<button id="sidebar-toggle" class="icon-btn" title="ග්‍රන්ථ ගස">☰</button>';
    }

    // Brand
    html +=
      '<a class="brand" href="./index.html">' +
        '<span class="brand-mark">❁</span>' +
        '<span class="brand-text">Suththa.org<small>ත්‍රිපිටකය</small></span>' +
      "</a>";

    // Desktop navigation
    html += '<nav class="nav-links">';

    items.forEach(function (it) {
      html +=
        '<a href="' +
        it.href +
        '"' +
        (it.id == page ? ' class="active"' : "") +
        ">" +
        it.label +
        "</a>";
    });

    html += "</nav>";

    // Header actions
    html +=
      '<div class="header-actions">' +

        // Mobile drawer button
        '<button id="nav-more-toggle" class="icon-btn nav-more-toggle" ' +
        'title="මෙනුව" aria-expanded="false">⋯</button>' +

        // Theme button
        '<button id="theme-toggle" class="icon-btn" ' +
        'title="තද පසුබිම / ආලෝකය">🌙</button>' +

      "</div>";

    html += "</header>";

    // ---------------------------------------------------------
    // MOBILE DRAWER (right side: navigation + reader actions)
    // ---------------------------------------------------------

    html += '<aside id="nav-drawer" class="nav-drawer">';

    html += '<div class="drawer-title">මෙනුව</div>';

    html += '<nav class="drawer-nav">';

    items.forEach(function (it) {
      html +=
        '<a href="' +
        it.href +
        '"' +
        (it.id == page ? ' class="active"' : "") +
        ">" +
        it.label +
        "</a>";
    });

    html += "</nav>";

    // Reader-specific actions are injected by app.js (reader page only)
    html += '<div id="drawer-actions" class="drawer-actions"></div>';

    html += "</aside>";

    html += '<div id="nav-drawer-backdrop" class="nav-drawer-backdrop"></div>';

    // Render everything
    nav.innerHTML = html;

    // ---------------------------------------------------------
    // THEME TOGGLE
    // ---------------------------------------------------------

    const toggle = document.getElementById("theme-toggle");

    if (toggle) {
      toggle.addEventListener("click", function () {
        store.set("darkMode", !store.settings.darkMode);
      });
    }

    // ---------------------------------------------------------
    // MOBILE DRAWER TOGGLE
    // ---------------------------------------------------------

    const drawerToggle = document.getElementById("nav-more-toggle");
    const drawer = document.getElementById("nav-drawer");
    const drawerBackdrop = document.getElementById("nav-drawer-backdrop");

    function closeDrawer() {
      if (drawer) drawer.classList.remove("open");
      if (drawerBackdrop) drawerBackdrop.classList.remove("show");
      if (drawerToggle) {
        drawerToggle.setAttribute("aria-expanded", "false");
      }
    }

    if (drawerToggle && drawer) {
      drawerToggle.addEventListener("click", function () {
        const isOpen = drawer.classList.toggle("open");

        if (drawerBackdrop) {
          drawerBackdrop.classList.toggle("show", isOpen);
        }

        drawerToggle.setAttribute(
          "aria-expanded",
          isOpen ? "true" : "false"
        );

        // Close the book-tree sidebar if it happens to be open
        const sidebar = document.getElementById("sidebar");
        const sidebarBackdrop = document.getElementById("sidebar-backdrop");

        if (sidebar) sidebar.classList.remove("open");
        if (sidebarBackdrop) sidebarBackdrop.classList.remove("show");

        document.body.classList.remove(
          "suth-sidebar-open"
        );
      });

      // Close on backdrop tap
      if (drawerBackdrop) {
        drawerBackdrop.addEventListener("click", closeDrawer);
      }

      // Close after selecting a page
      drawer.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", closeDrawer);
      });

      // Close on Escape
      document.addEventListener("keydown", function (e) {
        if (e.key == "Escape") closeDrawer();
      });
    }

    // Expose close so other pages can close the drawer (e.g. before
    // opening the book-tree sidebar on the reader page)
    Suththa.nav.closeDrawer = closeDrawer;
  }

  function init() {
    renderNav();

    store.on("settings-change", function () {
      const toggle = document.getElementById("theme-toggle");

      if (toggle) {
        toggle.textContent = store.settings.darkMode ? "☀️" : "🌙";
      }
    });
  }

  Suththa.nav = {
    init: init,
    currentPage: currentPage,
    closeDrawer: null,
  };
})();
