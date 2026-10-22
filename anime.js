/* ============================================================
   ANIME MAX ZONE — Details Page Logic (anime.js)
   Firebase Realtime Database Edition
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    child
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

/* ============================================================
   1. FIREBASE CONFIGURATION
   ============================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyCpfrluxsBhnz48ve9RykIy1IxzbBfk7dA",
    authDomain: "sm-studio-7.firebaseapp.com",
    databaseURL: "https://sm-studio-7-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "sm-studio-7",
    storageBucket: "sm-studio-7.firebasestorage.app",
    messagingSenderId: "126291501472",
    appId: "1:291501472:web:47386660af8ec3a57204c5"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/* ============================================================
   2. DOM REFERENCES
   ============================================================ */

const openSearchBtn = document.getElementById("openSearchBtn");
const navSearchBtn = document.getElementById("navSearchBtn");
const closeSearchBtn = document.getElementById("closeSearchBtn");
const searchOverlay = document.getElementById("searchOverlay");
const searchInput = document.getElementById("searchInput");
const liveSuggestions = document.getElementById("liveSuggestions");

const detailsLoading = document.getElementById("detailsLoading");
const detailsContent = document.getElementById("detailsContent");

let allAnimeForSearch = [];
let searchTimer = null;

/* ============================================================
   3. HELPERS
   ============================================================ */

function escapeHTML(value) {
    if (value == null) return "";

    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function safeImageUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
        return "";
    }

    try {
        const url = new URL(value);

        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.href;
        }
    } catch (_) {}

    return "";
}

const FALLBACK_POSTER =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">
            <rect width="200" height="300" fill="#1a1a24"/>
            <text x="100" y="150" fill="#777"
                  text-anchor="middle"
                  font-family="sans-serif"
                  font-size="14">No Image</text>
        </svg>
    `);

/* ============================================================
   4. REALTIME DATABASE DATA FORMAT
   ============================================================ */

/*
Expected structure:

anime/
  animeId/
    title: "Naruto"
    coverImageUrl: "https://..."
    description: "..."
    status: "Ongoing"
    genres:
      0: "Action"
      1: "Adventure"
    episodes:
      1:
        title: "Episode 1"
        videoUrl: "https://drive.google.com/file/d/FILE_ID/view"
      2:
        title: "Episode 2"
        videoUrl: "https://drive.google.com/file/d/FILE_ID/view"

This code reads your existing Realtime Database.
It does not create or modify database records.
*/

/* ============================================================
   5. NORMALIZE DATABASE DATA
   ============================================================ */

function normalizeAnime(id, value) {
    const anime = value && typeof value === "object" ? value : {};

    let genres = anime.genres || [];

    if (typeof genres === "string") {
        genres = genres.split(",").map(item => item.trim()).filter(Boolean);
    } else if (!Array.isArray(genres)) {
        genres = Object.values(genres);
    }

    const episodesValue = anime.episodes || {};
    const episodes = Array.isArray(episodesValue)
        ? episodesValue
        : Object.entries(episodesValue).map(([key, episode]) => ({
            episodeNumber: key,
            ...(episode && typeof episode === "object" ? episode : {})
        }));

    return {
        id,
        title: anime.title || anime.name || "Untitled",
        coverImageUrl: anime.coverImageUrl || anime.posterUrl || anime.poster || "",
        description: anime.description || "",
        status: anime.status || "Unknown",
        genres,
        episodes,
        createdAt: anime.createdAt || null
    };
}

/* ============================================================
   6. FETCH ANIME FROM REALTIME DATABASE
   ============================================================ */

async function fetchAnimeForSearch() {
    try {
        const snapshot = await get(ref(database, "anime"));

        if (!snapshot.exists()) {
            allAnimeForSearch = [];
            console.warn("No anime records found at /anime.");
            return;
        }

        const data = snapshot.val();

        allAnimeForSearch = Object.entries(data)
            .filter(([, value]) => value && typeof value === "object")
            .map(([id, value]) => normalizeAnime(id, value));

        allAnimeForSearch.sort((a, b) => {
            const dateA = Number(a.createdAt) || Date.parse(a.createdAt) || 0;
            const dateB = Number(b.createdAt) || Date.parse(b.createdAt) || 0;
            return dateB - dateA;
        });

    } catch (error) {
        console.error("Realtime Database search error:", error);
        allAnimeForSearch = [];
    }
}

/* ============================================================
   7. SEARCH SUGGESTIONS
   ============================================================ */

function renderSuggestions(searchTerm = "") {
    if (!liveSuggestions) return;

    liveSuggestions.replaceChildren();
    liveSuggestions.style.display = "block";

    const term = String(searchTerm).trim().toLowerCase();

    let filtered;

    if (!term) {
        const heading = document.createElement("div");
        heading.className = "suggestion-title";
        heading.textContent = "Anime";
        liveSuggestions.appendChild(heading);

        filtered = allAnimeForSearch.slice(0, 5);
    } else {
        filtered = allAnimeForSearch.filter(anime => {
            const title = String(anime.title || "").toLowerCase();
            const genres = (anime.genres || []).join(" ").toLowerCase();

            return title.includes(term) || genres.includes(term);
        }).slice(0, 10);
    }

    if (!filtered.length) {
        const empty = document.createElement("p");
        empty.className = "empty-msg";
        empty.textContent = term
            ? `No results found for "${searchTerm}"`
            : "No anime available yet.";

        liveSuggestions.appendChild(empty);
        return;
    }

    filtered.forEach(anime => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.tabIndex = 0;
        item.setAttribute("role", "button");

        const image = document.createElement("img");
        image.src = safeImageUrl(anime.coverImageUrl) || FALLBACK_POSTER;
        image.alt = anime.title;
        image.loading = "lazy";

        image.addEventListener("error", () => {
            image.src = FALLBACK_POSTER;
        }, { once: true });

        const info = document.createElement("div");
        info.className = "suggestion-info";

        const heading = document.createElement("h4");
        heading.textContent = anime.title;

        const genreText = document.createElement("p");
        genreText.textContent = anime.genres.join(", ");

        info.append(heading, genreText);
        item.append(image, info);

        const openAnime = () => {
            window.location.href =
                `anime.html?id=${encodeURIComponent(anime.id)}`;
        };

        item.addEventListener("click", openAnime);

        item.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openAnime();
            }
        });

        liveSuggestions.appendChild(item);
    });
}

/* ============================================================
   8. SEARCH OVERLAY
   ============================================================ */

function openSearch() {
    if (!searchOverlay) return;

    searchOverlay.classList.add("active");
    document.body.style.overflow = "hidden";

    renderSuggestions("");

    searchInput?.focus();
}

function closeSearch() {
    if (!searchOverlay) return;

    searchOverlay.classList.remove("active");
    document.body.style.overflow = "";

    if (searchInput) {
        searchInput.value = "";
    }

    if (liveSuggestions) {
        liveSuggestions.style.display = "none";
        liveSuggestions.replaceChildren();
    }

    clearTimeout(searchTimer);
}

openSearchBtn?.addEventListener("click", openSearch);
navSearchBtn?.addEventListener("click", openSearch);
closeSearchBtn?.addEventListener("click", closeSearch);

searchOverlay?.addEventListener("click", event => {
    if (event.target === searchOverlay) {
        closeSearch();
    }
});

document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        searchOverlay?.classList.contains("active")
    ) {
        closeSearch();
    }
});

searchInput?.addEventListener("input", event => {
    clearTimeout(searchTimer);

    const term = event.target.value.trim();

    searchTimer = setTimeout(() => {
        renderSuggestions(term);
    }, 250);
});

/* ============================================================
   9. LOAD ANIME DETAILS
   ============================================================ */

async function loadAnimeDetails() {
    const params = new URLSearchParams(window.location.search);
    const animeId = params.get("id");

    if (!animeId) {
        window.location.replace("index.html");
        return;
    }

    if (detailsLoading) {
        detailsLoading.style.display = "block";
    }

    if (detailsContent) {
        detailsContent.style.display = "none";
    }

    try {
        const snapshot = await get(child(ref(database), `anime/${animeId}`));

        if (!snapshot.exists()) {
            showAnimeNotFound();
            return;
        }

        const anime = normalizeAnime(animeId, snapshot.val());
        renderDetailsUI(anime);

    } catch (error) {
        console.error("Failed to load anime details:", error);

        showDetailsError(
            "Unable to load anime. Check your internet connection and Realtime Database rules."
        );
    }
}

function showAnimeNotFound() {
    if (detailsLoading) {
        detailsLoading.style.display = "block";

        detailsLoading.innerHTML = `
            <div style="padding:4rem 2rem;text-align:center;">
                <h2 style="color:#ff6b6b;margin-bottom:1rem;">
                    Anime Not Found
                </h2>
                <p style="color:var(--text-muted);margin-bottom:1.5rem;">
                    This anime does not exist in the Realtime Database.
                </p>
                <a href="index.html" class="btn-watch-now"
                   style="display:inline-flex;">
                    Go Back Home
                </a>
            </div>
        `;
    }

    if (detailsContent) {
        detailsContent.style.display = "none";
    }
}

function showDetailsError(message) {
    if (detailsLoading) {
        detailsLoading.style.display = "block";

        const paragraph = document.createElement("p");
        paragraph.textContent = message;

        detailsLoading.replaceChildren(paragraph);
    }

    if (detailsContent) {
        detailsContent.style.display = "none";
    }
}

/* ============================================================
   10. RENDER DETAILS UI
   ============================================================ */

function renderDetailsUI(anime) {
    if (!detailsContent) {
        console.error("Missing #detailsContent in anime.html");
        return;
    }

    if (detailsLoading) {
        detailsLoading.style.display = "none";
    }

    detailsContent.style.display = "block";

    document.title = `${anime.title} — Anime Max Zone`;

    const title = escapeHTML(anime.title);
    const description = escapeHTML(
        anime.description || "No description available for this anime yet."
    );

    const poster = safeImageUrl(anime.coverImageUrl) || FALLBACK_POSTER;
    const status = escapeHTML(anime.status);

    const genresHTML = anime.genres
        .map(genre => `<span>${escapeHTML(genre)}</span>`)
        .join("");

    let episodesHTML = "";

    if (anime.episodes.length) {
        anime.episodes.forEach((episode, index) => {
            const episodeNumber = String(
                episode.episodeNumber || episode.number || index + 1
            );

            episodesHTML += `
                <button
                    type="button"
                    class="ep-btn"
                    data-episode="${escapeHTML(episodeNumber)}">
                    ${escapeHTML(episodeNumber)}
                </button>
            `;
        });
    } else {
        episodesHTML = `
            <p class="empty-msg">
                No episodes have been added yet.
            </p>
        `;
    }

    detailsContent.innerHTML = `
        <section class="anime-hero"
                 style="background-image:url('${poster}');">

            <div class="anime-hero-content">
                <img
                    src="${poster}"
                    alt="${title}"
                    class="anime-poster"
                >

                <div class="anime-info">
                    <h1>${title}</h1>

                    <div class="anime-meta-badges">
                        <span style="background:var(--primary);border:none;">
                            ${status}
                        </span>
                        ${genresHTML}
                    </div>

                    <p class="anime-description">${description}</p>

                    <button
                        type="button"
                        class="btn-watch-now"
                        id="playFirstBtn">

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            aria-hidden="true">
                            <path d="M8 5v14l11-7z"/>
                        </svg>

                        Watch Episode 1
                    </button>
                </div>
            </div>
        </section>

        <section class="episodes-section">
            <h2>Episodes</h2>
            <div class="episode-grid">
                ${episodesHTML}
            </div>
        </section>
    `;

    detailsContent.querySelectorAll("img").forEach(image => {
        image.addEventListener("error", () => {
            image.src = FALLBACK_POSTER;
        }, { once: true });
    });

    function openEpisode(episodeNumber) {
        if (!anime.id || !episodeNumber) return;

        window.location.href =
            `video-player.html?animeId=${encodeURIComponent(anime.id)}` +
            `&ep=${encodeURIComponent(episodeNumber)}`;
    }

    detailsContent.querySelectorAll(".ep-btn").forEach(button => {
        button.addEventListener("click", () => {
            openEpisode(button.dataset.episode);
        });
    });

    document.getElementById("playFirstBtn")?.addEventListener("click", () => {
        const firstEpisode = anime.episodes[0];

        if (!firstEpisode) {
            alert("No episodes are available for this anime yet.");
            return;
        }

        openEpisode(
            firstEpisode.episodeNumber ||
            firstEpisode.number ||
            1
        );
    });
}

/* ============================================================
   11. INITIALIZE
   ============================================================ */

async function initializePage() {
    await Promise.allSettled([
        fetchAnimeForSearch(),
        loadAnimeDetails()
    ]);
}

initializePage();
