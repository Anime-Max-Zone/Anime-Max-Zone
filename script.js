// 1. Dummy Data for Live Search (Baad me aap ise Firebase se fetch kar sakte hain)
const animeDatabase = [
    { title: "One Piece", image: "https://image.tmdb.org/t/p/w500/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg", id: "GDRIVE_ID_ONEPIECE" },
    { title: "Spy x Family", image: "https://image.tmdb.org/t/p/w500/7m8pP0R4y5I5z3x2c1v0b9n8m7.jpg", id: "GDRIVE_ID_SPYFAMILY" },
    { title: "Jujutsu Kaisen", image: "https://image.tmdb.org/t/p/w500/6b7n8m9k0l1j2h3g4f5d6s7a8q.jpg", id: "GDRIVE_ID_JUJUTSU" },
    { title: "Solo Leveling", image: "https://image.tmdb.org/t/p/w500/geO8mHj2B8sP8y6m7x1g2c3v4b5.jpg", id: "GDRIVE_ID_SOLOLEVELING" },
    { title: "Demon Slayer", image: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg", id: "GDRIVE_ID_DEMONSLAYER" },
    { title: "Attack on Titan", image: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg", id: "GDRIVE_ID_AOT" },
    { title: "Ben 10", image: "https://image.tmdb.org/t/p/w500/9k8j7h6g5f4d3s2a1q0w9e8r7t.jpg", id: "GDRIVE_ID_BEN10" }
];

// 2. DOM Elements Get Karna
const searchPanel = document.getElementById('searchPanel');
const openSearchBtn = document.getElementById('openSearchBtn');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// 3. Panel Open/Close Logic
openSearchBtn.addEventListener('click', () => {
    searchPanel.classList.add('active');
    searchInput.focus(); // Input pe automatic cursor aayega
});

closeSearchBtn.addEventListener('click', () => {
    searchPanel.classList.remove('active');
    searchInput.value = ''; // Close karne par input clear
    searchResults.innerHTML = '<p class="search-hint">Start typing to search...</p>';
});

// 4. Live Suggestion Logic (Input event)
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    // Agar input khali hai toh hint dikhao
    if (query === '') {
        searchResults.innerHTML = '<p class="search-hint">Start typing to search...</p>';
        return;
    }

    // Database me se filter karo
    const filteredAnime = animeDatabase.filter(anime => 
        anime.title.toLowerCase().includes(query)
    );

    // Result render karo
    renderResults(filteredAnime);
});

// 5. Result Render Function
function renderResults(results) {
    searchResults.innerHTML = ''; // Pehle clear karo

    if (results.length === 0) {
        searchResults.innerHTML = '<p class="search-hint">No results found for your search.</p>';
        return;
    }

    results.forEach(anime => {
        // Har result ke liye ek link/row banao
        const item = document.createElement('a');
        item.href = `watch.html?id=${anime.id}`;
        item.className = 'search-item';
        
        item.innerHTML = `
            <img src="${anime.image}" alt="${anime.title}">
            <div class="search-item-info">
                <h3>${anime.title}</h3>
                <p>Tap to watch</p>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
        `;
        
        searchResults.appendChild(item);
    });
}
