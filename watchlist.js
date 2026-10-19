/* ============================================================
   ANIME MAX ZONE — Watchlist & Search Logic
   ============================================================ */

// ---------- 1. Firebase Imports ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---------- 2. Firebase Config ----------
const firebaseConfig = {
    apiKey: "AIzaSyCpfrluxsBhnz48ve9RykIy1IxzbBfk7dA",
    authDomain: "sm-studio-7.firebaseapp.com",
    projectId: "sm-studio-7",
    storageBucket: "sm-studio-7.firebasestorage.app",
    messagingSenderId: "126291501472",
    appId: "1:126291501472:web:47386660af8ec3a57204c5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- 3. DOM References ----------
const grid = document.getElementById("watchlistGrid");
const emptyState = document.getElementById("emptyWatchlist");

const openSearchBtn = document.getElementById("openSearchBtn");
const navSearchBtn = document.getElementById("navSearchBtn");
const closeSearchBtn = document.getElementById("closeSearchBtn");
const searchOverlay = document.getElementById("searchOverlay");
const searchInput = document.getElementById("searchInput");
const liveSuggestions = document.getElementById("liveSuggestions");

let allAnimeForSearch = [];

// Demo Data for Search Fallback
const demoData = [
    { id: '1', title: 'Demon Slayer', genres: ['Action', 'Fantasy'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg' },
    { id: '2', title: 'Jujutsu Kaisen', genres: ['Action', 'Supernatural'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg' },
    { id: '3', title: 'One Piece', genres: ['Action', 'Adventure'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg' },
    { id: '4', title: 'Attack on Titan', genres: ['Action', 'Drama'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg' },
    { id: '5', title: 'Naruto', genres: ['Action', 'Adventure'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg' }
];

// ---------- 4. Security & Helpers ----------
function escapeHTML(str) {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function safeImageUrl(url) {
    if (typeof url !== "string") return "";
    try {
        const u = new URL(url);
        if (u.protocol === "http:" || u.protocol === "https:") return u.href;
    } catch (_) {}
    return "";
}
const FALLBACK_POSTER = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#1a1a24"/><text x="100" y="150" fill="#555" text-anchor="middle" font-family="sans-serif" font-size="14">No Image</text></svg>`
);

// ============================================================
// ---------- 5. SEARCH OVERLAY LOGIC ----------
// ============================================================
async function fetchAnimeForSearch() {
    try {
        const q = query(collection(db, "anime"), orderBy("createdAt", "desc"), limit(60));
        const snap = await getDocs(q);
        allAnimeForSearch = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if(allAnimeForSearch.length === 0) allAnimeForSearch = demoData;
    } catch (err) {
        console.error("Search Fetch error:", err);
        allAnimeForSearch = demoData;
    }
}

function renderSuggestions(term) {
    liveSuggestions.innerHTML = "";
    liveSuggestions.style.display = "block"; 

    let filtered = [];
    if (!term) {
        liveSuggestions.innerHTML = `<div class="suggestion-title">Trending Now</div>`;
        filtered = allAnimeForSearch.slice(0, 5);
    } else {
        filtered = allAnimeForSearch.filter((a) => {
            const t = (a.title || "").toLowerCase();
            const g = Array.isArray(a.genres) ? a.genres.join(" ").toLowerCase() : String(a.genres || "").toLowerCase();
            return t.includes(term) || g.includes(term);
        }).slice(0, 10);
    }

    if (filtered.length === 0 && term) {
        liveSuggestions.innerHTML = `<p class="empty-msg">No results found for "${escapeHTML(term)}"</p>`;
        return;
    }

    filtered.forEach(anime => {
        const title = escapeHTML(anime.title || "Untitled");
        const poster = safeImageUrl(anime.coverImageUrl) || FALLBACK_POSTER;
        const safeId = encodeURIComponent(anime.id || "");

        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.innerHTML = `
            <img src="${poster}" alt="${title}" />
            <div class="suggestion-info">
                <h4>${title}</h4>
                <p>${Array.isArray(anime.genres) ? anime.genres.map(escapeHTML).join(", ") : escapeHTML(anime.genres || "")}</p>
            </div>
        `;
        div.addEventListener("click", () => { window.location.href = `anime.html?id=${safeId}`; });
        liveSuggestions.appendChild(div);
    });
}

function openSearch() {
    searchOverlay.classList.add("active");
    searchInput.focus();
    document.body.style.overflow = "hidden";
    renderSuggestions(""); 
}

function closeSearch() {
    searchOverlay.classList.remove("active");
    searchInput.value = "";
    liveSuggestions.style.display = "none"; 
    liveSuggestions.innerHTML = "";
    document.body.style.overflow = "";
}

if(openSearchBtn) openSearchBtn.addEventListener("click", openSearch);
if(navSearchBtn) navSearchBtn.addEventListener("click", openSearch);
if(closeSearchBtn) closeSearchBtn.addEventListener("click", closeSearch);

if(searchOverlay) {
    searchOverlay.addEventListener("click", (e) => { if (e.target === searchOverlay) closeSearch(); });
}
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && searchOverlay && searchOverlay.classList.contains("active")) closeSearch();
});
let searchTimer;
if(searchInput) {
    searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimer);
        const term = e.target.value.trim().toLowerCase();
        searchTimer = setTimeout(() => { renderSuggestions(term); }, 250);
    });
}

// ============================================================
// ---------- 6. WATCHLIST PAGE LOGIC ----------
// ============================================================
function renderCard(anime) {
    const title = escapeHTML(anime.title || "Untitled");
    const genres = Array.isArray(anime.genres) ? anime.genres.map(escapeHTML).join(", ") : escapeHTML(anime.genres || "");
    const poster = safeImageUrl(anime.coverImageUrl) || FALLBACK_POSTER;
    const safeId = encodeURIComponent(anime.id || "");

    const card = document.createElement("article");
    card.className = "anime-card";
    
    card.innerHTML = `
        <div class="poster" onclick="window.location.href='anime.html?id=${safeId}'" style="cursor:pointer;">
            <img src="${poster}" alt="${title} poster" loading="lazy" onerror="this.src='${FALLBACK_POSTER}'" />
        </div>
        <div class="info" onclick="window.location.href='anime.html?id=${safeId}'" style="cursor:pointer;">
            <h3 title="${title}">${title}</h3>
            <p class="genres">${genres || "&nbsp;"}</p>
        </div>
        <button class="remove-btn" data-id="${safeId}" aria-label="Remove from watchlist">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    `;

    const removeBtn = card.querySelector(".remove-btn");
    removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeFromWatchlist(anime.id);
    });

    return card;
}

function removeFromWatchlist(id) {
    let watchlist = JSON.parse(localStorage.getItem("animeWatchlist")) || [];
    watchlist = watchlist.filter(item => item.id !== id);
    localStorage.setItem("animeWatchlist", JSON.stringify(watchlist));
    loadWatchlist();
}

function loadWatchlist() {
    let watchlist = JSON.parse(localStorage.getItem("animeWatchlist")) || [];
    grid.innerHTML = "";

    if (watchlist.length === 0) {
        emptyState.style.display = "flex";
        grid.style.display = "none";
        return;
    }

    emptyState.style.display = "none";
    grid.style.display = "grid";

    const frag = document.createDocumentFragment();
    watchlist.forEach(anime => { frag.appendChild(renderCard(anime)); });
    grid.appendChild(frag);
}

// ---------- 7. Boot ----------
fetchAnimeForSearch(); // Load data for search overlay
loadWatchlist();       // Load user's watchlist
