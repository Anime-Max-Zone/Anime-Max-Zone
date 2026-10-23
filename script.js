// ================= 1. DUMMY DATA =================
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

// ================= 2. DOM ELEMENTS =================
const searchPanel = document.getElementById('searchPanel');
const openSearchBtn = document.getElementById('openSearchBtn');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// ================= 3. SEARCH PANEL LOGIC =================
// Check karein ki elements exist karte hain (Safety check)
if (openSearchBtn && searchPanel) {
    
    // Open Panel
    openSearchBtn.addEventListener('click', () => {
        searchPanel.classList.add('active');
        // Thoda delay taaki animation complete ho jaye, phir keyboard open ho
        setTimeout(() => {
            searchInput.focus(); 
        }, 300);
    });

    // Close Panel
    closeSearchBtn.addEventListener('click', () => {
        searchPanel.classList.remove('active');
        
        // Panel band hone ke baad usko reset karein
        setTimeout(() => {
            searchInput.value = ''; 
            searchResults.innerHTML = '<p class="search-hint">Start typing to search...</p>';
        }, 300);
    });

    // LIVE SUGGESTION LOGIC (Input event)
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        // Agar input khali hai toh hint dikhao
        if (query === '') {
            searchResults.innerHTML = '<p class="search-hint">Start typing to search...</p>';
            return;
        }

        // Database me se title ko match karo
        const filteredAnime = animeDatabase.filter(anime => 
            anime.title.toLowerCase().includes(query)
        );

        // Result render karo
        renderSearchResults(filteredAnime);
    });
}

// ================= 4. RESULT RENDER FUNCTION (For Search) =================
function renderSearchResults(results) {
    if (!searchResults) return; // Safety check

    searchResults.innerHTML = ''; // Pehle clear karo

    // Agar kuch na mile
    if (results.length === 0) {
        searchResults.innerHTML = `<p class="search-hint">No results found for "${searchInput.value}"</p>`;
        return;
    }

    // Agar mile toh loop chalao
    results.forEach(anime => {
        // Har result ke liye ek clickable link banaya
        const item = document.createElement('a');
        // Yahan aap anime-details.html?id=... bhi kar sakte hain agar wo page use kar rahe hain
        item.href = `watch.html?id=${anime.id}`; 
        item.className = 'search-item';
        
        // HTML structure
        item.innerHTML = `
            <img src="${anime.image}" alt="${anime.title}">
            <div class="search-item-info">
                <h3>${anime.title}</h3>
                <p>Tap to watch</p>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
        `;
        
        // List me add karo
        searchResults.appendChild(item);
    });
}

// ================= 5. ANIME GRID PAGE LOGIC =================
// Ye code check karega ki kya hum Anime page (anime.html) par hain
const animeGridContainer = document.getElementById('animeGrid');

if (animeGridContainer) {
    // Agar grid container mil gaya, toh saare anime render karo
    animeDatabase.forEach(anime => {
        // Card banayein
        const card = document.createElement('a');
        card.href = `watch.html?id=${anime.id}`; // Click karne par watch page khulega
        card.className = 'grid-card';
        
        card.innerHTML = `
            <img src="${anime.image}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/150x225?text=No+Image'">
            <div class="grid-card-title">${anime.title}</div>
        `;
        
        // Grid me card add karein
        animeGridContainer.appendChild(card);
    });
}
