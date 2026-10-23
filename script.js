// ================= 1. DUMMY DATA (ANIME & MOVIES) =================
const animeDatabase = [
    { title: "Solo Leveling", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVistBjvjjsTvMYAczgOZ7jv8d4hxGEO8nS8iPpCkSVQ&s=10", id: "GDRIVE_ID_SOLOLEVELING" },
    { title: "Demon Slayer", image: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg", id: "GDRIVE_ID_DEMONSLAYER" },
    { title: "Attack on Titan", image: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg", id: "GDRIVE_ID_AOT" },
    { title: "One Piece", image: "https://image.tmdb.org/t/p/w500/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg", id: "GDRIVE_ID_ONEPIECE" },
    { title: "Spy x Family", image: "https://image.tmdb.org/t/p/w500/7m8pP0R4y5I5z3x2c1v0b9n8m7.jpg", id: "GDRIVE_ID_SPYFAMILY" },
    { title: "Jujutsu Kaisen", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTh3hSw1X2eKkBBNgd3rEtwENN-wnk38NLfJMpUoPiNlw&s=10", id: "GDRIVE_ID_JUJUTSU" },
    { title: "Naruto", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcAKuYWXQrNb83dn8l0C9PCjYvUrsYBfO63qTUMIujTg&s=10", id: "GDRIVE_ID_NARUTO" }
];

const movieDatabase = [
    { title: "Jawan", image: "https://image.tmdb.org/t/p/w500/jJ63h5Gq6o8yG7x6s5d4f3g2h1.jpg", id: "MOVIE_JAWAN" },
    { title: "Pathaan", image: "https://image.tmdb.org/t/p/w500/7m8pP0R4y5I5z3x2c1v0b9n8m7.jpg", id: "MOVIE_PATHAAN" },
    { title: "Interstellar", image: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", id: "MOVIE_INTERSTELLAR" },
    { title: "Inception", image: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", id: "MOVIE_INCEPTION" },
    { title: "Your Name", image: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg", id: "MOVIE_YOURNAME" },
    { title: "Spirited Away", image: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", id: "MOVIE_SPIRITEDAWAY" }
];

const allContentDatabase = [...animeDatabase, ...movieDatabase];

// ================= 2. DOM ELEMENTS & SEARCH =================
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
        const filteredContent = allContentDatabase.filter(item => item.title.toLowerCase().includes(query));
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
        link.href = `anime-details.html?id=${item.id}`; 
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

// ================= 3. GRID PAGES LOGIC =================
const animeGridContainer = document.getElementById('animeGrid');
if (animeGridContainer) {
    animeDatabase.forEach(anime => {
        const card = document.createElement('a');
        card.href = `anime-details.html?id=${anime.id}`; 
        card.className = 'grid-card';
        card.innerHTML = `
            <img src="${anime.image}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/150x225?text=No+Image'">
            <div class="grid-card-title">${anime.title}</div>
        `;
        animeGridContainer.appendChild(card);
    });
}

const movieGridContainer = document.getElementById('movieGrid');
if (movieGridContainer) {
    movieDatabase.forEach(movie => {
        const card = document.createElement('a');
        card.href = `anime-details.html?id=${movie.id}`; 
        card.className = 'grid-card';
        card.innerHTML = `
            <img src="${movie.image}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/150x225?text=No+Image'">
            <div class="grid-card-title">${movie.title}</div>
        `;
        movieGridContainer.appendChild(card);
    });
}

// ================= 4. NEW DATABASE WITH SEASONS =================
// Yahan maine Episodes ko Seasons ke andar daal diya hai
const animeDetailsDB = {
    "GDRIVE_ID_SOLOLEVELING": {
        title: "Solo Leveling",
        banner: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVistBjvjjsTvMYAczgOZ7jv8d4hxGEO8nS8iPpCkSVQ&s=10",
        poster: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVistBjvjjsTvMYAczgOZ7jv8d4hxGEO8nS8iPpCkSVQ&s=10",
        rating: "8.8",
        year: "2024",
        genres: ["Action", "Fantasy"],
        synopsis: "In a world where hunters with magical powers must battle deadly monsters to protect the human race, Sung Jinwoo, a notoriously weak hunter, finds himself in a struggle for survival.",
        seasons: {
            "Season 1": [
                { ep: 1, title: "I'm Used to It", gdrive_id: "TEST_VIDEO_ID_1" },
                { ep: 2, title: "If I Had One More Chance", gdrive_id: "TEST_VIDEO_ID_2" }
            ],
            "Season 2": [
                { ep: 1, title: "New Beginning", gdrive_id: "TEST_VIDEO_ID_3" }
            ]
        }
    },
    "GDRIVE_ID_DEMONSLAYER": {
        title: "Demon Slayer",
        banner: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
        poster: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
        rating: "8.9",
        year: "2019",
        genres: ["Action", "Supernatural"],
        synopsis: "Tanjiro Kamado becomes a demon slayer after his family is slaughtered and his sister is turned into a demon.",
        seasons: {
            "Season 1": [
                { ep: 1, title: "Cruelty", gdrive_id: "TEST_VIDEO_ID_4" },
                { ep: 2, title: "Trainer Sakonji Urokodaki", gdrive_id: "TEST_VIDEO_ID_5" }
            ]
        }
    }
};

// ================= 5. DETAILS PAGE LOGIC =================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('detailTitle')) {
        const urlParams = new URLSearchParams(window.location.search);
        const detailAnimeId = urlParams.get('id');

        if (!detailAnimeId || !animeDetailsDB[detailAnimeId]) {
            document.getElementById('detailTitle').innerText = "Anime Not Found";
            document.getElementById('detailSynopsis').innerText = "Please go back and select from home page.";
            document.getElementById('detailPoster').style.display = 'none';
            return;
        }

        const data = animeDetailsDB[detailAnimeId];
        
        document.title = `${data.title} - Anime Max Zone`;
        document.getElementById('detailBanner').style.backgroundImage = `url(${data.banner})`;
        document.getElementById('detailPoster').src = data.poster;
        document.getElementById('detailTitle').innerText = data.title;
        document.getElementById('detailRating').innerText = data.rating;
        document.getElementById('detailYear').innerText = data.year;
        document.getElementById('detailSynopsis').innerText = data.synopsis;
        document.getElementById('detailGenres').innerHTML = data.genres.map(g => `<span class="genre-tag">${g}</span>`).join('');

        const episodeList = document.getElementById('episodeList');
        let totalEps = 0;
        
        // Saare seasons ke total episodes count karein
        Object.keys(data.seasons).forEach(season => { totalEps += data.seasons[season].length; });
        document.getElementById('episodeCount').innerText = `${totalEps} Episodes`;
        episodeList.innerHTML = '';

        // Details page par Default: Season 1 ke episodes dikhayenge
        const firstSeason = Object.keys(data.seasons)[0];
        if (firstSeason) {
            data.seasons[firstSeason].forEach(episode => {
                const epCard = document.createElement('a');
                // Watch page link me Anime ID aur Episode ID dono bhej rahe hain
                epCard.href = `watch.html?id=${detailAnimeId}&ep=${episode.gdrive_id}`; 
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

// ================= 6. WATCH PAGE (CUSTOM PLAYER + SEASONS) =================
if (document.getElementById('customVideo')) {
    const video = document.getElementById('customVideo');
    const videoLoader = document.getElementById('videoLoader');
    const seasonTabs = document.getElementById('seasonTabs');
    const episodeListContainer = document.getElementById('watchEpisodeList');
    const watchAnimeTitle = document.getElementById('watchAnimeTitle');
    const watchAnimeDesc = document.getElementById('watchAnimeDesc');

    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id'); // Anime ki ID (e.g. GDRIVE_ID_SOLOLEVELING)
    const currentEpId = urlParams.get('ep'); // Jo episode abhi play ho raha hai

    const animeData = animeDetailsDB[animeId];

    if (animeData) {
        // 1. Title aur Description set karein
        watchAnimeTitle.innerText = animeData.title;
        watchAnimeDesc.innerText = animeData.synopsis;
        
        // Browser Tab ka naam change karein
        document.title = `${animeData.title} - Anime Max Zone`;

        let activeSeason = Object.keys(animeData.seasons)[0]; // Default Season 1
        let activeEpId = currentEpId;

        // Agar URL me EP ID nahi hai, toh Season 1 ka pehla episode utha lo
        if (!activeEpId) {
            activeEpId = animeData.seasons[activeSeason][0].gdrive_id;
        }

        // Video Load Function
        function loadVideo(epId) {
            let finalUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
            
            // Asli GDrive ID logic (Test ID ko ignore karega)
            if (epId && !epId.includes("TEST_VIDEO_ID")) {
                function extractFileId(url) {
                    const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/];
                    for (let pattern of patterns) {
                        const match = url.match(pattern);
                        if (match) return match[1];
                    }
                    return url;
                }
                let fileId = extractFileId(epId);
                const API_KEY = "YOUR_GOOGLE_DRIVE_API_KEY"; 
                finalUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
            }
            
            videoLoader.style.display = 'block';
            video.src = finalUrl;
            video.play().catch(e => console.log("Autoplay blocked by browser", e));
        }

        // Season Tabs Render Function
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

        // Episodes Render Function (Selected Season ke hisaab se)
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

                // Click karne par video change karein bina page reload kiye
                card.addEventListener('click', () => {
                    activeEpId = ep.gdrive_id;
                    loadVideo(activeEpId); 
                    renderEpisodes(); // Highlight update karein
                    
                    // URL update karein
                    const newUrl = `watch.html?id=${animeId}&ep=${activeEpId}`;
                    window.history.pushState({path: newUrl}, '', newUrl);
                });

                episodeListContainer.appendChild(card);
            });
        }

        // Initialize Watch Page Data
        renderSeasons();
        renderEpisodes();
        loadVideo(activeEpId);

    } else {
        watchAnimeTitle.innerText = "Video Not Found";
        watchAnimeDesc.innerText = "The requested anime or movie does not exist.";
    }

    // ================= PLAYER CUSTOM CONTROLS =================
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

    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) playerWrapper.requestFullscreen();
        else document.exitFullscreen();
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
