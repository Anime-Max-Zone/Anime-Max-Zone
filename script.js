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

// Check karein ki elements exist karte hain (Safety check)
if (openSearchBtn && searchPanel) {
    
    // ================= 3. PANEL OPEN / CLOSE LOGIC =================
    
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

    // ================= 4. LIVE SUGGESTION LOGIC =================
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
        renderResults(filteredAnime);
    });
}

// ================= 5. RESULT RENDER FUNCTION =================
function renderResults(results) {
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
