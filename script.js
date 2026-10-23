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
            latestContainer.innerHTML = ''; onAirContainer.innerHTML = ''; newArrivalsContainer.innerHTML = '';

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

            // Details Update
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

            // Agar Movie hai toh watch page ka direct button ya hide episodes
            if (data.type === 'movie' || !data.seasons) {
                if (episodesSection) episodesSection.style.display = 'none';
                // Ek "Watch Now" button add kar sakte hain yahan
                const watchBtn = document.createElement('a');
                watchBtn.href = `watch.html?id=${animeId}`;
                watchBtn.className = 'admin-btn'; // Reusing button style
                watchBtn.style.display = 'block';
                watchBtn.style.textAlign = 'center';
                watchBtn.style.marginTop = '20px';
                watchBtn.innerHTML = `<i class="fa-solid fa-play"></i> Watch Movie Now`;
                document.querySelector('.synopsis-section').appendChild(watchBtn);

            } else {
                if (episodesSection) episodesSection.style.display = 'block';
                let totalEps = 0;
                episodeList.innerHTML = '';

                // Loop through all seasons
                Object.keys(data.seasons).forEach(seasonName => {
                    const episodesObj = data.seasons[seasonName];
                    const epArray = Object.keys(episodesObj).map(k => ({ firebaseKey: k, ...episodesObj[k] }));
                    totalEps += epArray.length;

                    // Season Header (optional)
                    if (Object.keys(data.seasons).length > 1) {
                        episodeList.innerHTML += `<h4 style="color:#a855f7; margin: 10px 0 5px 0; font-size: 14px;">${seasonName}</h4>`;
                    }

                    epArray.forEach(episode => {
                        const epCard = document.createElement('a');
                        // Link now passes: id, season and episode key
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
    
    // Get URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id'); 
    const seasonName = urlParams.get('season');
    const epKey = urlParams.get('ep');

    database.ref('content/' + animeId).once('value').then((snapshot) => {
        const animeData = snapshot.val();
        
        if (animeData) {
            document.title = `${animeData.title} - Anime Max Zone`;

            let videoDataToPlay = null;

            // Check: Movie or Anime
            if (animeData.type === 'movie' || !animeData.seasons) {
                videoDataToPlay = animeData; // Movie ke andar hi qualities/audios hain
            } else {
                // Anime Episode
                if (seasonName && epKey && animeData.seasons[seasonName] && animeData.seasons[seasonName][epKey]) {
                    videoDataToPlay = animeData.seasons[seasonName][epKey];
                } else {
                    // Fallback: Play first episode of first season
                    const firstSeason = Object.keys(animeData.seasons)[0];
                    if (firstSeason) {
                        const firstEpKey = Object.keys(animeData.seasons[firstSeason])[0];
                        videoDataToPlay = animeData.seasons[firstSeason][firstEpKey];
                    }
                }
            }

            if (videoDataToPlay) {
                setupPlayer(videoDataToPlay);
            } else {
                console.warn("Video data not found.");
            }
        }
    });

    // ================= PLAYER LOGIC =================
    
    // Settings Menu Toggle
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    if(settingsBtn && settingsMenu) {
        settingsBtn.addEventListener('click', () => {
            settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
        });
    }

    function setupPlayer(videoData) {
        // 1. Audio Setup
        const audioSection = document.getElementById('audioSection');
        const audioOptions = document.getElementById('audioOptions');
        if (videoData.audios && Object.keys(videoData.audios).length > 0) {
            if(audioSection) audioSection.style.display = 'block';
            audioOptions.innerHTML = '';
            Object.keys(videoData.audios).forEach(lang => {
                const btn = document.createElement('button');
                btn.innerText = lang;
                btn.className = 'setting-btn';
                btn.onclick = () => loadSpecificTrack(videoData, lang, currentQuality);
                audioOptions.appendChild(btn);
            });
        }

        // 2. Quality Setup
        const qualitySection = document.getElementById('qualitySection');
        const qualityOptions = document.getElementById('qualityOptions');
        if (videoData.qualities && Object.keys(videoData.qualities).length > 0) {
            if(qualitySection) qualitySection.style.display = 'block';
            qualityOptions.innerHTML = '';
            Object.keys(videoData.qualities).forEach(q => {
                const btn = document.createElement('button');
                btn.innerText = q;
                btn.className = 'setting-btn';
                btn.onclick = () => {
                    currentQuality = q;
                    loadSpecificTrack(videoData, currentAudio, q);
                };
                qualityOptions.appendChild(btn);
            });
        }

        // 3. Subtitle Setup
        const subtitleSection = document.getElementById('subtitleSection');
        const subtitleOptions = document.getElementById('subtitleOptions');
        if (videoData.subtitles && Object.keys(videoData.subtitles).length > 0) {
            if(subtitleSection) subtitleSection.style.display = 'block';
            subtitleOptions.innerHTML = '';
            Object.keys(videoData.subtitles).forEach(sub => {
                const btn = document.createElement('button');
                btn.innerText = sub;
                btn.className = 'setting-btn';
                btn.onclick = () => {
                    const track = document.getElementById('subtitleTrack');
                    if(track) { track.src = videoData.subtitles[sub]; track.style.display = 'block'; }
                    if(settingsMenu) settingsMenu.style.display = 'none';
                };
                subtitleOptions.appendChild(btn);
            });
        }

        // Default Load
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
        }

        if(url) playVideoUrl(url);
        if(settingsMenu) settingsMenu.style.display = 'none';
    }

    // 🔥 GDrive 500MB+ API Extraction Logic 🔥
    function playVideoUrl(url) {
        if(!url) return;
        let finalUrl = url;
        
        // Agar Google Drive ka pura link hai (drive.google.com/file/d/...)
        if (url.includes('drive.google.com')) {
            function extractFileId(link) {
                const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/];
                for (let pattern of patterns) {
                    const match = link.match(pattern);
                    if (match) return match[1];
                }
                return null;
            }
            let fileId = extractFileId(url);
            if(fileId) {
                const API_KEY = "AIzaSyCpfrluxsBhnz48ve9RykIy1IxzbBfk7dA"; 
                finalUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
            }
        } 
        // Agar sirf File ID hai (http se start nahi hota)
        else if (!url.startsWith('http')) {
            const API_KEY = "AIzaSyCpfrluxsBhnz48ve9RykIy1IxzbBfk7dA"; 
            finalUrl = `https://www.googleapis.com/drive/v3/files/${url}?alt=media&key=${API_KEY}`;
        }

        videoLoader.style.display = 'block';
        video.src = finalUrl;
        video.play().catch(e => console.log("Autoplay blocked", e));
    }

    // ================= CUSTOM CONTROLS =================
    const playPauseBtn = document.getElementById('playPauseBtn');
    const seekBar = document.getElementById('seekBar');
    const timeDisplay = document.getElementById('timeDisplay');
    const muteBtn = document.getElementById('muteBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const skipBackBtn = document.getElementById('skipBackBtn');
    const skipForwardBtn = document.getElementById('skipForwardBtn');
    const controlsBar = document.getElementById('controlsBar');
    const playerWrapper = document.getElementById('playerWrapper');

    video.addEventListener('waiting', () => videoLoader.style.display = 'block');
    video.addEventListener('playing', () => videoLoader.style.display = 'none');

    playPauseBtn.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            video.pause();
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    });

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

    seekBar.addEventListener('input', () => video.currentTime = video.duration * (seekBar.value / 100));
    skipForwardBtn.addEventListener('click', () => video.currentTime += 10);
    skipBackBtn.addEventListener('click', () => video.currentTime -= 10);
    
    muteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        muteBtn.innerHTML = video.muted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
    });

    fullscreenBtn.addEventListener('click', async () => {
        if (!document.fullscreenElement) {
            try {
                await playerWrapper.requestFullscreen();
                if (screen.orientation && screen.orientation.lock) {
                    await screen.orientation.lock('landscape');
                }
            } catch (err) {}
        } else {
            document.exitFullscreen();
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        }
    });

    let controlTimeout;
    function showControls() {
        controlsBar.classList.remove('hidden');
        clearTimeout(controlTimeout);
        if (!video.paused) {
            controlTimeout = setTimeout(() => controlsBar.classList.add('hidden'), 3000);
        }
    }
    playerWrapper.addEventListener('mousemove', showControls);
    playerWrapper.addEventListener('touchstart', showControls);
    playerWrapper.addEventListener('click', showControls);
    video.addEventListener('pause', () => {
        clearTimeout(controlTimeout);
        controlsBar.classList.remove('hidden');
    });
}
