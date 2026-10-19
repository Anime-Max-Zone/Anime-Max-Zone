/* ============================================================
   ANIME MAX ZONE — Settings Logic
   ============================================================ */

// ---------- 1. DOM References ----------
const themeToggleItem = document.getElementById("themeToggleItem");
const themeToggle = document.getElementById("themeToggle");

const notifToggleItem = document.getElementById("notifToggleItem");
const notifToggle = document.getElementById("notifToggle");

const clearWatchlistBtn = document.getElementById("clearWatchlistBtn");
const clearCacheBtn = document.getElementById("clearCacheBtn");

// ---------- 2. Load Saved Settings on Page Load ----------
document.addEventListener("DOMContentLoaded", () => {
    // Check notification preference
    const notifPref = localStorage.getItem("animeNotifs");
    if (notifPref === "true") {
        notifToggle.classList.add("active");
    } else if (notifPref === "false") {
        notifToggle.classList.remove("active");
    }

    // Force Dark Mode on by default (as the site is designed for it)
    themeToggle.classList.add("active");
});

// ---------- 3. Dark Mode Toggle Logic ----------
themeToggleItem.addEventListener("click", () => {
    themeToggle.classList.toggle("active");
    
    // Since the site is already in Dark Mode, we'll just show an alert if they try to turn it off
    if (!themeToggle.classList.contains("active")) {
        alert("Light mode is currently in development. Staying in Dark Mode.");
        themeToggle.classList.add("active"); // Revert back to active
    }
});

// ---------- 4. Notifications Toggle Logic ----------
notifToggleItem.addEventListener("click", () => {
    notifToggle.classList.toggle("active");
    
    // Save preference to localStorage
    const isActive = notifToggle.classList.contains("active");
    localStorage.setItem("animeNotifs", isActive);
});

// ---------- 5. Clear Watchlist Logic ----------
clearWatchlistBtn.addEventListener("click", () => {
    // Check if watchlist exists first
    const watchlist = JSON.parse(localStorage.getItem("animeWatchlist")) || [];
    
    if (watchlist.length === 0) {
        alert("Your watchlist is already empty!");
        return;
    }

    // Confirm before clearing
    const confirmDelete = confirm("Are you sure you want to clear your entire watchlist? This action cannot be undone.");
    
    if (confirmDelete) {
        localStorage.removeItem("animeWatchlist"); 
        alert("Your watchlist has been cleared successfully!");
    }
});

// ---------- 6. Clear Cache Logic (Mock) ----------
clearCacheBtn.addEventListener("click", () => {
    // In a real app, this would clear service workers or temporary images
    setTimeout(() => {
        alert("App cache cleared successfully!");
    }, 300); // Small delay for realism
});
