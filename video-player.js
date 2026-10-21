// ============================================================
// ANIME MAX ZONE — VIDEO PLAYER
// File: video-player.js
// Full Replace Version
// ============================================================

import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import {
  getDatabase,
  ref,
  get,
  child
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCpfrluxsBhnz48ve9RykIy1IxzbBfk7dA",
  authDomain: "sm-studio-7.firebaseapp.com",
  databaseURL:
    "https://sm-studio-7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sm-studio-7",
  storageBucket: "sm-studio-7.firebasestorage.app",
  messagingSenderId: "126291501472",
  appId: "1:126291501472:web:47386660af8ec3a57204c5",
  measurementId: "G-4X9Q0761SB"
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const database = getDatabase(app);

// ============================================================
// DOM HELPERS
// ============================================================

const $ = (id) => document.getElementById(id);

const video = $("videoPlayer");
const player = $("playerContainer");

const params = new URLSearchParams(window.location.search);

const animeId = params.get("anime");
const episodeId = params.get("episode");

const directUrl = params.get("url");
const directTitle = params.get("title");
const directEpisodeTitle = params.get("episodeTitle");

let animeData = {};
let episodeData = {};
let episodes = [];

let currentEpisodeIndex = -1;

let availableQualities = {};
let availableSubtitles = {};

let controlsLocked = false;
let introTimer = null;
let controlsTimer = null;
let seekWasPlaying = false;

let currentVideoRequest = 0;
let currentTrackUrl = "";

// ============================================================
// GENERAL HELPERS
// ============================================================

function setText(id, value) {
  const element = $(id);

  if (element) {
    element.textContent = value ?? "";
  }
}

function show(id) {
  const element = $(id);

  if (element) {
    element.hidden = false;
  }
}

function hide(id) {
  const element = $(id);

  if (element) {
    element.hidden = true;
  }
}

function setLoading(message = "Loading episode...") {
  setText("loadingText", message);
  show("videoLoading");
  hide("playerError");
}

function hideLoading() {
  hide("videoLoading");
}

function showError(message) {
  hideLoading();
  hide("cinematicIntro");
  show("playerError");
  setText("errorMessage", message);
}

function safeText(value, fallback = "") {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const text = String(value).trim();

    if (text) {
      return text;
    }
  }

  return fallback;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }

  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");

  return hours > 0
    ? `${hours}:${mm}:${ss}`
    : `${mm}:${ss}`;
}

// ============================================================
// GOOGLE DRIVE URL SUPPORT ONLY
// ============================================================

function normalizeGoogleDriveUrl(value) {
  const raw = safeText(value);

  if (!raw) return "";

  try {
    const url = new URL(raw);

    const host = url.hostname
      .toLowerCase()
      .replace(/^www\./, "");

    const isDriveHost =
      host === "drive.google.com" ||
      host === "docs.google.com";

    if (
      !isDriveHost ||
      (url.protocol !== "https:" &&
        url.protocol !== "http:")
    ) {
      return "";
    }

    let fileId = url.searchParams.get("id");

    if (!fileId) {
      const match = url.pathname.match(
        /\/(?:file\/d|document\/d|spreadsheets\/d|presentation\/d)\/([a-zA-Z0-9_-]+)/
      );

      if (match) {
        fileId = match[1];
      }
    }

    if (!fileId) return "";

    return (
      "https://drive.google.com/uc?export=download&id=" +
      encodeURIComponent(fileId)
    );
  } catch {
    return "";
  }
}

function isValidHttpUrl(value) {
  return Boolean(normalizeGoogleDriveUrl(value));
}

function normalizeEpisodes(value) {
  if (!value) {
    return [];
  }

  let result = [];

  if (Array.isArray(value)) {
    result = value.map((item, index) => ({
      id: String(index),
      ...(item || {})
    }));
  } else if (typeof value === "object") {
    result = Object.entries(value).map(([id, item]) => ({
      id,
      ...(item || {})
    }));
  }

  return result.filter((item) => {
    return Boolean(getEpisodeUrl(item));
  });
}

function getEpisodeUrl(item) {
  return normalizeGoogleDriveUrl(
    item?.videoUrl ||
    item?.url ||
    item?.streamUrl ||
    item?.audioUrl
  );
}

function getAnimeName() {
  return safeText(
    animeData.title ||
    animeData.animeName ||
    animeData.name,
    safeText(directTitle, "Anime")
  );
}

function getEpisodeName() {
  return safeText(
    episodeData.episodeTitle ||
    episodeData.title ||
    episodeData.episodeNumber,
    "Now Playing"
  );
}

// ============================================================
// PAGE INFORMATION
// ============================================================
// ============================================================
// PAGE INFORMATION & VIDEO METADATA
// ============================================================

function updatePageInformation() {
  const animeName = getAnimeName();
  const episodeName = getEpisodeName();

  document.title =
    `${animeName} - ${episodeName} | ANIME MAX ZONE`;

  setText("animeTitle", animeName);
  setText("episodeTitle", episodeName);
  setText("playerAnimeTitle", animeName);
  setText("playerEpisodeTitle", episodeName);

  const poster =
    episodeData.thumbnail ||
    episodeData.poster ||
    episodeData.image ||
    animeData.poster ||
    animeData.thumbnail ||
    animeData.image ||
    "";

  const posterElement = $("videoPoster");

  if (posterElement && poster) {
    posterElement.src = poster;
    posterElement.alt = `${animeName} - ${episodeName}`;
  }

  const background = $("playerBackground");

  if (
    background &&
    poster &&
    /^https?:\/\//i.test(poster)
  ) {
    background.style.backgroundImage =
      `linear-gradient(rgba(0,0,0,.65), rgba(0,0,0,.92)), url("${poster.replace(/["\\]/g, "")}")`;
  }
}

// ============================================================
// FIREBASE DATA HELPERS
// ============================================================

async function readFirebaseData(path) {
  if (!path) {
    throw new Error("Firebase data path missing.");
  }

  const snapshot = await get(
    child(ref(database), path)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val();
}

function getAnimePath(id) {
  return `anime/${id}`;
}

function getEpisodePath(id) {
  return `episodes/${id}`;
}

// ============================================================
// LOAD ANIME INFORMATION
// ============================================================

async function loadAnimeInformation() {
  if (!animeId) {
    return {};
  }

  try {
    const data = await readFirebaseData(
      getAnimePath(animeId)
    );

    if (data && typeof data === "object") {
      animeData = data;
    }

    return animeData;
  } catch (error) {
    console.error(
      "Failed to load anime information:",
      error
    );

    return {};
  }
}

// ============================================================
// LOAD EPISODE LIST
// ============================================================

async function loadEpisodeList() {
  if (!animeId) {
    return [];
  }

  const possiblePaths = [
    `anime/${animeId}/episodes`,
    `episodes/${animeId}`
  ];

  for (const path of possiblePaths) {
    try {
      const data = await readFirebaseData(path);

      if (data) {
        const list = normalizeEpisodes(data);

        if (list.length > 0) {
          return list;
        }
      }
    } catch (error) {
      console.warn(
        `Could not load episodes from ${path}:`,
        error
      );
    }
  }

  return [];
}

// ============================================================
// LOAD CURRENT EPISODE
// ============================================================

async function loadEpisodeInformation() {
  if (!episodeId) {
    return {};
  }

  // Try the anime's own episode list first.
  const matchingEpisode = episodes.find((episode) => {
    return String(episode.id) === String(episodeId);
  });

  if (matchingEpisode) {
    return matchingEpisode;
  }

  // Try a standalone episode record.
  try {
    const data = await readFirebaseData(
      getEpisodePath(episodeId)
    );

    if (data && typeof data === "object") {
      return data;
    }
  } catch (error) {
    console.warn(
      "Standalone episode lookup failed:",
      error
    );
  }

  return {};
}

// ============================================================
// FIND CURRENT EPISODE INDEX
// ============================================================

function findCurrentEpisodeIndex() {
  if (!episodeId || !episodes.length) {
    currentEpisodeIndex = -1;
    return;
  }

  currentEpisodeIndex = episodes.findIndex(
    (episode) =>
      String(episode.id) === String(episodeId)
  );
}

// ============================================================
// GET PREVIOUS AND NEXT EPISODES
// ============================================================

function getPreviousEpisode() {
  if (currentEpisodeIndex <= 0) {
    return null;
  }

  return episodes[currentEpisodeIndex - 1] || null;
}

function getNextEpisode() {
  if (
    currentEpisodeIndex < 0 ||
    currentEpisodeIndex >= episodes.length - 1
  ) {
    return null;
  }

  return episodes[currentEpisodeIndex + 1] || null;
}

// ============================================================
// NAVIGATE TO EPISODE
// ============================================================

function navigateToEpisode(episode) {
  if (!episode) {
    return;
  }

  const episodeUrl = getEpisodeUrl(episode);

  if (!episodeUrl) {
    showError(
      "Is episode ka valid Google Drive video URL nahi mila."
    );

    return;
  }

  const nextParams = new URLSearchParams(
    window.location.search
  );

  nextParams.set("episode", String(episode.id));
  nextParams.delete("url");

  const nextUrl =
    `${window.location.pathname}?${nextParams.toString()}`;

  window.location.href = nextUrl;
}

// ============================================================
// PREVIOUS / NEXT BUTTONS
// ============================================================

function setupEpisodeNavigation() {
  const previousButton = $("previousEpisode");
  const nextButton = $("nextEpisode");

  if (previousButton) {
    previousButton.disabled = !getPreviousEpisode();

    previousButton.addEventListener("click", () => {
      navigateToEpisode(getPreviousEpisode());
    });
  }

  if (nextButton) {
    nextButton.disabled = !getNextEpisode();

    nextButton.addEventListener("click", () => {
      navigateToEpisode(getNextEpisode());
    });
  }
}

// ============================================================
// EPISODE INFORMATION
// ============================================================

function updateEpisodeInformation() {
  updatePageInformation();
  findCurrentEpisodeIndex();
  setupEpisodeNavigation();
}

// ============================================================
// END OF PART 2
// ============================================================
// ============================================================
// VIDEO SOURCE MANAGEMENT
// ============================================================

function getVideoSource() {
  // Direct URL mode: Google Drive URLs only.
  if (directUrl) {
    return normalizeGoogleDriveUrl(directUrl);
  }

  // Firebase episode mode.
  return getEpisodeUrl(episodeData);
}

// ============================================================
// VIDEO PLAYER ERROR HANDLING
// ============================================================

function handleVideoError() {
  hideLoading();

  const mediaError = video?.error;

  let message =
    "Video play nahi ho raha. Google Drive link aur permissions check karo.";

  if (mediaError) {
    switch (mediaError.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        message = "Video playback cancel ho gaya.";
        break;

      case MediaError.MEDIA_ERR_NETWORK:
        message =
          "Network error. Internet connection check karke dobara try karo.";
        break;

      case MediaError.MEDIA_ERR_DECODE:
        message =
          "Video format ya codec supported nahi hai.";
        break;

      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        message =
          "Google Drive video browser mein play nahi ho raha. File permission aur playback support check karo.";
        break;
    }
  }

  showError(message);
}

// ============================================================
// RETRY VIDEO
// ============================================================

function retryVideo() {
  const source = getVideoSource();

  if (!source) {
    showError(
      "Valid Google Drive video URL nahi mila."
    );
    return;
  }

  hide("playerError");
  setLoading("Video dobara load ho raha hai...");

  video.pause();
  video.removeAttribute("src");
  video.load();

  window.setTimeout(() => {
    loadVideoSource(source);
  }, 300);
}

// ============================================================
// LOAD VIDEO SOURCE
// ============================================================

function loadVideoSource(source) {
  if (!video) {
    showError("Video player element nahi mila.");
    return;
  }

  const normalizedSource =
    normalizeGoogleDriveUrl(source);

  if (!normalizedSource) {
    showError(
      "Sirf valid Google Drive video links supported hain."
    );
    return;
  }

  const requestId = ++currentVideoRequest;

  currentTrackUrl = normalizedSource;

  hide("playerError");
  setLoading("Video load ho raha hai...");

  video.pause();
  video.src = normalizedSource;
  video.load();

  video.addEventListener(
    "loadedmetadata",
    function onMetadata() {
      if (requestId !== currentVideoRequest) {
        return;
      }

      video.removeEventListener(
        "loadedmetadata",
        onMetadata
      );

      hideLoading();

      setText(
        "durationText",
        formatTime(video.duration)
      );

      updateProgress();
    }
  );

  video.addEventListener(
    "canplay",
    function onCanPlay() {
      if (requestId !== currentVideoRequest) {
        return;
      }

      hideLoading();

      video.removeEventListener(
        "canplay",
        onCanPlay
      );
    }
  );

  video.addEventListener(
    "error",
    function onError() {
      if (requestId !== currentVideoRequest) {
        return;
      }

      handleVideoError();
    }
  );
}

// ============================================================
// PLAY VIDEO
// ============================================================

async function playVideo() {
  if (!video) {
    return;
  }

  try {
    await video.play();

    hide("playerError");
    updatePlayPauseButton();
    showPlayerControls();
  } catch (error) {
    console.warn("Video play failed:", error);

    updatePlayPauseButton();

    if (error.name === "NotAllowedError") {
      setText(
        "errorMessage",
        "Video play karne ke liye Play button dabao."
      );
    } else {
      showError(
        "Video play nahi ho raha. Google Drive access check karo."
      );
    }
  }
}

// ============================================================
// PLAY / PAUSE TOGGLE
// ============================================================

function togglePlayPause() {
  if (!video) {
    return;
  }

  if (video.paused || video.ended) {
    playVideo();
  } else {
    video.pause();
  }
}

// ============================================================
// PLAY / PAUSE BUTTON UI
// ============================================================

function updatePlayPauseButton() {
  const playButton = $("playPauseButton");

  if (!playButton || !video) {
    return;
  }

  const isPlaying =
    !video.paused && !video.ended;

  playButton.textContent =
    isPlaying ? "❚❚" : "▶";

  playButton.setAttribute(
    "aria-label",
    isPlaying ? "Pause video" : "Play video"
  );

  playButton.setAttribute(
    "title",
    isPlaying ? "Pause" : "Play"
  );
}

// ============================================================
// VIDEO EVENT LISTENERS
// ============================================================

function setupVideoEvents() {
  if (!video) {
    console.error(
      'HTML mein id="videoPlayer" element nahi mila.'
    );
    return;
  }

  video.addEventListener("play", () => {
    updatePlayPauseButton();
    hide("playerError");
  });

  video.addEventListener("pause", () => {
    updatePlayPauseButton();
  });

  video.addEventListener("ended", () => {
    updatePlayPauseButton();

    const nextEpisode = getNextEpisode();

    if (nextEpisode) {
      setText(
        "nextEpisodeMessage",
        "Next episode available"
      );
    }
  });

  video.addEventListener("waiting", () => {
    if (!video.paused) {
      setLoading("Buffering...");
    }
  });

  video.addEventListener("playing", () => {
    hideLoading();
    updatePlayPauseButton();
  });

  video.addEventListener("timeupdate", () => {
    updateProgress();
  });

  video.addEventListener("durationchange", () => {
    setText(
      "durationText",
      formatTime(video.duration)
    );
  });

  video.addEventListener("volumechange", () => {
    updateVolumeUI();
  });

  video.addEventListener("click", () => {
    togglePlayPause();
  });

  updatePlayPauseButton();
}

// ============================================================
// END OF PART 3
// ============================================================
