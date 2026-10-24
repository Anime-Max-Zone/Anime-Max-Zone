// ================= 1. FIREBASE SETUP =================
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

let database;

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    database = firebase.database();
    console.log("Firebase Connected!");

} catch (error) {
    console.error("Firebase Init Error:", error);
}

let allContentDatabase = [];
let currentAudio = null;
let currentQuality = null;
let activeSubtitleUrl = null;
let hls = null;
let audioHls = null;
let isMutedByUser = false;


// ================= 2. SPLASH SCREEN & INITIAL LOAD =================

document.addEventListener('DOMContentLoaded', function() {

    const splashScreen = document.getElementById('splash-screen');

    if (splashScreen) {
        setTimeout(function() {
            splashScreen.classList.add('hidden');
        }, 2000);
    }

    if (database) {
        database.ref('content').once('value')
            .then(function(snapshot) {

                const data = snapshot.val();

                if (data) {
                    allContentDatabase = Object.keys(data).map(function(key) {
                        return Object.assign({
                            firebaseKey: key
                        }, data[key]);
                    });

                    loadHomePageData();
                    initSearchAndGrids();

                } else {
                    showNoDataFound();
                }

            })
            .catch(function(error) {
                console.error("Firebase Fetch Error:", error);
                showNoDataFound();
            });
    }
});


function showNoDataFound() {

    const containers = [
        'latestContainer',
        'onAirContainer',
        'newArrivalsContainer',
        'animeGrid',
        'movieGrid'
    ];

    containers.forEach(function(id) {

        const el = document.getElementById(id);

        if (el) {
            el.innerHTML =
                '<p style="color:#888;padding:20px;width:100%;text-align:center;">No Content Available.</p>';
        }

    });
}


// ================= 3. HOME PAGE DATA =================

function loadHomePageData() {

    const latestContainer = document.getElementById('latestContainer');
    const onAirContainer = document.getElementById('onAirContainer');
    const newArrivalsContainer = document.getElementById('newArrivalsContainer');

    if (
        latestContainer &&
        onAirContainer &&
        newArrivalsContainer
    ) {

        setTimeout(function() {

            latestContainer.innerHTML = '';
            onAirContainer.innerHTML = '';
            newArrivalsContainer.innerHTML = '';

            const latestAnime = allContentDatabase.slice(0, 3);
            const onAirAnime = allContentDatabase.slice(3, 6);
            const newArrivals = allContentDatabase.slice(6, 10);

            function createCard(item) {

                const card = document.createElement('a');

                card.href = 'anime-details.html?id=' + item.firebaseKey;
                card.className = 'anime-card';

                const img = document.createElement('img');

                img.src = item.image || '';
                img.alt = item.title || 'Anime';

                img.onerror = function() {
                    this.src =
                        'https://via.placeholder.com/130x190?text=No+Image';
                };

                card.appendChild(img);

                return card;
            }

            latestAnime.forEach(function(item) {
                latestContainer.appendChild(createCard(item));
            });

            onAirAnime.forEach(function(item) {
                onAirContainer.appendChild(createCard(item));
            });

            newArrivals.forEach(function(item) {
                newArrivalsContainer.appendChild(createCard(item));
            });

        }, 1000);
    }
}


// ================= 4. SEARCH & GRIDS =================

function initSearchAndGrids() {

    const searchPanel = document.getElementById('searchPanel');
    const openSearchBtn = document.getElementById('openSearchBtn');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (openSearchBtn && searchPanel && searchInput && searchResults) {

        openSearchBtn.addEventListener('click', function() {

            searchPanel.classList.add('active');

            setTimeout(function() {
                searchInput.focus();
            }, 300);

        });

        if (closeSearchBtn) {

            closeSearchBtn.addEventListener('click', function() {

                searchPanel.classList.remove('active');

                setTimeout(function() {

                    searchInput.value = '';

                    searchResults.innerHTML =
                        '<p class="search-hint">Start typing to search...</p>';

                }, 300);

            });
        }

        searchInput.addEventListener('input', function(e) {

            const query = e.target.value.toLowerCase().trim();

            if (query === '') {

                searchResults.innerHTML =
                    '<p class="search-hint">Start typing to search...</p>';

                return;
            }

            const filtered = allContentDatabase.filter(function(item) {

                return item.title &&
                    item.title.toLowerCase().includes(query);

            });

            renderSearchResults(filtered);

        });
    }


    function renderSearchResults(results) {

        if (!searchResults) return;

        searchResults.innerHTML = '';

        if (results.length === 0) {

            searchResults.innerHTML =
                '<p class="search-hint">No results found.</p>';

            return;
        }

        results.forEach(function(item) {

            const link = document.createElement('a');

            link.href = 'anime-details.html?id=' + item.firebaseKey;
            link.className = 'search-item';

            const img = document.createElement('img');

            img.src = item.image || '';
            img.alt = item.title || 'Anime';

            img.onerror = function() {
                this.src =
                    'https://via.placeholder.com/55x75?text=No+Image';
            };

            const info = document.createElement('div');
            info.className = 'search-item-info';

            const title = document.createElement('h3');
            title.textContent = item.title || 'Untitled';

            const description = document.createElement('p');
            description.textContent = 'Tap to watch';

            info.appendChild(title);
            info.appendChild(description);

            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-chevron-right';

            link.appendChild(img);
            link.appendChild(info);
            link.appendChild(icon);

            searchResults.appendChild(link);

        });
    }


    // ---------- ANIME GRID ----------

    const animeGridContainer = document.getElementById('animeGrid');

    if (animeGridContainer) {

        animeGridContainer.innerHTML = '';

        const animeOnly = allContentDatabase.filter(function(item) {
            return item.type === 'anime' || !item.type;
        });

        if (animeOnly.length === 0) {

            animeGridContainer.innerHTML =
                "<p style='color:#888;text-align:center;width:100%;'>No Anime found.</p>";

        }

        animeOnly.forEach(function(item) {

            const card = document.createElement('a');

            card.href = 'anime-details.html?id=' + item.firebaseKey;
            card.className = 'grid-card';

            const img = document.createElement('img');

            img.src = item.image || '';
            img.alt = item.title || 'Anime';

            img.onerror = function() {
                this.src =
                    'https://via.placeholder.com/150x225?text=No+Image';
            };

            const title = document.createElement('div');
            title.className = 'grid-card-title';
            title.textContent = item.title || 'Untitled';

            card.appendChild(img);
            card.appendChild(title);

            animeGridContainer.appendChild(card);

        });
    }


    // ---------- MOVIES GRID ----------

    const movieGridContainer = document.getElementById('movieGrid');

    if (movieGridContainer) {

        movieGridContainer.innerHTML = '';

        const moviesOnly = allContentDatabase.filter(function(item) {
            return item.type === 'movie';
        });

        if (moviesOnly.length === 0) {

            movieGridContainer.innerHTML =
                "<p style='color:#888;text-align:center;width:100%;'>No Movies found.</p>";

        }

        moviesOnly.forEach(function(item) {

            const card = document.createElement('a');

            card.href = 'anime-details.html?id=' + item.firebaseKey;
            card.className = 'grid-card';

            const img = document.createElement('img');

            img.src = item.image || '';
            img.alt = item.title || 'Movie';

            img.onerror = function() {
                this.src =
                    'https://via.placeholder.com/150x225?text=No+Image';
            };

            const title = document.createElement('div');
            title.className = 'grid-card-title';
            title.textContent = item.title || 'Untitled';

            card.appendChild(img);
            card.appendChild(title);

            movieGridContainer.appendChild(card);

        });
    }

}


// ================= 5. ANIME DETAILS PAGE =================

document.addEventListener('DOMContentLoaded', function() {

    if (
        !document.getElementById('detailTitle') ||
        !database
    ) {
        return;
    }

    const animeId =
        new URLSearchParams(window.location.search).get('id');

    if (!animeId) {

        document.getElementById('detailTitle').innerText =
            'No ID Provided';

        return;
    }

    database.ref('content/' + animeId).once('value')
        .then(function(snapshot) {

            const data = snapshot.val();

            if (!data) {

                document.getElementById('detailTitle').innerText =
                    'Content Not Found';

                document.getElementById('detailSynopsis').innerText =
                    'This content does not exist.';

                return;
            }

            document.title = data.title + ' - Anime Max Zone';

            const banner = document.getElementById('detailBanner');
            const poster = document.getElementById('detailPoster');
            const title = document.getElementById('detailTitle');
            const rating = document.getElementById('detailRating');
            const year = document.getElementById('detailYear');
            const synopsis = document.getElementById('detailSynopsis');
            const genres = document.getElementById('detailGenres');

            if (banner) {
                banner.style.backgroundImage =
                    'url("' + (data.banner || data.image || '') + '")';
            }

            if (poster) poster.src = data.image || '';
            if (title) title.innerText = data.title || 'Untitled';
            if (rating) rating.innerText = data.rating || '0.0';
            if (year) year.innerText = data.year || '----';

            if (synopsis) {
                synopsis.innerText =
                    data.synopsis || 'No description available.';
            }

            if (genres && data.genres && Array.isArray(data.genres)) {

                genres.innerHTML = '';

                data.genres.forEach(function(genre) {

                    const tag = document.createElement('span');

                    tag.className = 'genre-tag';
                    tag.textContent = genre;

                    genres.appendChild(tag);

                });
            }

            const episodesSection =
                document.querySelector('.episodes-section');

            const episodeList =
                document.getElementById('episodeList');

            const synopsisSection =
                document.querySelector('.synopsis-section');


            // ---------- MOVIE ----------

            if (data.type === 'movie' || !data.seasons) {

                if (episodesSection) {
                    episodesSection.style.display = 'none';
                }

                if (synopsisSection) {

                    const watchBtn = document.createElement('a');

                    watchBtn.href = 'watch.html?id=' + animeId;
                    watchBtn.className = 'watch-now-btn';

                    watchBtn.innerHTML =
                        '<i class="fa-solid fa-play"></i> Watch Movie Now';

                    synopsisSection.appendChild(watchBtn);
                }

                return;
            }


            // ---------- SERIES / ANIME EPISODES ----------

            if (episodesSection) {
                episodesSection.style.display = 'block';
            }

            if (!episodeList) return;

            let totalEps = 0;

            episodeList.innerHTML = '';

            const seasonNames = Object.keys(data.seasons);

            seasonNames.forEach(function(seasonName) {

                const episodesObj = data.seasons[seasonName];

                const epArray = Object.keys(episodesObj).map(function(key) {

                    return Object.assign({
                        firebaseKey: key
                    }, episodesObj[key]);

                });

                totalEps += epArray.length;

                if (seasonNames.length > 1) {

                    const heading = document.createElement('h4');

                    heading.style.cssText =
                        'color:#a855f7;margin:10px 0 5px;font-size:14px;';

                    heading.textContent = seasonName;

                    episodeList.appendChild(heading);
                }

                epArray.forEach(function(episode) {

                    const epCard = document.createElement('a');

                    epCard.href =
                        'watch.html?id=' + animeId +
                        '&season=' + encodeURIComponent(seasonName) +
                        '&ep=' + episode.firebaseKey;

                    epCard.className = 'episode-card';

                    epCard.innerHTML =
                        '<div class="ep-play-icon"><i class="fa-solid fa-play"></i></div>' +
                        '<div class="ep-info">' +
                        '<h4>Episode ' + (episode.ep || '') + '</h4>' +
                        '<p>' + (episode.title || '') + '</p>' +
                        '</div>' +
                        '<i class="fa-solid fa-chevron-right ep-arrow"></i>';

                    episodeList.appendChild(epCard);

                });
            });

            const episodeCount =
                document.getElementById('episodeCount');

            if (episodeCount) {
                episodeCount.innerText = totalEps + ' Episodes';
            }

        })
        .catch(function(error) {
            console.error('Anime Details Error:', error);
        });

});

/* =========================================================
   PART 2/4 — WATCH PLAYER + HLS AUDIO TRACK FIX
   Anime Max Zone
========================================================= */

(function () {
    "use strict";

    /* -------------------------
       PLAYER STATE
    ------------------------- */

    let amzHls = null;
    let amzVideo = null;

    let amzCurrentAudioTracks = [];
    let amzCurrentQualityLevels = [];

    let amzSelectedAudioTrack = -1;
    let amzSelectedQuality = -1;

    let amzHlsReady = false;
    let amzAudioMenuReady = false;

    const AMZ_MASTER_PLAYLIST =
        "https://raw.githubusercontent.com/Anime-Max-Zone/Anime-Max-Zone/refs/heads/main/master.m3u8";


    /* -------------------------
       FIND HTML ELEMENTS
    ------------------------- */

    function amzGetVideo() {
        if (amzVideo && document.contains(amzVideo)) {
            return amzVideo;
        }

        amzVideo =
            document.getElementById("videoPlayer") ||
            document.getElementById("video") ||
            document.getElementById("player") ||
            document.querySelector("video");

        return amzVideo;
    }

    function amzGetAudioMenu() {
        return (
            document.getElementById("audioTrackMenu") ||
            document.getElementById("audioTracksMenu") ||
            document.getElementById("audio-track-menu")
        );
    }

    function amzGetAudioButton() {
        return (
            document.getElementById("audioTrackBtn") ||
            document.getElementById("audioTrackButton") ||
            document.getElementById("audio-track-btn")
        );
    }

    function amzGetQualityMenu() {
        return (
            document.getElementById("qualityMenu") ||
            document.getElementById("quality-menu")
        );
    }

    function amzGetQualityButton() {
        return (
            document.getElementById("qualityBtn") ||
            document.getElementById("qualityButton") ||
            document.getElementById("quality-btn")
        );
    }


    /* -------------------------
       AUDIO LABEL
    ------------------------- */

    function amzGetAudioLabel(track, index) {
        let label = "";

        if (track) {
            label =
                track.name ||
                track.lang ||
                track.language ||
                "";
        }

        label = String(label).trim();

        if (!label) {
            label = "Audio " + (index + 1);
        }

        const languageNames = {
            "en": "English",
            "eng": "English",
            "hi": "Hindi",
            "hin": "Hindi",
            "ja": "Japanese",
            "jpn": "Japanese",
            "ko": "Korean",
            "kor": "Korean",
            "ta": "Tamil",
            "tam": "Tamil",
            "te": "Telugu",
            "tel": "Telugu",
            "bn": "Bengali",
            "ben": "Bengali",
            "or": "Odia",
            "ori": "Odia",
            "od": "Odia",
            "es": "Spanish",
            "spa": "Spanish",
            "fr": "French",
            "fra": "French",
            "pt": "Portuguese",
            "por": "Portuguese",
            "zh": "Chinese",
            "zho": "Chinese",
            "ar": "Arabic",
            "ara": "Arabic",
            "ru": "Russian",
            "rus": "Russian"
        };

        const normalized = label.toLowerCase();

        if (languageNames[normalized]) {
            return languageNames[normalized];
        }

        return label;
    }


    /* -------------------------
       CREATE AUDIO MENU
    ------------------------- */

    function amzEnsureAudioMenu() {
        let menu = amzGetAudioMenu();

        if (menu) {
            return menu;
        }

        const button = amzGetAudioButton();

        if (!button) {
            console.warn(
                "Anime Max Zone: Audio Track button was not found."
            );
            return null;
        }

        menu = document.createElement("div");
        menu.id = "audioTrackMenu";
        menu.className = "amz-audio-track-menu";

        menu.style.position = "absolute";
        menu.style.right = "12px";
        menu.style.bottom = "55px";
        menu.style.zIndex = "9999";
        menu.style.minWidth = "180px";
        menu.style.maxWidth = "260px";
        menu.style.maxHeight = "260px";
        menu.style.overflowY = "auto";
        menu.style.padding = "8px";
        menu.style.borderRadius = "10px";
        menu.style.background = "rgba(18,18,22,0.97)";
        menu.style.color = "#ffffff";
        menu.style.boxShadow = "0 4px 18px rgba(0,0,0,0.45)";
        menu.style.display = "none";

        const parent =
            button.closest(".player-container") ||
            button.closest(".video-container") ||
            button.parentElement;

        if (parent) {
            const position =
                window.getComputedStyle(parent).position;

            if (position === "static") {
                parent.style.position = "relative";
            }

            parent.appendChild(menu);
        } else {
            document.body.appendChild(menu);
        }

        return menu;
    }


    /* -------------------------
       RENDER AUDIO TRACKS
    ------------------------- */

    function amzRenderAudioTracks() {
        const menu = amzEnsureAudioMenu();

        if (!menu) {
            return;
        }

        menu.innerHTML = "";

        if (
            !amzCurrentAudioTracks ||
            amzCurrentAudioTracks.length === 0
        ) {
            const empty = document.createElement("div");

            empty.textContent = "No audio tracks available";
            empty.style.padding = "12px";
            empty.style.fontSize = "13px";
            empty.style.color = "#cccccc";

            menu.appendChild(empty);

            return;
        }

        amzCurrentAudioTracks.forEach(function (track, index) {
            const item = document.createElement("button");

            item.type = "button";
            item.className = "amz-audio-track-item";

            const label = amzGetAudioLabel(track, index);

            item.textContent =
                (index === amzSelectedAudioTrack ? "✓ " : "") +
                label;

            item.style.display = "block";
            item.style.width = "100%";
            item.style.padding = "11px 12px";
            item.style.margin = "2px 0";
            item.style.border = "0";
            item.style.borderRadius = "6px";
            item.style.textAlign = "left";
            item.style.fontSize = "14px";
            item.style.cursor = "pointer";

            item.style.background =
                index === amzSelectedAudioTrack
                    ? "#3d5afe"
                    : "transparent";

            item.style.color = "#ffffff";

            item.addEventListener("click", function () {
                amzSelectAudioTrack(index);
            });

            menu.appendChild(item);
        });
    }


    /* -------------------------
       SELECT AUDIO TRACK
    ------------------------- */

    function amzSelectAudioTrack(index) {
        if (!amzHls) {
            console.warn(
                "Anime Max Zone: HLS player is not initialized."
            );
            return;
        }

        if (
            index < 0 ||
            index >= amzCurrentAudioTracks.length
        ) {
            return;
        }

        try {
            amzHls.audioTrack = index;

            amzSelectedAudioTrack = index;

            amzRenderAudioTracks();

            const track = amzCurrentAudioTracks[index];
            const label = amzGetAudioLabel(track, index);

            console.log(
                "Anime Max Zone: Audio switched to " + label
            );

            const menu = amzGetAudioMenu();

            if (menu) {
                menu.style.display = "none";
            }

            document.dispatchEvent(
                new CustomEvent("amz-audio-track-changed", {
                    detail: {
                        index: index,
                        label: label,
                        track: track
                    }
                })
            );

        } catch (error) {
            console.error(
                "Anime Max Zone: Could not switch audio track.",
                error
            );
        }
    }


    /* -------------------------
       AUDIO BUTTON
    ------------------------- */

    function amzSetupAudioButton() {
        const button = amzGetAudioButton();

        if (!button || button.dataset.amzBound === "1") {
            return;
        }

        button.dataset.amzBound = "1";

        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            const menu = amzEnsureAudioMenu();

            if (!menu) {
                return;
            }

            const isVisible =
                window.getComputedStyle(menu).display !== "none";

            menu.style.display = isVisible ? "none" : "block";

            if (!isVisible) {
                amzRenderAudioTracks();
            }
        });

        document.addEventListener("click", function (event) {
            const menu = amzGetAudioMenu();
            const audioButton = amzGetAudioButton();

            if (!menu) {
                return;
            }

            if (
                !menu.contains(event.target) &&
                audioButton &&
                !audioButton.contains(event.target)
            ) {
                menu.style.display = "none";
            }
        });
    }


    /* -------------------------
       QUALITY MENU
    ------------------------- */

    function amzEnsureQualityMenu() {
        let menu = amzGetQualityMenu();

        if (menu) {
            return menu;
        }

        const button = amzGetQualityButton();

        if (!button) {
            return null;
        }

        menu = document.createElement("div");
        menu.id = "qualityMenu";
        menu.className = "amz-quality-menu";

        menu.style.position = "absolute";
        menu.style.right = "12px";
        menu.style.bottom = "55px";
        menu.style.zIndex = "9998";
        menu.style.minWidth = "140px";
        menu.style.maxHeight = "250px";
        menu.style.overflowY = "auto";
        menu.style.padding = "8px";
        menu.style.borderRadius = "10px";
        menu.style.background = "rgba(18,18,22,0.97)";
        menu.style.color = "#ffffff";
        menu.style.boxShadow = "0 4px 18px rgba(0,0,0,0.45)";
        menu.style.display = "none";

        const parent =
            button.closest(".player-container") ||
            button.closest(".video-container") ||
            button.parentElement;

        if (parent) {
            if (
                window.getComputedStyle(parent).position === "static"
            ) {
                parent.style.position = "relative";
            }

            parent.appendChild(menu);
        } else {
            document.body.appendChild(menu);
        }

        return menu;
    }


    function amzRenderQualityLevels() {
        const menu = amzEnsureQualityMenu();

        if (!menu) {
            return;
        }

        menu.innerHTML = "";

        const autoButton = document.createElement("button");

        autoButton.type = "button";
        autoButton.textContent =
            amzSelectedQuality === -1
                ? "✓ Auto"
                : "Auto";

        amzStyleMenuButton(
            autoButton,
            amzSelectedQuality === -1
        );

        autoButton.addEventListener("click", function () {
            if (amzHls) {
                amzHls.currentLevel = -1;
                amzSelectedQuality = -1;
                amzRenderQualityLevels();
            }

            menu.style.display = "none";
        });

        menu.appendChild(autoButton);

        if (!amzCurrentQualityLevels.length) {
            const message = document.createElement("div");

            message.textContent = "Quality unavailable";
            message.style.padding = "10px";
            message.style.fontSize = "12px";

            menu.appendChild(message);

            return;
        }

        amzCurrentQualityLevels.forEach(function (level, index) {
            const height = level.height || 0;

            let label = height ? height + "p" : "Quality " + (index + 1);

            if (level.name) {
                label = level.name;
            }

            const item = document.createElement("button");

            item.type = "button";

            item.textContent =
                amzSelectedQuality === index
                    ? "✓ " + label
                    : label;

            amzStyleMenuButton(
                item,
                amzSelectedQuality === index
            );

            item.addEventListener("click", function () {
                if (!amzHls) {
                    return;
                }

                amzHls.currentLevel = index;
                amzSelectedQuality = index;

                amzRenderQualityLevels();

                menu.style.display = "none";
            });

            menu.appendChild(item);
        });
    }


    function amzStyleMenuButton(button, selected) {
        button.style.display = "block";
        button.style.width = "100%";
        button.style.padding = "10px 12px";
        button.style.margin = "2px 0";
        button.style.border = "0";
        button.style.borderRadius = "6px";
        button.style.textAlign = "left";
        button.style.fontSize = "14px";
        button.style.cursor = "pointer";

        button.style.background =
            selected ? "#3d5afe" : "transparent";

        button.style.color = "#ffffff";
    }


    function amzSetupQualityButton() {
        const button = amzGetQualityButton();

        if (!button || button.dataset.amzBound === "1") {
            return;
        }

        button.dataset.amzBound = "1";

        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            const menu = amzEnsureQualityMenu();

            if (!menu) {
                return;
            }

            const visible =
                window.getComputedStyle(menu).display !== "none";

            menu.style.display = visible ? "none" : "block";

            if (!visible) {
                amzRenderQualityLevels();
            }
        });

        document.addEventListener("click", function (event) {
            const menu = amzGetQualityMenu();

            if (
                menu &&
                !menu.contains(event.target) &&
                !button.contains(event.target)
            ) {
                menu.style.display = "none";
            }
        });
    }


    /* -------------------------
       PLAYER ERROR DISPLAY
    ------------------------- */

    function amzShowPlayerError(message) {
        let box = document.getElementById("amzPlayerError");

        if (!box) {
            box = document.createElement("div");
            box.id = "amzPlayerError";

            box.style.position = "absolute";
            box.style.left = "12px";
            box.style.right = "12px";
            box.style.top = "50%";
            box.style.transform = "translateY(-50%)";
            box.style.zIndex = "9997";
            box.style.padding = "14px";
            box.style.borderRadius = "8px";
            box.style.background = "rgba(0,0,0,0.85)";
            box.style.color = "#ffffff";
            box.style.textAlign = "center";
            box.style.fontSize = "14px";

            const video = amzGetVideo();

            const parent = video
                ? video.parentElement
                : document.body;

            if (parent) {
                if (
                    window.getComputedStyle(parent).position === "static"
                ) {
                    parent.style.position = "relative";
                }

                parent.appendChild(box);
            }
        }

        box.textContent = message;
        box.style.display = "block";
    }


    function amzHidePlayerError() {
        const box = document.getElementById("amzPlayerError");

        if (box) {
            box.style.display = "none";
        }
    }


    /* -------------------------
       GET PLAYLIST URL
    ------------------------- */

    function amzGetStreamUrl() {
        const params = new URLSearchParams(window.location.search);

        const possibleKeys = [
            "url",
            "stream",
            "video",
            "src",
            "hls"
        ];

        for (let i = 0; i < possibleKeys.length; i++) {
            const value = params.get(possibleKeys[i]);

            if (value) {
                return value;
            }
        }

        const video = amzGetVideo();

        if (video) {
            const source =
                video.getAttribute("data-src") ||
                video.getAttribute("src");

            if (source) {
                return source;
            }
        }

        return AMZ_MASTER_PLAYLIST;
    }


    /* -------------------------
       INITIALIZE HLS PLAYER
    ------------------------- */

    function amzInitializeHlsPlayer(streamUrl) {
        const video = amzGetVideo();

        if (!video) {
            console.error(
                "Anime Max Zone: <video> element was not found."
            );
            return;
        }

        if (!streamUrl) {
            amzShowPlayerError("Video URL is missing.");
            return;
        }

        amzSetupAudioButton();
        amzSetupQualityButton();

        amzHidePlayerError();

        if (amzHls) {
            try {
                amzHls.destroy();
            } catch (error) {
                console.warn("Could not destroy previous HLS instance.", error);
            }

            amzHls = null;
        }

        amzCurrentAudioTracks = [];
        amzCurrentQualityLevels = [];

        amzSelectedAudioTrack = -1;
        amzSelectedQuality = -1;

        /*
         * Native HLS fallback.
         * On Safari, the browser may handle HLS internally.
         * Native HLS does not expose the same track list as hls.js.
         */

        const nativeHls =
            video.canPlayType("application/vnd.apple.mpegurl") ||
            video.canPlayType("application/x-mpegURL");

        if (
            nativeHls &&
            !window.Hls
        ) {
            video.src = streamUrl;

            video.addEventListener("loadedmetadata", function () {
                amzHlsReady = true;
            }, { once: true });

            video.addEventListener("error", function () {
                amzShowPlayerError(
                    "Unable to load video. Please check the stream URL."
                );
            }, { once: true });

            video.load();
            return;
        }

        if (!window.Hls) {
            amzShowPlayerError(
                "HLS.js is not loaded. Add the HLS.js library to watch.html."
            );

            console.error(
                "HLS.js missing. Load hls.min.js before script.js."
            );

            return;
        }

        if (!window.Hls.isSupported()) {
            amzShowPlayerError(
                "This browser does not support HLS playback."
            );

            return;
        }

        amzHls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,

            /*
             * These settings allow hls.js to discover
             * alternate audio renditions in the master playlist.
             */
            startLevel: -1,
            capLevelToPlayerSize: false,
            testBandwidth: true
        });

        amzHls.attachMedia(video);

        amzHls.on(Hls.Events.MEDIA_ATTACHED, function () {
            amzHls.loadSource(streamUrl);
        });

        /* -------------------------
           MANIFEST PARSED
        ------------------------- */

        amzHls.on(
            Hls.Events.MANIFEST_PARSED,
            function (event, data) {
                amzHlsReady = true;

                amzHidePlayerError();

                amzCurrentAudioTracks =
                    amzHls.audioTracks || [];

                amzCurrentQualityLevels =
                    amzHls.levels || [];

                amzSelectedAudioTrack =
                    typeof amzHls.audioTrack === "number"
                        ? amzHls.audioTrack
                        : -1;

                amzSelectedQuality =
                    typeof amzHls.currentLevel === "number" &&
                    amzHls.currentLevel >= 0
                        ? amzHls.currentLevel
                        : -1;

                amzRenderAudioTracks();
                amzRenderQualityLevels();

                console.log(
                    "Anime Max Zone: HLS manifest loaded."
                );

                console.log(
                    "Audio tracks found:",
                    amzCurrentAudioTracks.length
                );

                console.log(
                    "Quality levels found:",
                    amzCurrentQualityLevels.length
                );

                if (
                    amzCurrentAudioTracks.length === 0
                ) {
                    console.warn(
                        "No alternate audio tracks were exposed by hls.js. " +
                        "Check the master playlist AUDIO groups and EXT-X-MEDIA tags."
                    );
                }

                document.dispatchEvent(
                    new CustomEvent("amz-hls-manifest-ready", {
                        detail: {
                            audioTracks: amzCurrentAudioTracks,
                            qualityLevels: amzCurrentQualityLevels,
                            manifest: data
                        }
                    })
                );
            }
        );


        /* -------------------------
           AUDIO TRACKS UPDATED
        ------------------------- */

        amzHls.on(
            Hls.Events.AUDIO_TRACKS_UPDATED,
            function (event, data) {
                amzCurrentAudioTracks =
                    amzHls.audioTracks || [];

                if (
                    amzSelectedAudioTrack >=
                    amzCurrentAudioTracks.length
                ) {
                    amzSelectedAudioTrack =
                        typeof amzHls.audioTrack === "number"
                            ? amzHls.audioTrack
                            : -1;
                }

                amzRenderAudioTracks();

                console.log(
                    "Audio tracks updated:",
                    amzCurrentAudioTracks.map(function (track, index) {
                        return {
                            index: index,
                            name: track.name,
                            lang: track.lang,
                            type: track.type,
                            default: track.default
                        };
                    })
                );
            }
        );


        /* -------------------------
           AUDIO TRACK SWITCHED
        ------------------------- */

        amzHls.on(
            Hls.Events.AUDIO_TRACK_SWITCHED,
            function (event, data) {
                amzSelectedAudioTrack = data.id;

                amzCurrentAudioTracks =
                    amzHls.audioTracks || [];

                amzRenderAudioTracks();

                console.log(
                    "Active audio track index:",
                    data.id
                );
            }
        );


        /* -------------------------
           QUALITY LEVELS UPDATED
        ------------------------- */

        amzHls.on(
            Hls.Events.LEVELS_UPDATED,
            function () {
                amzCurrentQualityLevels =
                    amzHls.levels || [];

                amzRenderQualityLevels();
            }
        );


        /* -------------------------
           QUALITY LEVEL SWITCHED
        ------------------------- */

        amzHls.on(
            Hls.Events.LEVEL_SWITCHED,
            function (event, data) {
                amzSelectedQuality = data.level;

                amzRenderQualityLevels();
            }
        );


        /* -------------------------
           MEDIA CAN PLAY
        ------------------------- */

        amzHls.on(
            Hls.Events.FRAG_LOADED,
            function () {
                amzHidePlayerError();
            }
        );


        /* -------------------------
           HLS ERROR HANDLING
        ------------------------- */

        amzHls.on(
            Hls.Events.ERROR,
            function (event, data) {
                console.error(
                    "HLS error:",
                    data.type,
                    data.details,
                    data
                );

                if (!data.fatal) {
                    return;
                }

                if (
                    data.type === Hls.ErrorTypes.NETWORK_ERROR
                ) {
                    amzShowPlayerError(
                        "Network error. Retrying video stream..."
                    );

                    amzHls.startLoad();
                    return;
                }

                if (
                    data.type === Hls.ErrorTypes.MEDIA_ERROR
                ) {
                    amzShowPlayerError(
                        "Recovering video playback..."
                    );

                    amzHls.recoverMediaError();
                    return;
                }

                amzShowPlayerError(
                    "Video playback failed. Please try again."
                );

                try {
                    amzHls.destroy();
                } catch (error) {
                    console.error(error);
                }

                amzHls = null;
            }
        );
    }


    /* -------------------------
       PUBLIC PLAYER API
    ------------------------- */

    window.AMZPlayer = window.AMZPlayer || {};

    window.AMZPlayer.init = function (url) {
        amzInitializeHlsPlayer(
            url || amzGetStreamUrl()
        );
    };

    window.AMZPlayer.getAudioTracks = function () {
        return amzCurrentAudioTracks;
    };

    window.AMZPlayer.getQualityLevels = function () {
        return amzCurrentQualityLevels;
    };

    window.AMZPlayer.selectAudioTrack = function (index) {
        amzSelectAudioTrack(Number(index));
    };

    window.AMZPlayer.selectQuality = function (index) {
        if (!amzHls) {
            return;
        }

        const qualityIndex = Number(index);

        if (
            qualityIndex < -1 ||
            qualityIndex >= amzCurrentQualityLevels.length
        ) {
            return;
        }

        amzHls.currentLevel = qualityIndex;
        amzSelectedQuality = qualityIndex;

        amzRenderQualityLevels();
    };


    /* -------------------------
       AUTO INITIALIZE
    ------------------------- */

    function amzWaitForPlayer() {
        const video = amzGetVideo();

        if (!video) {
            return;
        }

        amzSetupAudioButton();
        amzSetupQualityButton();

        const streamUrl = amzGetStreamUrl();

        if (streamUrl) {
            amzInitializeHlsPlayer(streamUrl);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            amzWaitForPlayer
        );
    } else {
        amzWaitForPlayer();
    }

})();

/* =========================================================
   PART 3/4 — PLAYER CONTROLS + SUBTITLES
   Anime Max Zone
========================================================= */

(function () {
    "use strict";

    let video = null;
    let controlsTimer = null;
    let subtitleTracks = [];
    let selectedSpeed = 1;

    /* -------------------------
       FIND ELEMENTS
    ------------------------- */

    function getVideo() {
        if (video && document.contains(video)) {
            return video;
        }

        video =
            document.getElementById("videoPlayer") ||
            document.getElementById("video") ||
            document.getElementById("player") ||
            document.querySelector("video");

        return video;
    }

    function getElement(ids) {
        for (let i = 0; i < ids.length; i++) {
            const element = document.getElementById(ids[i]);

            if (element) {
                return element;
            }
        }

        return null;
    }

    function getPlayerContainer() {
        const currentVideo = getVideo();

        if (!currentVideo) {
            return null;
        }

        return (
            currentVideo.closest(".player-container") ||
            currentVideo.closest(".video-container") ||
            currentVideo.parentElement
        );
    }


    /* -------------------------
       PLAY / PAUSE
    ------------------------- */

    function setupPlayPause() {
        const currentVideo = getVideo();

        if (!currentVideo) {
            return;
        }

        const button = getElement([
            "playPauseBtn",
            "playPauseButton",
            "playBtn",
            "play-pause"
        ]);

        if (button && button.dataset.amzControlBound !== "1") {
            button.dataset.amzControlBound = "1";

            button.addEventListener("click", function () {
                togglePlayback();
            });
        }

        currentVideo.addEventListener("play", updatePlayButton);
        currentVideo.addEventListener("pause", updatePlayButton);

        updatePlayButton();
    }

    function togglePlayback() {
        const currentVideo = getVideo();

        if (!currentVideo) {
            return;
        }

        if (currentVideo.paused) {
            const playPromise = currentVideo.play();

            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function (error) {
                    console.warn("Playback could not start:", error);
                });
            }
        } else {
            currentVideo.pause();
        }
    }

    function updatePlayButton() {
        const currentVideo = getVideo();

        const button = getElement([
            "playPauseBtn",
            "playPauseButton",
            "playBtn",
            "play-pause"
        ]);

        if (!currentVideo || !button) {
            return;
        }

        button.textContent = currentVideo.paused ? "▶" : "❚❚";

        button.setAttribute(
            "aria-label",
            currentVideo.paused ? "Play video" : "Pause video"
        );
    }


    /* -------------------------
       TIME FORMAT
    ------------------------- */

    function formatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) {
            return "00:00";
        }

        const total = Math.floor(seconds);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const secs = total % 60;

        const pad = function (number) {
            return number < 10 ? "0" + number : String(number);
        };

        if (hours > 0) {
            return (
                pad(hours) + ":" +
                pad(minutes) + ":" +
                pad(secs)
            );
        }

        return pad(minutes) + ":" + pad(secs);
    }


    /* -------------------------
       SEEK BAR
    ------------------------- */

    function setupSeekBar() {
        const currentVideo = getVideo();

        if (!currentVideo) {
            return;
        }

        const seekBar = getElement([
            "seekBar",
            "progressBar",
            "videoSeekBar",
            "seekbar"
        ]);

        const currentTime = getElement([
            "currentTime",
            "current-time",
            "timeCurrent"
        ]);

        const durationTime = getElement([
            "durationTime",
            "totalTime",
            "duration",
            "videoDuration"
        ]);

        if (seekBar && seekBar.dataset.amzControlBound !== "1") {
            seekBar.dataset.amzControlBound = "1";

            seekBar.addEventListener("input", function () {
                if (!Number.isFinite(currentVideo.duration)) {
                    return;
                }

                currentVideo.currentTime =
                    (Number(seekBar.value) / 100) *
                    currentVideo.duration;
            });
        }

        if (currentVideo.dataset.amzTimeBound !== "1") {
            currentVideo.dataset.amzTimeBound = "1";

            currentVideo.addEventListener("timeupdate", function () {
                if (
                    seekBar &&
                    Number.isFinite(currentVideo.duration) &&
                    currentVideo.duration > 0
                ) {
                    seekBar.value =
                        (currentVideo.currentTime /
                            currentVideo.duration) * 100;
                }

                if (currentTime) {
                    currentTime.textContent =
                        formatTime(currentVideo.currentTime);
                }
            });

            currentVideo.addEventListener("loadedmetadata", function () {
                if (durationTime) {
                    durationTime.textContent =
                        formatTime(currentVideo.duration);
                }
            });

            currentVideo.addEventListener("durationchange", function () {
                if (durationTime) {
                    durationTime.textContent =
                        formatTime(currentVideo.duration);
                }
            });
        }
    }


    /* -------------------------
       SKIP BACK / FORWARD
    ------------------------- */

    function seekBy(seconds) {
        const currentVideo = getVideo();

        if (!currentVideo) {
            return;
        }

        const duration = Number.isFinite(currentVideo.duration)
            ? currentVideo.duration
            : Infinity;

        currentVideo.currentTime = Math.max(
            0,
            Math.min(currentVideo.currentTime + seconds, duration)
        );
    }

    function setupSkipButtons() {
        const backButton = getElement([
            "rewindBtn",
            "backwardBtn",
            "skipBackBtn",
            "seekBack"
        ]);

        const forwardButton = getElement([
            "forwardBtn",
            "skipForwardBtn",
            "seekForward"
        ]);

        if (
            backButton &&
            backButton.dataset.amzControlBound !== "1"
        ) {
            backButton.dataset.amzControlBound = "1";

            backButton.addEventListener("click", function () {
                seekBy(-10);
            });
        }

        if (
            forwardButton &&
            forwardButton.dataset.amzControlBound !== "1"
        ) {
            forwardButton.dataset.amzControlBound = "1";

            forwardButton.addEventListener("click", function () {
                seekBy(10);
            });
        }
    }


    /* -------------------------
       VOLUME
    ------------------------- */

    function setupVolume() {
        const currentVideo = getVideo();

        if (!currentVideo) {
            return;
        }

        const volumeBar = getElement([
            "volumeBar",
            "volumeSlider",
            "volume"
        ]);

        const muteButton = getElement([
            "muteBtn",
            "volumeBtn",
            "muteButton"
        ]);

        if (
            volumeBar &&
            volumeBar.dataset.amzControlBound !== "1"
        ) {
            volumeBar.dataset.amzControlBound = "1";

            volumeBar.addEventListener("input", function () {
                const value = Number(volumeBar.value);

                currentVideo.volume = Math.max(
                    0,
                    Math.min(1, value > 1 ? value / 100 : value)
                );

                currentVideo.muted = currentVideo.volume === 0;
                updateMuteButton();
            });
        }

        if (
            muteButton &&
            muteButton.dataset.amzControlBound !== "1"
        ) {
            muteButton.dataset.amzControlBound = "1";

            muteButton.addEventListener("click", function () {
                currentVideo.muted = !currentVideo.muted;
                updateMuteButton();
            });
        }

        currentVideo.addEventListener("volumechange", updateMuteButton);

        updateMuteButton();
    }

    function updateMuteButton() {
        const currentVideo = getVideo();

        const muteButton = getElement([
            "muteBtn",
            "volumeBtn",
            "muteButton"
        ]);

        if (!currentVideo || !muteButton) {
            return;
        }

        if (currentVideo.muted || currentVideo.volume === 0) {
            muteButton.textContent = "🔇";
        } else if (currentVideo.volume < 0.5) {
            muteButton.textContent = "🔉";
        } else {
            muteButton.textContent = "🔊";
        }
    }


    /* -------------------------
       PLAYBACK SPEED
    ------------------------- */

    function setupSpeedMenu() {
        const button = getElement([
            "speedBtn",
            "playbackSpeedBtn",
            "speedButton"
        ]);

        if (!button || button.dataset.amzControlBound === "1") {
            return;
        }

        button.dataset.amzControlBound = "1";

        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            let menu = document.getElementById("amzSpeedMenu");

            if (!menu) {
                menu = document.createElement("div");
                menu.id = "amzSpeedMenu";

                menu.style.position = "absolute";
                menu.style.right = "12px";
                menu.style.bottom = "55px";
                menu.style.zIndex = "9999";
                menu.style.padding = "8px";
                menu.style.minWidth = "120px";
                menu.style.background = "#17171c";
                menu.style.color = "#ffffff";
                menu.style.borderRadius = "10px";
                menu.style.boxShadow = "0 4px 18px rgba(0,0,0,.4)";

                const parent = getPlayerContainer() || document.body;

                if (
                    window.getComputedStyle(parent).position === "static"
                ) {
                    parent.style.position = "relative";
                }

                parent.appendChild(menu);

                const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

                speeds.forEach(function (speed) {
                    const item = document.createElement("button");

                    item.type = "button";
                    item.textContent =
                        speed === 1 ? "Normal" : speed + "x";

                    item.style.display = "block";
                    item.style.width = "100%";
                    item.style.padding = "9px";
                    item.style.border = "0";
                    item.style.background = "transparent";
                    item.style.color = "#ffffff";
                    item.style.textAlign = "left";
                    item.style.cursor = "pointer";

                    item.addEventListener("click", function () {
                        const currentVideo = getVideo();

                        if (currentVideo) {
                            currentVideo.playbackRate = speed;
                            selectedSpeed = speed;
                        }

                        button.textContent =
                            speed === 1 ? "1x" : speed + "x";

                        menu.style.display = "none";
                    });

                    menu.appendChild(item);
                });
            }

            menu.style.display =
                menu.style.display === "block" ? "none" : "block";
        });
    }


    /* -------------------------
       FULLSCREEN
    ------------------------- */

    function setupFullscreen() {
        const button = getElement([
            "fullscreenBtn",
            "fullScreenBtn",
            "fullscreenButton"
        ]);

        if (!button || button.dataset.amzControlBound === "1") {
            return;
        }

        button.dataset.amzControlBound = "1";

        button.addEventListener("click", function () {
            const container = getPlayerContainer() || getVideo();

            if (!container) {
                return;
            }

            if (document.fullscreenElement) {
                document.exitFullscreen().catch(function (error) {
                    console.warn("Exit fullscreen failed:", error);
                });

                return;
            }

            if (container.requestFullscreen) {
                container.requestFullscreen().catch(function (error) {
                    console.warn("Fullscreen failed:", error);
                });
            } else {
                const currentVideo = getVideo();

                if (currentVideo && currentVideo.webkitEnterFullscreen) {
                    currentVideo.webkitEnterFullscreen();
                }
            }
        });
    }


    /* -------------------------
       SUBTITLE TRACKS
    ------------------------- */

    function getSubtitleTracks() {
        const currentVideo = getVideo();

        if (!currentVideo) {
            return [];
        }

        return Array.from(currentVideo.textTracks || []);
    }

    function setupSubtitleMenu() {
        const button = getElement([
            "subtitleBtn",
            "subtitlesBtn",
            "subtitleButton",
            "captionsBtn"
        ]);

        if (!button || button.dataset.amzControlBound === "1") {
            return;
        }

        button.dataset.amzControlBound = "1";

        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            let menu = document.getElementById("amzSubtitleMenu");

            if (!menu) {
                menu = document.createElement("div");
                menu.id = "amzSubtitleMenu";

                menu.style.position = "absolute";
                menu.style.right = "12px";
                menu.style.bottom = "55px";
                menu.style.zIndex = "9999";
                menu.style.padding = "8px";
                menu.style.minWidth = "170px";
                menu.style.maxHeight = "240px";
                menu.style.overflowY = "auto";
                menu.style.background = "#17171c";
                menu.style.color = "#ffffff";
                menu.style.borderRadius = "10px";
                menu.style.boxShadow = "0 4px 18px rgba(0,0,0,.4)";

                const parent = getPlayerContainer() || document.body;

                if (
                    window.getComputedStyle(parent).position === "static"
                ) {
                    parent.style.position = "relative";
                }

                parent.appendChild(menu);
            }

            renderSubtitleMenu(menu);

            menu.style.display =
                menu.style.display === "block" ? "none" : "block";
        });
    }

    function renderSubtitleMenu(menu) {
        menu.innerHTML = "";

        const currentVideo = getVideo();

        if (!currentVideo) {
            return;
        }

        const offButton = document.createElement("button");

        offButton.type = "button";
        offButton.textContent = "Off";
        styleSubtitleButton(offButton);

        offButton.addEventListener("click", function () {
            const tracks = getSubtitleTracks();

            tracks.forEach(function (track) {
                track.mode = "disabled";
            });

            menu.style.display = "none";
        });

        menu.appendChild(offButton);

        const tracks = getSubtitleTracks();

        if (!tracks.length) {
            const empty = document.createElement("div");

            empty.textContent = "No subtitles loaded";
            empty.style.padding = "10px";
            empty.style.fontSize = "13px";

            menu.appendChild(empty);
            return;
        }

        tracks.forEach(function (track, index) {
            const item = document.createElement("button");

            item.type = "button";

            item.textContent =
                track.label ||
                track.language ||
                ("Subtitle " + (index + 1));

            styleSubtitleButton(item);

            item.addEventListener("click", function () {
                tracks.forEach(function (otherTrack, otherIndex) {
                    otherTrack.mode =
                        otherIndex === index ? "showing" : "disabled";
                });

                menu.style.display = "none";
            });

            menu.appendChild(item);
        });
    }

    function styleSubtitleButton(button) {
        button.style.display = "block";
        button.style.width = "100%";
        button.style.padding = "10px";
        button.style.margin = "2px 0";
        button.style.border = "0";
        button.style.borderRadius = "6px";
        button.style.background = "transparent";
        button.style.color = "#ffffff";
        button.style.textAlign = "left";
        button.style.cursor = "pointer";
    }


    /* -------------------------
       AUTO-HIDE PLAYER CONTROLS
    ------------------------- */

    function setupAutoHideControls() {
        const container = getPlayerContainer();

        if (!container || container.dataset.amzHideBound === "1") {
            return;
        }

        container.dataset.amzHideBound = "1";

        const controls = getElement([
            "playerControls",
            "videoControls",
            "controls"
        ]);

        function showControls() {
            if (controls) {
                controls.style.opacity = "1";
                controls.style.pointerEvents = "auto";
            }

            container.style.cursor = "default";

            if (controlsTimer) {
                clearTimeout(controlsTimer);
            }

            controlsTimer = setTimeout(function () {
                const currentVideo = getVideo();

                if (
                    currentVideo &&
                    !currentVideo.paused &&
                    !currentVideo.ended
                ) {
                    if (controls) {
                        controls.style.opacity = "0";
                        controls.style.pointerEvents = "none";
                    }

                    container.style.cursor = "none";
                }
            }, 3000);
        }

        container.addEventListener("mousemove", showControls);
        container.addEventListener("touchstart", showControls);
        container.addEventListener("click", showControls);

        showControls();
    }


    /* -------------------------
       KEYBOARD SHORTCUTS
    ------------------------- */

    function setupKeyboardControls() {
        if (document.body.dataset.amzKeyboardBound === "1") {
            return;
        }

        document.body.dataset.amzKeyboardBound = "1";

        document.addEventListener("keydown", function (event) {
            const target = event.target;

            if (
                target &&
                (
                    target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable
                )
            ) {
                return;
            }

            const currentVideo = getVideo();

            if (!currentVideo) {
                return;
            }

            switch (event.key) {
                case " ":
                case "k":
                case "K":
                    event.preventDefault();
                    togglePlayback();
                    break;

                case "ArrowLeft":
                    event.preventDefault();
                    seekBy(-10);
                    break;

                case "ArrowRight":
                    event.preventDefault();
                    seekBy(10);
                    break;

                case "ArrowUp":
                    event.preventDefault();
                    currentVideo.volume = Math.min(
                        1,
                        currentVideo.volume + 0.05
                    );
                    currentVideo.muted = false;
                    break;

                case "ArrowDown":
                    event.preventDefault();
                    currentVideo.volume = Math.max(
                        0,
                        currentVideo.volume - 0.05
                    );
                    break;

                case "m":
                case "M":
                    currentVideo.muted = !currentVideo.muted;
                    break;

                case "f":
                case "F":
                    const fullscreenButton = getElement([
                        "fullscreenBtn",
                        "fullScreenBtn",
                        "fullscreenButton"
                    ]);

                    if (fullscreenButton) {
                        fullscreenButton.click();
                    }
                    break;
            }
        });
    }


    /* -------------------------
       INITIALIZE CONTROLS
    ------------------------- */

    function initializeControls() {
        if (!getVideo()) {
            return;
        }

        setupPlayPause();
        setupSeekBar();
        setupSkipButtons();
        setupVolume();
        setupSpeedMenu();
        setupFullscreen();
        setupSubtitleMenu();
        setupAutoHideControls();
        setupKeyboardControls();
    }

    window.AMZControls = {
        init: initializeControls,
        playPause: togglePlayback,
        seekBy: seekBy,
        formatTime: formatTime,
        getSubtitleTracks: getSubtitleTracks,
        setSpeed: function (speed) {
            const currentVideo = getVideo();

            if (!currentVideo) {
                return;
            }

            const value = Number(speed);

            if (Number.isFinite(value) && value > 0) {
                currentVideo.playbackRate = value;
                selectedSpeed = value;
            }
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeControls
        );
    } else {
        initializeControls();
    }

})();

/* =========================================================
   PART 4/4 — COMMENTS + EPISODES + WATCH PROGRESS
   Anime Max Zone
========================================================= */

(function () {
    "use strict";

    const AMZ_PROGRESS_PREFIX = "amz_watch_progress_";
    const AMZ_COMMENTS_PREFIX = "amz_comments_";

    let amzProgressVideo = null;
    let amzProgressTimer = null;

    /* -------------------------
       GENERAL HELPERS
    ------------------------- */

    function amzFindElement(ids) {
        for (let i = 0; i < ids.length; i++) {
            const element = document.getElementById(ids[i]);

            if (element) {
                return element;
            }
        }

        return null;
    }

    function amzFindVideo() {
        return (
            document.getElementById("videoPlayer") ||
            document.getElementById("video") ||
            document.getElementById("player") ||
            document.querySelector("video")
        );
    }

    function amzGetEpisodeId() {
        const params = new URLSearchParams(window.location.search);

        return (
            params.get("episode") ||
            params.get("id") ||
            params.get("ep") ||
            window.location.pathname
        );
    }

    function amzGetSafeStorage(key, fallback) {
        try {
            const value = localStorage.getItem(key);

            return value === null ? fallback : value;
        } catch (error) {
            console.warn("Local storage unavailable:", error);

            return fallback;
        }
    }

    function amzSetSafeStorage(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.warn("Could not save local data:", error);

            return false;
        }
    }


    /* -------------------------
       WATCH PROGRESS
    ------------------------- */

    function amzSaveWatchProgress() {
        const video = amzFindVideo();

        if (
            !video ||
            !Number.isFinite(video.currentTime) ||
            !Number.isFinite(video.duration) ||
            video.duration <= 0
        ) {
            return;
        }

        const episodeId = amzGetEpisodeId();

        const progress = {
            currentTime: video.currentTime,
            duration: video.duration,
            updatedAt: Date.now()
        };

        amzSetSafeStorage(
            AMZ_PROGRESS_PREFIX + episodeId,
            JSON.stringify(progress)
        );
    }

    function amzRestoreWatchProgress() {
        const video = amzFindVideo();

        if (!video || video.dataset.amzResumeBound === "1") {
            return;
        }

        video.dataset.amzResumeBound = "1";

        video.addEventListener("loadedmetadata", function () {
            const episodeId = amzGetEpisodeId();

            const saved = amzGetSafeStorage(
                AMZ_PROGRESS_PREFIX + episodeId,
                null
            );

            if (!saved) {
                return;
            }

            try {
                const progress = JSON.parse(saved);

                if (
                    progress &&
                    Number.isFinite(progress.currentTime) &&
                    Number.isFinite(video.duration) &&
                    progress.currentTime > 5 &&
                    progress.currentTime < video.duration - 5
                ) {
                    const resume = window.confirm(
                        "Continue watching from " +
                        amzFormatTime(progress.currentTime) +
                        "?"
                    );

                    if (resume) {
                        video.currentTime = progress.currentTime;
                    }
                }
            } catch (error) {
                console.warn("Could not restore watch progress:", error);
            }
        });

        video.addEventListener("timeupdate", function () {
            const now = Date.now();

            if (
                !amzProgressTimer ||
                now - amzProgressTimer >= 5000
            ) {
                amzProgressTimer = now;
                amzSaveWatchProgress();
            }
        });

        video.addEventListener("pause", amzSaveWatchProgress);
        video.addEventListener("ended", function () {
            try {
                localStorage.removeItem(
                    AMZ_PROGRESS_PREFIX + amzGetEpisodeId()
                );
            } catch (error) {
                console.warn(error);
            }
        });

        window.addEventListener("beforeunload", amzSaveWatchProgress);
    }

    function amzFormatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) {
            return "00:00";
        }

        const total = Math.floor(seconds);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const secs = total % 60;

        function pad(number) {
            return number < 10 ? "0" + number : String(number);
        }

        if (hours > 0) {
            return (
                pad(hours) + ":" +
                pad(minutes) + ":" +
                pad(secs)
            );
        }

        return pad(minutes) + ":" + pad(secs);
    }


    /* -------------------------
       EPISODE NAVIGATION
    ------------------------- */

    function amzGetEpisodeList() {
        if (Array.isArray(window.animeEpisodes)) {
            return window.animeEpisodes;
        }

        if (
            window.currentAnime &&
            Array.isArray(window.currentAnime.episodes)
        ) {
            return window.currentAnime.episodes;
        }

        return [];
    }

    function amzGetCurrentEpisodeIndex(episodes) {
        const params = new URLSearchParams(window.location.search);

        const currentId =
            params.get("episode") ||
            params.get("id") ||
            params.get("ep");

        if (currentId !== null) {
            const byId = episodes.findIndex(function (episode) {
                return String(episode.id) === String(currentId);
            });

            if (byId !== -1) {
                return byId;
            }

            const numericId = Number(currentId);

            if (
                Number.isInteger(numericId) &&
                numericId >= 0 &&
                numericId < episodes.length
            ) {
                return numericId;
            }
        }

        return -1;
    }

    function amzNavigateEpisode(direction) {
        const episodes = amzGetEpisodeList();

        if (!episodes.length) {
            console.warn(
                "Episode list is not available. " +
                "Set window.animeEpisodes to your episode data."
            );

            return;
        }

        const currentIndex = amzGetCurrentEpisodeIndex(episodes);

        if (currentIndex === -1) {
            console.warn("Could not identify the current episode.");
            return;
        }

        const nextIndex = currentIndex + direction;

        if (nextIndex < 0 || nextIndex >= episodes.length) {
            return;
        }

        const episode = episodes[nextIndex];

        if (!episode) {
            return;
        }

        /*
         * Supported episode properties:
         * id, title, url, videoUrl, streamUrl
         */

        const episodeId =
            episode.id !== undefined
                ? episode.id
                : nextIndex;

        const episodeTitle =
            episode.title ||
            episode.name ||
            ("Episode " + (nextIndex + 1));

        const episodeUrl =
            episode.pageUrl ||
            episode.watchUrl ||
            (
                "watch.html?episode=" +
                encodeURIComponent(episodeId)
            );

        const videoUrl =
            episode.url ||
            episode.videoUrl ||
            episode.streamUrl ||
            "";

        /*
         * If the episode has a page URL, open that page.
         * Otherwise, load its stream in the current player.
         */

        if (episode.pageUrl || episode.watchUrl) {
            window.location.href = episodeUrl;
            return;
        }

        if (videoUrl && window.AMZPlayer) {
            const video = amzFindVideo();

            if (video) {
                video.pause();
                video.currentTime = 0;
            }

            const params = new URLSearchParams();

            params.set("episode", String(episodeId));

            if (episodeTitle) {
                params.set("title", episodeTitle);
            }

            if (window.history && window.history.pushState) {
                window.history.pushState(
                    { episodeId: episodeId },
                    "",
                    "?" + params.toString()
                );
            }

            window.AMZPlayer.init(videoUrl);

            const titleElement = amzFindElement([
                "episodeTitle",
                "watchTitle",
                "videoTitle"
            ]);

            if (titleElement) {
                titleElement.textContent = episodeTitle;
            }

            return;
        }

        window.location.href = episodeUrl;
    }

    function amzSetupEpisodeButtons() {
        const previousButton = amzFindElement([
            "prevEpisodeBtn",
            "previousEpisodeBtn",
            "prevEpisode"
        ]);

        const nextButton = amzFindElement([
            "nextEpisodeBtn",
            "nextEpisode"
        ]);

        if (
            previousButton &&
            previousButton.dataset.amzEpisodeBound !== "1"
        ) {
            previousButton.dataset.amzEpisodeBound = "1";

            previousButton.addEventListener("click", function () {
                amzNavigateEpisode(-1);
            });
        }

        if (
            nextButton &&
            nextButton.dataset.amzEpisodeBound !== "1"
        ) {
            nextButton.dataset.amzEpisodeBound = "1";

            nextButton.addEventListener("click", function () {
                amzNavigateEpisode(1);
            });
        }
    }


    /* -------------------------
       COMMENTS
       Local browser storage only
    ------------------------- */

    function amzGetCommentsKey() {
        return AMZ_COMMENTS_PREFIX + amzGetEpisodeId();
    }

    function amzReadComments() {
        try {
            const saved = amzGetSafeStorage(
                amzGetCommentsKey(),
                "[]"
            );

            const comments = JSON.parse(saved);

            return Array.isArray(comments) ? comments : [];
        } catch (error) {
            console.warn("Could not read comments:", error);

            return [];
        }
    }

    function amzWriteComments(comments) {
        return amzSetSafeStorage(
            amzGetCommentsKey(),
            JSON.stringify(comments)
        );
    }

    function amzRenderComments() {
        const list = amzFindElement([
            "commentsList",
            "commentList",
            "commentsContainer"
        ]);

        const count = amzFindElement([
            "commentsCount",
            "commentCount"
        ]);

        if (!list) {
            return;
        }

        const comments = amzReadComments();

        list.replaceChildren();

        if (count) {
            count.textContent = String(comments.length);
        }

        if (!comments.length) {
            const empty = document.createElement("div");

            empty.textContent = "No comments yet.";
            empty.style.padding = "16px";
            empty.style.color = "#999999";
            empty.style.textAlign = "center";

            list.appendChild(empty);

            return;
        }

        comments.slice().reverse().forEach(function (comment) {
            const card = document.createElement("div");

            card.className = "amz-comment-card";
            card.style.padding = "12px";
            card.style.marginBottom = "10px";
            card.style.borderRadius = "10px";
            card.style.background = "#171923";

            const name = document.createElement("div");

            name.textContent = comment.name || "Viewer";
            name.style.fontWeight = "600";
            name.style.marginBottom = "5px";

            const message = document.createElement("div");

            /*
             * textContent prevents comments from being interpreted
             * as HTML or executable markup.
             */
            message.textContent = comment.message || "";
            message.style.whiteSpace = "pre-wrap";
            message.style.overflowWrap = "anywhere";

            const date = document.createElement("small");

            date.textContent = comment.date || "";
            date.style.display = "block";
            date.style.marginTop = "8px";
            date.style.color = "#999999";

            card.appendChild(name);
            card.appendChild(message);
            card.appendChild(date);

            list.appendChild(card);
        });
    }

    function amzSetupComments() {
        const form = amzFindElement([
            "commentForm",
            "commentsForm"
        ]);

        const input = amzFindElement([
            "commentInput",
            "commentText",
            "commentMessage"
        ]);

        const nameInput = amzFindElement([
            "commentName",
            "displayName",
            "usernameInput"
        ]);

        if (
            form &&
            input &&
            form.dataset.amzCommentBound !== "1"
        ) {
            form.dataset.amzCommentBound = "1";

            form.addEventListener("submit", function (event) {
                event.preventDefault();

                const message = input.value.trim();

                const name = nameInput
                    ? nameInput.value.trim()
                    : "";

                if (!message) {
                    alert("Please enter a comment.");
                    return;
                }

                if (message.length > 1000) {
                    alert("Comment must be 1000 characters or fewer.");
                    return;
                }

                const comments = amzReadComments();

                comments.push({
                    name: name.slice(0, 40) || "Viewer",
                    message: message,
                    date: new Date().toLocaleString()
                });

                if (!amzWriteComments(comments)) {
                    alert("Could not save the comment in this browser.");
                    return;
                }

                input.value = "";

                amzRenderComments();
            });
        }

        amzRenderComments();
    }


    /* -------------------------
       OPTIONAL AUTO-NEXT
    ------------------------- */

    function amzSetupAutoNext() {
        const video = amzFindVideo();

        if (!video || video.dataset.amzAutoNextBound === "1") {
            return;
        }

        video.dataset.amzAutoNextBound = "1";

        video.addEventListener("ended", function () {
            const checkbox = amzFindElement([
                "autoNextToggle",
                "autoNextCheckbox"
            ]);

            const enabled = checkbox
                ? checkbox.checked
                : false;

            if (enabled) {
                amzNavigateEpisode(1);
            }
        });
    }


    /* -------------------------
       CLEANUP
    ------------------------- */

    function amzCleanup() {
        if (amzProgressTimer) {
            clearInterval(amzProgressTimer);
            amzProgressTimer = null;
        }

        amzSaveWatchProgress();
    }


    /* -------------------------
       INITIALIZE PART 4
    ------------------------- */

    function amzInitializePart4() {
        const video = amzFindVideo();

        if (!video) {
            return;
        }

        if (amzProgressVideo === video) {
            return;
        }

        amzProgressVideo = video;

        amzRestoreWatchProgress();
        amzSetupEpisodeButtons();
        amzSetupComments();
        amzSetupAutoNext();

        window.addEventListener("pagehide", amzCleanup);
    }

    window.AMZExtras = {
        init: amzInitializePart4,
        saveProgress: amzSaveWatchProgress,
        restoreProgress: amzRestoreWatchProgress,
        navigateEpisode: amzNavigateEpisode,
        renderComments: amzRenderComments
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            amzInitializePart4
        );
    } else {
        amzInitializePart4();
    }

})();
