/* ==========================================================
   Anime Max Zone — Main Script
   Author: Anime Max Zone
   Version: 1.0
   ========================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------
     WAIT FOR DOM
     ------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {

    /* ------------------------------------------------------
       ELEMENT REFERENCES
       ------------------------------------------------------ */
    var navbar       = document.getElementById("navbar");
    var hamburger    = document.getElementById("hamburger");
    var navLinks     = document.getElementById("navLinks");
    var searchToggle = document.getElementById("searchToggle");
    var searchWrap   = document.getElementById("searchWrap");
    var searchInput  = document.getElementById("searchInput");
    var noResult     = document.getElementById("noResult");
    var backTop      = document.getElementById("backTop");
    var yearEl       = document.getElementById("year");

    var cards      = Array.prototype.slice.call(document.querySelectorAll(".card"));
    var filterBtns = Array.prototype.slice.call(document.querySelectorAll(".filter-btn"));
    var catCards   = Array.prototype.slice.call(document.querySelectorAll(".cat-card"));

    var activeCat = "all";

    /* ------------------------------------------------------
       FOOTER YEAR
       ------------------------------------------------------ */
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    /* ------------------------------------------------------
       MOBILE MENU
       ------------------------------------------------------ */
    if (hamburger && navLinks) {
      hamburger.addEventListener("click", function () {
        var isOpen = navLinks.classList.toggle("open");
        hamburger.textContent = isOpen ? "\u2715" : "\u2630"; // ✕ / ☰
        hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      Array.prototype.forEach.call(navLinks.querySelectorAll("a"), function (link) {
        link.addEventListener("click", function () {
          navLinks.classList.remove("open");
          hamburger.textContent = "\u2630";
          hamburger.setAttribute("aria-expanded", "false");
        });
      });

      // Close menu when clicking outside
      document.addEventListener("click", function (e) {
        if (
          navLinks.classList.contains("open") &&
          !navLinks.contains(e.target) &&
          !hamburger.contains(e.target)
        ) {
          navLinks.classList.remove("open");
          hamburger.textContent = "\u2630";
          hamburger.setAttribute("aria-expanded", "false");
        }
      });
    }

    /* ------------------------------------------------------
       SEARCH TOGGLE
       ------------------------------------------------------ */
    if (searchToggle && searchWrap) {
      searchToggle.addEventListener("click", function () {
        var isOpen = searchWrap.classList.toggle("open");

        if (isOpen && searchInput) {
          setTimeout(function () {
            searchInput.focus();
          }, 250);
        } else if (searchInput) {
          searchInput.value = "";
          applyFilters();
        }
      });
    }

    /* ------------------------------------------------------
       FILTER LOGIC
       ------------------------------------------------------ */
    function applyFilters() {
      var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
      var visibleCount = 0;

      cards.forEach(function (card) {
        var title = (card.getAttribute("data-title") || "").toLowerCase();
        var cat   = card.getAttribute("data-cat") || "";

        var matchCat    = activeCat === "all" || cat === activeCat;
        var matchSearch = query === "" || title.indexOf(query) !== -1;
        var show        = matchCat && matchSearch;

        if (show) {
          card.classList.remove("hide");
          visibleCount++;
        } else {
          card.classList.add("hide");
        }
      });

      if (noResult) {
        noResult.style.display = visibleCount === 0 ? "block" : "none";
      }
    }

    /* ------------------------------------------------------
       FILTER BUTTONS
       ------------------------------------------------------ */
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        activeCat = btn.getAttribute("data-cat") || "all";
        applyFilters();
      });
    });

    /* ------------------------------------------------------
       CATEGORY CARDS
       ------------------------------------------------------ */
    catCards.forEach(function (card) {
      card.addEventListener("click", function () {
        var cat = card.getAttribute("data-cat") || "all";

        // Sync active filter button
        filterBtns.forEach(function (b) {
          if (b.getAttribute("data-cat") === cat) {
            b.classList.add("active");
          } else {
            b.classList.remove("active");
          }
        });

        activeCat = cat;
        applyFilters();
      });
    });

    /* ------------------------------------------------------
       LIVE SEARCH
       ------------------------------------------------------ */
    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);

      // ESC key closes search
      searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          if (searchWrap) searchWrap.classList.remove("open");
          searchInput.value = "";
          applyFilters();
        }
      });
    }

    /* ------------------------------------------------------
       NAVBAR SCROLL + BACK-TO-TOP VISIBILITY
       ------------------------------------------------------ */
    var lastScrollY = 0;
    var ticking = false;

    function onScroll() {
      var y = window.scrollY;

      if (navbar) {
        navbar.classList.toggle("scrolled", y > 40);
      }

      if (backTop) {
        backTop.classList.toggle("show", y > 500);
      }

      // Active nav link
      updateActiveNav(y);

      lastScrollY = y;
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    });

    /* ------------------------------------------------------
       BACK TO TOP
       ------------------------------------------------------ */
    if (backTop) {
      backTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    /* ------------------------------------------------------
       SCROLL REVEAL ANIMATION
       ------------------------------------------------------ */
    var revealEls = document.querySelectorAll(
      ".section-head, .card, .cat-card, .about-text, .about-card, .filters"
    );

    Array.prototype.forEach.call(revealEls, function (el) {
      el.classList.add("reveal");
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );

      Array.prototype.forEach.call(revealEls, function (el) {
        observer.observe(el);
      });
    } else {
      // Fallback
      Array.prototype.forEach.call(revealEls, function (el) {
        el.classList.add("visible");
      });
    }

    /* ------------------------------------------------------
       ACTIVE NAV LINK ON SCROLL
       ------------------------------------------------------ */
    var sections = document.querySelectorAll("section[id]");
    var navItems = document.querySelectorAll(".nav-link");

    function updateActiveNav(scrollY) {
      if (!sections.length || !navItems.length) return;

      var current = "";

      Array.prototype.forEach.call(sections, function (sec) {
        var top = sec.offsetTop - 120;
        if (scrollY >= top) {
          current = sec.id;
        }
      });

      Array.prototype.forEach.call(navItems, function (link) {
        var href = link.getAttribute("href") || "";
        link.classList.toggle("active", href === "#" + current);
      });
    }

    /* ------------------------------------------------------
       SMOOTH ANCHOR SCROLL (Fallback)
       ------------------------------------------------------ */
    Array.prototype.forEach.call(
      document.querySelectorAll('a[href^="#"]'),
      function (link) {
        link.addEventListener("click", function (e) {
          var href = link.getAttribute("href");
          if (!href || href === "#" || href.length < 2) return;

          var target = document.querySelector(href);
          if (!target) return;

          e.preventDefault();

          var offset = 80;
          var targetPos =
            target.getBoundingClientRect().top + window.pageYOffset - offset;

          window.scrollTo({
            top: targetPos,
            behavior: "smooth"
          });
        });
      }
    );

    /* ------------------------------------------------------
       CARD CLICK — OPTIONAL (open detail if data-url present)
       ------------------------------------------------------ */
    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        var url = card.getAttribute("data-url");
        if (url) {
          window.location.href = url;
        }
      });
    });

    /* ------------------------------------------------------
       IMAGE LAZY-LOAD FALLBACK
       ------------------------------------------------------ */
    Array.prototype.forEach.call(
      document.querySelectorAll("img[loading='lazy']"),
      function (img) {
        img.addEventListener("error", function () {
          img.src =
            "https://placehold.co/300x400/1a1a2e/6b7280?text=No+Image";
        });
      }
    );

    /* ------------------------------------------------------
       KEYBOARD SHORTCUT: "/" focuses search
       ------------------------------------------------------ */
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && searchInput && searchWrap) {
        var tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea") return;

        e.preventDefault();
        searchWrap.classList.add("open");
        setTimeout(function () {
          searchInput.focus();
        }, 200);
      }
    });

    /* ------------------------------------------------------
       INITIAL RUN
       ------------------------------------------------------ */
    applyFilters();
    onScroll();
  });
})();
