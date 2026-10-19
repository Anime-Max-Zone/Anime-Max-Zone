/* ============================================================
   ANIME MAX ZONE — User Panel Logic
   ============================================================ */

// ---------- 1. Firebase Imports (v10 modular) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore, collection, getDocs, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const grid = document.getElementById("animeGrid");
const preloader = document.getElementById("preloader");

// Search Overlay Elements
const openSearchBtn = document.getElementById("openSearchBtn");
const navSearchBtn = document.getElementById("navSearchBtn");
const closeSearchBtn = document.getElementById("closeSearchBtn");
const searchOverlay = document.getElementById("searchOverlay");
const searchInput = document.getElementById("searchInput");
const liveSuggestions = document.getElementById("liveSuggestions");

let allAnime = [];

// ============================================================
// ---------- 4. PRELOADER LOGIC ----------
// ============================================================
function hidePreloader() {
    if (preloader && !preloader.classList.contains("hidden")) {
        preloader.classList.add("hidden");
        setTimeout(() => { preloader.style.display = 'none'; }, 500);
    }
}

// Check if user is visiting for the first time in this session
if (!sessionStorage.getItem("hasVisited")) {
    // First time: Show loader for 2.5 seconds
    sessionStorage.setItem("hasVisited", "true");
    setTimeout(hidePreloader, 2500);
} else {
    // If page reloads: Hide quickly (0.5 seconds)
    setTimeout(hidePreloader, 500);
}

// Emergency Backup: Force hide after 5 seconds
setTimeout(hidePreloader, 5000);


// ---------- 5. Security Helpers ----------
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
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">
        <rect width="200" height="300" fill="#1a1a24"/>
        <text x="100" y="150" fill="#555" text-anchor="middle" font-family="sans-serif" font-size="14">No Image</text>
     </svg>`
);

// ---------- 6. Main Grid Card Renderer ----------
function renderCard(anime) {
    const title = escapeHTML(anime.title || "Untitled");
    const genres = Array.isArray(anime.genres) ? anime.genres.map(escapeHTML).join(", ") : escapeHTML(anime.genres || "");
    const poster = safeImageUrl(anime.coverImageUrl) || FALLBACK_POSTER;

    const status = (anime.status || "").toLowerCase();
    const statusClass = status === "ongoing" ? "badge status-ongoing" : status === "completed" ? "badge status-completed" : "badge";
    const statusLabel = escapeHTML(anime.status || "");

    const card = document.createElement("article");
    card.className = "anime-card";
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");

    const safeId = encodeURIComponent(anime.id || "");
    card.dataset.href = `/anime.html?id=${safeId}`;

    card.innerHTML = `
        <div class="poster">
            ${statusLabel ? `<span class="${statusClass}">${statusLabel}</span>` : ""}
            <img src="${poster}" alt="${title} poster" loading="lazy" />
        </div>
        <div class="info">
            <h3 title="${title}">${title}</h3>
            <p class="genres">${genres || "&nbsp;"}</p>
        </div>
    `;

    const img = card.querySelector("img");
    img.addEventListener("error", () => { img.src = FALLBACK_POSTER; }, { once: true });

    const go = () => { window.location.href = card.dataset.href; };
    card.addEventListener("click", go);
    card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });

    return card;
}

// ---------- 7. Main Grid List Renderer ----------
function renderList(list) {
    grid.innerHTML = "";
    if (!list.length) {
        grid.innerHTML = `<div class="message">No anime found 😕</div>`; // Translated
        return;
    }
    const frag = document.createDocumentFragment();
    list.forEach((a) => frag.appendChild(renderCard(a)));
    grid.appendChild(frag);
}

// ============================================================
// ---------- 8. Live Suggestions Renderer (FIXED) ----------
// ============================================================
function renderSuggestions(term) {
    liveSuggestions.innerHTML = "";
    
    // Agar input khali hai, toh box ko hide kar do
    if (!term) {
        liveSuggestions.style.display = "none";
        return;
    }

    const filtered = allAnime.filter((a) => {
        const t = (a.title || "").toLowerCase();
        const g = Array.isArray(a.genres) ? a.genres.join(" ").toLowerCase() : String(a.genres || "").toLowerCase();
        return t.includes(term) || g.includes(term);
    }).slice(0, 5); // Max 5 suggestions

    // Agar kuch nahi mila, toh box show karke message dikhao
    if (filtered.length === 0) {
        liveSuggestions.style.display = "block";
        liveSuggestions.innerHTML = `<p class="empty-msg">No results found for "${escapeHTML(term)}"</p>`;
        return;
    }

    // Agar result mila, toh box show karo aur items daalo
    liveSuggestions.style.display = "block";

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
        
        div.addEventListener("click", () => {
            window.location.href = `/anime.html?id=${safeId}`;
        });

        liveSuggestions.appendChild(div);
    });
}

// ---------- 9. Firestore Loader ----------
async function loadAnime() {
    try {
        const q = query(collection(db, "anime"), orderBy("createdAt", "desc"), limit(60));
        const snap = await getDocs(q);

        allAnime = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
        // Fallback for testing if DB is empty
        if(allAnime.length === 0) {
            allAnime = [
                { id: '1', title: 'Demon Slayer', genres: ['Action', 'Fantasy'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', status: 'Ongoing' },
                { id: '2', title: 'Jujutsu Kaisen', genres: ['Action', 'Supernatural'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', status: 'Completed' },
                { id: '3', title: 'One Piece', genres: ['Action', 'Adventure'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg', status: 'Ongoing' }
            ];
        }

        renderList(allAnime);
    } catch (err) {
        console.error("Firestore error:", err);
        grid.innerHTML = `<div class="message error">Failed to load anime. Please check your internet or Firebase connection.</div>`; // Translated
    }
}

// ---------- 10. Search Panel Logic ----------
function openSearch() {
    searchOverlay.classList.add("active");
    searchInput.focus();
    document.body.style.overflow = "hidden";
    
    // Search khulte hi box ko hide karo
    liveSuggestions.style.display = "none"; 
}

function closeSearch() {
    searchOverlay.classList.remove("active");
    searchInput.value = "";
    liveSuggestions.style.display = "none"; 
    liveSuggestions.innerHTML = "";
    document.body.style.overflow = "";
}

openSearchBtn.addEventListener("click", openSearch);
if(navSearchBtn) navSearchBtn.addEventListener("click", openSearch);
closeSearchBtn.addEventListener("click", closeSearch);

// Overlay ke bahar click karne par band karo
searchOverlay.addEventListener("click", (e) => {
    if (e.target === searchOverlay) closeSearch();
});

// Escape key se band karo
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && searchOverlay.classList.contains("active")) {
        closeSearch();
    }
});

// Live Search Input Handler
let searchTimer;
searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    const term = e.target.value.trim().toLowerCase();

    searchTimer = setTimeout(() => {
        renderSuggestions(term);
    }, 250);
});

// ---------- 11. Boot ----------
loadAnime();
