/* ============================================================
   ANIME MAX ZONE — Watchlist Logic
   ============================================================ */

// ---------- 1. DOM References ----------
const grid = document.getElementById("watchlistGrid");
const emptyState = document.getElementById("emptyWatchlist");

// ---------- 2. Security & Helpers ----------
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

// ---------- 3. Card Renderer ----------
function renderCard(anime) {
    const title = escapeHTML(anime.title || "Untitled");
    const genres = Array.isArray(anime.genres) 
        ? anime.genres.map(escapeHTML).join(", ") 
        : escapeHTML(anime.genres || "");
    
    const poster = safeImageUrl(anime.coverImageUrl) || FALLBACK_POSTER;
    const safeId = encodeURIComponent(anime.id || "");

    const card = document.createElement("article");
    card.className = "anime-card";
    
    // Note: 'position: relative' anime-card me pehle se hota hai, 
    // jisse remove button top-right me set ho pata hai.
    card.innerHTML = `
        <div class="poster" onclick="window.location.href='/anime.html?id=${safeId}'" style="cursor:pointer;">
            <img src="${poster}" alt="${title} poster" loading="lazy" onerror="this.src='${FALLBACK_POSTER}'" />
        </div>
        <div class="info" onclick="window.location.href='/anime.html?id=${safeId}'" style="cursor:pointer;">
            <h3 title="${title}">${title}</h3>
            <p class="genres">${genres || "&nbsp;"}</p>
        </div>
        
        <!-- Remove Button (CSS class use kar rahe hain) -->
        <button class="remove-btn" data-id="${safeId}" aria-label="Remove from watchlist">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    `;

    // Remove Button Event Listener
    const removeBtn = card.querySelector(".remove-btn");
    removeBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Card ke click event ko rokne ke liye
        removeFromWatchlist(anime.id);
    });

    return card;
}

// ---------- 4. Remove Function ----------
function removeFromWatchlist(id) {
    // LocalStorage se data uthao
    let watchlist = JSON.parse(localStorage.getItem("animeWatchlist")) || [];
    
    // Us specific ID ko filter out karo
    watchlist = watchlist.filter(item => item.id !== id);
    
    // Wapas save karo
    localStorage.setItem("animeWatchlist", JSON.stringify(watchlist));
    
    // UI ko dobara load karo
    loadWatchlist();
}

// ---------- 5. Load & Render Function ----------
function loadWatchlist() {
    let watchlist = JSON.parse(localStorage.getItem("animeWatchlist")) || [];

    grid.innerHTML = ""; // Purana data clear karo

    // Agar watchlist khali hai
    if (watchlist.length === 0) {
        emptyState.style.display = "flex"; // .empty-watchlist flex hai
        grid.style.display = "none";
        return;
    }

    // Agar data hai
    emptyState.style.display = "none";
    grid.style.display = "grid";

    // Grid render karo
    const frag = document.createDocumentFragment();
    watchlist.forEach(anime => {
        frag.appendChild(renderCard(anime));
    });
    grid.appendChild(frag);
}

// ---------- 6. Boot ----------
loadWatchlist();
