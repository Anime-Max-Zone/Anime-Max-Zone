/* ============================================================
   ANIME MAX ZONE — Watch Page & Search Logic
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

// DOM Elements
const playerLoading = document.getElementById("playerLoading");
const nativePlayerContainer = document.getElementById("nativePlayerContainer");
const gdrivePlayerContainer = document.getElementById("gdrivePlayerContainer");
const gdriveIframe = document.getElementById("gdriveIframe");
const videoPlayer = document.getElementById("videoPlayer");

const watchInfo = document.getElementById("watchInfo");
const errorMessage = document.getElementById("errorMessage");
const episodeTitleEl = document.getElementById("episodeTitle");
const animeLink = document.getElementById("animeLink");
const prevEpBtn = document.getElementById("prevEpBtn");
const nextEpBtn = document.getElementById("nextEpBtn");

// Search Overlay Elements
const openSearchBtn = document.getElementById("openSearchBtn");
const navSearchBtn = document.getElementById("navSearchBtn");
const closeSearchBtn = document.getElementById("closeSearchBtn");
const searchOverlay = document.getElementById("searchOverlay");
const searchInput = document.getElementById("searchInput");
const liveSuggestions = document.getElementById("liveSuggestions");

let allAnimeForSearch = []; 
let player = null; 

// Demo Data
const demoData = [
    { id: '1', title: 'Demon Slayer', genres: ['Action', 'Fantasy'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg' },
    { id: '2', title: 'Jujutsu Kaisen', genres: ['Action', 'Supernatural'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg' },
    { id: '3', title: 'One Piece', genres: ['Action', 'Adventure'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg' },
    { id: '4', title: 'Attack on Titan', genres: ['Action', 'Drama'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg' },
    { id: '5', title: 'Naruto', genres: ['Action', 'Adventure'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg' }
];

// Dummy Video Data
const DUMMY_VIDEO_1080 = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const DEMO_SUBTITLE_EN = "https://raw.githubusercontent.com/mozilla/vtt.js/master/tests/subtitles/subtitles.vtt";

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
// 1. SEARCH OVERLAY LOGIC
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
// 2. WATCH PAGE LOGIC
// ============================================================
async function loadWatchPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('animeId');
    const episodeNum = urlParams.get('ep') || 1;

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
    renderPlayer(animeData, episodeNum);
}

function renderPlayer(anime, epNum) {
    playerLoading.style.display = "none";
    watchInfo.style.display = "block";

    const title = escapeHTML(anime.title || "Unknown Anime");
    document.title = `${title} - Episode ${epNum} — Anime Max Zone`;
    animeLink.textContent = title;
    animeLink.href = `anime.html?id=${anime.id}`; 
    episodeTitleEl.textContent = `Episode ${epNum}`;

    // ---------------------------------------------
    // VIDEO SOURCES (Quality & Audio Tracks)
    // ---------------------------------------------
    // Yahan aap Firebase se aane wale alag-alag links map kar sakte hain.
    // Abhi ke liye humne ek hi video ka link 3 qualities me mock kiya hai.
    const videoSources = [
        { src: anime.videoUrl || DUMMY_VIDEO_1080, type: "video/mp4", size: 1080, label: "1080p HD" },
        { src: anime.videoUrl || DUMMY_VIDEO_1080, type: "video/mp4", size: 720, label: "720p" },
        { src: anime.videoUrl || DUMMY_VIDEO_1080, type: "video/mp4", size: 480, label: "480p" }
    ];

    // ---------------------------------------------
    // SUBTITLES & CAPTIONS
    // ---------------------------------------------
    const subtitles = [
        { src: DEMO_SUBTITLE_EN, label: "English", srclang: "en", default: true },
        // Agar future me Hindi subtitle add karna ho:
        // { src: "https://link-to-hindi.vtt", label: "Hindi", srclang: "hi", default: false }
    ];

    // Check for Google Drive
    if (videoSources[0].src.includes("drive.google.com")) {
        nativePlayerContainer.style.display = "none";
        gdrivePlayerContainer.style.display = "block";

        let fileId = "";
        const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/;
        const match = videoSources[0].src.match(driveRegex);
        if (match && match[1]) fileId = match[1];

        // GDrive default UI hides via CSS in watch.css
        gdriveIframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
        
    } else {
        // Native Player (Plyr)
        gdrivePlayerContainer.style.display = "none";
        nativePlayerContainer.style.display = "block";

        // Clear previous player content
        videoPlayer.innerHTML = "";
        
        // Add Video Sources dynamically for Quality Selection
        videoSources.forEach(sourceData => {
            const source = document.createElement("source");
            source.src = sourceData.src;
            source.type = sourceData.type;
            source.size = sourceData.size; // Yeh Plyr ko batata hai ki kaunsi quality hai
            source.title = sourceData.label;
            videoPlayer.appendChild(source);
        });

        // Add Subtitles dynamically
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

        // Initialize or Update Plyr
        if (!player) {
            player = new Plyr(videoPlayer, {
                controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
                settings: ['captions', 'quality', 'speed', 'loop']
            });
        } else {
            player.source = {
                type: 'video',
                sources: videoSources,
                tracks: subtitles
            };
        }
    }

    // ============================================
    // NEXT / PREVIOUS EPISODE BUTTONS LOGIC
    // ============================================
    const totalEpisodes = anime.totalEpisodes || 12; 
    let currentEp = parseInt(epNum);

    if (currentEp > 1) {
        prevEpBtn.disabled = false;
        prevEpBtn.onclick = () => { window.location.href = `watch.html?animeId=${anime.id}&ep=${currentEp - 1}`; };
    } else {
        prevEpBtn.disabled = true;
    }

    if (currentEp < totalEpisodes) {
        nextEpBtn.classList.remove("disabled");
        nextEpBtn.onclick = () => { window.location.href = `watch.html?animeId=${anime.id}&ep=${currentEp + 1}`; };
    } else {
        nextEpBtn.classList.add("disabled");
        nextEpBtn.onclick = null;
    }
}

function showError() {
    playerLoading.style.display = "none";
    nativePlayerContainer.style.display = "none";
    gdrivePlayerContainer.style.display = "none";
    watchInfo.style.display = "none";
    errorMessage.style.display = "block";
    document.title = "Not Found — Anime Max Zone";
}

// Boot
fetchAnimeForSearch(); 
loadWatchPage();
