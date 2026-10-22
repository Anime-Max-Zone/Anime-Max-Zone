/* =========================================
   ANIME MAX ZONE
   Main JavaScript
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    /* =====================================
       ELEMENTS
    ===================================== */

    var searchToggle = document.getElementById("searchToggle");
    var searchPanel = document.getElementById("searchPanel");
    var searchClose = document.getElementById("searchClose");

    var searchForm = document.getElementById("searchForm");
    var searchInput = document.getElementById("searchInput");
    var searchResults = document.getElementById("searchResults");

    var noResults = document.getElementById("noResults");

    var currentYear = document.getElementById("currentYear");

    var searchSuggestions = document.querySelectorAll(".search-suggestion");

    var animeCards = document.querySelectorAll(".anime-card");
    var latestCards = document.querySelectorAll(".latest-card");

    var mainContent = document.querySelector(".main-content");

    var searchTimer = null;


    /* =====================================
       CURRENT YEAR
    ===================================== */

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* =====================================
       ANIME DATABASE
       Demo data from existing HTML
    ===================================== */

    var animeDatabase = [
        {
            id: "naruto-shippuden",
            title: "Naruto Shippuden",
            genre: "Action, Adventure, Fantasy",
            year: "2007 - 2017",
            episodes: "500 Episodes",
            image: "https://placehold.co/400x550/25213f/ffffff?text=Naruto+Shippuden",
            url: "details.html?id=naruto-shippuden"
        },
        {
            id: "one-piece",
            title: "One Piece",
            genre: "Action, Adventure",
            year: "1999",
            episodes: "1200+ Episodes",
            image: "https://placehold.co/400x550/172e55/ffffff?text=One+Piece",
            url: "details.html?id=one-piece"
        },
        {
            id: "attack-on-titan",
            title: "Attack on Titan",
            genre: "Action, Drama, Fantasy",
            year: "2013",
            episodes: "87 Episodes",
            image: "https://placehold.co/400x550/372020/ffffff?text=Attack+on+Titan",
            url: "details.html?id=attack-on-titan"
        },
        {
            id: "demon-slayer",
            title: "Demon Slayer",
            genre: "Action, Adventure, Fantasy",
            year: "2019",
            episodes: "26 Episodes",
            image: "https://placehold.co/400x550/174d63/ffffff?text=Demon+Slayer",
            url: "details.html?id=demon-slayer"
        },
        {
            id: "jujutsu-kaisen",
            title: "Jujutsu Kaisen",
            genre: "Action, Supernatural",
            year: "2020",
            episodes: "47 Episodes",
            image: "https://placehold.co/400x550/34205b/ffffff?text=Jujutsu+Kaisen",
            url: "details.html?id=jujutsu-kaisen"
        },
        {
            id: "solo-leveling",
            title: "Solo Leveling",
            genre: "Action, Adventure, Fantasy",
            year: "2024",
            episodes: "24 Episodes",
            image: "https://placehold.co/400x550/17264c/ffffff?text=Solo+Leveling",
            url: "details.html?id=solo-leveling"
        },
        {
            id: "blue-lock",
            title: "Blue Lock",
            genre: "Sports, Drama",
            year: "2022",
            episodes: "14 Episodes",
            image: "https://placehold.co/400x550/163b65/ffffff?text=Blue+Lock",
            url: "details.html?id=blue-lock"
        }
    ];


    /* =====================================
       SEARCH PANEL OPEN
    ===================================== */

    function openSearch() {

        if (!searchPanel) {
            return;
        }

        searchPanel.hidden = false;

        if (searchToggle) {
            searchToggle.setAttribute("aria-expanded", "true");
        }

        document.body.classList.add("search-open");

        window.setTimeout(function () {

            if (searchInput) {
                searchInput.focus();
            }

        }, 100);

    }


    /* =====================================
       SEARCH PANEL CLOSE
    ===================================== */

    function closeSearch() {

        if (!searchPanel) {
            return;
        }

        searchPanel.hidden = true;

        if (searchToggle) {
            searchToggle.setAttribute("aria-expanded", "false");
            searchToggle.focus();
        }

        document.body.classList.remove("search-open");

        if (searchInput) {
            searchInput.value = "";
        }

        if (searchResults) {
            searchResults.innerHTML = "";
        }

        if (searchTimer) {
            window.clearTimeout(searchTimer);
        }

    }


    if (searchToggle) {

        searchToggle.addEventListener("click", function () {

            if (searchPanel.hidden) {
                openSearch();
            } else {
                closeSearch();
            }

        });

    }


    if (searchClose) {

        searchClose.addEventListener("click", function () {
            closeSearch();
        });

    }


    /* =====================================
       CLOSE WITH ESCAPE
    ===================================== */

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape" &&
            searchPanel &&
            !searchPanel.hidden) {

            closeSearch();

        }

    });


    /* =====================================
       SEARCH NORMALIZATION
    ===================================== */

    function normalizeText(value) {

        return String(value || "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, " ");

    }


    /* =====================================
       GET SEARCHABLE ANIME

       Combines demo database and HTML cards
    ===================================== */

    function getAnimeList() {

        var list = animeDatabase.slice();

        var knownIds = {};

        for (var i = 0; i < list.length; i++) {
            knownIds[list[i].id] = true;
        }

        for (var j = 0; j < animeCards.length; j++) {

            var card = animeCards[j];

            var title = card.getAttribute("data-title") || "";

            var genre = card.getAttribute("data-genre") || "";

            var link = card.querySelector("h3 a");

            var poster = card.querySelector(".anime-poster img");

            var yearElement = card.querySelector(".anime-year");

            if (!title) {
                continue;
            }

            var slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");

            if (knownIds[slug]) {
                continue;
            }

            list.push({

                id: slug,

                title: title,

                genre: genre.replace(/\s+/g, ", "),

                year: yearElement ?
                    yearElement.textContent.trim() : "",

                episodes: "",

                image: poster ?
                    poster.getAttribute("src") : "",

                url: link ?
                    link.getAttribute("href") :
                    "details.html?id=" + encodeURIComponent(slug)

            });

            knownIds[slug] = true;

        }

        return list;

    }


    /* =====================================
       MATCH SEARCH QUERY
    ===================================== */

    function findAnime(query) {

        var normalizedQuery = normalizeText(query);

        if (!normalizedQuery) {
            return [];
        }

        var animeList = getAnimeList();

        var results = [];

        for (var i = 0; i < animeList.length; i++) {

            var anime = animeList[i];

            var title = normalizeText(anime.title);

            var genre = normalizeText(anime.genre);

            var year = normalizeText(anime.year);

            var searchableText = title + " " + genre + " " + year;

            if (searchableText.indexOf(normalizedQuery) !== -1) {

                results.push(anime);

                continue;

            }

            /* Match individual words */

            var queryWords = normalizedQuery.split(" ");

            var allWordsMatch = true;

            for (var j = 0; j < queryWords.length; j++) {

                if (searchableText.indexOf(queryWords[j]) === -1) {

                    allWordsMatch = false;

                    break;

                }

            }

            if (allWordsMatch) {
                results.push(anime);
            }

        }

        return results;

    }


    /* =====================================
       SAFE HTML HELPERS
    ===================================== */

    function escapeHTML(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function safeImageURL(value) {

        var url = String(value || "");

        if (/^https:\/\/[^\s"'<>]+$/i.test(url) ||
            /^\/(?!\/)[^\s"'<>]*$/i.test(url) ||
            /^(?!\/)[a-z0-9_-]+(?:\/[a-z0-9._-]+)*\.(?:png|jpe?g|webp|avif)$/i.test(url)) {

            return url;

        }

        return "https://placehold.co/400x550/101020/ffffff?text=Anime";

    }


    function safePageURL(value) {

        var url = String(value || "");

        if (/^details\.html(?:\?[a-z0-9_=&%-]*)?$/i.test(url) ||
            /^watch\.html(?:\?[a-z0-9_=&%-]*)?$/i.test(url) ||
            /^anime\.html(?:\?[a-z0-9_=&%-]*)?$/i.test(url)) {

            return url;

        }

        return "details.html?id=" +
            encodeURIComponent(String(value || ""));

    }


    /* =====================================
       RENDER LIVE SEARCH RESULTS
    ===================================== */

    function renderResults(results, query) {

        if (!searchResults) {
            return;
        }

        searchResults.innerHTML = "";

        if (!query) {
            return;
        }

        var heading = document.createElement("h3");

        heading.className = "search-results-heading";

        heading.textContent = results.length > 0 ?
            "Search Results (" + results.length + ")" :
            "Search Results";

        searchResults.appendChild(heading);


        if (results.length === 0) {

            var empty = document.createElement("div");

            empty.className = "search-empty";

            empty.innerHTML =
                "<strong>No Anime Found</strong>" +
                "<p>Try another anime title.</p>";

            searchResults.appendChild(empty);

            return;

        }


        var fragment = document.createDocumentFragment();

        /* Limit the number of visible suggestions */

        var maxResults = Math.min(results.length, 12);

        for (var i = 0; i < maxResults; i++) {

            var anime = results[i];

            var link = document.createElement("a");

            link.className = "search-result-item";

            link.href = safePageURL(anime.url);

            var poster = document.createElement("div");

            poster.className = "search-result-poster";

            var image = document.createElement("img");

            image.src = safeImageURL(anime.image);

            image.alt = anime.title;

            image.loading = "lazy";

            image.onerror = function () {

                this.onerror = null;

                this.src =
                    "https://placehold.co/400x550/101020/ffffff?text=Anime";

            };

            poster.appendChild(image);


            var info = document.createElement("div");

            info.className = "search-result-info";

            var title = document.createElement("h4");

            title.textContent = anime.title;

            var description = document.createElement("p");

            var descriptionParts = [];

            if (anime.genre) {
                descriptionParts.push(anime.genre);
            }

            if (anime.year) {
                descriptionParts.push(anime.year);
            }

            if (anime.episodes) {
                descriptionParts.push(anime.episodes);
            }

            description.textContent =
                descriptionParts.join(" · ") || "Anime";

            info.appendChild(title);

            info.appendChild(description);


            var arrow = document.createElement("span");

            arrow.className = "search-result-arrow";

            arrow.textContent = "›";

            arrow.setAttribute("aria-hidden", "true");


            link.appendChild(poster);

            link.appendChild(info);

            link.appendChild(arrow);

            fragment.appendChild(link);

        }

        searchResults.appendChild(fragment);

    }


    /* =====================================
       LIVE SEARCH
    ===================================== */

    function performLiveSearch() {

        if (!searchInput) {
            return;
        }

        var query = searchInput.value.trim();

        if (!query) {

            if (searchResults) {
                searchResults.innerHTML = "";
            }

            return;

        }

        var results = findAnime(query);

        renderResults(results, query);

    }


    if (searchInput) {

        searchInput.addEventListener("input", function () {

            if (searchTimer) {
                window.clearTimeout(searchTimer);
            }

            searchTimer = window.setTimeout(function () {

                performLiveSearch();

            }, 120);

        });

    }


    /* =====================================
       SEARCH FORM SUBMIT
    ===================================== */

    if (searchForm) {

        searchForm.addEventListener("submit", function (event) {

            event.preventDefault();

            if (!searchInput) {
                return;
            }

            var query = searchInput.value.trim();

            if (!query) {

                searchInput.focus();

                return;

            }

            var results = findAnime(query);

            renderResults(results, query);

            if (results.length > 0) {

                window.location.href =
                    safePageURL(results[0].url);

            }

        });

    }


    /* =====================================
       POPULAR SEARCH BUTTONS
    ===================================== */

    for (var i = 0; i < searchSuggestions.length; i++) {

        searchSuggestions[i].addEventListener("click", function () {

            var query = this.textContent.trim();

            if (!searchInput) {
                return;
            }

            searchInput.value = query;

            openSearch();

            performLiveSearch();

        });

    }


    /* =====================================
       FILTER ANIME CARDS
    ===================================== */

    function filterAnimeCards(query) {

        var normalizedQuery = normalizeText(query);

        var visibleCount = 0;

        for (var i = 0; i < animeCards.length; i++) {

            var card = animeCards[i];

            var title = normalizeText(
                card.getAttribute("data-title")
            );

            var genre = normalizeText(
                card.getAttribute("data-genre")
            );

            var matches = !normalizedQuery ||
                title.indexOf(normalizedQuery) !== -1 ||
                genre.indexOf(normalizedQuery) !== -1;

            card.style.display = matches ? "" : "none";

            if (matches) {
                visibleCount++;
            }

        }

        if (noResults) {

            noResults.hidden =
                normalizedQuery !== "" && visibleCount === 0;

        }

    }


    /* =====================================
       BOTTOM NAVIGATION ACTIVE STATE
    ===================================== */

    var navItems = document.querySelectorAll(".nav-item");

    for (var i = 0; i < navItems.length; i++) {

        navItems[i].addEventListener("click", function () {

            for (var j = 0; j < navItems.length; j++) {

                navItems[j].classList.remove("active");

                navItems[j].removeAttribute("aria-current");

            }

            this.classList.add("active");

            this.setAttribute("aria-current", "page");

        });

    }


    /* =====================================
       IMAGE FALLBACK
    ===================================== */

    var allImages = document.querySelectorAll("img");

    for (var i = 0; i < allImages.length; i++) {

        allImages[i].addEventListener("error", function () {

            if (this.getAttribute("data-fallback-used") === "true") {
                return;
            }

            this.setAttribute("data-fallback-used", "true");

            this.style.backgroundColor = "#101936";

        });

    }


    /* =====================================
       EXTERNAL CLICK CLOSE
    ===================================== */

    document.addEventListener("click", function (event) {

        if (!searchPanel || searchPanel.hidden) {
            return;
        }

        if (
            searchPanel.contains(event.target) ||
            (searchToggle && searchToggle.contains(event.target))
        ) {
            return;
        }

        closeSearch();

    });


    /* =====================================
       INITIALIZE
    ===================================== */

    filterAnimeCards("");

});
