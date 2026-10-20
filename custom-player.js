/* ============================================================
   ANIME MAX ZONE — Custom Video Controller
   ============================================================ */

let player = null;

// 1. Initialize Plyr (Default controls ko hide kar dein)
function initCustomPlayer(videoElementId, sources, subtitles) {
    const videoElement = document.getElementById(videoElementId);
    if (!videoElement) return;

    // Empty the video tag and add sources
    videoElement.innerHTML = "";
    
    sources.forEach(src => {
        const source = document.createElement("source");
        source.src = src.src;
        source.type = src.type;
        source.size = src.size;
        source.title = src.label;
        videoElement.appendChild(source);
    });

    subtitles.forEach(sub => {
        const track = document.createElement("track");
        track.kind = "captions";
        track.label = sub.label;
        track.srclang = sub.srclang;
        track.src = sub.src;
        if (sub.default) track.default = true;
        videoElement.appendChild(track);
    });

    // Destroy previous instance if any
    if (player) {
        player.destroy();
    }

    // Initialize Plyr with NO controls (Humara custom UI chalega)
    player = new Plyr(videoElement, {
        controls: [], 
        settings: ['captions', 'quality', 'speed'],
        hideControls: false, 
        clickToPlay: true
    });

    // Attach Events
    bindCustomControls();
    addDoubleTapToSeek();
    addCustomSettingsLogic();
    
    // Player ko globally expose karein taaki watch.js use kar sake
    window.player = player; 
}

// 2. Bind Custom HTML Buttons to Plyr API
function bindCustomControls() {
    const playBtn = document.getElementById("customPlayBtn");
    const playIcon = document.getElementById("customPlayIcon");
    const centerPlayBtn = document.getElementById("centerPlayBtn");
    const progressBar = document.getElementById("customProgressBar");
    const muteBtn = document.getElementById("customMuteBtn");
    const fullScreenBtn = document.getElementById("customFullScreenBtn");
    const fullScreenIcon = document.getElementById("customFullScreenIcon");

    // Play/Pause
    if (playBtn && centerPlayBtn && playIcon) {
        playBtn.addEventListener("click", () => player.togglePlay());
        centerPlayBtn.addEventListener("click", () => player.play());
        
        player.on("play", () => { 
            playIcon.innerHTML = `<path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`; 
            centerPlayBtn.style.display = "none";
        });
        
        player.on("pause", () => { 
            playIcon.innerHTML = `<path fill="currentColor" d="M8 5v14l11-7z"/>`; 
            centerPlayBtn.style.display = "flex";
        });
    }

    // Progress Bar
    if (progressBar) {
        player.on("timeupdate", () => {
            const percent = (player.currentTime / player.duration) * 100;
            progressBar.value = percent || 0;
            updateTimeDisplay(player.currentTime, player.duration);
        });

        progressBar.addEventListener("input", () => {
            const seekTo = player.duration * (progressBar.value / 100);
            player.currentTime = seekTo;
        });
    }

    // Mute / Unmute
    if (muteBtn) {
        muteBtn.addEventListener("click", () => player.muted = !player.muted);
        
        player.on("volumechange", () => {
            if (player.muted || player.volume === 0) {
                muteBtn.innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
            } else {
                muteBtn.innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
            }
        });
    }

    // Fullscreen
    if (fullScreenBtn) {
        fullScreenBtn.addEventListener("click", () => player.fullscreen.toggle());
        
        player.on("enterfullscreen", () => {
            if(fullScreenIcon) fullScreenIcon.innerHTML = `<path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>`;
        });
        
        player.on("exitfullscreen", () => {
            if(fullScreenIcon) fullScreenIcon.innerHTML = `<path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>`;
        });
    }
}

// 3. Custom Settings / BottomSheet Logic
function addCustomSettingsLogic() {
    const settingsBtn = document.getElementById("customSettingsBtn");
    const settingsSheet = document.getElementById("settingsSheetOverlay");
    const settingsContent = document.getElementById("settingsContent");
    const closeSettingsBtn = document.getElementById("closeSettingsBtn");

    if (settingsBtn && settingsSheet && settingsContent) {
        settingsBtn.addEventListener("click", () => {
            let html = `<div class="settings-group"><h4>Quality</h4><div class="settings-options">`;
            
            // Quality Options
            if (player.quality && player.quality.options && player.quality.options.length > 0) {
                player.quality.options.forEach(q => {
                    let active = player.quality === q ? "active" : "";
                    html += `<button class="settings-btn ${active}" onclick="player.quality = ${q}; document.getElementById('settingsSheetOverlay').classList.remove('active');">${q}p</button>`;
                });
            } else {
                html += `<button class="settings-btn active">Auto</button>`;
            }
            html += `</div></div>`;

            // Subtitles Options
            html += `<div class="settings-group"><h4>Subtitles</h4><div class="settings-options">`;
            html += `<button class="settings-btn" onclick="toggleSubs(-1); document.getElementById('settingsSheetOverlay').classList.remove('active');">Off</button>`;
            
            const videoElement = document.getElementById("videoPlayer");
            if (videoElement && videoElement.textTracks) {
                for (let i = 0; i < videoElement.textTracks.length; i++) {
                    let active = videoElement.textTracks[i].mode === 'showing' ? 'active' : '';
                    html += `<button class="settings-btn ${active}" onclick="toggleSubs(${i}); document.getElementById('settingsSheetOverlay').classList.remove('active');">${videoElement.textTracks[i].label}</button>`;
                }
            }
            html += `</div></div>`;

            settingsContent.innerHTML = html;
            settingsSheet.classList.add("active");
        });
    }

    if (closeSettingsBtn && settingsSheet) {
        closeSettingsBtn.addEventListener("click", () => settingsSheet.classList.remove("active"));
        settingsSheet.addEventListener("click", (e) => { if (e.target === settingsSheet) settingsSheet.classList.remove("active"); });
    }
}

// Global Function for Subtitle Toggle
window.toggleSubs = (index) => {
    const videoElement = document.getElementById("videoPlayer");
    if (!videoElement) return;

    for (let i = 0; i < videoElement.textTracks.length; i++) {
        videoElement.textTracks[i].mode = (i === index) ? 'showing' : 'hidden';
    }
};

// 4. Double Tap to Seek (YouTube Style)
function addDoubleTapToSeek() {
    const videoContainer = document.getElementById("nativePlayerContainer");
    if (!videoContainer) return;
    
    let lastTap = 0;

    videoContainer.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault(); 
            const rect = videoContainer.getBoundingClientRect();
            const tapX = e.changedTouches[0].clientX - rect.left;
            
            if (player) {
                if (tapX < rect.width / 2) {
                    player.currentTime -= 10; 
                    showSeekAnimation("backward");
                } else {
                    player.currentTime += 10; 
                    showSeekAnimation("forward");
                }
            }
        }
        lastTap = currentTime;
    });
}

// Helpers
function updateTimeDisplay(current, total) {
    const currentTimeEl = document.getElementById("customCurrentTime");
    const durationEl = document.getElementById("customDuration");
    
    const format = (time) => {
        if (isNaN(time)) return "0:00";
        let m = Math.floor(time / 60);
        let s = Math.floor(time % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
    
    if (currentTimeEl) currentTimeEl.textContent = format(current);
    if (durationEl) durationEl.textContent = format(total);
}

function showSeekAnimation(direction) {
    const videoContainer = document.getElementById("nativePlayerContainer");
    if (!videoContainer) return;

    const existing = document.querySelector('.seek-overlay');
    if (existing) existing.remove();

    let overlay = document.createElement("div");
    overlay.className = `seek-overlay ${direction === "forward" ? "right" : "left"}`;
    
    let svgIcon = direction === "forward" 
        ? `<svg viewBox="0 0 24 24" fill="white"><path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>` 
        : `<svg viewBox="0 0 24 24" fill="white"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/></svg>`;
    
    overlay.innerHTML = `${svgIcon} <span>10 seconds</span>`;
    videoContainer.appendChild(overlay);
    
    setTimeout(() => { overlay.classList.add("show"); }, 10);
    setTimeout(() => { 
        overlay.classList.remove("show"); 
        setTimeout(() => overlay.remove(), 300);
    }, 600);
}
