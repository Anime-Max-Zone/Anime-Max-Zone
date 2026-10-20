/* ============================================================
   ANIME MAX ZONE — Custom Video Controller Logic
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
const video = document.getElementById("videoPlayer");
const nativePlayerContainer = document.getElementById("nativePlayerContainer");
const iframePlayerContainer = document.getElementById("iframePlayerContainer");
const videoIframe = document.getElementById("videoIframe");

// Custom UI Elements
const customVideoUI = document.getElementById("customVideoUI");
const centerPlayBtn = document.getElementById("centerPlayBtn");
const customPlayBtn = document.getElementById("customPlayBtn");
const customPlayIcon = document.getElementById("customPlayIcon");
const customProgressBar = document.getElementById("customProgressBar");
const customCurrentTime = document.getElementById("customCurrentTime");
const customDuration = document.getElementById("customDuration");
const customMuteBtn = document.getElementById("customMuteBtn");
const customMuteIcon = document.getElementById("customMuteIcon");
const customSettingsBtn = document.getElementById("customSettingsBtn");
const customFullScreenBtn = document.getElementById("customFullScreenBtn");
const customFullScreenIcon = document.getElementById("customFullScreenIcon");

// Bottom Sheets
const settingsSheetOverlay = document.getElementById("settingsSheetOverlay");
const settingsContent = document.getElementById("settingsContent");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");

const bottomSheetOverlay = document.getElementById("bottomSheetOverlay");
const bottomSheet = document.getElementById("bottomSheet");
const sheetTitle = document.getElementById("sheetTitle");
const sheetContent = document.getElementById("sheetContent");
const closeSheetBtn = document.getElementById("closeSheetBtn");

// Page Elements
const watchInfo = document.getElementById("watchInfo");
const errorMessage = document.getElementById("errorMessage");
const episodeTitleEl = document.getElementById("episodeTitle");
const animeLink = document.getElementById("animeLink");
const seasonEpisodeWrapper = document.getElementById("seasonEpisodeWrapper");
const currentSeasonText = document.getElementById("currentSeasonText");
const currentEpisodeText = document.getElementById("currentEpisodeText");
const seasonBtn = document.getElementById("seasonBtn");
const episodeBtn = document.getElementById("episodeBtn");
const relatedSection = document.getElementById("relatedSection");
const relatedGrid = document.getElementById("relatedGrid");

let player = null;
let allAnimeForSearch = [];

// Demo Data
const demoData = [
    { id: '1', title: 'Demon Slayer', genres: ['Action', 'Fantasy'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', type: 'series', totalEpisodes: 12, totalSeasons: 2 },
    { id: '2', title: 'Jujutsu Kaisen', genres: ['Action', 'Supernatural'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', type: 'series', totalEpisodes: 24, totalSeasons: 2 },
    { id: '5', title: 'Naruto', genres: ['Action', 'Adventure'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg', type: 'series', totalEpisodes: 220, totalSeasons: 5 }
];

// --- 1. CUSTOM PLAYER LOGIC ---
function initVideoPlayer(videoSources, subtitles) {
    if (player) {
        player.destroy();
    }

    video.innerHTML = "";
    videoSources.forEach(src => {
        const source = document.createElement("source");
        source.src = src.src;
        source.type = src.type;
        source.size = src.size;
        source.title = src.label;
        video.appendChild(source);
    });

    subtitles.forEach(sub => {
        const track = document.createElement("track");
        track.kind = "captions";
        track.label = sub.label;
        track.srclang = sub.srclang;
        track.src = sub.src;
        if (sub.default) track.default = true;
        video.appendChild(track);
    });

    // Plyr Engine (No Default Controls)
    player = new Plyr(video, {
        controls: [], 
        settings: ['captions', 'quality', 'speed']
    });

    // --- Attach Custom Controls ---
    centerPlayBtn.addEventListener("click", () => player.togglePlay());
    customPlayBtn.addEventListener("click", () => player.togglePlay());

    player.on("play", () => {
        customPlayIcon.innerHTML = `<path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
        centerPlayBtn.style.display = "none";
    });
    
    player.on("pause", () => {
        customPlayIcon.innerHTML = `<path fill="currentColor" d="M8 5v14l11-7z"/>`;
        centerPlayBtn.style.display = "flex";
    });

    player.on("timeupdate", () => {
        const percent = (player.currentTime / player.duration) * 100;
        customProgressBar.value = percent || 0;
        customCurrentTime.textContent = formatTime(player.currentTime);
        if(player.duration) customDuration.textContent = formatTime(player.duration);
    });

    customProgressBar.addEventListener("input", () => {
        player.currentTime = player.duration * (customProgressBar.value / 100);
    });

    customMuteBtn.addEventListener("click", () => player.muted = !player.muted);
    player.on("volumechange", () => {
        if (player.muted || player.volume === 0) {
            customMuteIcon.innerHTML = `<path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>`;
        } else {
            customMuteIcon.innerHTML = `<path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
        }
    });

    customFullScreenBtn.addEventListener("click", () => player.fullscreen.toggle());
    player.on("enterfullscreen", () => customFullScreenIcon.innerHTML = `<path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>`);
    player.on("exitfullscreen", () => customFullScreenIcon.innerHTML = `<path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>`);

    // Settings Bottom Sheet
    customSettingsBtn.addEventListener("click", () => {
        let html = `<div class="settings-group"><h4>Quality</h4><div class="settings-options">`;
        if (player.quality && player.quality.options) {
            player.quality.options.forEach(q => {
                let active = player.quality === q ? "active" : "";
                html += `<button class="settings-btn ${active}" onclick="player.quality = ${q}; document.getElementById('settingsSheetOverlay').classList.remove('active');">${q}p</button>`;
            });
        } else {
            html += `<button class="settings-btn active">Auto</button>`;
        }
        html += `</div></div>`;

        html += `<div class="settings-group"><h4>Subtitles</h4><div class="settings-options">`;
        html += `<button class="settings-btn" onclick="toggleSubs(-1); document.getElementById('settingsSheetOverlay').classList.remove('active');">Off</button>`;
        for (let i = 0; i < video.textTracks.length; i++) {
            let active = video.textTracks[i].mode === 'showing' ? 'active' : '';
            html += `<button class="settings-btn ${active}" onclick="toggleSubs(${i}); document.getElementById('settingsSheetOverlay').classList.remove('active');">${video.textTracks[i].label}</button>`;
        }
        html += `</div></div>`;

        settingsContent.innerHTML = html;
        settingsSheetOverlay.classList.add("active");
    });

    // Double Tap Seek
    let lastTap = 0;
    nativePlayerContainer.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault(); 
            const rect = nativePlayerContainer.getBoundingClientRect();
            const tapX = e.changedTouches[0].clientX - rect.left;
            if (tapX < rect.width / 2) {
                player.currentTime -= 10; showSeekAnimation("backward");
            } else {
                player.currentTime += 10; showSeekAnimation("forward");
            }
        }
        lastTap = currentTime;
    });
}

window.toggleSubs = (index) => {
    for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = (i === index) ? 'showing' : 'hidden';
    }
};

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    let m = Math.floor(seconds / 60);
    let s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function showSeekAnimation(direction) {
    const existing = document.querySelector('.seek-overlay');
    if (existing) existing.remove();
    let overlay = document.createElement("div");
    overlay.className = `seek-overlay ${direction === "forward" ? "right" : "left"}`;
    let svgIcon = direction === "forward" ? `<svg viewBox="0 0 24 24" fill="white"><path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>` : `<svg viewBox="0 0 24 24" fill="white"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/></svg>`;
    overlay.innerHTML = `${svgIcon} <span>10s</span>`;
    nativePlayerContainer.appendChild(overlay);
    setTimeout(() => overlay.classList.add("show"), 10);
    setTimeout(() => { overlay.classList.remove("show"); setTimeout(() => overlay.remove(), 300); }, 600);
}

// --- 2. OTHER LOGIC (Search, Episode Sheet, Data Fetch) ---
closeSettingsBtn.addEventListener("click", () => settingsSheetOverlay.classList.remove("active"));
settingsSheetOverlay.addEventListener("click", (e) => { if (e.target === settingsSheetOverlay) settingsSheetOverlay.classList.remove("active"); });
closeSheetBtn.addEventListener("click", () => bottomSheetOverlay.classList.remove("active"));
bottomSheetOverlay.addEventListener("click", (e) => { if (e.target === bottomSheetOverlay) bottomSheetOverlay.classList.remove("active"); });

async function fetchAnimeData() {
    try {
        const q = query(collection(db, "anime"), orderBy("createdAt", "desc"), limit(60));
        const snap = await getDocs(q);
        allAnimeForSearch = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if(allAnimeForSearch.length === 0) allAnimeForSearch = demoData;
    } catch (err) {
        allAnimeForSearch = demoData;
    }
}

async function loadWatchPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('animeId');
    const epNum = urlParams.get('ep') || 1;
    const seasonNum = urlParams.get('season') || 1;

    if (!animeId) { showError(); return; }

    let animeData = null;
    try {
        const docRef = doc(db, "anime", animeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) animeData = { id: docSnap.id, ...docSnap.data() };
        else animeData = demoData.find(a => a.id === animeId);
    } catch (err) {
        animeData = demoData.find(a => a.id === animeId);
    }

    if (!animeData) { showError(); return; }

    // Setup UI
    watchInfo.style.display = "block";
    document.title = `${animeData.title} - Episode ${epNum} — Anime Max Zone`;
    animeLink.textContent = animeData.title;
    animeLink.href = `anime.html?id=${animeData.id}`;
    
    // Video Sources
    const videoUrl = animeData.videoUrl || "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4";
    const videoSources = [
        { src: videoUrl, type: "video/mp4", size: 1080, label: "1080p HD" },
        { src: videoUrl, type: "video/mp4", size: 720, label: "720p" },
        { src: videoUrl, type: "video/mp4", size: 480, label: "480p" }
    ];
    const subtitles = [
        { src: "https://rawcdn.githack.com/sadevID/vidJS/f23e769a20d5e06f59afe4ab2f3bbfd154939838/View_From_A_Blue_Moon_Trailer-HD.id.vtt", label: "English", srclang: "en", default: true }
    ];

    if (videoUrl.includes("drive.google.com")) {
        nativePlayerContainer.style.display = "none";
        iframePlayerContainer.style.display = "block";
        let fileId = "";
        const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/;
        const match = videoUrl.match(driveRegex);
        if (match && match[1]) fileId = match[1];
        videoIframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
    } else {
        iframePlayerContainer.style.display = "none";
        nativePlayerContainer.style.display = "block";
        initVideoPlayer(videoSources, subtitles);
    }

    // Episodes UI
    const isMovie = animeData.type === "movie" || (animeData.totalEpisodes === 1 && !animeData.totalSeasons);
    if (isMovie) {
        seasonEpisodeWrapper.style.display = "none";
        episodeTitleEl.style.display = "none";
        document.querySelector('.separator').style.display = "none";
    } else {
        seasonEpisodeWrapper.style.display = "flex";
        episodeTitleEl.textContent = `Episode ${epNum}`;
        currentEpisodeText.textContent = `Episode ${epNum}`;
        currentSeasonText.textContent = `Season ${seasonNum}`;

        episodeBtn.onclick = () => {
            sheetTitle.textContent = "Select Episode";
            let epsHTML = `<div class="sheet-grid">`;
            const totalEps = animeData.totalEpisodes || 12;
            for (let i = 1; i <= totalEps; i++) {
                const activeClass = (i === parseInt(epNum)) ? "active" : "";
                epsHTML += `<div class="sheet-item ${activeClass}" data-ep="${i}">${i}</div>`;
            }
            epsHTML += `</div>`;
            sheetContent.innerHTML = epsHTML;
            document.querySelectorAll(".sheet-item").forEach(item => {
                item.onclick = () => { window.location.href = `watch.html?animeId=${animeData.id}&season=${seasonNum}&ep=${item.getAttribute("data-ep")}`; }
            });
            bottomSheetOverlay.classList.add("active");
        };

        seasonBtn.onclick = () => {
            sheetTitle.textContent = "Select Season";
            const totalSeasons = animeData.totalSeasons || 1; 
            let seasonsHTML = `<div class="sheet-grid">`;
            for (let i = 1; i <= totalSeasons; i++) {
                const activeClass = (i === parseInt(seasonNum)) ? "active" : "";
                seasonsHTML += `<div class="sheet-item ${activeClass}" data-season="${i}">S${i}</div>`;
            }
            seasonsHTML += `</div>`;
            sheetContent.innerHTML = seasonsHTML;
            document.querySelectorAll(".sheet-item").forEach(item => {
                item.onclick = () => { window.location.href = `watch.html?animeId=${animeData.id}&season=${item.getAttribute("data-season")}&ep=1`; }
            });
            bottomSheetOverlay.classList.add("active");
        };
    }

    renderRelatedAnime(animeData.id);
}

function renderRelatedAnime(currentAnimeId) {
    let list = allAnimeForSearch.length > 0 ? allAnimeForSearch : demoData;
    const related = list.filter(a => a.id !== currentAnimeId).slice(0, 6);
    if (related.length === 0) return;

    relatedSection.style.display = "block";
    relatedGrid.innerHTML = "";
    const frag = document.createDocumentFragment();
    
    related.forEach(anime => {
        const card = document.createElement("article");
        card.className = "anime-card";
        card.innerHTML = `
            <div class="poster" onclick="window.location.href='anime.html?id=${anime.id}'" style="cursor:pointer;">
                <img src="${anime.coverImageUrl || ''}" alt="${anime.title}" loading="lazy" />
            </div>
            <div class="info" onclick="window.location.href='anime.html?id=${anime.id}'" style="cursor:pointer;">
                <h3>${anime.title}</h3>
                <p class="genres">${Array.isArray(anime.genres) ? anime.genres.join(", ") : ""}</p>
            </div>
        `;
        frag.appendChild(card);
    });
    relatedGrid.appendChild(frag);
}

function showError() {
    watchInfo.style.display = "none";
    nativePlayerContainer.style.display = "none";
    iframePlayerContainer.style.display = "none";
    errorMessage.style.display = "block";
}

// Boot
fetchAnimeData(); 
loadWatchPage();
