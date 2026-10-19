/* ============================================================
   ANIME MAX ZONE — User Panel Logic
   ============================================================ */

// ---------- 1. Firebase Imports (v10 modular) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---------- 2. Firebase Config (apni values daalein) ----------
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
const searchInput = document.getElementById("searchInput");
const sectionTitle = document.getElementById("sectionTitle");
const loginBtn = document.getElementById("loginBtn");

// Full list for client-side search
let allAnime = [];

// ---------- 4. Security Helpers ----------

/** Escape any user-controlled string (prevents XSS) */
function escapeHTML(str) {
    if (str == null) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/** Allow only http/https image URLs (blocks javascript: and data: abuse) */
function safeImageUrl(url) {
    if (typeof url !== "string") return "";
    try {
        const u = new URL(url);
        if (u.protocol === "http:" || u.protocol === "https:") return u.href;
    } catch (_) {
        /* invalid URL */
    }
    return "";
}

// Fallback poster (inline SVG data URI)
const FALLBACK_POSTER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">
            <rect width="200" height="300" fill="#1a1a24"/>
            <text x="100" y="150" fill="#555" text-anchor="middle"
                  font-family="sans-serif" font-size="14">No Image</text>
         </svg>`
    );

// ---------- 5. Card Renderer ----------
function renderCard(anime) {
    const title = escapeHTML(anime.title || "Untitled");
    const genres = Array.isArray(anime.genres)
        ? anime.genres.map(escapeHTML).join(", ")
        : escapeHTML(anime.genres || "");
    const poster = safeImageUrl(anime.coverImageUrl) || FALLBACK_POSTER;

    const status = (anime.status || "").toLowerCase();
    const statusClass =
        status === "ongoing"
            ? "badge status-ongoing"
            : status === "completed"
            ? "badge status-completed"
            : "badge";
    const statusLabel = escapeHTML(anime.status || "");

    const card = document.createElement("article");
    card.className = "anime-card";
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");

    const safeId = encodeURIComponent(anime.id || "");
    card.dataset.href = `/anime.html?id=${safeId}`;

    // Safe HTML construction
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

    // Attach image error handler programmatically (no inline onerror → CSP friendly)
    const img = card.querySelector("img");
    img.addEventListener("error", () => {
        img.src = FALLBACK_POSTER;
    }, { once: true });

    // Navigate on click / Enter / Space
    const go = () => {
        window.location.href = card.dataset.href;
    };
    card.addEventListener("click", go);
    card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            go();
        }
    });

    return card;
}

// ---------- 6. List Renderer ----------
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

// ---------- 7. Firestore Loader ----------
async function loadAnime() {
    try {
        // Public read rule hona chahiye: match /anime/{id} { allow read: if true; }
        const q = query(
            collection(db, "anime"),
            orderBy("createdAt", "desc"),
            limit(60)
        );
        const snap = await getDocs(q);

        allAnime = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderList(allAnime);
    } catch (err) {
        // Detailed error sirf console mein, user ko generic message
        console.error("Firestore error:", err);
        grid.innerHTML = `<div class="message error">
            Anime load nahi ho paye. Thodi der baad try karein.
        </div>`;
    }
}

// ---------- 8. Search (debounced, client-side) ----------
let searchTimer;
searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    const rawTerm = e.target.value.trim();
    const term = rawTerm.toLowerCase();

    searchTimer = setTimeout(() => {
        if (!term) {
            sectionTitle.textContent = "Trending Now";
            renderList(allAnime);
            return;
        }

        // textContent use kar rahe hain → XSS safe
        sectionTitle.textContent = `Results for "${rawTerm}"`;

        const filtered = allAnime.filter((a) => {
            const t = (a.title || "").toLowerCase();
            const g = Array.isArray(a.genres)
                ? a.genres.join(" ").toLowerCase()
                : String(a.genres || "").toLowerCase();
            return t.includes(term) || g.includes(term);
        });

        renderList(filtered);
    }, 250);
});

// ---------- 9. Login Button ----------
loginBtn.addEventListener("click", () => {
    window.location.href = "/login.html";
});

// ---------- 10. Boot ----------
loadAnime();
