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

// Demo Data (Agar Firebase khali ho ya error aaye toh yeh use hoga)
const demoData = [
    { id: '1', title: 'Demon Slayer', genres: ['Action', 'Fantasy'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', status: 'Ongoing' },
    { id: '2', title: 'Jujutsu Kaisen', genres: ['Action', 'Supernatural'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', status: 'Completed' },
    { id: '3', title: 'One Piece', genres: ['Action', 'Adventure'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg', status: 'Ongoing' },
    { id: '4', title: 'Attack on Titan', genres: ['Action', 'Drama'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg', status: 'Completed' },
    { id: '5', title: 'Naruto', genres: ['Action', 'Adventure'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg', status: 'Completed' }
];

// ============================================================
// ---------- 4. PRELOADER LOGIC ----------
// ============================================================
function hidePreloader() {
    if (preloader && !preloader.classList.contains("hidden")) {
        preloader.classList.add("hidden");
        setTimeout(() => { preloader.style.display = 'none'; }, 500);
    }
}

// First time visit par 2.5s, baad me 0.5s
if (!sessionStorage.getItem("hasVisited")) {
    sessionStorage.setItem("hasVisited", "true");
    setTimeout(hidePreloader, 2500);
} else {
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
    
    // RELATIVE PATH (No leading slash) -> Fix for GitHub Pages
    card.dataset.href = `anime.html?id=${safeId}`;

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
        grid.innerHTML = `<div class="message">No anime found 😕</div>`; 
        return;
    }
    const frag = document.createDocumentFragment();
    list.forEach((a) => frag.appendChild(renderCard(a)));
    grid.appendChild(frag);
}

// ============================================================
// ---------- 8. HERO SLIDER LOGIC (Card Style) ----------
// ============================================================
let slideInterval;
let currentSlide = 0;
let sliderAnimeList = [];

function renderHeroSlider(animeList) {
    const sliderContainer = document.getElementById("heroSlider");
    if (!sliderContainer) return;

    sliderAnimeList = animeList.slice(0, 5); // Top 5 Anime
    if (sliderAnimeList.length === 0) return;

    sliderContainer.innerHTML = ""; // Placeholder remove

    // Slides Generate karein
    sliderAnimeList.forEach((anime, index) => {
        const title = escapeHTML(anime.title || "Untitled");
        const bannerImg = safeImageUrl(anime.coverImageUrl) || FALLBACK_POSTER;
        const genres = Array.isArray(anime.genres) ? anime.genres.map(escapeHTML).join(" • ") : escapeHTML(anime.genres || "Action");
        const status = escapeHTML(anime.status || "Anime");
        
        const slide = document.createElement("a");
        slide.className = `slide ${index === 0 ? 'active' : ''}`;
        
        // RELATIVE PATH (No leading slash) -> Fix for GitHub Pages
        slide.href = `anime.html?id=${encodeURIComponent(anime.id)}`;
        slide.style.backgroundImage = `url('${bannerImg}')`;

        slide.innerHTML = `
            <div class="slide-content">
                <h1>${title}</h1>
                <p>${genres}</p>
                <div class="meta-info">
                    <span>${status}</span> • <span>Latest Episodes</span>
                </div>
            </div>
        `;
        sliderContainer.appendChild(slide);
    });

    // Dots Container
    const dotsContainer = document.createElement("div");
    dotsContainer.className = "slider-dots";
    sliderAnimeList.forEach((_, index) => {
        const dot = document.createElement("div");
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener("click", (e) => { e.preventDefault(); goToSlide(index); });
        dotsContainer.appendChild(dot);
    });
    sliderContainer.appendChild(dotsContainer);

    // Arrows Container
    const arrowsContainer = document.createElement("div");
    arrowsContainer.className = "slider-arrows";
    arrowsContainer.innerHTML = `
        <button class="arrow-btn" id="prevBtn" aria-label="Previous">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button class="arrow-btn" id="nextBtn" aria-label="Next">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
    `;
    sliderContainer.appendChild(arrowsContainer);

    // Arrow Event Listeners
    document.getElementById("prevBtn").addEventListener("click", (e) => { e.preventDefault(); prevSlide(); });
    document.getElementById("nextBtn").addEventListener("click", (e) => { e.preventDefault(); nextSlide(); });

    startSlideShow();
}

function goToSlide(index) {
    const slides = document.querySelectorAll(".slide");
    const dots = document.querySelectorAll(".dot");
    if (slides.length === 0) return;

    slides[currentSlide].classList.remove("active");
    dots[currentSlide].classList.remove("active");

    currentSlide = (index + slides.length) % slides.length; // Loop

    slides[currentSlide].classList.add("active");
    dots[currentSlide].classList.add("active");

    resetSlideTimer();
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

function startSlideShow() {
    slideInterval = setInterval(nextSlide, 5000); // Har 5 sec me change hoga
}

function resetSlideTimer() {
    clearInterval(slideInterval);
    startSlideShow();
}

// ============================================================
// ---------- 9. Live Suggestions Renderer ----------
// ============================================================
function renderSuggestions(term) {
    liveSuggestions.innerHTML = "";
    liveSuggestions.style.display = "block"; 

    let filtered = [];

    // Agar search khali hai, toh "Trending Now" dikhao
    if (!term) {
        liveSuggestions.innerHTML = `<div class="suggestion-title">Trending Now</div>`;
        filtered = allAnime.slice(0, 5); // Top 5
    } else {
        // Agar user ne kuch type kiya hai, toh filter karo
        filtered = allAnime.filter((a) => {
            const t = (a.title || "").toLowerCase();
            const g = Array.isArray(a.genres) ? a.genres.join(" ").toLowerCase() : String(a.genres || "").toLowerCase();
            return t.includes(term) || g.includes(term);
        }).slice(0, 10); // Max 10 results
    }

    // Agar type kiya hua kuch nahi mila
    if (filtered.length === 0 && term) {
        liveSuggestions.innerHTML = `<p class="empty-msg">No results found for "${escapeHTML(term)}"</p>`;
        return;
    }

    // Results render karo
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
            // RELATIVE PATH (No leading slash) -> Fix for GitHub Pages
            window.location.href = `anime.html?id=${safeId}`;
        });

        liveSuggestions.appendChild(div);
    });
}

// ---------- 10. Firestore Loader ----------
async function loadAnime() {
    try {
        const q = query(collection(db, "anime"), orderBy("createdAt", "desc"), limit(60));
        const snap = await getDocs(q);

        allAnime = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
        // Agar database khali hai, toh demo data load karo
        if(allAnime.length === 0) {
            allAnime = demoData;
        }

    } catch (err) {
        console.error("Firestore error:", err);
        // Agar error aata hai, tab bhi demo data load karo
        allAnime = demoData; 
    } finally {
        // Data ready hone ke baad Main Grid aur Hero Slider dono render karo
        renderList(allAnime);
        renderHeroSlider(allAnime);
    }
}

// ---------- 11. Search Panel Logic ----------
function openSearch() {
    searchOverlay.classList.add("active");
    searchInput.focus();
    document.body.style.overflow = "hidden";
    
    // Search khulte hi "Trending Now" load karo (khali string pass karke)
    renderSuggestions(""); 
}

function closeSearch() {
    searchOverlay.classList.remove("active");
    searchInput.value = "";
    liveSuggestions.style.display = "none"; 
    liveSuggestions.innerHTML = "";
    document.body.style.overflow = "";
}

// Event Listeners
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

// ---------- 12. Boot ----------
loadAnime();
