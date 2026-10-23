// ================= 1. DUMMY DATA (ANIME) =================
const animeDatabase = [
    { title: "Solo Leveling", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVistBjvjjsTvMYAczgOZ7jv8d4hxGEO8nS8iPpCkSVQ&s=10", id: "GDRIVE_ID_SOLOLEVELING" },
    { title: "Demon Slayer", image: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg", id: "GDRIVE_ID_DEMONSLAYER" },
    { title: "Attack on Titan", image: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg", id: "GDRIVE_ID_AOT" },
    { title: "One Piece", image: "https://image.tmdb.org/t/p/w500/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg", id: "GDRIVE_ID_ONEPIECE" },
    { title: "Spy x Family", image: "https://image.tmdb.org/t/p/w500/7m8pP0R4y5I5z3x2c1v0b9n8m7.jpg", id: "GDRIVE_ID_SPYFAMILY" },
    { title: "Jujutsu Kaisen", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTh3hSw1X2eKkBBNgd3rEtwENN-wnk38NLfJMpUoPiNlw&s=10", id: "GDRIVE_ID_JUJUTSU" },
    { title: "Naruto", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcAKuYWXQrNb83dn8l0C9PCjYvUrsYBfO63qTUMIujTg&s=10", id: "GDRIVE_ID_NARUTO" }
];

// ================= 2. DUMMY DATA (MOVIES) =================
const movieDatabase = [
    { title: "Jawan", image: "https://image.tmdb.org/t/p/w500/jJ63h5Gq6o8yG7x6s5d4f3g2h1.jpg", id: "MOVIE_JAWAN" },
    { title: "Pathaan", image: "https://image.tmdb.org/t/p/w500/7m8pP0R4y5I5z3x2c1v0b9n8m7.jpg", id: "MOVIE_PATHAAN" },
    { title: "Interstellar", image: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", id: "MOVIE_INTERSTELLAR" },
    { title: "Inception", image: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", id: "MOVIE_INCEPTION" },
    { title: "Your Name", image: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg", id: "MOVIE_YOURNAME" },
    { title: "Spirited Away", image: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", id: "MOVIE_SPIRITEDAWAY" }
];

// Search bar me dono (Anime + Movies) ek sath search ho sake
const allContentDatabase = [...animeDatabase, ...movieDatabase];

// ================= 3. DOM ELEMENTS =================
const searchPanel = document.getElementById('searchPanel');
const openSearchBtn = document.getElementById('openSearchBtn');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// ================= 4. SEARCH PANEL LOGIC =================
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
            item.title.toLowerCase().includes(query)
        );

        renderSearchResults(filteredContent);
    });
}

// ================= 5. RESULT RENDER FUNCTION (For Search) =================
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

// ================= 6. ANIME GRID PAGE LOGIC (anime.html) =================
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

// ================= 7. MOVIES GRID PAGE LOGIC (movies.html) =================
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

// ================= 8. ANIME DETAILS PAGE LOGIC (anime-details.html) =================
const animeDetailsDB = {
    "GDRIVE_ID_SOLOLEVELING": {
        title: "Solo Leveling",
        banner: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVistBjvjjsTvMYAczgOZ7jv8d4hxGEO8nS8iPpCkSVQ&s=10",
        poster: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVistBjvjjsTvMYAczgOZ7jv8d4hxGEO8nS8iPpCkSVQ&s=10",
        rating: "8.8",
        year: "2024",
        genres: ["Action", "Fantasy"],
        synopsis: "In a world where hunters with magical powers must battle deadly monsters to protect the human race, Sung Jinwoo, a notoriously weak hunter, finds himself in a struggle for survival.",
        episodes: [
            { ep: 1, title: "I'm Used to It", gdrive_id: "TEST_VIDEO_ID" },
            { ep: 2, title: "If I Had One More Chance", gdrive_id: "TEST_VIDEO_ID" }
        ]
    },
    "GDRIVE_ID_DEMONSLAYER": {
        title: "Demon Slayer",
        banner: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
        poster: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
        rating: "8.9",
        year: "2019",
        genres: ["Action", "Supernatural"],
        synopsis: "Tanjiro Kamado becomes a demon slayer after his family is slaughtered and his sister is turned into a demon.",
        episodes: [
            { ep: 1, title: "Cruelty", gdrive_id: "TEST_VIDEO_ID" }
        ]
    }
};

// DOMContentLoaded lagaya hai taaki elements load hone ke baad hi script chale
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('detailTitle')) {
        const urlParams = new URLSearchParams(window.location.search);
        const detailAnimeId = urlParams.get('id');

        // Check karein agar URL me id nahi hai
        if (!detailAnimeId) {
            document.getElementById('detailTitle').innerText = "No Anime Selected";
            document.getElementById('detailSynopsis').innerText = "Please go back and select an anime or movie from the home page.";
            document.getElementById('episodeList').innerHTML = "<p style='color:#666;'>No episodes to display.</p>";
            document.getElementById('detailPoster').style.display = 'none'; // Hide empty poster
            return;
        }

        const data = animeDetailsDB[detailAnimeId];

        if (!data) {
            document.getElementById('detailTitle').innerText = "Anime Not Found";
            document.getElementById('detailSynopsis').innerText = "Content does not exist in our database.";
            document.getElementById('episodeList').innerHTML = "";
        } else {
            document.title = `${data.title} - Anime Max Zone`;
            document.getElementById('detailBanner').style.backgroundImage = `url(${data.banner})`;
            document.getElementById('detailPoster').src = data.poster;
            document.getElementById('detailTitle').innerText = data.title;
            document.getElementById('detailRating').innerText = data.rating;
            document.getElementById('detailYear').innerText = data.year;
            document.getElementById('detailSynopsis').innerText = data.synopsis;

            document.getElementById('detailGenres').innerHTML = data.genres.map(g => `<span class="genre-tag">${g}</span>`).join('');

            const episodeList = document.getElementById('episodeList');
            document.getElementById('episodeCount').innerText = `${data.episodes.length} Episodes`;
            episodeList.innerHTML = '';

            data.episodes.forEach(episode => {
                const epCard = document.createElement('a');
                epCard.href = `watch.html?id=${episode.gdrive_id}&title=${encodeURIComponent(data.title + ' - Ep ' + episode.ep)}`; 
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
        }
    }
});

// ================= 9. WATCH PAGE (CUSTOM VIDEO PLAYER) =================
if (document.getElementById('customVideo')) {
    const video = document.getElementById('customVideo');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const seekBar = document.getElementById('seekBar');
    const timeDisplay = document.getElementById('timeDisplay');
    const muteBtn = document.getElementById('muteBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const skipBackBtn = document.getElementById('skipBackBtn');
    const skipForwardBtn = document.getElementById('skipForwardBtn');
    const controlsBar = document.getElementById('controlsBar');
    const playerWrapper = document.getElementById('playerWrapper');
    const videoLoader = document.getElementById('videoLoader');

    const watchUrlParams = new URLSearchParams(window.location.search);
    let videoId = watchUrlParams.get('id');
    let videoTitle = watchUrlParams.get('title') || "Now Playing";
    
    const titleTag = document.querySelector('.video-info-section h2');
    if(titleTag) titleTag.innerText = videoTitle;

    let finalVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    
    if (videoId && !videoId.includes("TEST_VIDEO_ID")) {
        function extractFileId(url) {
            const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/];
            for (let pattern of patterns) {
                const match = url.match(pattern);
                if (match) return match[1];
            }
            return url;
        }
        let fileId = extractFileId(videoId);
        const API_KEY = "YOUR_GOOGLE_DRIVE_API_KEY"; 
        finalVideoUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
    }

    video.src = finalVideoUrl;
    videoLoader.style.display = 'block';

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
