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
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    database = firebase.database();
    console.log("Firebase Connected!");
} catch (error) {
    console.error("Firebase Init Error:", error);
}

let allContentDatabase = [];
let currentAudio = null;
let currentQuality = null;
let activeSubtitleUrl = null;
let hls = null; 
let audioHls = null; 
let isMutedByUser = false; 
let isHiddenAudioActive = false; // 🔥 Naya variable: Track karne ke liye ki hidden audio chal raha hai ya nahi

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
    const hiddenAudioPlayer = document.getElementById('hiddenAudioPlayer'); 
    const videoLoader = document.getElementById('videoLoader');
    const topControls = document.getElementById('topControls'); 
    const controlsBar = document.getElementById('controlsBar'); 
    
    const audioIconBtn = document.getElementById('audioIconBtn');
    const subtitleIconBtn = document.getElementById('subtitleIconBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const audioMenu = document.getElementById('audioMenu');
    const subtitleMenu = document.getElementById('subtitleMenu');
    const qualityMenu = document.getElementById('qualityMenu');

    let currentAnimeData = null;
    let activeSeason = "";
    let currentEpKey = "";

    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id'); 

    window.closeAllMenus = () => {
        if(audioMenu) audioMenu.classList.remove('active');
        if(subtitleMenu) subtitleMenu.classList.remove('active');
        if(qualityMenu) qualityMenu.classList.remove('active');
    };

    if(audioIconBtn) audioIconBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = audioMenu.classList.contains('active');
        closeAllMenus();
        if(!isActive) audioMenu.classList.add('active');
        resetControlTimeout();
    });

    if(subtitleIconBtn) subtitleIconBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = subtitleMenu.classList.contains('active');
        closeAllMenus();
        if(!isActive) subtitleMenu.classList.add('active');
        resetControlTimeout();
    });

    if(settingsBtn) settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = qualityMenu.classList.contains('active');
        closeAllMenus();
        if(!isActive) qualityMenu.classList.add('active');
        resetControlTimeout();
    });

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
                
                activeSubtitleUrl = null; 
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
                <div class="ep-play-icon"><i class="fa-solid ${isPlaying ? (video.paused ? 'fa-play' : 'fa-pause') : 'fa-play'}"></i></div>
                <div class="ep-info">
                    <h4>Episode ${ep.ep} ${isPlaying ? '(Playing)' : ''}</h4>
                    <p>${ep.title}</p>
                </div>
            `;
            
            card.addEventListener('click', () => {
                if (isPlaying) {
                    togglePlayPause();
                } else {
                    currentEpKey = key;
                    window.history.pushState({path: `watch.html?id=${animeId}&season=${encodeURIComponent(activeSeason)}&ep=${currentEpKey}`}, '', `watch.html?id=${animeId}&season=${encodeURIComponent(activeSeason)}&ep=${currentEpKey}`);
                    
                    renderWatchEpisodes(); 
                    activeSubtitleUrl = null; 
                    setupPlayer(ep); 
                    document.getElementById('watchAnimeTitle').innerText = `${currentAnimeData.title} - ${activeSeason} Ep ${ep.ep}`;
                }
            });
            epContainer.appendChild(card);
        });
    }

    // ================= AUDIO TICK HELPER =================
    function setAudioActive(container, activeBtn) {
        if (!container) return;
        Array.from(container.children).forEach(c => {
            c.classList.remove('active');
            const t = c.querySelector('.audio-tick');
            if (t) t.remove();
        });
        if (!activeBtn) return;
        activeBtn.classList.add('active');
        const tick = document.createElement('i');
        tick.className = 'fa-solid fa-check audio-tick';
        tick.style.cssText = 'margin-left:auto; color:#a855f7; font-size:12px;';
        activeBtn.appendChild(tick);
    }

    // ================= SUBTITLE HELPERS =================
    let customSubBlobUrl = null;

    function srtToVtt(text) {
        text = text.replace(/\r+/g, '').replace(/^\uFEFF/, '').trim();
        if (text.startsWith('WEBVTT')) return text;
        return 'WEBVTT\n\n' + text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    }

    function removeCustomSubtitle() {
        const old = document.getElementById('subtitleTrack');
        if (old) old.remove();
        if (customSubBlobUrl) { URL.revokeObjectURL(customSubBlobUrl); customSubBlobUrl = null; }
    }

    async function showCustomSubtitle(url) {
        removeCustomSubtitle();
        let trackSrc = url;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const text = await res.text();
            customSubBlobUrl = URL.createObjectURL(new Blob([srtToVtt(text)], { type: 'text/vtt' }));
            trackSrc = customSubBlobUrl;
        } catch (err) {
            console.warn('Subtitle fetch failed, direct link try ho raha hai:', err);
        }
        if (activeSubtitleUrl !== url) return; // beech me user ne subtitle badal di

        const trackEl = document.createElement('track');
        trackEl.id = 'subtitleTrack';
        trackEl.kind = 'subtitles';
        trackEl.label = 'Subtitles';
        trackEl.srclang = 'en';
        trackEl.src = trackSrc;
        trackEl.default = true;
        video.appendChild(trackEl);
        // NOTE: mode TextTrack par hota hai (trackEl.track), <track> element par nahi
        trackEl.track.mode = 'showing';
    }

    function renderSubtitleMenu(videoData) {
        const subtitleOptions = document.getElementById('subtitleOptions');
        if (!subtitleOptions) return;
        subtitleOptions.innerHTML = '';

        const setActive = (btn) => {
            Array.from(subtitleOptions.children).forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
        };
        const hlsSubIndex = (hls && !activeSubtitleUrl) ? hls.subtitleTrack : -1;

        // Off
        const offBtn = document.createElement('button');
        offBtn.innerText = 'Off';
        offBtn.className = `setting-btn ${(!activeSubtitleUrl && hlsSubIndex === -1) ? 'active' : ''}`;
        offBtn.onclick = (e) => {
            e.stopPropagation();
            activeSubtitleUrl = null;
            removeCustomSubtitle();
            if (hls) hls.subtitleTrack = -1;
            setActive(offBtn);
            setTimeout(closeAllMenus, 300);
        };
        subtitleOptions.appendChild(offBtn);

        // Firebase wale subtitles
        if (videoData && videoData.subtitles && Object.keys(videoData.subtitles).length > 0) {
            Object.keys(videoData.subtitles).forEach(sub => {
                const subUrl = videoData.subtitles[sub];
                const btn = document.createElement('button');
                btn.innerText = sub;
                btn.className = `setting-btn ${activeSubtitleUrl === subUrl ? 'active' : ''}`;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    activeSubtitleUrl = subUrl;
                    if (hls) hls.subtitleTrack = -1; // double subtitle na aaye
                    showCustomSubtitle(subUrl);
                    setActive(btn);
                    setTimeout(closeAllMenus, 300);
                };
                subtitleOptions.appendChild(btn);
            });
        }

        // m3u8 ke andar wale subtitles
        if (hls && hls.subtitleTracks && hls.subtitleTracks.length > 0) {
            hls.subtitleTracks.forEach((track, index) => {
                const btn = document.createElement('button');
                btn.innerText = track.name || track.lang || `Subtitle ${index + 1}`;
                btn.className = `setting-btn ${hlsSubIndex === index ? 'active' : ''}`;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    activeSubtitleUrl = null;
                    removeCustomSubtitle();
                    hls.subtitleDisplay = true;
                    hls.subtitleTrack = index;
                    setActive(btn);
                    setTimeout(closeAllMenus, 300);
                };
                subtitleOptions.appendChild(btn);
            });
        }
    }

    function setupPlayer(videoData) {
        closeAllMenus(); 
        removeCustomSubtitle();
        hideTapToPlay();

        if (hls) { hls.destroy(); hls = null; }
        if (audioHls) { audioHls.destroy(); audioHls = null; }
        if(hiddenAudioPlayer) {
            hiddenAudioPlayer.pause();
            hiddenAudioPlayer.removeAttribute('src');
            hiddenAudioPlayer.load();
        }
        
        video.muted = false; 

        let videoUrl = "";
        if (videoData.gdrive_id && videoData.gdrive_id.includes('.m3u8')) {
            videoUrl = videoData.gdrive_id;
        } else if (videoData.qualities && Object.values(videoData.qualities).length > 0) {
            for (let q in videoData.qualities) {
                if (videoData.qualities[q].includes('.m3u8')) {
                    videoUrl = videoData.qualities[q];
                    break;
                }
            }
        }

        if (videoUrl && videoUrl.includes('.m3u8') && typeof Hls !== 'undefined' && Hls.isSupported()) {
            setupHlsPlayer(videoData, videoUrl);
            return; 
        }

        // MP4 Fallback
        renderSubtitleMenu(videoData);
        const audioOptions = document.getElementById('audioOptions');
        if (videoData.audios && Object.keys(videoData.audios).length > 0) {
            audioOptions.innerHTML = '';
            if (!videoData.audios[currentAudio]) currentAudio = Object.keys(videoData.audios)[0];
            Object.keys(videoData.audios).forEach(lang => {
                const btn = document.createElement('button');
                btn.innerText = lang;
                btn.className = `setting-btn ${currentAudio === lang ? 'active' : ''}`;
                btn.onclick = (e) => { 
                    e.stopPropagation(); 
                    currentAudio = lang;
                    setAudioActive(audioOptions, btn);
                    loadSpecificTrack(videoData, lang, null); 
                    setTimeout(closeAllMenus, 300);
                };
                audioOptions.appendChild(btn);
            });
            setAudioActive(audioOptions, audioOptions.querySelector('.setting-btn.active'));
        } else { audioOptions.innerHTML = '<p style="font-size:14px; color:#888; padding:15px;">No Audio</p>'; }
    }

    function setupHlsPlayer(videoData, videoUrl) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            
            // 🔥 1. QUALITY TRACKS FIX 🔥
            const qualityOptions = document.getElementById('qualityOptions');
            qualityOptions.innerHTML = '';
            
            // Pehle check karo ki HLS Master Link me levels (qualities) hain ya nahi
            if (hls.levels && hls.levels.length > 1) {
                // Auto Button
                const autoBtn = document.createElement('button');
                autoBtn.innerText = 'Auto';
                autoBtn.className = `setting-btn ${hls.autoLevelEnabled ? 'active' : ''}`;
                autoBtn.onclick = (e) => {
                    e.stopPropagation();
                    hls.currentLevel = -1; 
                    Array.from(qualityOptions.children).forEach(c => c.classList.remove('active'));
                    autoBtn.classList.add('active');
                    setTimeout(closeAllMenus, 300);
                };
                qualityOptions.appendChild(autoBtn);

                // Individual Levels (720p, 1080p, etc.)
                hls.levels.forEach((level, index) => {
                    const btn = document.createElement('button');
                    btn.innerText = level.height ? `${level.height}p` : `Level ${index + 1}`;
                    btn.className = `setting-btn ${hls.currentLevel === index ? 'active' : ''}`;
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        hls.currentLevel = index; 
                        Array.from(qualityOptions.children).forEach(c => c.classList.remove('active'));
                        btn.classList.add('active');
                        setTimeout(closeAllMenus, 300);
                    };
                    qualityOptions.appendChild(btn);
                });
            } 
            // Fallback: Agar HLS me levels nahi hain, toh Firebase wali qualities use karo (Hidden Audio logic)
            else if (videoData.qualities && Object.keys(videoData.qualities).length > 0) {
                Object.keys(videoData.qualities).forEach(q => {
                    const btn = document.createElement('button');
                    btn.innerText = q;
                    btn.className = `setting-btn ${currentQuality === q ? 'active' : ''}`;
                    btn.onclick = (e) => { 
                        e.stopPropagation(); 
                        currentQuality = q; 
                        Array.from(qualityOptions.children).forEach(c => c.classList.remove('active'));
                        btn.classList.add('active');
                        
                        const previousTime = video.currentTime;
                        const wasPlaying = !video.paused;

                        if(hls) { hls.destroy(); }
                        hls = new Hls({ enableWorker: true });
                        hls.loadSource(videoData.qualities[q]);
                        hls.attachMedia(video);
                        
                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            if (previousTime > 0) video.currentTime = previousTime;
                            if (wasPlaying) video.play();
                        });
                        
                        setTimeout(closeAllMenus, 300);
                    };
                    qualityOptions.appendChild(btn);
                });
            }

            // 🔥 2. AUDIO TRACKS FIX 🔥
            const audioOptions = document.getElementById('audioOptions');
            audioOptions.innerHTML = '';
            isHiddenAudioActive = false;

            // Pehle check karo ki HLS Master link me audio tracks hain ya nahi
            if (hls.audioTracks && hls.audioTracks.length > 0) {
                video.muted = false; 
                
                hls.audioTracks.forEach((track, index) => {
                    const btn = document.createElement('button');
                    btn.innerText = track.name || track.lang || `Audio ${index + 1}`;
                    btn.className = `setting-btn ${hls.audioTrack === index ? 'active' : ''}`;
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        hls.audioTrack = index; 
                        setAudioActive(audioOptions, btn);
                        setTimeout(closeAllMenus, 300);
                    };
                    audioOptions.appendChild(btn);
                });
                setAudioActive(audioOptions, audioOptions.querySelector('.setting-btn.active'));
            } 
            // Fallback: Hidden Audio (Firebase se alag links)
            else if (videoData.audios && Object.keys(videoData.audios).length > 0) {
                isHiddenAudioActive = true;
                video.muted = true; // Video ko mute rakho taaki double sound na aaye
                const activeLang = videoData.audios[currentAudio] ? currentAudio : Object.keys(videoData.audios)[0];
                currentAudio = activeLang;
                let firstAudioUrl = videoData.audios[activeLang];
                
                audioHls = new Hls({ enableWorker: true, lowLatencyMode: true });
                audioHls.loadSource(firstAudioUrl);
                audioHls.attachMedia(hiddenAudioPlayer);
                
                Object.keys(videoData.audios).forEach(lang => {
                    const btn = document.createElement('button');
                    btn.innerText = lang;
                    btn.className = `setting-btn ${currentAudio === lang ? 'active' : ''}`;
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        currentAudio = lang;
                        
                        const newAudioUrl = videoData.audios[lang];
                        if (audioHls) audioHls.destroy();
                        
                        audioHls = new Hls({ enableWorker: true });
                        audioHls.loadSource(newAudioUrl);
                        audioHls.attachMedia(hiddenAudioPlayer);
                        
                        audioHls.on(Hls.Events.MANIFEST_PARSED, () => {
                            hiddenAudioPlayer.currentTime = video.currentTime;
                            if(!video.paused) hiddenAudioPlayer.play();
                        });

                        setAudioActive(audioOptions, btn);
                        setTimeout(closeAllMenus, 300);
                    };
                    audioOptions.appendChild(btn);
                });
                setAudioActive(audioOptions, audioOptions.querySelector('.setting-btn.active'));
            } else {
                audioOptions.innerHTML = '<p style="font-size:14px; color:#888; padding:15px;">No Audio Tracks</p>';
            }

            // 3. SUBTITLE RENDER
            renderSubtitleMenu(videoData);

            // 🔥 3. PLAY & MUTE FIX 🔥
            video.play().then(() => {
                if (isHiddenAudioActive) {
                    if (hiddenAudioPlayer && hiddenAudioPlayer.src && audioHls) {
                        hiddenAudioPlayer.muted = false;
                        hiddenAudioPlayer.play().then(() => {
                            if(muteBtn) muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
                        }).catch(() => { showTapToPlay(); });
                    }
                } else {
                    if(muteBtn) muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
                }
            }).catch(e => {
                // Refresh par browser sound ke saath autoplay block karta hai
                if (e && e.name === 'NotAllowedError') showTapToPlay();
            });
        });

        // 🔥 AUDIO TRACKS FIX: tracks aksar MANIFEST_PARSED ke baad aate hain 🔥
        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, function() {
            if (!hls || !hls.audioTracks || hls.audioTracks.length === 0) return;

            // HLS ke apne audio tracks mile, to hidden audio fallback band karo
            if (isHiddenAudioActive) {
                isHiddenAudioActive = false;
                if (audioHls) { audioHls.destroy(); audioHls = null; }
                if (hiddenAudioPlayer) {
                    hiddenAudioPlayer.pause();
                    hiddenAudioPlayer.removeAttribute('src');
                }
                video.muted = isMutedByUser;
            }

            const audioOptions = document.getElementById('audioOptions');
            audioOptions.innerHTML = '';
            hls.audioTracks.forEach((track, index) => {
                const btn = document.createElement('button');
                btn.innerText = track.name || track.lang || `Audio ${index + 1}`;
                btn.className = `setting-btn ${hls.audioTrack === index ? 'active' : ''}`;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    hls.audioTrack = index;
                    setAudioActive(audioOptions, btn);
                    setTimeout(closeAllMenus, 300);
                };
                audioOptions.appendChild(btn);
            });
            setAudioActive(audioOptions, audioOptions.querySelector('.setting-btn.active'));
        });

        hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, function(event, data) {
            if (isHiddenAudioActive || !hls || !hls.audioTracks || hls.audioTracks.length === 0) return;
            const audioOptions = document.getElementById('audioOptions');
            const btn = audioOptions && audioOptions.children[data.id];
            if (btn && btn.tagName === 'BUTTON') setAudioActive(audioOptions, btn);
        });

        // 🔥 SUBTITLE FIX: m3u8 ke andar ke subtitle tracks bhi menu me dikhao 🔥
        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, function() {
            renderSubtitleMenu(videoData);
        });

        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
                    case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
                    default: hls.destroy(); break;
                }
            }
        });
    }

    // Global Event Listeners for Hidden Audio (To avoid multiple listeners on Quality change)
    video.addEventListener('play', () => { 
        if(hiddenAudioPlayer && hiddenAudioPlayer.src && audioHls) hiddenAudioPlayer.play(); 
    });
    video.addEventListener('pause', () => { 
        if(hiddenAudioPlayer && hiddenAudioPlayer.src && audioHls) hiddenAudioPlayer.pause(); 
    });
    video.addEventListener('seeked', () => { 
        if(hiddenAudioPlayer && hiddenAudioPlayer.src && audioHls) hiddenAudioPlayer.currentTime = video.currentTime; 
    });

    function loadSpecificTrack(videoData, audioLang, qualityName) {
        if (audioLang !== null) currentAudio = audioLang;
        if (qualityName !== null) currentQuality = qualityName;
        
        let url = "";
        if (qualityName && videoData.qualities && videoData.qualities[qualityName]) {
            url = videoData.qualities[qualityName];
        } else if (audioLang && videoData.audios && videoData.audios[audioLang]) {
            url = videoData.audios[audioLang];
        } else if (videoData.gdrive_id) { 
            url = videoData.gdrive_id;
        }

        if(url) playVideoUrl(url);
        closeAllMenus(); 
    }

    function playVideoUrl(url) {
        if(!url) return;
        
        if (hls) { hls.destroy(); hls = null; }
        if (audioHls) { audioHls.destroy(); audioHls = null; }
        isHiddenAudioActive = false;

        const previousTime = video.currentTime;
        const wasMuted = isMutedByUser;
        const currentVolume = video.volume;
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
            video.muted = wasMuted;
            video.volume = currentVolume;

            if (activeSubtitleUrl) showCustomSubtitle(activeSubtitleUrl); else removeCustomSubtitle();
            
            if (wasPlaying) {
                let playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                        if(muteBtn) muteBtn.innerHTML = wasMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
                    }).catch(e => {
                        if (e && e.name === 'NotAllowedError') showTapToPlay();
                    });
                }
            }
            
            video.onloadedmetadata = null; 
        };
    }

    // 🔥 NO AUTO-MUTE FIX: autoplay block ho to mute nahi karte, "Tap to Play" dikhate hain 🔥
    function showTapToPlay() {
        // Sound ON rakho, video ruka rahe jab tak user tap na kare
        video.pause();
        if (hiddenAudioPlayer) hiddenAudioPlayer.pause();
        if (isHiddenAudioActive && hiddenAudioPlayer) {
            video.muted = true;               // sound hidden audio se aayegi
            hiddenAudioPlayer.muted = false;
        } else {
            video.muted = false;
        }
        isMutedByUser = false;
        if(muteBtn) muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        if (videoLoader) videoLoader.style.display = 'none';

        let overlay = document.getElementById('tapToPlayOverlay');
        if (!overlay && playerWrapper) {
            overlay = document.createElement('div');
            overlay.id = 'tapToPlayOverlay';
            overlay.style.cssText = 'position:absolute; inset:0; z-index:20; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:rgba(0,0,0,0.55); color:#fff; cursor:pointer;';
            overlay.innerHTML = '<i class="fa-solid fa-circle-play" style="font-size:64px; color:#a855f7;"></i><span style="font-size:14px; font-weight:600;">Tap to Play</span>';
            overlay.addEventListener('click', (e) => {
                e.stopPropagation();
                hideTapToPlay();
                video.play().catch(() => {});
                if (isHiddenAudioActive && hiddenAudioPlayer && hiddenAudioPlayer.src) hiddenAudioPlayer.play().catch(() => {});
            });
            playerWrapper.appendChild(overlay);
        }
        if (overlay) overlay.style.display = 'flex';
    }

    function hideTapToPlay() {
        const overlay = document.getElementById('tapToPlayOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    function showUnmuteHint() {
        let hint = document.getElementById('unmuteHint');
        if(!hint && playerWrapper) {
            hint = document.createElement('div');
            hint.id = 'unmuteHint';
            hint.style.cssText = "position: absolute; top: 20%; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 8px 15px; border-radius: 20px; font-size: 12px; z-index: 999; pointer-events: none; transition: opacity 0.5s;";
            hint.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Tap speaker to Unmute';
            playerWrapper.appendChild(hint);
        }
        if(hint) {
            hint.style.opacity = '1';
            setTimeout(() => { hint.style.opacity = '0'; }, 3000);
        }
    }

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
    video.addEventListener('playing', () => { if(videoLoader) videoLoader.style.display = 'none'; hideTapToPlay(); });

    video.addEventListener('play', () => {
        if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        renderWatchEpisodes(); 
    });

    video.addEventListener('pause', () => {
        if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        renderWatchEpisodes(); 
    });

    // 🔥 MUTE BUTTON FIX 🔥
    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (isHiddenAudioActive) {
            // Agar hidden audio chal raha hai
            hiddenAudioPlayer.muted = !hiddenAudioPlayer.muted;
            isMutedByUser = hiddenAudioPlayer.muted;
        } else {
            // Agar normal HLS master link chal raha hai
            video.muted = !video.muted;
            isMutedByUser = video.muted;
        }
        
        if(isMutedByUser) {
            muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        } else {
            muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            // Agar user unmute karta hai aur hidden audio active hai, toh video ko mute hi rakho
            if (isHiddenAudioActive) {
                video.muted = true;
            }
        }
        resetControlTimeout();
    });

    playPauseBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlayPause(); resetControlTimeout(); });

    function togglePlayPause() {
        if (video.paused) video.play(); else video.pause();
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
        if(hiddenAudioPlayer && hiddenAudioPlayer.src && audioHls) hiddenAudioPlayer.currentTime = video.currentTime;
    });
    
    skipForwardBtn.addEventListener('click', (e) => { 
        e.stopPropagation(); video.currentTime += 10; 
        if(hiddenAudioPlayer && hiddenAudioPlayer.src && audioHls) hiddenAudioPlayer.currentTime = video.currentTime;
        resetControlTimeout(); 
    });
    
    skipBackBtn.addEventListener('click', (e) => { 
        e.stopPropagation(); video.currentTime -= 10; 
        if(hiddenAudioPlayer && hiddenAudioPlayer.src && audioHls) hiddenAudioPlayer.currentTime = video.currentTime;
        resetControlTimeout(); 
    });

    fullscreenBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            try { await playerWrapper.requestFullscreen(); if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (err) {}
        } else { document.exitFullscreen(); if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }
        resetControlTimeout();
    });

    let controlTimeout;

    function showControls() { controlsBar.classList.remove('hidden'); topControls.classList.remove('hidden'); resetControlTimeout(); }
    function hideControls() { if (!video.paused) { controlsBar.classList.add('hidden'); topControls.classList.add('hidden'); closeAllMenus(); } }
    function resetControlTimeout() { clearTimeout(controlTimeout); if (!video.paused) { controlTimeout = setTimeout(hideControls, 3000); } }

    video.addEventListener('pause', () => { clearTimeout(controlTimeout); showControls(); });

    let lastTap = 0;
    
    function handleTap(overlay, action) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            if (action === 'left') {
                video.currentTime = Math.max(0, video.currentTime - 10);
                if(hiddenAudioPlayer && hiddenAudioPlayer.src && audioHls) hiddenAudioPlayer.currentTime = video.currentTime;
                overlay.querySelector('.tap-feedback').innerHTML = '<i class="fa-solid fa-backward"></i> 10s';
            } else if (action === 'right') {
                video.currentTime = Math.min(video.duration, video.currentTime + 10);
                if(hiddenAudioPlayer && hiddenAudioPlayer.src && audioHls) hiddenAudioPlayer.currentTime = video.currentTime;
                overlay.querySelector('.tap-feedback').innerHTML = '10s <i class="fa-solid fa-forward"></i>';
            } else if (action === 'center') {
                togglePlayPause();
                centerFeedbackIcon.innerHTML = video.paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
            }
            overlay.classList.add('active');
            setTimeout(() => { overlay.classList.remove('active'); }, 500);
        } else {
            if (controlsBar.classList.contains('hidden')) showControls(); else { if (!video.paused) hideControls(); }
        }
        lastTap = currentTime;
    }

    if(leftOverlay) leftOverlay.addEventListener('click', () => handleTap(leftOverlay, 'left'));
    if(rightOverlay) rightOverlay.addEventListener('click', () => handleTap(rightOverlay, 'right'));
    if(centerOverlay) centerOverlay.addEventListener('click', () => handleTap(centerOverlay, 'center'));

    showControls();
}

// ================= 7. COMMENT SYSTEM =================
if (document.getElementById('customVideo') && database) {
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id'); 
    const commentForm = document.getElementById('commentForm');
    const commentsList = document.getElementById('commentsList');
    const openCommentsBtn = document.getElementById('openCommentsBtn');
    const closeCommentsBtn = document.getElementById('closeCommentsBtn');
    const bottomSheet = document.getElementById('commentsBottomSheet');
    const backdrop = document.getElementById('bottomSheetBackdrop');

    if(openCommentsBtn && bottomSheet) {
        openCommentsBtn.addEventListener('click', () => { bottomSheet.classList.add('active'); backdrop.classList.add('active'); });
        closeCommentsBtn.addEventListener('click', () => { bottomSheet.classList.remove('active'); backdrop.classList.remove('active'); });
        backdrop.addEventListener('click', () => { bottomSheet.classList.remove('active'); backdrop.classList.remove('active'); });
    }

    let localCommentUserId = localStorage.getItem('commentUserId');
    if (!localCommentUserId) {
        localCommentUserId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('commentUserId', localCommentUserId);
    }

    let isAdmin = false;
    if (typeof firebase.auth === 'function') {
        firebase.auth().onAuthStateChanged((user) => { if (user) { isAdmin = true; if (animeId) loadComments(); } });
    }

    if (commentForm) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            if (!animeId) return;
            const name = document.getElementById('commentName').value.trim();
            const email = document.getElementById('commentEmail').value.trim();
            const text = document.getElementById('commentText').value.trim();
            if(!name || !email || !text) return;

            const submitBtn = commentForm.querySelector('button[type="submit"]');
            if(submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting...'; }

            database.ref('comments/' + animeId).push({
                name: name, email: email, text: text, userId: localCommentUserId,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }).then(() => { 
                commentForm.reset(); 
                if(submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Post Comment'; }
            }).catch(err => {
                if(submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Post Comment'; }
            });
        });
    }

    function loadComments() {
        if (!animeId || !commentsList) return;
        database.ref('comments/' + animeId).on('value', (snapshot) => {
            const commentsData = snapshot.val();
            commentsList.innerHTML = '';
            if (commentsData) {
                const sortedComments = Object.keys(commentsData).map(key => ({ key: key, ...commentsData[key] })).sort((a, b) => b.timestamp - a.timestamp);
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
    if (animeId) loadComments();
}

// ================= 8. CUSTOM CONFIRM MODAL LOGIC =================
let pendingDeleteAction = null;
window.showCustomConfirm = (message, action) => {
    const modal = document.getElementById('customConfirmModal');
    const msgEl = document.getElementById('confirmMessage');
    if (!modal) return; 
    if(msgEl) msgEl.innerText = message;
    pendingDeleteAction = action;
    modal.style.display = 'flex';
};

document.addEventListener('DOMContentLoaded', () => {
    const yesBtn = document.getElementById('confirmYesBtn');
    const noBtn = document.getElementById('confirmNoBtn');
    const modal = document.getElementById('customConfirmModal');
    if (yesBtn && noBtn && modal) {
        yesBtn.addEventListener('click', () => { if (pendingDeleteAction) pendingDeleteAction(); modal.style.display = 'none'; pendingDeleteAction = null; });
        noBtn.addEventListener('click', () => { modal.style.display = 'none'; pendingDeleteAction = null; });
        modal.addEventListener('click', (e) => { if (e.target === modal) { modal.style.display = 'none'; pendingDeleteAction = null; } });
    }
});

window.deleteComment = (animeId, commentKey) => {
    showCustomConfirm("Are you sure you want to delete this comment permanently?", () => {
        database.ref(`comments/${animeId}/${commentKey}`).remove();
    });
};
