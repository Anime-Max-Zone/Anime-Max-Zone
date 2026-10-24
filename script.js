// ============================================================
// ANIME MAX ZONE — SCRIPT.JS
// Firebase content, watch player, audio, subtitles, quality,
// search, grids, episode navigation and comments.
// ============================================================

// ================= 1. FIREBASE SETUP =================

const firebaseConfig = {
    apiKey: "AIzaSyCpfrluxsBhnz48ve9RykIy1IxzbBfk7dA",
    authDomain: "sm-studio-7.firebaseapp.com",
    databaseURL: "https://sm-studio-7-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sm-studio-7",
    storageBucket: "sm-studio-7.firebasestorage.app",
    messagingSenderId: "126291501472",
    appId: "1:126291501472:web:47386660af8ec3a57204c5",
    measurementId: "G-4X9Q0761SB"
};

let database = null;

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    database = firebase.database();
    console.log("Anime Max Zone: Firebase connected.");
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

let allContentDatabase = [];

let currentAudio = null;
let currentQuality = null;
let activeSubtitleUrl = null;


// ================= 2. SHARED HELPERS =================

function getElement(id) {
    return document.getElementById(id);
}

function safeText(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function getDriveFileId(url) {
    if (typeof url !== "string") return null;

    const patterns = [
        /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
        /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
        /[?&]id=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

function normalizeMediaUrl(url) {
    if (typeof url !== "string" || !url.trim()) return "";

    const value = url.trim();

    // Do not assume every Drive URL can be converted into an API URL.
    // A normal shared Drive URL may require authentication, API access,
    // permissions or additional configuration to stream.
    return value;
}

function showNoDataFound() {
    [
        "latestContainer",
        "onAirContainer",
        "newArrivalsContainer",
        "animeGrid",
        "movieGrid"
    ].forEach(id => {
        const element = getElement(id);

        if (element) {
            element.innerHTML =
                '<p style="color:#888;padding:20px;width:100%;text-align:center;">No Content Available.</p>';
        }
    });
}


// ================= 3. INITIAL DATA LOAD =================

document.addEventListener("DOMContentLoaded", () => {
    const splashScreen = getElement("splash-screen");

    if (splashScreen) {
        setTimeout(() => splashScreen.classList.add("hidden"), 2000);
    }

    if (!database) return;

    database.ref("content").once("value")
        .then(snapshot => {
            const data = snapshot.val();

            if (!data) {
                allContentDatabase = [];
                showNoDataFound();
                return;
            }

            allContentDatabase = Object.entries(data).map(([key, value]) => ({
                firebaseKey: key,
                ...value
            }));

            loadHomePageData();
            initSearchAndGrids();
        })
        .catch(error => {
            console.error("Firebase content fetch failed:", error);
            showNoDataFound();
        });
});


// ================= 4. HOME PAGE =================

function loadHomePageData() {
    const latestContainer = getElement("latestContainer");
    const onAirContainer = getElement("onAirContainer");
    const newArrivalsContainer = getElement("newArrivalsContainer");

    if (!latestContainer || !onAirContainer || !newArrivalsContainer) {
        return;
    }

    latestContainer.innerHTML = "";
    onAirContainer.innerHTML = "";
    newArrivalsContainer.innerHTML = "";

    const latestAnime = allContentDatabase.slice(0, 3);
    const onAirAnime = allContentDatabase.slice(3, 6);
    const newArrivals = allContentDatabase.slice(6, 10);

    function createCard(item) {
        const card = document.createElement("a");
        card.href = `anime-details.html?id=${encodeURIComponent(item.firebaseKey)}`;
        card.className = "anime-card";

        const image = document.createElement("img");
        image.src = item.image || "";
        image.alt = safeText(item.title, "Anime");
        image.onerror = () => {
            image.onerror = null;
            image.src = "https://placehold.co/130x190?text=No+Image";
        };

        card.appendChild(image);
        return card;
    }

    latestAnime.forEach(item => latestContainer.appendChild(createCard(item)));
    onAirAnime.forEach(item => onAirContainer.appendChild(createCard(item)));
    newArrivals.forEach(item => newArrivalsContainer.appendChild(createCard(item)));
}


// ================= 5. SEARCH AND GRIDS =================

function initSearchAndGrids() {
    const searchPanel = getElement("searchPanel");
    const openSearchBtn = getElement("openSearchBtn");
    const closeSearchBtn = getElement("closeSearchBtn");
    const searchInput = getElement("searchInput");
    const searchResults = getElement("searchResults");

    if (searchPanel && openSearchBtn && closeSearchBtn && searchInput && searchResults) {
        openSearchBtn.addEventListener("click", () => {
            searchPanel.classList.add("active");
            setTimeout(() => searchInput.focus(), 300);
        });

        closeSearchBtn.addEventListener("click", () => {
            searchPanel.classList.remove("active");
            searchInput.value = "";
            searchResults.innerHTML =
                '<p class="search-hint">Start typing to search...</p>';
        });

        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();

            if (!query) {
                searchResults.innerHTML =
                    '<p class="search-hint">Start typing to search...</p>';
                return;
            }

            const filtered = allContentDatabase.filter(item =>
                safeText(item.title).toLowerCase().includes(query)
            );

            searchResults.innerHTML = "";

            if (!filtered.length) {
                searchResults.innerHTML =
                    `<p class="search-hint">No results found for "${escapeHTML(searchInput.value)}"</p>`;
                return;
            }

            filtered.forEach(item => {
                const link = document.createElement("a");
                link.href = `anime-details.html?id=${encodeURIComponent(item.firebaseKey)}`;
                link.className = "search-item";

                const image = document.createElement("img");
                image.src = item.image || "";
                image.alt = safeText(item.title, "Anime");
                image.onerror = () => {
                    image.onerror = null;
                    image.src = "https://placehold.co/55x75?text=No+Image";
                };

                const info = document.createElement("div");
                info.className = "search-item-info";

                const title = document.createElement("h3");
                title.textContent = safeText(item.title, "Untitled");

                const subtitle = document.createElement("p");
                subtitle.textContent = "Tap to watch";

                const arrow = document.createElement("i");
                arrow.className = "fa-solid fa-chevron-right";

                info.append(title, subtitle);
                link.append(image, info, arrow);
                searchResults.appendChild(link);
            });
        });
    }

    renderContentGrid("animeGrid",
        allContentDatabase.filter(item => item.type === "anime" || !item.type)
    );

    renderContentGrid("movieGrid",
        allContentDatabase.filter(item => item.type === "movie")
    );
}

function renderContentGrid(containerId, items) {
    const container = getElement(containerId);
    if (!container) return;

    container.innerHTML = "";

    if (!items.length) {
        container.innerHTML =
            '<p style="color:#888;text-align:center;width:100%;">No content found.</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement("a");
        card.href = `anime-details.html?id=${encodeURIComponent(item.firebaseKey)}`;
        card.className = "grid-card";

        const image = document.createElement("img");
        image.src = item.image || "";
        image.alt = safeText(item.title, "Anime");
        image.onerror = () => {
            image.onerror = null;
            image.src = "https://placehold.co/150x225?text=No+Image";
        };

        const title = document.createElement("div");
        title.className = "grid-card-title";
        title.textContent = safeText(item.title, "Untitled");

        card.append(image, title);
        container.appendChild(card);
    });
}


// ================= 6. ANIME DETAILS PAGE =================

document.addEventListener("DOMContentLoaded", () => {
    const detailTitle = getElement("detailTitle");

    if (!detailTitle || !database) return;

    const animeId = new URLSearchParams(location.search).get("id");

    if (!animeId) {
        detailTitle.textContent = "No ID Provided";
        return;
    }

    database.ref(`content/${animeId}`).once("value")
        .then(snapshot => {
            const data = snapshot.val();

            if (!data) {
                detailTitle.textContent = "Content Not Found";

                const synopsis = getElement("detailSynopsis");
                if (synopsis) synopsis.textContent = "This content does not exist.";

                return;
            }

            document.title = `${safeText(data.title, "Anime")} - Anime Max Zone`;

            const banner = getElement("detailBanner");
            const poster = getElement("detailPoster");
            const rating = getElement("detailRating");
            const year = getElement("detailYear");
            const synopsis = getElement("detailSynopsis");
            const genres = getElement("detailGenres");

            if (banner) {
                banner.style.backgroundImage = `url("${data.banner || data.image || ""}")`;
            }

            if (poster) poster.src = data.image || "";
            detailTitle.textContent = safeText(data.title, "Untitled");
            if (rating) rating.textContent = data.rating ?? "0.0";
            if (year) year.textContent = data.year ?? "----";

            if (synopsis) {
                synopsis.textContent = safeText(data.synopsis, "No description available.");
            }

            if (genres) {
                genres.innerHTML = "";

                (Array.isArray(data.genres) ? data.genres : []).forEach(genre => {
                    const tag = document.createElement("span");
                    tag.className = "genre-tag";
                    tag.textContent = genre;
                    genres.appendChild(tag);
                });
            }

            const episodesSection = document.querySelector(".episodes-section");
            const episodeList = getElement("episodeList");

            if (data.type === "movie" || !data.seasons) {
                if (episodesSection) episodesSection.style.display = "none";

                const synopsisSection = document.querySelector(".synopsis-section");

                if (synopsisSection && !getElement("movieWatchNowBtn")) {
                    const watchBtn = document.createElement("a");
                    watchBtn.id = "movieWatchNowBtn";
                    watchBtn.href = `watch.html?id=${encodeURIComponent(animeId)}`;
                    watchBtn.className = "watch-now-btn";
                    watchBtn.innerHTML = '<i class="fa-solid fa-play"></i> Watch Movie Now';
                    synopsisSection.appendChild(watchBtn);
                }

                return;
            }

            if (episodesSection) episodesSection.style.display = "block";
            if (!episodeList) return;

            episodeList.innerHTML = "";

            const seasons = data.seasons;
            let totalEpisodes = 0;
            const seasonNames = Object.keys(seasons);

            seasonNames.forEach(seasonName => {
                const episodes = seasons[seasonName] || {};

                if (seasonNames.length > 1) {
                    const heading = document.createElement("h4");
                    heading.style.cssText =
                        "color:#a855f7;margin:10px 0 5px;font-size:14px;";
                    heading.textContent = seasonName;
                    episodeList.appendChild(heading);
                }

                Object.entries(episodes).forEach(([episodeKey, episode]) => {
                    totalEpisodes++;

                    const link = document.createElement("a");
                    link.href =
                        `watch.html?id=${encodeURIComponent(animeId)}` +
                        `&season=${encodeURIComponent(seasonName)}` +
                        `&ep=${encodeURIComponent(episodeKey)}`;
                    link.className = "episode-card";

                    link.innerHTML = `
                        <div class="ep-play-icon"><i class="fa-solid fa-play"></i></div>
                        <div class="ep-info">
                            <h4>Episode ${escapeHTML(episode.ep ?? "?")}</h4>
                            <p>${escapeHTML(episode.title ?? "")}</p>
                        </div>
                        <i class="fa-solid fa-chevron-right ep-arrow"></i>
                    `;

                    episodeList.appendChild(link);
                });
            });

            const episodeCount = getElement("episodeCount");
            if (episodeCount) episodeCount.textContent = `${totalEpisodes} Episodes`;
        })
        .catch(error => {
            console.error("Details load error:", error);
            detailTitle.textContent = "Unable to load content";
        });
});


// ================= 7. WATCH PAGE / PLAYER =================

if (getElement("customVideo") && database) {
    initializeWatchPlayer();
}

function initializeWatchPlayer() {
    const video = getElement("customVideo");
    const playerWrapper = getElement("playerWrapper");
    const videoLoader = getElement("videoLoader");
    const controlsBar = getElement("controlsBar");
    const topControls = getElement("topControls");

    const audioMenu = getElement("audioMenu");
    const subtitleMenu = getElement("subtitleMenu");
    const qualityMenu = getElement("qualityMenu");

    const audioOptions = getElement("audioOptions");
    const subtitleOptions = getElement("subtitleOptions");
    const qualityOptions = getElement("qualityOptions");

    const playPauseBtn = getElement("playPauseBtn");
    const muteBtn = getElement("muteBtn");
    const seekBar = getElement("seekBar");
    const timeDisplay = getElement("timeDisplay");
    const settingsBtn = getElement("settingsBtn");
    const fullscreenBtn = getElement("fullscreenBtn");
    const skipBackBtn = getElement("skipBackBtn");
    const skipForwardBtn = getElement("skipForwardBtn");

    const urlParams = new URLSearchParams(location.search);
    const animeId = urlParams.get("id");

    let animeData = null;
    let currentVideoData = null;
    let activeSeason = "";
    let currentEpKey = "";
    let currentVideoUrl = "";
    let currentAudioUrl = "";
    let controlTimeout = null;
    let switchToken = 0;
    let wasPlayingBeforeSwitch = false;

    // Separate audio element for audio-only URLs.
    // This requires browser playback support and compatible CORS/streaming.
    const audioPlayer = new Audio();
    audioPlayer.preload = "auto";
    audioPlayer.crossOrigin = "anonymous";

    let audioSyncTimer = null;
    let lastTapTime = 0;

    const leftOverlay = getElement("seekLeftOverlay");
    const centerOverlay = getElement("centerOverlay");
    const rightOverlay = getElement("seekRightOverlay");
    const centerFeedbackIcon = getElement("centerFeedbackIcon");

    function setLoader(show) {
        if (videoLoader) {
            videoLoader.style.display = show ? "block" : "none";
        }
    }

    function closeMenus() {
        [audioMenu, subtitleMenu, qualityMenu].forEach(menu => {
            if (menu) menu.style.display = "none";
        });
    }

    function toggleMenu(menu, event) {
        if (event) event.stopPropagation();
        if (!menu) return;

        const shouldOpen = menu.style.display === "none" || !menu.style.display;
        closeMenus();

        if (shouldOpen) menu.style.display = "block";
        resetControlTimeout();
    }

    function setActiveButton(container, selectedButton) {
        if (!container) return;

        container.querySelectorAll(".setting-btn").forEach(button => {
            button.classList.toggle("active", button === selectedButton);
        });
    }

    function makeOption(container, label, active, callback) {
        if (!container) return null;

        const button = document.createElement("button");
        button.type = "button";
        button.className = `setting-btn${active ? " active" : ""}`;
        button.textContent = label;

        button.addEventListener("click", event => {
            event.stopPropagation();
            callback(button);
        });

        container.appendChild(button);
        return button;
    }

    function showEmptyOption(container, message) {
        if (container) {
            container.innerHTML =
                `<p style="font-size:12px;color:#888;">${escapeHTML(message)}</p>`;
        }
    }

    function setVideoSourceUrl(url) {
        const value = normalizeMediaUrl(url);

        if (!value) return "";

        // Preserve valid direct media URLs. Drive sharing links may not
        // be direct media URLs and might not stream in an HTML5 player.
        return value;
    }

    function updateSubtitleTrack(url) {
        const track = getElement("subtitleTrack");

        if (!track) return;

        // Disable previous text tracks first.
        Array.from(video.textTracks || []).forEach(textTrack => {
            textTrack.mode = "disabled";
        });

        track.mode = "disabled";
        track.removeAttribute("src");

        if (!url) {
            activeSubtitleUrl = null;
            return;
        }

        activeSubtitleUrl = url;
        track.src = url;
        track.label = "Selected subtitles";
        track.srclang = "en";
        track.kind = "subtitles";

        // Browser loads the new subtitle track asynchronously.
        track.track.mode = "showing";
    }

    function startAudioSync() {
        stopAudioSync();

        audioSyncTimer = setInterval(() => {
            if (!currentAudioUrl || audioPlayer.paused || video.paused) return;

            // Correct small drift between separate audio/video streams.
            const drift = audioPlayer.currentTime - video.currentTime;

            if (Math.abs(drift) > 0.35) {
                try {
                    audioPlayer.currentTime = video.currentTime;
                } catch (_) {}
            }
        }, 700);
    }

    function stopAudioSync() {
        if (audioSyncTimer) {
            clearInterval(audioSyncTimer);
            audioSyncTimer = null;
        }
    }

    async function switchAudio(language) {
        if (!currentVideoData || !currentVideoData.audios) return;

        const url = currentVideoData.audios[language];
        if (!url) return;

        currentAudio = language;
        currentAudioUrl = normalizeMediaUrl(url);

        try {
            audioPlayer.pause();
            audioPlayer.src = currentAudioUrl;
            audioPlayer.load();

            if (Number.isFinite(video.currentTime) && video.currentTime > 0) {
                audioPlayer.currentTime = video.currentTime;
            }

            if (!video.paused) {
                await audioPlayer.play();
                startAudioSync();
            } else {
                stopAudioSync();
            }

            console.info("Selected audio track:", language);
        } catch (error) {
            console.error("Audio switching failed:", error);
            alert(
                "Audio file play nahi ho payi. Check karein ki Google Drive URL direct playable hai aur file accessible hai."
            );
        }

        closeMenus();
        resetControlTimeout();
    }

    function switchQuality(qualityName) {
        if (!currentVideoData || !currentVideoData.qualities) return;

        const url = currentVideoData.qualities[qualityName];
        if (!url) return;

        currentQuality = qualityName;

        const newUrl = setVideoSourceUrl(url);

        if (!newUrl) return;

        loadVideoSource(newUrl, {
            preserveTime: true,
            preserveAudio: true,
            preserveSubtitle: true
        });

        closeMenus();
    }

    function renderAudioOptions(data) {
        if (!audioOptions) return;

        audioOptions.innerHTML = "";

        const audios = data.audios || {};
        const languages = Object.keys(audios);

        if (!languages.length) {
            showEmptyOption(audioOptions, "No Audio Tracks");
            return;
        }

        if (!currentAudio || !audios[currentAudio]) {
            currentAudio = languages[0];
        }

        languages.forEach(language => {
            makeOption(audioOptions, language, language === currentAudio, button => {
                currentAudio = language;
                setActiveButton(audioOptions, button);
                switchAudio(language);
            });
        });
    }

    function renderQualityOptions(data) {
        if (!qualityOptions) return;

        qualityOptions.innerHTML = "";

        const qualities = data.qualities || {};
        const names = Object.keys(qualities);

        if (!names.length) {
            showEmptyOption(qualityOptions, "No Quality Options");
            return;
        }

        // Prefer 480p when available; otherwise first database entry.
        if (!currentQuality || !qualities[currentQuality]) {
            currentQuality = qualities["480p"] ? "480p" : names[0];
        }

        names.forEach(name => {
            makeOption(qualityOptions, name, name === currentQuality, button => {
                currentQuality = name;
                setActiveButton(qualityOptions, button);
                switchQuality(name);
            });
        });
    }

    function renderSubtitleOptions(data) {
        if (!subtitleOptions) return;

        subtitleOptions.innerHTML = "";

        makeOption(subtitleOptions, "Off", !activeSubtitleUrl, button => {
            updateSubtitleTrack(null);
            setActiveButton(subtitleOptions, button);
            closeMenus();
        });

        const subtitles = data.subtitles || {};
        const names = Object.keys(subtitles);

        names.forEach(name => {
            makeOption(
                subtitleOptions,
                name,
                activeSubtitleUrl === subtitles[name],
                button => {
                    updateSubtitleTrack(subtitles[name]);
                    setActiveButton(subtitleOptions, button);
                    closeMenus();
                }
            );
        });
    }

    function stopExternalAudio() {
        stopAudioSync();
        audioPlayer.pause();
        audioPlayer.removeAttribute("src");
        audioPlayer.load();
        currentAudioUrl = "";
    }

    function loadVideoSource(url, options = {}) {
        if (!url) {
            setLoader(false);
            console.error("No valid video URL selected.");
            return;
        }

        const token = ++switchToken;

        const preserveTime = options.preserveTime !== false;
        const previousTime = preserveTime ? video.currentTime || 0 : 0;
        const wasPlaying = !video.paused;
        const previousMuted = video.muted;
        const previousVolume = video.volume;

        wasPlayingBeforeSwitch = wasPlaying;
        currentVideoUrl = url;

        setLoader(true);

        video.pause();
        video.src = url;
        video.load();

        video.addEventListener("loadedmetadata", async function onMetadata() {
            if (token !== switchToken) return;

            video.removeEventListener("loadedmetadata", onMetadata);

            if (
                preserveTime &&
                Number.isFinite(video.duration) &&
                previousTime < video.duration
            ) {
                try {
                    video.currentTime = previousTime;
                } catch (_) {}
            }

            video.muted = previousMuted;
            video.volume = previousVolume;

            // Restore subtitle track.
            if (activeSubtitleUrl) {
                updateSubtitleTrack(activeSubtitleUrl);
            }

            setLoader(false);

            // Keep separate audio aligned after quality change.
            if (currentAudioUrl && options.preserveAudio !== false) {
                try {
                    audioPlayer.currentTime = video.currentTime;
                } catch (_) {}
            }

            if (wasPlayingBeforeSwitch) {
                try {
                    await video.play();

                    if (currentAudioUrl) {
                        try {
                            await audioPlayer.play();
                            startAudioSync();
                        } catch (audioError) {
                            console.warn("Separate audio could not resume:", audioError);
                        }
                    }
                } catch (error) {
                    console.warn("Video playback needs user interaction:", error);
                }
            }
        }, { once: true });

        video.addEventListener("error", function onVideoError() {
            if (token !== switchToken) return;

            video.removeEventListener("error", onVideoError);
            setLoader(false);

            console.error("Video loading error:", video.error);

            const hint = getElement("playerErrorMessage");

            if (hint) {
                hint.textContent =
                    "Video load nahi ho paya. URL, permissions aur video format check karein.";
                hint.style.display = "block";
            }
        }, { once: true });
    }

    function setupPlayer(data) {
        if (!data) return;

        currentVideoData = data;

        closeMenus();
        stopExternalAudio();

        currentAudio = null;
        currentQuality = null;
        activeSubtitleUrl = null;

        renderAudioOptions(data);
        renderQualityOptions(data);
        renderSubtitleOptions(data);

        const qualities = data.qualities || {};
        const qualityNames = Object.keys(qualities);

        let videoUrl = "";

        if (qualityNames.length) {
            currentQuality = qualities["480p"] ? "480p" : qualityNames[0];
            videoUrl = qualities[currentQuality];
        } else if (data.gdrive_id) {
            videoUrl = data.gdrive_id;
        } else if (data.videoUrl) {
            videoUrl = data.videoUrl;
        } else if (data.url) {
            videoUrl = data.url;
        }

        if (!videoUrl) {
            setLoader(false);
            console.error("No video URL found for this episode.");
            alert("Is episode ke liye video URL nahi mila.");
            return;
        }

        // Do not start a separate audio file automatically here.
        // User selects the language explicitly from the Audio Track menu.
        loadVideoSource(setVideoSourceUrl(videoUrl), {
            preserveTime: false,
            preserveAudio: false,
            preserveSubtitle: false
        });
    }

    // ---------- Load Firebase episode ----------

    function loadWatchContent() {
        if (!animeId) {
            alert("Anime ID URL mein nahi mila.");
            return;
        }

        database.ref(`content/${animeId}`).once("value")
            .then(snapshot => {
                animeData = snapshot.val();

                if (!animeData) {
                    alert("Anime ya episode nahi mila.");
                    return;
                }

                const isMovie = animeData.type === "movie" || !animeData.seasons;
                let videoData = null;
                let pageTitle = safeText(animeData.title, "Anime");

                if (isMovie) {
                    videoData = animeData;
                    currentEpKey = "movie";

                    const wrapper = getElement("seasonsEpisodesWrapper");
                    if (wrapper) wrapper.style.display = "none";
                } else {
                    const wrapper = getElement("seasonsEpisodesWrapper");
                    if (wrapper) wrapper.style.display = "block";

                    const seasonNames = Object.keys(animeData.seasons || {});

                    if (!seasonNames.length) {
                        alert("Is anime mein seasons nahi hain.");
                        return;
                    }

                    const requestedSeason = urlParams.get("season");
                    activeSeason = seasonNames.includes(requestedSeason)
                        ? requestedSeason
                        : seasonNames[0];

                    const episodes = animeData.seasons[activeSeason] || {};
                    const episodeNames = Object.keys(episodes);

                    if (!episodeNames.length) {
                        alert("Is season mein episodes nahi hain.");
                        return;
                    }

                    const requestedEpisode = urlParams.get("ep");
                    currentEpKey = episodes[requestedEpisode]
                        ? requestedEpisode
                        : episodeNames[0];

                    videoData = episodes[currentEpKey];
                    pageTitle += ` - ${activeSeason} Ep ${videoData.ep ?? ""}`;

                    renderWatchSeasons();
                }

                document.title = `${pageTitle} - Anime Max Zone`;

                const titleElement = getElement("watchAnimeTitle");
                const descElement = getElement("watchAnimeDesc");

                if (titleElement) titleElement.textContent = pageTitle;
                if (descElement) {
                    descElement.textContent =
                        safeText(animeData.synopsis, "No description available.");
                }

                setupPlayer(videoData);
            })
            .catch(error => {
                console.error("Watch content load failed:", error);
                alert("Content load nahi ho paya. Firebase connection check karein.");
            });
    }

    function renderWatchSeasons() {
        const seasonTabs = getElement("watchSeasonTabs");
        if (!seasonTabs || !animeData || !animeData.seasons) return;

        seasonTabs.innerHTML = "";

        Object.keys(animeData.seasons).forEach(seasonName => {
            const button = document.createElement("button");
            button.type = "button";
            button.className =
                `season-btn${seasonName === activeSeason ? " active" : ""}`;
            button.textContent = seasonName;

            button.addEventListener("click", () => {
                activeSeason = seasonName;

                const episodes = animeData.seasons[seasonName] || {};
                const keys = Object.keys(episodes);

                if (!keys.length) return;

                currentEpKey = keys[0];

                updateEpisodeURL();
                renderWatchSeasons();
                renderWatchEpisodes();
                updateWatchTitle(episodes[currentEpKey]);
                setupPlayer(episodes[currentEpKey]);
            });

            seasonTabs.appendChild(button);
        });

        renderWatchEpisodes();
    }

    function updateEpisodeURL() {
        const url =
            `watch.html?id=${encodeURIComponent(animeId)}` +
            `&season=${encodeURIComponent(activeSeason)}` +
            `&ep=${encodeURIComponent(currentEpKey)}`;

        history.pushState({ path: url }, "", url);
    }

    function updateWatchTitle(episode) {
        const titleElement = getElement("watchAnimeTitle");
        if (titleElement && episode) {
            titleElement.textContent =
                `${safeText(animeData.title, "Anime")} - ${activeSeason} Ep ${episode.ep ?? ""}`;
        }
    }

    function renderWatchEpisodes() {
        const container = getElement("watchEpisodeList");
        if (!container || !animeData || !animeData.seasons) return;

        container.innerHTML = "";

        const episodes = animeData.seasons[activeSeason] || {};

        Object.entries(episodes).forEach(([key, episode]) => {
            const isPlaying = key === currentEpKey;

            const card = document.createElement("div");
            card.className = `episode-card${isPlaying ? " active" : ""}`;
            card.style.cursor = "pointer";

            card.innerHTML = `
                <div class="ep-play-icon">
                    <i class="fa-solid ${isPlaying && !video.paused ? "fa-pause" : "fa-play"}"></i>
                </div>
                <div class="ep-info">
                    <h4>Episode ${escapeHTML(episode.ep ?? "?")} ${isPlaying ? "(Playing)" : ""}</h4>
                    <p>${escapeHTML(episode.title ?? "")}</p>
                </div>
            `;

            card.addEventListener("click", () => {
                if (isPlaying) {
                    togglePlayPause();
                    return;
                }

                currentEpKey = key;
                updateEpisodeURL();
                renderWatchEpisodes();
                updateWatchTitle(episode);
                setupPlayer(episode);
            });

            container.appendChild(card);
        });
    }

    // ---------- Menus ----------

    const audioIconBtn = getElement("audioIconBtn");
    const subtitleIconBtn = getElement("subtitleIconBtn");

    if (audioIconBtn) {
        audioIconBtn.addEventListener("click", event => toggleMenu(audioMenu, event));
    }

    if (subtitleIconBtn) {
        subtitleIconBtn.addEventListener("click", event => toggleMenu(subtitleMenu, event));
    }

    if (settingsBtn) {
        settingsBtn.addEventListener("click", event => toggleMenu(qualityMenu, event));
    }

    // ---------- Playback controls ----------

    function togglePlayPause() {
        if (video.paused) {
            video.play().catch(error => {
                console.warn("Play request rejected:", error);
            });

            if (currentAudioUrl) {
                audioPlayer.play().catch(error => {
                    console.warn("Audio play request rejected:", error);
                });
            }
        } else {
            video.pause();
            audioPlayer.pause();
        }
    }

    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", event => {
            event.stopPropagation();
            togglePlayPause();
            resetControlTimeout();
        });
    }

    video.addEventListener("play", () => {
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        }

        if (currentAudioUrl && audioPlayer.paused) {
            audioPlayer.currentTime = video.currentTime;
            audioPlayer.play().catch(error => {
                console.warn("Audio did not start:", error);
            });
        }

        renderWatchEpisodes();
        resetControlTimeout();
    });

    video.addEventListener("pause", () => {
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }

        audioPlayer.pause();
        stopAudioSync();
        renderWatchEpisodes();
        showControls();
    });

    video.addEventListener("waiting", () => setLoader(true));
    video.addEventListener("playing", () => setLoader(false));
    video.addEventListener("canplay", () => setLoader(false));

    video.addEventListener("ended", () => {
        audioPlayer.pause();
        stopAudioSync();
    });

    video.addEventListener("timeupdate", () => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;

        if (seekBar) {
            seekBar.value = (video.currentTime / video.duration) * 100;
        }

        if (timeDisplay) {
            timeDisplay.textContent =
                `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
        }
    });

    if (seekBar) {
        seekBar.addEventListener("input", event => {
            event.stopPropagation();

            if (Number.isFinite(video.duration)) {
                video.currentTime = video.duration * (Number(seekBar.value) / 100);

                if (currentAudioUrl) {
                    try {
                        audioPlayer.currentTime = video.currentTime;
                    } catch (_) {}
                }
            }
        });
    }

    if (skipBackBtn) {
        skipBackBtn.addEventListener("click", event => {
            event.stopPropagation();
            video.currentTime = Math.max(0, video.currentTime - 10);

            if (currentAudioUrl) {
                audioPlayer.currentTime = video.currentTime;
            }

            resetControlTimeout();
        });
    }

    if (skipForwardBtn) {
        skipForwardBtn.addEventListener("click", event => {
            event.stopPropagation();

            const target = video.currentTime + 10;
            video.currentTime = Number.isFinite(video.duration)
                ? Math.min(video.duration, target)
                : target;

            if (currentAudioUrl) {
                audioPlayer.currentTime = video.currentTime;
            }

            resetControlTimeout();
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener("click", event => {
            event.stopPropagation();
            video.muted = !video.muted;
            resetControlTimeout();
        });
    }

    video.addEventListener("volumechange", () => {
        if (!muteBtn) return;

        muteBtn.innerHTML = (video.muted || video.volume === 0)
            ? '<i class="fa-solid fa-volume-xmark"></i>'
            : '<i class="fa-solid fa-volume-high"></i>';
    });

    if (fullscreenBtn && playerWrapper) {
        fullscreenBtn.addEventListener("click", async event => {
            event.stopPropagation();

            try {
                if (!document.fullscreenElement) {
                    await playerWrapper.requestFullscreen();

                    if (screen.orientation?.lock) {
                        try {
                            await screen.orientation.lock("landscape");
                        } catch (_) {}
                    }
                } else {
                    await document.exitFullscreen();

                    if (screen.orientation?.unlock) {
                        screen.orientation.unlock();
                    }
                }
            } catch (error) {
                console.warn("Fullscreen unavailable:", error);
            }

            resetControlTimeout();
        });
    }

    // ---------- Show/hide controls ----------

    function showControls() {
        if (controlsBar) controlsBar.classList.remove("hidden");
        if (topControls) topControls.classList.remove("hidden");
        resetControlTimeout();
    }

    function hideControls() {
        if (video.paused) return;

        if (controlsBar) controlsBar.classList.add("hidden");
        if (topControls) topControls.classList.add("hidden");

        closeMenus();
    }

    function resetControlTimeout() {
        clearTimeout(controlTimeout);

        if (!video.paused) {
            controlTimeout = setTimeout(hideControls, 3000);
        }
    }

    if (playerWrapper) {
        playerWrapper.addEventListener("mousemove", showControls);
        playerWrapper.addEventListener("touchstart", showControls, { passive: true });
    }

    // ---------- Tap and double-tap seek ----------

    function handleTap(overlay, action) {
        const now = Date.now();
        const isDoubleTap = now - lastTapTime < 300;
        lastTapTime = now;

        if (!isDoubleTap) {
            showControls();
            return;
        }

        if (action === "left") {
            video.currentTime = Math.max(0, video.currentTime - 10);
        } else if (action === "right") {
            const target = video.currentTime + 10;

            video.currentTime = Number.isFinite(video.duration)
                ? Math.min(video.duration, target)
                : target;
        } else {
            togglePlayPause();
        }

        if (overlay) {
            overlay.classList.add("active");
            setTimeout(() => overlay.classList.remove("active"), 500);
        }

        resetControlTimeout();
    }

    if (leftOverlay) {
        leftOverlay.addEventListener("click", () => handleTap(leftOverlay, "left"));
    }

    if (rightOverlay) {
        rightOverlay.addEventListener("click", () => handleTap(rightOverlay, "right"));
    }

    if (centerOverlay) {
        centerOverlay.addEventListener("click", () => {
            handleTap(centerOverlay, "center");
        });
    }

    // Close menus on outside click.
    document.addEventListener("click", event => {
        const insideMenu = event.target.closest(
            "#audioMenu, #subtitleMenu, #qualityMenu, #audioIconBtn, #subtitleIconBtn, #settingsBtn"
        );

        if (!insideMenu) closeMenus();
    });

    // ---------- Start ----------

    showControls();
    loadWatchContent();
}


// ================= 8. COMMENTS SYSTEM =================

if (getElement("customVideo") && database) {
    const animeId = new URLSearchParams(location.search).get("id");

    const commentForm = getElement("commentForm");
    const commentsList = getElement("commentsList");
    const openCommentsBtn = getElement("openCommentsBtn");
    const closeCommentsBtn = getElement("closeCommentsBtn");
    const bottomSheet = getElement("commentsBottomSheet");
    const backdrop = getElement("bottomSheetBackdrop");

    function closeCommentsSheet() {
        if (bottomSheet) bottomSheet.classList.remove("active");
        if (backdrop) backdrop.classList.remove("active");
    }

    if (openCommentsBtn && bottomSheet && backdrop) {
        openCommentsBtn.addEventListener("click", () => {
            bottomSheet.classList.add("active");
            backdrop.classList.add("active");
        });

        if (closeCommentsBtn) {
            closeCommentsBtn.addEventListener("click", closeCommentsSheet);
        }

        backdrop.addEventListener("click", closeCommentsSheet);
    }

    let commentUserId = localStorage.getItem("commentUserId");

    if (!commentUserId) {
        commentUserId =
            "user_" + Math.random().toString(36).slice(2, 11);

        localStorage.setItem("commentUserId", commentUserId);
    }

    let isAdmin = false;

    if (firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            // Sign-in alone should not automatically grant admin permissions.
            // Use Firebase database security rules for actual authorization.
            isAdmin = Boolean(user && user.email);
        });
    }

    function renderComments(snapshot) {
        if (!commentsList) return;

        commentsList.innerHTML = "";

        const data = snapshot.val();

        if (!data) {
            commentsList.innerHTML =
                '<p style="color:#888;font-size:13px;text-align:center;">No comments yet. Be the first to comment!</p>';
            return;
        }

        const comments = Object.entries(data)
            .map(([key, value]) => ({ key, ...value }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        comments.forEach(comment => {
            const item = document.createElement("div");
            item.className = "comment-item";

            const header = document.createElement("div");
            header.className = "comment-header";

            const name = document.createElement("span");
            name.className = "comment-name";
            name.textContent = safeText(comment.name, "Anonymous");

            const right = document.createElement("div");
            right.style.cssText = "display:flex;align-items:center;gap:10px;";

            const time = document.createElement("span");
            time.className = "comment-time";

            time.textContent = comment.timestamp
                ? new Date(comment.timestamp).toLocaleString()
                : "";

            right.appendChild(time);

            const canDelete = comment.userId === commentUserId || isAdmin;

            if (canDelete) {
                const deleteBtn = document.createElement("button");
                deleteBtn.type = "button";
                deleteBtn.className = "delete-comment-btn";
                deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';

                deleteBtn.addEventListener("click", () => {
                    window.deleteComment(animeId, comment.key);
                });

                right.appendChild(deleteBtn);
            }

            header.append(name, right);

            const text = document.createElement("p");
            text.className = "comment-text";
            text.textContent = safeText(comment.text);

            item.append(header, text);
            commentsList.appendChild(item);
        });
    }

    function loadComments() {
        if (!animeId || !commentsList) return;

        database.ref(`comments/${animeId}`).on(
            "value",
            renderComments,
            error => {
                console.error("Comments load error:", error);

                commentsList.innerHTML =
                    '<p style="color:#ef4444;text-align:center;">Unable to load comments.</p>';
            }
        );
    }

    if (commentForm) {
        commentForm.addEventListener("submit", event => {
            event.preventDefault();

            if (!animeId) {
                alert("Content ID URL mein nahi mila.");
                return;
            }

            const name = safeText(getElement("commentName")?.value).trim();
            const email = safeText(getElement("commentEmail")?.value).trim();
            const text = safeText(getElement("commentText")?.value).trim();

            if (!name || !email || !text) {
                alert("Please fill all fields.");
                return;
            }

            const submitBtn = commentForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Posting...';
            }

            database.ref(`comments/${animeId}`).push({
                name,
                email,
                text,
                userId: commentUserId,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            })
                .then(() => commentForm.reset())
                .catch(error => {
                    console.error("Comment post error:", error);
                    alert("Comment post nahi ho paya: " + error.message);
                })
                .finally(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML =
                            '<i class="fa-solid fa-paper-plane"></i> Post Comment';
                    }
                });
        });
    }

    if (animeId) {
        loadComments();
    } else if (commentsList) {
        commentsList.innerHTML =
            '<p style="color:#ef4444;text-align:center;">Error: Anime ID not found in URL.</p>';
    }
}


// ================= 9. DELETE CONFIRMATION MODAL =================

let pendingDeleteAction = null;

window.showCustomConfirm = (message, action) => {
    const modal = getElement("customConfirmModal");
    const messageElement = getElement("confirmMessage");

    if (!modal) {
        if (confirm(message)) action?.();
        return;
    }

    if (messageElement) messageElement.textContent = message;

    pendingDeleteAction = action;
    modal.style.display = "flex";
};

document.addEventListener("DOMContentLoaded", () => {
    const yesBtn = getElement("confirmYesBtn");
    const noBtn = getElement("confirmNoBtn");
    const modal = getElement("customConfirmModal");

    function closeModal() {
        if (modal) modal.style.display = "none";
        pendingDeleteAction = null;
    }

    if (yesBtn) {
        yesBtn.addEventListener("click", () => {
            const action = pendingDeleteAction;
            closeModal();

            if (typeof action === "function") action();
        });
    }

    if (noBtn) {
        noBtn.addEventListener("click", closeModal);
    }

    if (modal) {
        modal.addEventListener("click", event => {
            if (event.target === modal) closeModal();
        });
    }
});

window.deleteComment = (animeId, commentKey) => {
    if (!database || !animeId || !commentKey) return;

    window.showCustomConfirm(
        "Are you sure you want to delete this comment permanently?",
        () => {
            database.ref(`comments/${animeId}/${commentKey}`)
                .remove()
                .catch(error => {
                    alert("Error deleting comment: " + error.message);
                });
        }
    );
};
