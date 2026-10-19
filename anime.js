/* ============================================================
   ANIME MAX ZONE — Details Page Logic (anime.js)
   ============================================================ */

// ---------- 1. Firebase Imports ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---------- 2. Firebase Config ----------
const firebaseConfig = {
    apiKey: "AIzaSyCpfrluxsBhnz48ve9RykIy1IxzbBfk7dA",
    authDomain: "sm-studio-7.firebaseapp.com",
    projectId: "sm-studio-7",
    storageBucket: "sm-studio-7.firebasestorage.app",
    messagingSenderId: "126291501472",
    appId: "1:126291501472:web:47386660af8ec3a57204c5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- 3. Security Helpers ----------
function escapeHTML(str) {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function safeImageUrl(url) {
    if (typeof url !== "string") return "";
    try {
        const u = new URL(url);
        if (u.protocol === "http:" || u.protocol === "https:") return u.href;
    } catch (_) {}
    return "";
}

const FALLBACK_POSTER = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">
        <rect width="200" height="300" fill="#1a1a24"/>
        <text x="100" y="150" fill="#555" text-anchor="middle" font-family="sans-serif" font-size="14">No Image</text>
     </svg>`
);

// Demo Data (Fallback ke liye)
const demoData = [
    { id: '1', title: 'Demon Slayer', genres: ['Action', 'Fantasy'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', status: 'Ongoing', description: 'Tanjiro Kamado sets out to become a demon slayer after his family is slaughtered and his sister is turned into a demon.' },
    { id: '2', title: 'Jujutsu Kaisen', genres: ['Action', 'Supernatural'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', status: 'Completed', description: 'A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself.' },
    { id: '3', title: 'One Piece', genres: ['Action', 'Adventure'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg', status: 'Ongoing', description: 'Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger.' },
    { id: '4', title: 'Attack on Titan', genres: ['Action', 'Drama'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg', status: 'Completed', description: 'After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans.' },
    { id: '5', title: 'Naruto', genres: ['Action', 'Adventure'], coverImageUrl: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg', status: 'Completed', description: 'Naruto Uzumaki, a mischievous adolescent ninja, struggles as he searches for recognition and dreams of becoming the Hokage.' }
];

// ---------- 4. Main Logic ----------
async function loadAnimeDetails() {
    // URL se ID nikalna (jaise anime.html?id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id');

    if (!animeId) {
        // Agar URL me ID nahi hai, toh home page par bhej do
        window.location.href = "/"; 
        return;
    }

    let animeData = null;

    try {
        // Firebase Firestore se data fetch karo
        const docRef = doc(db, "anime", animeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            animeData = { id: docSnap.id, ...docSnap.data() };
        } else {
            // Agar Firebase me nahi mila, toh Demo data me dhoondo
            animeData = demoData.find(a => a.id === animeId);
        }
    } catch (err) {
        console.error("Error fetching details:", err);
        // Error aane par Demo data me dhoondo
        animeData = demoData.find(a => a.id === animeId);
    }

    // Agar data phir bhi nahi mila
    if (!animeData) {
        document.getElementById('detailsLoading').innerHTML = `
            <div style="padding: 4rem 2rem; text-align: center;">
                <h2 style="color: #ff6b6b; margin-bottom: 1rem;">Anime Not Found</h2>
                <p style="color: var(--text-muted); margin-bottom: 1.5rem;">The anime you are looking for does not exist or has been removed.</p>
                <a href="/" class="btn-watch-now" style="display: inline-flex;">Go Back Home</a>
            </div>
        `;
        return;
    }

    // Data mil gaya, UI render karo
    renderDetailsUI(animeData);
}

function renderDetailsUI(anime) {
    // Loader hide karo aur Content show karo
    document.getElementById('detailsLoading').style.display = 'none';
    const container = document.getElementById('detailsContent');
    container.style.display = 'block';

    const title = escapeHTML(anime.title || "Untitled");
    const desc = escapeHTML(anime.description || "No description available for this anime yet. Stay tuned!");
    const poster = safeImageUrl(anime.coverImageUrl) || FALLBACK_POSTER;
    const status = escapeHTML(anime.status || "Unknown");
    const genres = Array.isArray(anime.genres) ? anime.genres : [];

    // Genres HTML format karo
    const genresHTML = genres.map(g => `<span>${escapeHTML(g)}</span>`).join("");

    // Episodes Generate karo (Abhi ke liye dummy 1 se 12)
    // Future me aap Firebase se 'episodes' ka array mangwa kar yahan loop chala sakte hain
    let episodesHTML = "";
    for (let i = 1; i <= 12; i++) {
        episodesHTML += `<div class="ep-btn">${i}</div>`;
    }

    // Poora HTML structure inject karo
    container.innerHTML = `
        <section class="anime-hero" style="background-image: url('${poster}');">
            <div class="anime-hero-content">
                <img src="${poster}" alt="${title}" class="anime-poster" onerror="this.src='${FALLBACK_POSTER}'" />
                <div class="anime-info">
                    <h1>${title}</h1>
                    <div class="anime-meta-badges">
                        <span style="background:var(--primary); border:none;">${status}</span>
                        ${genresHTML}
                    </div>
                    <p class="anime-description">${desc}</p>
                    <button class="btn-watch-now" id="playFirstBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
                        Watch Episode 1
                    </button>
                </div>
            </div>
        </section>

        <section class="episodes-section">
            <h2>Episodes</h2>
            <div class="episode-grid">
                ${episodesHTML}
            </div>
        </section>
    `;

    // Episode Buttons par click event add karo (UI change ke liye)
    const epBtns = document.querySelectorAll('.ep-btn');
    epBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Sabhi buttons se active hatao
            epBtns.forEach(b => b.classList.remove('active'));
            // Jispe click kiya usko active karo
            e.target.classList.add('active');
            
            // Future me yahan video player open hoga
            // alert(`Playing Episode ${e.target.innerText}`);
        });
    });

    // "Watch Episode 1" button par click event
    document.getElementById('playFirstBtn').addEventListener('click', () => {
        if(epBtns.length > 0) {
            epBtns[0].click(); // Pehle episode par click simulate karo
            // Future: yahan direct player open karne ka logic aayega
        }
    });
}

// ---------- 5. Boot ----------
loadAnimeDetails();
