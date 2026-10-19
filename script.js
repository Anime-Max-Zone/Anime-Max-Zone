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

// ---------- 4. Security Helpers ----------
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

// ---------- 5. Main Grid Card Renderer ----------
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

// ---------- 6. Main Grid List Renderer ----------
function renderList(list) {
    grid.innerHTML = "";
    if (!list.length) {
        grid.innerHTML = `<div class="message">Koi anime nahi mila 😕</div>`;
        return;
    }
    const frag = document.createDocumentFragment();
    list.forEach((a) => frag.appendChild(renderCard(a)));
    grid.appendChild(frag);
}

// ---------- 7. Live Suggestions Renderer (Search Overlay ke andar) ----------
function renderSuggestions(term) {
    liveSuggestions.innerHTML = "";
    
    if (!term) {
        liveSuggestions.innerHTML = `<p class="empty-msg">Type to search...</p>`;
        return;
    }

    const filtered = allAnime.filter((a) => {
        const t = (a.title || "").toLowerCase();
        const g = Array.isArray(a.genres) ? a.genres.join(" ").toLowerCase() : String(a.genres || "").toLowerCase();
        return t.includes(term) || g.includes(term);
    }).slice(0, 5); // Max 5 suggestions dikhayenge

    if (filtered.length === 0) {
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
        
        // Click karne par anime page par le jayega
        div.addEventListener("click", () => {
            window.location.href = `/anime.html?id=${safeId}`;
        });

        liveSuggestions.appendChild(div);
    });
}

// ---------- 8. Hide Preloader ----------
function hidePreloader() {
    if (preloader) {
        preloader.classList.add("hidden");
        setTimeout(() => { preloader.style.display = 'none'; }, 500);
    }
}

// ---------- 9. Firestore Loader ----------
async function loadAnime() {
    try {
        const q = query(collection(db, "anime"), orderBy("createdAt", "desc"), limit(60));
        const snap = await getDocs(q);

        allAnime = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
        // Agar database khali ho toh testing ke liye dummy data (Optional)
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
        grid.innerHTML = `<div class="message error">Anime load nahi ho paye. Internet ya Firebase check karein.</div>`;
    } finally {
        setTimeout(hidePreloader, 1000); 
    }
}

// ---------- 10. Search Panel Logic ----------
function openSearch() {
    searchOverlay.classList.add("active");
    searchInput.focus();
    document.body.style.overflow = "hidden"; // Background scroll roko
}

function closeSearch() {
    searchOverlay.classList.remove("active");
    searchInput.value = "";
    renderSuggestions("");
    document.body.style.overflow = ""; // Background scroll wapas chalu karo
}

// Overlay Open Buttons
openSearchBtn.addEventListener("click", openSearch);
if(navSearchBtn) navSearchBtn.addEventListener("click", openSearch);

// Overlay Close Button
closeSearchBtn.addEventListener("click", closeSearch);

// Overlay ke bahar click karne par band ho
searchOverlay.addEventListener("click", (e) => {
    if (e.target === searchOverlay) closeSearch();
});

// Escape key dabane par band ho
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && searchOverlay.classList.contains("active")) {
        closeSearch();
    }
});

// Live Search Input Handler (Debounce)
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
