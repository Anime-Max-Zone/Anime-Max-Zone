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

let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log("Firebase Connected!");
} catch (error) {
    console.error("Firebase Init Error:", error);
}

let allContentDatabase = [];
let currentAudio = null;
let currentQuality = null;

// ================= 2. SPLASH SCREEN & INITIAL LOAD =================
document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        setTimeout(() => splashScreen.classList.add('hidden'), 2000);
    }

    if (database) {
        database.ref('content').once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                if (data) {
                    allContentDatabase = Object.keys(data).map(key => ({
                        firebaseKey: key,
                        ...data[key]
                    }));
                    loadHomePageData();
                    initSearchAndGrids();
                } else {
                    showNoDataFound();
                }
            })
            .catch((error) => {
                console.error("Firebase Fetch Error:", error);
                showNoDataFound();
            });
    }
});

function showNoDataFound() {
    const containers = ['latestContainer', 'onAirContainer', 'newArrivalsContainer', 'animeGrid', 'movieGrid'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<p style="color:#888; padding: 20px; width:100%; text-align:center;">No Content Available.</p>`;
    });
}

// ================= 3. HOME PAGE DATA =================
function loadHomePageData() {
    const latestContainer = document.getElementById('latestContainer');
    const onAirContainer = document.getElementById('onAirContainer');
    const newArrivalsContainer = document.getElementById('newArrivalsContainer');

    if (latestContainer && onAirContainer && newArrivalsContainer) {
        setTimeout(() => {
            latestContainer.innerHTML = ''; 
            onAirContainer.innerHTML = ''; 
            newArrivalsContainer.innerHTML = '';

            const latestAnime = allContentDatabase.slice(0, 3);
            const onAirAnime = allContentDatabase.slice(3, 6);
            const newArrivals = allContentDatabase.slice(6, 10);

            function createCard(item) {
                const card = document.createElement('a');
                card.href = `anime-details.html?id=${item.firebaseKey}`;
                card.className = 'anime-card';
                card.innerHTML = `<img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/130x190?text=No+Image'">`;
                return card;
            }

            if (latestAnime.length) latestAnime.forEach(item => latestContainer.appendChild(createCard(item)));
            if (onAirAnime.length) onAirAnime.forEach(item => onAirContainer.appendChild(createCard(item)));
            if (newArrivals.length) newArrivals.forEach(item => newArrivalsContainer.appendChild(createCard(item)));
        }, 1000); 
    }
}

// ================= 4. SEARCH & GRIDS =================
function initSearchAndGrids() {
    const searchPanel = document.getElementById('searchPanel');
    const openSearchBtn = document.getElementById('openSearchBtn');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (openSearchBtn && searchPanel) {
        openSearchBtn.addEventListener('click', () => {
            searchPanel.classList.add('active');
            setTimeout(() => { searchInput.focus(); }, 300);
        });

        closeSearchBtn.addEventListener('click', () => {
            searchPanel.classList.remove('active');
            setTimeout(() => {
                searchInput.value = ''; 
                searchResults.innerHTML = '<p class="search-hint">Start typing to search...</p>';
            }, 300);
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query === '') {
                searchResults.innerHTML = '<p class="search-hint">Start typing to search...</p>';
                return;
            }
            const filtered = allContentDatabase.filter(item => item.title && item.title.toLowerCase().includes(query));
            renderSearchResults(filtered);
        });
    }

    function renderSearchResults(results) {
        if (!searchResults) return; 
        searchResults.innerHTML = ''; 

        if (results.length === 0) {
            searchResults.innerHTML = `<p class="search-hint">No results found for "${searchInput.value}"</p>`;
            return;
        }

        results.forEach(item => {
            const link = document.createElement('a');
            link.href = `anime-details.html?id=${item.firebaseKey}`; 
            link.className = 'search-item';
            link.innerHTML = `
                <img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/55x75?text=No+Image'">
                <div class="search-item-info">
                    <h3>${item.title}</h3>
                    <p>Tap to watch</p>
                </div>
                <i class="fa-solid fa-chevron-right"></i>
            `;
            searchResults.appendChild(link);
        });
    }

    // --- ANIME GRID ---
    const animeGridContainer = document.getElementById('animeGrid');
    if (animeGridContainer) {
        animeGridContainer.innerHTML = ''; 
        const animeOnly = allContentDatabase.filter(item => item.type === 'anime' || !item.type);
        if(animeOnly.length === 0) animeGridContainer.innerHTML = "<p style='color:#888; text-align:center; width:100%;'>No Anime found.</p>";
        
        animeOnly.forEach(item => {
            const card = document.createElement('a');
            card.href = `anime-details.html?id=${item.firebaseKey}`; 
            card.className = 'grid-card';
            card.innerHTML = `
                <img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/150x225?text=No+Image'">
                <div class="grid-card-title">${item.title}</div>
            `;
            animeGridContainer.appendChild(card);
        });
    }

    // --- MOVIES GRID ---
    const movieGridContainer = document.getElementById('movieGrid');
    if (movieGridContainer) {
        movieGridContainer.innerHTML = '';
        const moviesOnly = allContentDatabase.filter(item => item.type === 'movie');
        if(moviesOnly.length === 0) movieGridContainer.innerHTML = "<p style='color:#888; text-align:center; width:100%;'>No Movies found.</p>";

        moviesOnly.forEach(item => {
            const card = document.createElement('a');
            card.href = `anime-details.html?id=${item.firebaseKey}`; 
            card.className = 'grid-card';
            card.innerHTML = `
                <img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/150x225?text=No+Image'">
                <div class="grid-card-title">${item.title}</div>
            `;
            movieGridContainer.appendChild(card);
        });
    }
}

// ================= 5. ANIME DETAILS PAGE =================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('detailTitle') && database) {
        const animeId = new URLSearchParams(window.location.search).get('id');

        if (!animeId) {
            document.getElementById('detailTitle').innerText = "No ID Provided";
            return;
        }

        database.ref('content/' + animeId).once('value').then((snapshot) => {
            const data = snapshot.val();
            
            if (!data) {
                document.getElementById('detailTitle').innerText = "Content Not Found";
                document.getElementById('detailSynopsis').innerText = "This content does not exist.";
                return;
            }

            document.title = `${data.title} - Anime Max Zone`;
            document.getElementById('detailBanner').style.backgroundImage = `url(${data.banner || data.image})`;
            document.getElementById('detailPoster').src = data.image;
            document.getElementById('detailTitle').innerText = data.title;
            document.getElementById('detailRating').innerText = data.rating || "0.0";
            document.getElementById('detailYear').innerText = data.year || "----";
            document.getElementById('detailSynopsis').innerText = data.synopsis || "No description available.";
            
            if (data.genres && Array.isArray(data.genres)) {
                document.getElementById('detailGenres').innerHTML = data.genres.map(g => `<span class="genre-tag">${g}</span>`).join('');
            }

            const episodesSection = document.querySelector('.episodes-section');
            const episodeList = document.getElementById('episodeList');

            if (data.type === 'movie' || !data.seasons) {
                if (episodesSection) episodesSection.style.display = 'none';
                
                const watchBtn = document.createElement('a');
                watchBtn.href = `watch.html?id=${animeId}`;
                watchBtn.className = 'watch-now-btn'; 
                watchBtn.innerHTML = `<i class="fa-solid fa-play"></i> Watch Movie Now`;
                document.querySelector('.synopsis-section').appendChild(watchBtn);

            } else {
                if (episodesSection) episodesSection.style.display = 'block';
                let totalEps = 0;
                episodeList.innerHTML = '';

                Object.keys(data.seasons).forEach(seasonName => {
                    const episodesObj = data.seasons[seasonName];
                    const epArray = Object.keys(episodesObj).map(k => ({ firebaseKey: k, ...episodesObj[k] }));
                    totalEps += epArray.length;

                    if (Object.keys(data.seasons).length > 1) {
                        episodeList.innerHTML += `<h4 style="color:#a855f7; margin: 10px 0 5px 0; font-size: 14px;">${seasonName}</h4>`;
                    }

                    epArray.forEach(episode => {
                        const epCard = document.createElement('a');
                        epCard.href = `watch.html?id=${animeId}&season=${encodeURIComponent(seasonName)}&ep=${episode.firebaseKey}`; 
                        epCard.className = 'episode-card';
                        epCard.innerHTML = `
                            <div class="ep-play-icon"><i class="fa-solid fa-play"></i></div>
                            <div class="ep-info">
                                <h4>Episode ${episode.ep}</h4>
                                <p>${episode.title}</p>
                            </div>
                            <i class="fa-solid fa-chevron-right ep-arrow"></i>
                        `;
                        episodeList.appendChild(epCard);
                    });
                });
                document.getElementById('episodeCount').innerText = `${totalEps} Episodes`;
            }
        });
    }
});

// ================= 6. WATCH PAGE (PLAYER) =================
if (document.getElementById('customVideo') && database) {
    const video = document.getElementById('customVideo');
    const videoLoader = document.getElementById('videoLoader');
    const topControls = document.getElementById('topControls'); 
    const controlsBar = document.getElementById('controlsBar'); 
    
    // Top Menus
    const audioIconBtn = document.getElementById('audioIconBtn');
    const subtitleIconBtn = document.getElementById('subtitleIconBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const audioMenu = document.getElementById('audioMenu');
    const subtitleMenu = document.getElementById('subtitleMenu');
    const qualityMenu = document.getElementById('qualityMenu');

    let currentAnimeData = null;
    let activeSeason = "";
    let currentEpKey = "";

    // URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id'); 
    
    // Load Data
    database.ref('content/' + animeId).once('value').then((snapshot) => {
        currentAnimeData = snapshot.val();
        
        if (currentAnimeData) {
            let videoDataToPlay = null;
            let pageTitle = currentAnimeData.title;

            if (currentAnimeData.type === 'movie' || !currentAnimeData.seasons) {
                videoDataToPlay = currentAnimeData; 
                const wrapper = document.getElementById('seasonsEpisodesWrapper');
                if(wrapper) wrapper.style.display = 'none';
                currentEpKey = "movie";
            } else {
                const wrapper = document.getElementById('seasonsEpisodesWrapper');
                if(wrapper) wrapper.style.display = 'block';
                
                const urlSeason = urlParams.get('season');
                const urlEp = urlParams.get('ep');
                const seasons = Object.keys(currentAnimeData.seasons);
                
                activeSeason = (urlSeason && seasons.includes(urlSeason)) ? urlSeason : seasons[0];
                const episodesObj = currentAnimeData.seasons[activeSeason];
                
                currentEpKey = urlEp || Object.keys(episodesObj)[0];
                videoDataToPlay = episodesObj[currentEpKey];
                
                pageTitle += ` - ${activeSeason} Ep ${videoDataToPlay.ep}`;
                renderWatchSeasons();
            }

            document.title = `${pageTitle} - Anime Max Zone`;
            const titleEl = document.getElementById('watchAnimeTitle');
            if(titleEl) titleEl.innerText = pageTitle;
            const descEl = document.getElementById('watchAnimeDesc');
            if(descEl) descEl.innerText = currentAnimeData.synopsis || "No description available.";

            if (videoDataToPlay) {
                setupPlayer(videoDataToPlay);
            }
        }
    });

    // --- Render Seasons & Episodes ---
    function renderWatchSeasons() {
        const seasonTabs = document.getElementById('watchSeasonTabs');
        if (!seasonTabs) return;
        seasonTabs.innerHTML = '';
        
        Object.keys(currentAnimeData.seasons).forEach(seasonName => {
            const btn = document.createElement('button');
            btn.className = `season-btn ${seasonName === activeSeason ? 'active' : ''}`;
            btn.innerText = seasonName;
            btn.onclick = () => {
                activeSeason = seasonName;
                const firstEpKey = Object.keys(currentAnimeData.seasons[seasonName])[0];
                currentEpKey = firstEpKey;
                
                window.history.pushState({path: `watch.html?id=${animeId}&season=${encodeURIComponent(activeSeason)}&ep=${currentEpKey}`}, '', `watch.html?id=${animeId}&season=${encodeURIComponent(activeSeason)}&ep=${currentEpKey}`);
                
                renderWatchSeasons(); 
                renderWatchEpisodes(); 
                
                const newVideoData = currentAnimeData.seasons[activeSeason][currentEpKey];
                setupPlayer(newVideoData);
                document.getElementById('watchAnimeTitle').innerText = `${currentAnimeData.title} - ${activeSeason} Ep ${newVideoData.ep}`;
            };
            seasonTabs.appendChild(btn);
        });
        renderWatchEpisodes();
    }

    function renderWatchEpisodes() {
        const epContainer = document.getElementById('watchEpisodeList');
        if (!epContainer) return;
        epContainer.innerHTML = '';
        
        const episodesObj = currentAnimeData.seasons[activeSeason];
        
        Object.keys(episodesObj).forEach(key => {
            const ep = episodesObj[key];
            const isPlaying = (key === currentEpKey);
            
            const card = document.createElement('div');
            card.className = `episode-card ${isPlaying ? 'active' : ''}`;
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="ep-play-icon"><i class="fa-solid ${isPlaying ? 'fa-volume-high' : 'fa-play'}"></i></div>
                <div class="ep-info">
                    <h4>Episode ${ep.ep} ${isPlaying ? '(Playing)' : ''}</h4>
                    <p>${ep.title}</p>
                </div>
            `;
            
            card.addEventListener('click', () => {
                currentEpKey = key;
                window.history.pushState({path: `watch.html?id=${animeId}&season=${encodeURIComponent(activeSeason)}&ep=${currentEpKey}`}, '', `watch.html?id=${animeId}&season=${encodeURIComponent(activeSeason)}&ep=${currentEpKey}`);
                
                renderWatchEpisodes(); 
                setupPlayer(ep); 
                document.getElementById('watchAnimeTitle').innerText = `${currentAnimeData.title} - ${activeSeason} Ep ${ep.ep}`;
            });
            epContainer.appendChild(card);
        });
    }

    // --- PLAYER LOGIC ---
    if(audioIconBtn) audioIconBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audioMenu.style.display = audioMenu.style.display === 'none' ? 'block' : 'none';
        if(subtitleMenu) subtitleMenu.style.display = 'none';
        if(qualityMenu) qualityMenu.style.display = 'none';
        resetControlTimeout();
    });

    if(subtitleIconBtn) subtitleIconBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        subtitleMenu.style.display = subtitleMenu.style.display === 'none' ? 'block' : 'none';
        if(audioMenu) audioMenu.style.display = 'none';
        if(qualityMenu) qualityMenu.style.display = 'none';
        resetControlTimeout();
    });

    if(settingsBtn) settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        qualityMenu.style.display = qualityMenu.style.display === 'none' ? 'block' : 'none';
        if(audioMenu) audioMenu.style.display = 'none';
        if(subtitleMenu) subtitleMenu.style.display = 'none';
        resetControlTimeout();
    });

    function setupPlayer(videoData) {
        audioMenu.style.display = 'none';
        subtitleMenu.style.display = 'none';
        qualityMenu.style.display = 'none';

        const audioOptions = document.getElementById('audioOptions');
        if (videoData.audios && Object.keys(videoData.audios).length > 0) {
            audioOptions.innerHTML = '';
            Object.keys(videoData.audios).forEach(lang => {
                const btn = document.createElement('button');
                btn.innerText = lang;
                btn.className = 'setting-btn';
                btn.onclick = (e) => { e.stopPropagation(); loadSpecificTrack(videoData, lang, currentQuality); };
                audioOptions.appendChild(btn);
            });
        } else { audioOptions.innerHTML = '<p style="font-size:12px; color:#888;">No Audio</p>'; }

        const qualityOptions = document.getElementById('qualityOptions');
        if (videoData.qualities && Object.keys(videoData.qualities).length > 0) {
            qualityOptions.innerHTML = '';
            Object.keys(videoData.qualities).forEach(q => {
                const btn = document.createElement('button');
                btn.innerText = q;
                btn.className = 'setting-btn';
                btn.onclick = (e) => { e.stopPropagation(); currentQuality = q; loadSpecificTrack(videoData, currentAudio, q); };
                qualityOptions.appendChild(btn);
            });
        } else { qualityOptions.innerHTML = '<p style="font-size:12px; color:#888;">No Quality</p>'; }

        const subtitleOptions = document.getElementById('subtitleOptions');
        if (videoData.subtitles && Object.keys(videoData.subtitles).length > 0) {
            subtitleOptions.innerHTML = '';
            Object.keys(videoData.subtitles).forEach(sub => {
                const btn = document.createElement('button');
                btn.innerText = sub;
                btn.className = 'setting-btn';
                btn.onclick = (e) => { 
                    e.stopPropagation();
                    const track = document.getElementById('subtitleTrack');
                    if(track) { track.src = videoData.subtitles[sub]; track.style.display = 'block'; }
                    subtitleMenu.style.display = 'none'; 
                };
                subtitleOptions.appendChild(btn);
            });
        } else { subtitleOptions.innerHTML = '<p style="font-size:12px; color:#888;">No Subtitles</p>'; }

        const defaultAudio = Object.keys(videoData.audios || {})[0] || null;
        const defaultQuality = Object.keys(videoData.qualities || {})[0] || null;
        loadSpecificTrack(videoData, defaultAudio, defaultQuality);
    }

    function loadSpecificTrack(videoData, audioLang, qualityName) {
        currentAudio = audioLang;
        currentQuality = qualityName;
        
        let url = "";
        if (audioLang && videoData.audios && videoData.audios[audioLang]) {
            url = videoData.audios[audioLang];
        } else if (qualityName && videoData.qualities && videoData.qualities[qualityName]) {
            url = videoData.qualities[qualityName];
        } else if (videoData.gdrive_id) { 
            url = videoData.gdrive_id;
        }

        if(url) playVideoUrl(url);
        audioMenu.style.display = 'none';
        qualityMenu.style.display = 'none';
    }

    // Seamless Video Playback (With Resume Time)
    function playVideoUrl(url) {
        if(!url) return;
        const previousTime = video.currentTime;
        const wasPlaying = !video.paused;
        
        let fileId = null;
        if (url.includes('drive.google.com')) {
            const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/];
            for (let pattern of patterns) {
                const match = url.match(pattern);
                if (match) { fileId = match[1]; break; }
            }
        } else if (!url.startsWith('http')) {
            fileId = url;
        }

        let finalUrl = fileId ? `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=AIzaSyCpfrluxsBhnz48ve9RykIy1IxzbBfk7dA` : url;

        if(videoLoader) videoLoader.style.display = 'block';
        video.src = finalUrl;
        video.load();
        
        video.onloadedmetadata = function() {
            if(previousTime > 0 && previousTime < video.duration) {
                video.currentTime = previousTime;
            }
            if(wasPlaying) {
                video.play().catch(e => console.log("Autoplay blocked", e));
            }
            video.onloadedmetadata = null; 
        };
    }

    // --- CONTROLS & DOUBLE TAP ---
    const playPauseBtn = document.getElementById('playPauseBtn');
    const seekBar = document.getElementById('seekBar');
    const timeDisplay = document.getElementById('timeDisplay');
    const muteBtn = document.getElementById('muteBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const skipBackBtn = document.getElementById('skipBackBtn');
    const skipForwardBtn = document.getElementById('skipForwardBtn');
    const playerWrapper = document.getElementById('playerWrapper');
    
    const leftOverlay = document.getElementById('seekLeftOverlay');
    const centerOverlay = document.getElementById('centerOverlay');
    const rightOverlay = document.getElementById('seekRightOverlay');
    const centerFeedbackIcon = document.getElementById('centerFeedbackIcon');

    video.addEventListener('waiting', () => { if(videoLoader) videoLoader.style.display = 'block'; });
    video.addEventListener('playing', () => { if(videoLoader) videoLoader.style.display = 'none'; });

    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
        resetControlTimeout();
    });

    function togglePlayPause() {
        if (video.paused) {
            video.play(); playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            video.pause(); playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    }

    video.addEventListener('timeupdate', () => {
        if (!isNaN(video.duration)) {
            seekBar.value = (video.currentTime / video.duration) * 100;
            let currMin = Math.floor(video.currentTime / 60);
            let currSec = Math.floor(video.currentTime % 60);
            let totalMin = Math.floor(video.duration / 60);
            let totalSec = Math.floor(video.duration % 60);
            currSec = currSec < 10 ? '0' + currSec : currSec;
            totalSec = totalSec < 10 ? '0' + totalSec : totalSec;
            timeDisplay.innerText = `${currMin}:${currSec} / ${totalMin}:${totalSec}`;
        }
    });

    seekBar.addEventListener('input', (e) => {
        e.stopPropagation();
        video.currentTime = video.duration * (seekBar.value / 100);
    });
    
    skipForwardBtn.addEventListener('click', (e) => { e.stopPropagation(); video.currentTime += 10; resetControlTimeout(); });
    skipBackBtn.addEventListener('click', (e) => { e.stopPropagation(); video.currentTime -= 10; resetControlTimeout(); });
    
    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        muteBtn.innerHTML = video.muted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
        resetControlTimeout();
    });

    fullscreenBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            try {
                await playerWrapper.requestFullscreen();
                if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
            } catch (err) {}
        } else {
            document.exitFullscreen();
            if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
        }
        resetControlTimeout();
    });

    // 🔥 Auto Hide Controls Logic (3 Seconds) 🔥
    let controlTimeout;

    function showControls() {
        controlsBar.classList.remove('hidden');
        topControls.classList.remove('hidden');
        resetControlTimeout();
    }

    function hideControls() {
        if (!video.paused) {
            controlsBar.classList.add('hidden');
            topControls.classList.add('hidden');
            if(audioMenu) audioMenu.style.display = 'none';
            if(subtitleMenu) subtitleMenu.style.display = 'none';
            if(qualityMenu) qualityMenu.style.display = 'none';
        }
    }

    function resetControlTimeout() {
        clearTimeout(controlTimeout);
        if (!video.paused) {
            controlTimeout = setTimeout(hideControls, 3000); // 3 Second
        }
    }

    // Jab video pause ho toh controls hide mat karein
    video.addEventListener('pause', () => {
        clearTimeout(controlTimeout);
        showControls();
    });

    // Jab mouse move ya touch ho toh controls show karein
    playerWrapper.addEventListener('mousemove', showControls);
    playerWrapper.addEventListener('touchstart', showControls);

    // --- Single Tap / Double Tap Logic ---
    let lastTap = 0;
    
    function handleTap(overlay, action) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        // Double Tap detect hua
        if (tapLength < 300 && tapLength > 0) {
            if (action === 'left') {
                video.currentTime = Math.max(0, video.currentTime - 10);
                overlay.querySelector('.tap-feedback').innerHTML = '<i class="fa-solid fa-backward"></i> 10s';
            } else if (action === 'right') {
                video.currentTime = Math.min(video.duration, video.currentTime + 10);
                overlay.querySelector('.tap-feedback').innerHTML = '10s <i class="fa-solid fa-forward"></i>';
            } else if (action === 'center') {
                togglePlayPause();
                centerFeedbackIcon.innerHTML = video.paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
            }
            // Animation Show
            overlay.classList.add('active');
            setTimeout(() => { overlay.classList.remove('active'); }, 500);
            
        } else {
            // Single Tap (Controller show/hide)
            if (controlsBar.classList.contains('hidden')) {
                showControls();
            } else {
                if (!video.paused) hideControls();
            }
        }
        lastTap = currentTime;
    }

    if(leftOverlay) leftOverlay.addEventListener('click', () => handleTap(leftOverlay, 'left'));
    if(rightOverlay) rightOverlay.addEventListener('click', () => handleTap(rightOverlay, 'right'));
    if(centerOverlay) centerOverlay.addEventListener('click', () => handleTap(centerOverlay, 'center'));

    // Initial Show
    showControls();
}

// ================= 7. COMMENT SYSTEM & BOTTOM SHEET LOGIC =================
if (document.getElementById('customVideo') && database) {
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id'); 

    const commentForm = document.getElementById('commentForm');
    const commentsList = document.getElementById('commentsList');

    // Bottom Sheet Elements
    const openCommentsBtn = document.getElementById('openCommentsBtn');
    const closeCommentsBtn = document.getElementById('closeCommentsBtn');
    const bottomSheet = document.getElementById('commentsBottomSheet');
    const backdrop = document.getElementById('bottomSheetBackdrop');

    // Bottom Sheet Open/Close Logic
    if(openCommentsBtn && bottomSheet) {
        openCommentsBtn.addEventListener('click', () => {
            bottomSheet.classList.add('active');
            backdrop.classList.add('active');
        });

        closeCommentsBtn.addEventListener('click', () => {
            bottomSheet.classList.remove('active');
            backdrop.classList.remove('active');
        });

        backdrop.addEventListener('click', () => {
            bottomSheet.classList.remove('active');
            backdrop.classList.remove('active');
        });
    }

    // Local User ID (For self-delete)
    let localCommentUserId = localStorage.getItem('commentUserId');
    if (!localCommentUserId) {
        localCommentUserId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('commentUserId', localCommentUserId);
    }

    let isAdmin = false;
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            isAdmin = true;
            loadComments(); // Re-render to show delete buttons
        }
    });

    if (commentForm && animeId) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('commentName').value.trim();
            const email = document.getElementById('commentEmail').value.trim();
            const text = document.getElementById('commentText').value.trim();

            if(!name || !email || !text) return;

            database.ref('comments/' + animeId).push({
                name: name,
                email: email,
                text: text,
                userId: localCommentUserId,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }).then(() => { commentForm.reset(); })
              .catch(err => alert("Comment post nahi ho paya: " + err.message));
        });

        function loadComments() {
            database.ref('comments/' + animeId).on('value', (snapshot) => {
                const commentsData = snapshot.val();
                commentsList.innerHTML = '';

                if (commentsData) {
                    const sortedComments = Object.keys(commentsData).map(key => ({
                        key: key,
                        ...commentsData[key]
                    })).sort((a, b) => b.timestamp - a.timestamp);

                    sortedComments.forEach(comment => {
                        const date = new Date(comment.timestamp);
                        const timeString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                        const canDelete = (comment.userId === localCommentUserId) || isAdmin;
                        const deleteBtn = canDelete ? `<button class="delete-comment-btn" onclick="deleteComment('${animeId}', '${comment.key}')"><i class="fa-solid fa-trash"></i></button>` : '';

                        commentsList.innerHTML += `
                            <div class="comment-item">
                                <div class="comment-header">
                                    <span class="comment-name">${comment.name}</span>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <span class="comment-time">${timeString}</span>
                                        ${deleteBtn}
                                    </div>
                                </div>
                                <p class="comment-text">${comment.text}</p>
                            </div>
                        `;
                    });
                } else {
                    commentsList.innerHTML = '<p style="color: #888; font-size: 13px; text-align: center;">No comments yet. Be the first to comment!</p>';
                }
            });
        }
        loadComments();
    }
}

// Global Delete Comment Function
window.deleteComment = (animeId, commentKey) => {
    if (confirm("Are you sure you want to delete this comment?")) {
        database.ref(`comments/${animeId}/${commentKey}`).remove()
            .catch((err) => alert("Error deleting comment: " + err.message));
    }
};
