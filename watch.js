/* ============================================================
   ANIME MAX ZONE — Watch Page Logic
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// ============================================================
// 1. DOM Elements
// ============================================================
const playerLoading = document.getElementById("playerLoading");
const nativePlayerContainer = document.getElementById("nativePlayerContainer");
const iframePlayerContainer = document.getElementById("iframePlayerContainer");
const videoIframe = document.getElementById("videoIframe");
const videoPlayer = document.getElementById("videoPlayer");
const videoSpinnerOverlay = document.getElementById("videoSpinnerOverlay");

const watchInfo = document.getElementById("watchInfo");
const errorMessage = document.getElementById("errorMessage");
const episodeTitleEl = document.getElementById("episodeTitle");
const animeLink = document.getElementById("animeLink");

const seasonBtn = document.getElementById("seasonBtn");
const episodeBtn = document.getElementById("episodeBtn");
const seasonEpisodeWrapper = document.getElementById("seasonEpisodeWrapper");
const currentSeasonText = document.getElementById("currentSeasonText");
const currentEpisodeText = document.getElementById("currentEpisodeText");

const bottomSheetOverlay = document.getElementById("bottomSheetOverlay");
const bottomSheet = document.getElementById("bottomSheet");
const sheetTitle = document.getElementById("sheetTitle");
const sheetContent = document.getElementById("sheetContent");
const closeSheetBtn = document.getElementById("closeSheetBtn");

const relatedSection = document.getElementById("relatedSection");
const relatedGrid = document.getElementById("relatedGrid");

const openSearchBtn = document.getElementById("openSearchBtn");
const navSearchBtn = document.getElementById("navSearchBtn");
const closeSearchBtn = document.getElementById("closeSearchBtn");
const searchOverlay = document.getElementById("searchOverlay");
const searchInput = document.getElementById("searchInput");
const liveSuggestions = document.getElementById("liveSuggestions");

let allAnimeForSearch = []; 
let player = null; 

// Demo Data (Fallback)
const demoData = [
    { id: '1', title: 'Demon Slayer', genres: ['Action', 'Fantasy'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', type: 'series', totalEpisodes: 12, totalSeasons: 2 },
    { id: '2', title: 'Jujutsu Kaisen', genres: ['Action', 'Supernatural'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', type: 'series', totalEpisodes: 24, totalSeasons: 2 },
    { id: '3', title: 'One Piece', genres: ['Action', 'Adventure'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg', type: 'series', totalEpisodes: 1000, totalSeasons: 20 },
    { id: '4', title: 'Attack on Titan', genres: ['Action', 'Drama'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg', type: 'series', totalEpisodes: 25, totalSeasons: 4 },
    { id: '5', title: 'Naruto', genres: ['Action', 'Adventure'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg', type: 'series', totalEpisodes: 220, totalSeasons: 5 },
    { id: '6', title: 'Your Name', genres: ['Romance', 'Drama'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/5/87048.jpg', type: 'movie', totalEpisodes: 1 }
];

// Working Video & Subtitle URLs for testing
const DUMMY_VIDEO_1080 = "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4";
const DEMO_SUBTITLE_EN = "https://rawcdn.githack.com/sadevID/vidJS/f23e769a20d5e06f59afe4ab2f3bbfd154939838/View_From_A_Blue_Moon_Trailer-HD.id.vtt";

// Helper Functions
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
// 2. SEARCH LOGIC
// ============================================================
async function fetchAnimeForSearch() {
    try {
        const q = query(collection(db, "anime"), orderBy("createdAt", "desc"), limit(60));
        const snap = await getDocs(q);
        allAnimeForSearch = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if(allAnimeForSearch.length === 0) allAnimeForSearch = demoData;
    } catch (err) {
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
if(searchOverlay) searchOverlay.addEventListener("click", (e) => { if (e.target === searchOverlay) closeSearch(); });

document.addEventListener("keydown", (e) => { 
    if (e.key === "Escape" && searchOverlay.classList.contains("active")) closeSearch(); 
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
// 3. BOTTOM SHEET LOGIC (Scroll Down to Dismiss)
// ============================================================
function openBottomSheet() {
    bottomSheetOverlay.classList.add("active");
    document.body.style.overflow = "hidden"; 
}

function closeBottomSheet() {
    bottomSheetOverlay.classList.remove("active");
    document.body.style.overflow = ""; 
}

if(closeSheetBtn) closeSheetBtn.addEventListener("click", closeBottomSheet);
if(bottomSheetOverlay) {
    bottomSheetOverlay.addEventListener("click", (e) => {
        if (e.target === bottomSheetOverlay) closeBottomSheet();
    });
}

// Touch & Wheel logic to close Bottom Sheet
if (sheetContent) {
    let touchStartY = 0;
    
    sheetContent.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    sheetContent.addEventListener('touchmove', (e) => {
        let touchEndY = e.touches[0].clientY;
        if (touchEndY - touchStartY > 50) { 
            closeBottomSheet();
        }
    }, { passive: true });

    sheetContent.addEventListener('wheel', (e) => {
        if (e.deltaY > 30) { 
            closeBottomSheet();
        }
    });
}

// ============================================================
// 4. WATCH PAGE LOGIC
// ============================================================
async function loadWatchPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('animeId');
    const episodeNum = urlParams.get('ep') || 1;
    const seasonNum = urlParams.get('season') || 1;

    if (!animeId) { showError(); return; }

    let animeData = null;
    try {
        const docRef = doc(db, "anime", animeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            animeData = { id: docSnap.id, ...docSnap.data() };
        } else {
            animeData = demoData.find(a => a.id === animeId);
        }
    } catch (err) {
        animeData = demoData.find(a => a.id === animeId);
    }

    if (!animeData) { showError(); return; }
    renderPlayer(animeData, episodeNum, seasonNum);
}

function renderPlayer(anime, epNum, seasonNum) {
    playerLoading.style.display = "none";
    watchInfo.style.display = "block";

    const title = escapeHTML(anime.title || "Unknown Anime");
    document.title = `${title} - Episode ${epNum} — Anime Max Zone`;
    animeLink.textContent = title;
    animeLink.href = `anime.html?id=${anime.id}`; 
    
    // Video Sources
    const videoSources = [
        { src: anime.videoUrl || DUMMY_VIDEO_1080, type: "video/mp4", size: 1080, label: "1080p HD" },
        { src: anime.videoUrl || DUMMY_VIDEO_1080, type: "video/mp4", size: 720, label: "720p" },
        { src: anime.videoUrl || DUMMY_VIDEO_1080, type: "video/mp4", size: 480, label: "480p" }
    ];

    // Subtitles
    const subtitles = [
        { src: DEMO_SUBTITLE_EN, label: "English", srclang: "en", default: true }
    ];

    // Check for Google Drive Link
    if (videoSources[0].src.includes("drive.google.com")) {
        nativePlayerContainer.style.display = "none";
        iframePlayerContainer.style.display = "block";

        let fileId = "";
        const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/;
        const match = videoSources[0].src.match(driveRegex);
        if (match && match[1]) fileId = match[1];

        videoIframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
    } else {
        // Native Plyr Player
        iframePlayerContainer.style.display = "none";
        nativePlayerContainer.style.display = "block";

        videoPlayer.innerHTML = "";
        
        videoSources.forEach(sourceData => {
            const source = document.createElement("source");
            source.src = sourceData.src;
            source.type = sourceData.type;
            source.size = sourceData.size;
            source.title = sourceData.label;
            videoPlayer.appendChild(source);
        });

        subtitles.forEach(sub => {
            const track = document.createElement("track");
            track.kind = "captions";
            track.label = sub.label;
            track.srclang = sub.srclang;
            track.src = sub.src;
            if (sub.default) track.default = true;
            videoPlayer.appendChild(track);
        });

        videoPlayer.poster = anime.coverImageUrl || "";
        videoPlayer.load(); // Force reload

        // Hide Spinner on load or error
        videoPlayer.onloadeddata = () => {
            if (videoSpinnerOverlay) videoSpinnerOverlay.classList.add("hidden");
        };
        videoPlayer.onerror = () => {
            if (videoSpinnerOverlay) videoSpinnerOverlay.classList.add("hidden");
        };

        // Initialize Plyr
        try {
            if (typeof Plyr !== 'undefined') {
                if (!player) {
                    player = new Plyr(videoPlayer, {
                        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
                        settings: ['captions', 'quality', 'speed', 'loop']
                    });

                    player.on('ready', () => {
                        if (videoSpinnerOverlay) videoSpinnerOverlay.classList.add("hidden");
                    });
                } else {
                    player.source = {
                        type: 'video',
                        sources: videoSources,
                        tracks: subtitles
                    };
                }
            } else {
                // Fallback if Plyr CDN fails
                videoPlayer.setAttribute("controls", "true");
                if (videoSpinnerOverlay) videoSpinnerOverlay.classList.add("hidden");
            }
        } catch (error) {
            console.error("Plyr error:", error);
            videoPlayer.setAttribute("controls", "true"); 
            if (videoSpinnerOverlay) videoSpinnerOverlay.classList.add("hidden");
        }
    }

    // Season & Episode UI Logic
    const isMovie = anime.type === "movie" || (anime.totalEpisodes === 1 && !anime.totalSeasons);
    
    if (isMovie) {
        seasonEpisodeWrapper.style.display = "none";
        episodeTitleEl.style.display = "none";
        document.querySelector('.separator').style.display = "none";
    } else {
        seasonEpisodeWrapper.style.display = "flex";
        episodeTitleEl.style.display = "inline";
        document.querySelector('.separator').style.display = "inline";
        
        episodeTitleEl.textContent = `Episode ${epNum}`;
        currentEpisodeText.textContent = `Episode ${epNum}`;
        currentSeasonText.textContent = `Season ${seasonNum}`;

        // Episode Button Click
        episodeBtn.onclick = () => {
            sheetTitle.textContent = "Select Episode";
            let epsHTML = `<div class="sheet-grid">`;
            const totalEps = anime.totalEpisodes || 12;
            
            for (let i = 1; i <= totalEps; i++) {
                const activeClass = (i === parseInt(epNum)) ? "active" : "";
                epsHTML += `<div class="sheet-item ${activeClass}" data-ep="${i}">${i}</div>`;
            }
            epsHTML += `</div>`;
            sheetContent.innerHTML = epsHTML;
            
            document.querySelectorAll(".sheet-item").forEach(item => {
                item.onclick = () => {
                    const selectedEp = item.getAttribute("data-ep");
                    window.location.href = `watch.html?animeId=${anime.id}&season=${seasonNum}&ep=${selectedEp}`;
                }
            });
            openBottomSheet();
        };

        // Season Button Click
        seasonBtn.onclick = () => {
            sheetTitle.textContent = "Select Season";
            const totalSeasons = anime.totalSeasons || 1; 
            let seasonsHTML = `<div class="sheet-grid">`;
            
            for (let i = 1; i <= totalSeasons; i++) {
                const activeClass = (i === parseInt(seasonNum)) ? "active" : "";
                seasonsHTML += `<div class="sheet-item ${activeClass}" data-season="${i}">S${i}</div>`;
            }
            seasonsHTML += `</div>`;
            sheetContent.innerHTML = seasonsHTML;

            document.querySelectorAll(".sheet-item").forEach(item => {
                item.onclick = () => {
                    const selectedSeason = item.getAttribute("data-season");
                    window.location.href = `watch.html?animeId=${anime.id}&season=${selectedSeason}&ep=1`;
                }
            });
            openBottomSheet();
        };
    }

    renderRelatedAnime(anime.id);
}

function renderRelatedAnime(currentAnimeId) {
    let allAnimeList = allAnimeForSearch.length > 0 ? allAnimeForSearch : demoData;
    const relatedAnime = allAnimeList.filter(a => a.id !== currentAnimeId).slice(0, 6);

    if (relatedAnime.length === 0) {
        relatedSection.style.display = "none";
        return;
    }

    relatedSection.style.display = "block";
    relatedGrid.innerHTML = "";

    const frag = document.createDocumentFragment();
    
    relatedAnime.forEach(anime => {
        const title = escapeHTML(anime.title || "Untitled");
        const poster = safeImageUrl(anime.coverImageUrl) || FALLBACK_POSTER;
        const safeId = encodeURIComponent(anime.id || "");
        const genres = Array.isArray(anime.genres) ? anime.genres.map(escapeHTML).join(", ") : escapeHTML(anime.genres || "");
        
        const status = (anime.status || "").toLowerCase();
        const statusClass = status === "ongoing" ? "badge status-ongoing" : status === "completed" ? "badge status-completed" : "badge";
        const statusLabel = escapeHTML(anime.status || "");

        const card = document.createElement("article");
        card.className = "anime-card";
        
        card.innerHTML = `
            <div class="poster" onclick="window.location.href='anime.html?id=${safeId}'" style="cursor:pointer;">
                ${statusLabel ? `<span class="${statusClass}">${statusLabel}</span>` : ""}
                <img src="${poster}" alt="${title} poster" loading="lazy" onerror="this.src='${FALLBACK_POSTER}'" />
            </div>
            <div class="info" onclick="window.location.href='anime.html?id=${safeId}'" style="cursor:pointer;">
                <h3 title="${title}">${title}</h3>
                <p class="genres">${genres || "&nbsp;"}</p>
            </div>
        `;
        
        frag.appendChild(card);
    });

    relatedGrid.appendChild(frag);
}

function showError() {
    playerLoading.style.display = "none";
    nativePlayerContainer.style.display = "none";
    iframePlayerContainer.style.display = "none";
    watchInfo.style.display = "none";
    relatedSection.style.display = "none";
    errorMessage.style.display = "block";
    document.title = "Not Found — Anime Max Zone";
}

// Boot
fetchAnimeForSearch(); 
loadWatchPage();
