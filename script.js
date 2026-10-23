// ================= 1. FIREBASE SETUP (Aapka Real Project) =================
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

// Initialize Firebase (Compat version for HTML/JS)
let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log("Firebase Connected Successfully!");
} catch (error) {
    console.error("Firebase Init Error:", error);
}

// Ye array Firebase se data store karega
let allContentDatabase = [];

// ================= 2. SPLASH SCREEN & INITIAL LOAD =================
document.addEventListener('DOMContentLoaded', () => {
    // Splash Screen Hide (2 second baad)
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        setTimeout(() => splashScreen.classList.add('hidden'), 2000);
    }

    // Firebase se REAL data fetch karein
    if (database) {
        database.ref('content').once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                
                if (data) {
                    // Data mil gaya (Object to Array)
                    allContentDatabase = Object.keys(data).map(key => ({
                        firebaseKey: key,
                        ...data[key]
                    }));
                    console.log("Real Data Loaded:", allContentDatabase);
                    
                    loadHomePageData();
                    initSearchAndGrids();
                } else {
                    console.warn("Database is empty.");
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
        if (el) {
            el.innerHTML = `<p style="color:#888; padding: 20px; width:100%; text-align:center;">No Content Available. Please add data in Firebase Console.</p>`;
        }
    });
}

// ================= 3. HOME PAGE DATA RENDER =================
function loadHomePageData() {
    const latestContainer = document.getElementById('latestContainer');
    const onAirContainer = document.getElementById('onAirContainer');
    const newArrivalsContainer = document.getElementById('newArrivalsContainer');

    if (latestContainer && onAirContainer && newArrivalsContainer) {
        setTimeout(() => {
            latestContainer.innerHTML = '';
            onAirContainer.innerHTML = '';
            newArrivalsContainer.innerHTML = '';

            // Data ko sections me divide karein
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

        }, 1000); // Shimmer effect ke liye delay
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
            const filteredContent = allContentDatabase.filter(item => 
                item.title && item.title.toLowerCase().includes(query)
            );
            renderSearchResults(filteredContent);
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

    // --- ANIME GRID PAGE ---
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

    // --- MOVIES GRID PAGE ---
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
        const urlParams = new URLSearchParams(window.location.search);
        const animeId = urlParams.get('id');

        if (!animeId) {
            document.getElementById('detailTitle').innerText = "No ID Provided";
            return;
        }

        database.ref('content/' + animeId).once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                
                if (!data) {
                    document.getElementById('detailTitle').innerText = "Content Not Found";
                    document.getElementById('detailSynopsis').innerText = "This content does not exist in database.";
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

                // Movie Logic
                if (data.type === 'movie' || !data.seasons) {
                    if (episodesSection) episodesSection.style.display = 'none';
                } else {
                    if (episodesSection) episodesSection.style.display = 'block';
                    let totalEps = 0;
                    Object.keys(data.seasons).forEach(season => { totalEps += data.seasons[season].length; });
                    document.getElementById('episodeCount').innerText = `${totalEps} Episodes`;
                    episodeList.innerHTML = '';

                    const firstSeason = Object.keys(data.seasons)[0];
                    if (firstSeason) {
                        data.seasons[firstSeason].forEach(episode => {
                            const epCard = document.createElement('a');
                            epCard.href = `watch.html?id=${animeId}&ep=${episode.gdrive_id}`; 
                            epCard.className = 'episode-card';
                            epCard.innerHTML = `
                                <div class="ep-play-icon"><i class="fa-solid fa-play"></i></div>
                                <div class="ep-info">
                                    <h4>${firstSeason} - Episode ${episode.ep}</h4>
                                    <p>${episode.title}</p>
                                </div>
                                <i class="fa-solid fa-chevron-right ep-arrow"></i>
                            `;
                            episodeList.appendChild(epCard);
                        });
                    }
                }
            });
    }
});

// ================= 6. WATCH PAGE (PLAYER) =================
if (document.getElementById('customVideo') && database) {
    const video = document.getElementById('customVideo');
    const videoLoader = document.getElementById('videoLoader');
    const seasonTabs = document.getElementById('seasonTabs');
    const episodeListContainer = document.getElementById('watchEpisodeList');
    const watchAnimeTitle = document.getElementById('watchAnimeTitle');
    const watchAnimeDesc = document.getElementById('watchAnimeDesc');

    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id'); 
    const currentEpId = urlParams.get('ep'); 

    database.ref('content/' + animeId).once('value').then((snapshot) => {
        const animeData = snapshot.val();
        
        if (animeData) {
            watchAnimeTitle.innerText = animeData.title;
            watchAnimeDesc.innerText = animeData.synopsis || "No description available.";
            document.title = `${animeData.title} - Anime Max Zone`;

            // Movie Logic (No Seasons/Episodes)
            if (animeData.type === 'movie' || !animeData.seasons) {
                if(seasonTabs) seasonTabs.style.display = 'none';
                if(episodeListContainer) episodeListContainer.style.display = 'none';
                let movieVideoId = currentEpId || animeData.gdrive_id || animeData.video_url;
                loadVideo(movieVideoId);
            } else {
                if(seasonTabs) seasonTabs.style.display = 'flex';
                if(episodeListContainer) episodeListContainer.style.display = 'block';

                let activeSeason = Object.keys(animeData.seasons)[0];
                let activeEpId = currentEpId || animeData.seasons[activeSeason][0].gdrive_id;

                function renderSeasons() {
                    seasonTabs.innerHTML = '';
                    Object.keys(animeData.seasons).forEach(seasonName => {
                        const btn = document.createElement('button');
                        btn.className = `season-btn ${seasonName === activeSeason ? 'active' : ''}`;
                        btn.innerText = seasonName;
                        btn.addEventListener('click', () => {
                            activeSeason = seasonName;
                            renderSeasons(); 
                            renderEpisodes(); 
                        });
                        seasonTabs.appendChild(btn);
                    });
                }

                function renderEpisodes() {
                    episodeListContainer.innerHTML = '';
                    const episodes = animeData.seasons[activeSeason];
                    episodes.forEach(ep => {
                        const isPlaying = (ep.gdrive_id === activeEpId);
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
                            activeEpId = ep.gdrive_id;
                            loadVideo(activeEpId); 
                            renderEpisodes(); 
                            window.history.pushState({path: `watch.html?id=${animeId}&ep=${activeEpId}`}, '', `watch.html?id=${animeId}&ep=${activeEpId}`);
                        });
                        episodeListContainer.appendChild(card);
                    });
                }
                renderSeasons();
                renderEpisodes();
                loadVideo(activeEpId);
            }
        }
    });

    function loadVideo(epId) {
        let finalUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"; 
        
        if (epId && epId.length > 10) {
            function extractFileId(url) {
                const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/];
                for (let pattern of patterns) {
                    const match = url.match(pattern);
                    if (match) return match[1];
                }
                return url;
            }
            let fileId = extractFileId(epId);
            const API_KEY = "AIzaSyCpfrluxsBhnz48ve9RykIy1IxzbBfk7dA"; // Your Google API Key
            finalUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
        }
        
        videoLoader.style.display = 'block';
        video.src = finalUrl;
        video.play().catch(e => console.log("Autoplay blocked", e));
    }

    // CONTROLS LOGIC
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
