// ================= 1. DUMMY DATA (ANIME) =================
// (Baad me aap ise Firebase Realtime Database se fetch kar sakte hain)
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

// Search bar me dono (Anime + Movies) ek sath search ho sake, isliye dono ko mila diya
const allContentDatabase = [...animeDatabase, ...movieDatabase];


// ================= 3. DOM ELEMENTS =================
const searchPanel = document.getElementById('searchPanel');
const openSearchBtn = document.getElementById('openSearchBtn');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');


// ================= 4. SEARCH PANEL LOGIC =================
if (openSearchBtn && searchPanel) {
    
    // Open Panel
    openSearchBtn.addEventListener('click', () => {
        searchPanel.classList.add('active');
        setTimeout(() => {
            searchInput.focus(); 
        }, 300);
    });

    // Close Panel
    closeSearchBtn.addEventListener('click', () => {
        searchPanel.classList.remove('active');
        setTimeout(() => {
            searchInput.value = ''; 
            searchResults.innerHTML = '<p class="search-hint">Start typing to search...</p>';
        }, 300);
    });

    // LIVE SUGGESTION LOGIC
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query === '') {
            searchResults.innerHTML = '<p class="search-hint">Start typing to search...</p>';
            return;
        }

        // Ab hum allContentDatabase (Anime + Movies) me search karenge
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
        link.href = `watch.html?id=${item.id}`; 
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
        card.href = `watch.html?id=${anime.id}`; 
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
        card.href = `watch.html?id=${movie.id}`; 
        card.className = 'grid-card';
        
        card.innerHTML = `
            <img src="${movie.image}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/150x225?text=No+Image'">
            <div class="grid-card-title">${movie.title}</div>
        `;
        
        movieGridContainer.appendChild(card);
    });
}
