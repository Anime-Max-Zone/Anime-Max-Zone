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
// ============================================================
// VIDEO PROGRESS BAR
// ============================================================

function updateProgress() {
  if (!video) {
    return;
  }

  const current = video.currentTime || 0;
  const duration = video.duration || 0;

  const progressBar = $("progressBar");
  const progressFill = $("progressFill");
  const seekBar = $("seekBar");
  const currentTimeText = $("currentTimeText");
  const durationText = $("durationText");

  const percentage =
    duration > 0 ? (current / duration) * 100 : 0;

  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
  }

  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }

  if (seekBar && duration > 0) {
    seekBar.value = String(percentage);
    seekBar.setAttribute(
      "aria-valuenow",
      String(Math.round(percentage))
    );
  }

  if (currentTimeText) {
    currentTimeText.textContent = formatTime(current);
  }

  if (durationText) {
    durationText.textContent = formatTime(duration);
  }
}

// ============================================================
// SEEK VIDEO
// ============================================================

function seekToPercentage(value) {
  if (!video || !Number.isFinite(video.duration)) {
    return;
  }

  const percentage = Math.max(
    0,
    Math.min(100, Number(value) || 0)
  );

  video.currentTime =
    (percentage / 100) * video.duration;

  updateProgress();
}

function setupSeekBar() {
  const seekBar = $("seekBar");

  if (!seekBar) {
    return;
  }

  seekBar.addEventListener("input", (event) => {
    seekToPercentage(event.target.value);
  });

  seekBar.addEventListener("change", (event) => {
    seekToPercentage(event.target.value);
  });
}

// ============================================================
// SKIP FORWARD / BACKWARD
// ============================================================

function skipForward(seconds = 10) {
  if (!video || !Number.isFinite(video.duration)) {
    return;
  }

  video.currentTime = Math.min(
    video.duration,
    video.currentTime + seconds
  );

  updateProgress();
}

function skipBackward(seconds = 10) {
  if (!video) {
    return;
  }

  video.currentTime = Math.max(
    0,
    video.currentTime - seconds
  );

  updateProgress();
}

// ============================================================
// VOLUME CONTROL
// ============================================================

function updateVolumeUI() {
  if (!video) {
    return;
  }

  const volumeSlider = $("volumeSlider");
  const muteButton = $("muteButton");

  if (volumeSlider) {
    volumeSlider.value = String(
      video.muted ? 0 : video.volume
    );
  }

  if (muteButton) {
    muteButton.textContent =
      video.muted || video.volume === 0
        ? "🔇"
        : video.volume < 0.5
          ? "🔉"
          : "🔊";

    muteButton.setAttribute(
      "aria-label",
      video.muted ? "Unmute" : "Mute"
    );
  }
}

function setVolume(value) {
  if (!video) {
    return;
  }

  const volume = Math.max(
    0,
    Math.min(1, Number(value) || 0)
  );

  video.volume = volume;
  video.muted = volume === 0;

  updateVolumeUI();
}

function toggleMute() {
  if (!video) {
    return;
  }

  video.muted = !video.muted;
  updateVolumeUI();
}

function setupVolumeControls() {
  const volumeSlider = $("volumeSlider");
  const muteButton = $("muteButton");

  if (volumeSlider) {
    volumeSlider.addEventListener("input", (event) => {
      setVolume(event.target.value);
    });
  }

  if (muteButton) {
    muteButton.addEventListener("click", toggleMute);
  }

  updateVolumeUI();
}

// ============================================================
// PLAYBACK SPEED
// ============================================================

function setPlaybackSpeed(speed) {
  if (!video) {
    return;
  }

  const allowedSpeeds = [
    0.25,
    0.5,
    0.75,
    1,
    1.25,
    1.5,
    1.75,
    2
  ];

  const selectedSpeed = Number(speed);

  if (!allowedSpeeds.includes(selectedSpeed)) {
    return;
  }

  video.playbackRate = selectedSpeed;

  setText(
    "playbackSpeedLabel",
    `${selectedSpeed}x`
  );

  hide("speedMenu");
}

function setupPlaybackSpeed() {
  const speedButton = $("speedButton");
  const speedMenu = $("speedMenu");

  if (speedButton && speedMenu) {
    speedButton.addEventListener("click", () => {
      speedMenu.hidden = !speedMenu.hidden;
    });

    speedMenu
      .querySelectorAll("[data-speed]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          setPlaybackSpeed(
            button.getAttribute("data-speed")
          );
        });
      });
  }
}

// ============================================================
// DOUBLE-TAP SEEK
// ============================================================

let lastTapTime = 0;
let lastTapSide = "";

function setupDoubleTapSeek() {
  if (!player) {
    return;
  }

  player.addEventListener("touchend", (event) => {
    if (
      event.target.closest("button") ||
      event.target.closest("input") ||
      event.target.closest("select")
    ) {
      return;
    }

    const now = Date.now();
    const touch = event.changedTouches[0];
    const rect = player.getBoundingClientRect();

    const x = touch.clientX - rect.left;
    const side =
      x < rect.width / 2 ? "left" : "right";

    if (
      now - lastTapTime < 320 &&
      side === lastTapSide
    ) {
      if (side === "left") {
        skipBackward(10);
      } else {
        skipForward(10);
      }

      lastTapTime = 0;
      lastTapSide = "";
      return;
    }

    lastTapTime = now;
    lastTapSide = side;
  });
}

// ============================================================
// END OF PART 4
// ============================================================
// ============================================================
// FULLSCREEN MODE
// ============================================================

function isPlayerFullscreen() {
  return Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement
  );
}

async function toggleFullscreen() {
  const target = player || video;

  if (!target) {
    return;
  }

  try {
    if (isPlayerFullscreen()) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }

      return;
    }

    if (target.requestFullscreen) {
      await target.requestFullscreen();
    } else if (target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen();
    } else if (video?.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    } else {
      console.warn("Fullscreen is not supported.");
    }
  } catch (error) {
    console.error("Fullscreen error:", error);
  }
}

function updateFullscreenButton() {
  const button = $("fullscreenButton");

  if (!button) {
    return;
  }

  const fullscreen = isPlayerFullscreen();

  button.textContent = fullscreen ? "⛶" : "⛶";

  button.setAttribute(
    "aria-label",
    fullscreen ? "Exit fullscreen" : "Enter fullscreen"
  );
}

function setupFullscreen() {
  const button = $("fullscreenButton");

  if (button) {
    button.addEventListener("click", toggleFullscreen);
  }

  document.addEventListener(
    "fullscreenchange",
    updateFullscreenButton
  );

  document.addEventListener(
    "webkitfullscreenchange",
    updateFullscreenButton
  );
}

// ============================================================
// PICTURE-IN-PICTURE MODE
// ============================================================

async function togglePictureInPicture() {
  if (!video) {
    return;
  }

  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      return;
    }

    if (
      document.pictureInPictureEnabled &&
      video.readyState >= 1
    ) {
      await video.requestPictureInPicture();
    } else {
      console.warn(
        "Picture-in-Picture is not available."
      );
    }
  } catch (error) {
    console.error("Picture-in-Picture error:", error);
  }
}

function setupPictureInPicture() {
  const button = $("pipButton");

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    togglePictureInPicture
  );

  if (!document.pictureInPictureEnabled) {
    button.disabled = true;
    button.title = "Picture-in-Picture not supported";
  }
}

// ============================================================
// PLAYER CONTROLS VISIBILITY
// ============================================================

function showPlayerControls() {
  if (!player || controlsLocked) {
    return;
  }

  player.classList.remove("controls-hidden");

  clearTimeout(controlsTimer);

  if (video && !video.paused) {
    controlsTimer = window.setTimeout(() => {
      if (
        !video.paused &&
        !controlsLocked &&
        !isPlayerFullscreen()
      ) {
        player.classList.add("controls-hidden");
      }
    }, 3500);
  }
}

function hidePlayerControls() {
  if (!player || controlsLocked) {
    return;
  }

  player.classList.add("controls-hidden");
}

function setupControlsVisibility() {
  if (!player) {
    return;
  }

  player.addEventListener("mousemove", () => {
    showPlayerControls();
  });

  player.addEventListener("touchstart", () => {
    showPlayerControls();
  }, { passive: true });

  player.addEventListener("click", (event) => {
    if (
      event.target.closest("button") ||
      event.target.closest("input") ||
      event.target.closest("select")
    ) {
      showPlayerControls();
      return;
    }

    if (player.classList.contains("controls-hidden")) {
      showPlayerControls();
    } else {
      showPlayerControls();
    }
  });

  video?.addEventListener("play", () => {
    showPlayerControls();
  });

  video?.addEventListener("pause", () => {
    showPlayerControls();
  });
}

// ============================================================
// LOCK PLAYER CONTROLS
// ============================================================

function toggleControlsLock() {
  controlsLocked = !controlsLocked;

  const button = $("lockControlsButton");

  if (button) {
    button.textContent = controlsLocked ? "🔒" : "🔓";

    button.setAttribute(
      "aria-label",
      controlsLocked
        ? "Unlock player controls"
        : "Lock player controls"
    );
  }

  if (player) {
    player.classList.toggle(
      "controls-locked",
      controlsLocked
    );
  }

  if (controlsLocked) {
    clearTimeout(controlsTimer);
  } else {
    showPlayerControls();
  }
}

function setupControlsLock() {
  const button = $("lockControlsButton");

  if (button) {
    button.addEventListener(
      "click",
      toggleControlsLock
    );
  }
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

function setupKeyboardControls() {
  document.addEventListener("keydown", (event) => {
    const target = event.target;

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable
    ) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case " ":
      case "k":
        event.preventDefault();
        togglePlayPause();
        break;

      case "arrowright":
        event.preventDefault();
        skipForward(10);
        break;

      case "arrowleft":
        event.preventDefault();
        skipBackward(10);
        break;

      case "arrowup":
        event.preventDefault();
        setVolume((video?.volume || 0) + 0.05);
        break;

      case "arrowdown":
        event.preventDefault();
        setVolume((video?.volume || 0) - 0.05);
        break;

      case "m":
        toggleMute();
        break;

      case "f":
        toggleFullscreen();
        break;

      case "escape":
        showPlayerControls();
        break;
    }
  });
}

// ============================================================
// END OF PART 5
// ============================================================
// ============================================================
// SUBTITLE MANAGEMENT
// ============================================================

function clearSubtitles() {
  if (!video || !video.textTracks) {
    return;
  }

  for (const track of video.textTracks) {
    track.mode = "disabled";
  }
}

function getSubtitleUrl(item) {
  if (!item) {
    return "";
  }

  return normalizeGoogleDriveUrl(
    item.url ||
    item.subtitleUrl ||
    item.fileUrl
  );
}

function loadSubtitleOptions(subtitles) {
  const select = $("subtitleSelect");

  if (!select) {
    return;
  }

  select.replaceChildren();

  const offOption = document.createElement("option");
  offOption.value = "";
  offOption.textContent = "Subtitles Off";

  select.appendChild(offOption);

  availableSubtitles = {};

  if (!Array.isArray(subtitles)) {
    return;
  }

  subtitles.forEach((item, index) => {
    const url = getSubtitleUrl(item);

    if (!url) {
      return;
    }

    const option = document.createElement("option");

    option.value = String(index);
    option.textContent =
      safeText(item.label || item.language, `Subtitle ${index + 1}`);

    availableSubtitles[index] = {
      ...item,
      url
    };

    select.appendChild(option);
  });
}

async function selectSubtitle(index) {
  if (!video) {
    return;
  }

  video.querySelectorAll("track").forEach((track) => {
    track.remove();
  });

  clearSubtitles();

  if (index === "") {
    return;
  }

  const subtitle = availableSubtitles[index];

  if (!subtitle) {
    return;
  }

  const trackElement = document.createElement("track");

  trackElement.kind = "subtitles";
  trackElement.label =
    safeText(subtitle.label || subtitle.language, "Subtitle");

  trackElement.srclang =
    safeText(subtitle.languageCode, "en");

  trackElement.src = subtitle.url;
  trackElement.default = true;

  video.appendChild(trackElement);

  trackElement.addEventListener("load", () => {
    const tracks = video.textTracks;

    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = "disabled";
    }

    if (tracks.length > 0) {
      tracks[tracks.length - 1].mode = "showing";
    }
  });
}

function setupSubtitleControls() {
  const select = $("subtitleSelect");

  if (select) {
    select.addEventListener("change", () => {
      selectSubtitle(select.value);
    });
  }
}

// ============================================================
// AUDIO TRACK MANAGEMENT
// ============================================================

function setupAudioTrackControls() {
  const select = $("audioTrackSelect");

  if (!select || !video) {
    return;
  }

  select.replaceChildren();

  const defaultOption = document.createElement("option");

  defaultOption.value = "default";
  defaultOption.textContent = "Default Audio";

  select.appendChild(defaultOption);

  /*
   * Native HTML video does not expose a consistent,
   * cross-browser API for selecting alternate audio tracks.
   *
   * This selector therefore keeps the default audio selected.
   * Alternate-track selection requires compatible media,
   * browser support, and a suitable streaming implementation.
   */

  select.disabled = true;
}

// ============================================================
// VIDEO QUALITY MENU
// ============================================================

function setupQualityControls() {
  const select = $("qualitySelect");

  if (!select) {
    return;
  }

  select.replaceChildren();

  const option = document.createElement("option");

  option.value = "auto";
  option.textContent = "Original Quality";

  select.appendChild(option);

  /*
   * A Google Drive URL generally represents one video file,
   * not a list of selectable streaming quality variants.
   *
   * Real quality switching requires separate compatible
   * video sources or a streaming manifest.
   */

  select.disabled = true;
}

// ============================================================
// PLAYBACK SETTINGS MENU
// ============================================================

function setupSettingsMenu() {
  const settingsButton = $("settingsButton");
  const settingsMenu = $("settingsMenu");

  if (!settingsButton || !settingsMenu) {
    return;
  }

  settingsButton.addEventListener("click", (event) => {
    event.stopPropagation();

    settingsMenu.hidden = !settingsMenu.hidden;
  });

  document.addEventListener("click", (event) => {
    if (
      !settingsMenu.contains(event.target) &&
      !settingsButton.contains(event.target)
    ) {
      settingsMenu.hidden = true;
    }
  });
}

// ============================================================
// SHARE CURRENT EPISODE
// ============================================================

async function shareCurrentEpisode() {
  const shareData = {
    title: document.title,
    text: `${getAnimeName()} - ${getEpisodeName()}`,
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareData.url);

      setText("shareMessage", "Link copied!");

      window.setTimeout(() => {
        setText("shareMessage", "");
      }, 2000);
    } else {
      window.prompt("Copy this link:", shareData.url);
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Share failed:", error);
    }
  }
}

function setupShareButton() {
  const button = $("shareButton");

  if (button) {
    button.addEventListener("click", shareCurrentEpisode);
  }
}

// ============================================================
// END OF PART 6
// ============================================================
// ============================================================
// CINEMATIC INTRO
// ============================================================

function hideCinematicIntro() {
  clearTimeout(introTimer);

  const intro = $("cinematicIntro");

  if (intro) {
    intro.classList.remove("show");
    intro.hidden = true;
  }
}

function showCinematicIntro() {
  const intro = $("cinematicIntro");

  if (!intro) {
    return;
  }

  setText("introAnimeTitle", getAnimeName());
  setText("introEpisodeTitle", getEpisodeName());

  intro.hidden = false;

  requestAnimationFrame(() => {
    intro.classList.add("show");
  });

  clearTimeout(introTimer);

  introTimer = window.setTimeout(() => {
    hideCinematicIntro();
  }, 2500);
}

function setupCinematicIntro() {
  const skipButton = $("skipIntroButton");

  if (skipButton) {
    skipButton.addEventListener(
      "click",
      hideCinematicIntro
    );
  }
}

// ============================================================
// LOADING INDICATOR
// ============================================================

function setupLoadingIndicator() {
  if (!video) {
    return;
  }

  video.addEventListener("loadstart", () => {
    setLoading("Video load ho raha hai...");
  });

  video.addEventListener("waiting", () => {
    if (!video.paused) {
      setLoading("Buffering...");
    }
  });

  video.addEventListener("playing", () => {
    hideLoading();
  });

  video.addEventListener("canplay", () => {
    hideLoading();
  });

  video.addEventListener("stalled", () => {
    if (!video.paused) {
      setLoading("Connection slow hai...");
    }
  });
}

// ============================================================
// RETRY BUTTON
// ============================================================

function setupRetryButton() {
  const retryButton = $("retryButton");

  if (retryButton) {
    retryButton.addEventListener("click", () => {
      retryVideo();
    });
  }
}

// ============================================================
// BROWSER ONLINE / OFFLINE STATUS
// ============================================================

function setupNetworkStatus() {
  window.addEventListener("offline", () => {
    if (video && !video.paused) {
      video.pause();
    }

    showError(
      "Internet connection nahi hai. Connection check karke retry karo."
    );
  });

  window.addEventListener("online", () => {
    hide("playerError");
    setText(
      "networkStatus",
      "Connection restored"
    );
  });
}

// ============================================================
// PREVENT UNEXPECTED PAGE SCROLL IN FULLSCREEN
// ============================================================

function setupFullscreenLayout() {
  document.addEventListener("fullscreenchange", () => {
    document.body.classList.toggle(
      "player-fullscreen",
      Boolean(document.fullscreenElement)
    );
  });
}

// ============================================================
// PLAYER CONTROL BUTTONS
// ============================================================

function setupMainPlayerButtons() {
  const playButton = $("playPauseButton");
  const backwardButton = $("backwardButton");
  const forwardButton = $("forwardButton");

  if (playButton) {
    playButton.addEventListener(
      "click",
      togglePlayPause
    );
  }

  if (backwardButton) {
    backwardButton.addEventListener("click", () => {
      skipBackward(10);
    });
  }

  if (forwardButton) {
    forwardButton.addEventListener("click", () => {
      skipForward(10);
    });
  }
}

// ============================================================
// ACCESSIBILITY
// ============================================================

function setupAccessibility() {
  if (!video) {
    return;
  }

  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("preload", "metadata");

  const controls = [
    "playPauseButton",
    "fullscreenButton",
    "pipButton",
    "muteButton",
    "settingsButton",
    "shareButton",
    "previousEpisode",
    "nextEpisode"
  ];

  controls.forEach((id) => {
    const element = $(id);

    if (
      element &&
      element.tagName === "BUTTON" &&
      !element.hasAttribute("type")
    ) {
      element.type = "button";
    }
  });
}

// ============================================================
// CLEANUP
// ============================================================

function cleanupPlayer() {
  clearTimeout(introTimer);
  clearTimeout(controlsTimer);

  if (video) {
    video.pause();
  }
}

window.addEventListener("pagehide", cleanupPlayer);

// ============================================================
// END OF PART 7
// ============================================================
// ============================================================
// INITIALIZE VIDEO PLAYER
// ============================================================

async function initializeVideoPlayer() {
  try {
    setLoading("Anime Max Zone not loaded");

    // Set up player controls and event listeners.
    setupVideoEvents();
    setupSeekBar();
    setupVolumeControls();
    setupPlaybackSpeed();
    setupFullscreen();
    setupPictureInPicture();
    setupControlsVisibility();
    setupControlsLock();
    setupKeyboardControls();
    setupDoubleTapSeek();
    setupSubtitleControls();
    setupAudioTrackControls();
    setupQualityControls();
    setupSettingsMenu();
    setupShareButton();
    setupCinematicIntro();
    setupLoadingIndicator();
    setupRetryButton();
    setupNetworkStatus();
    setupFullscreenLayout();
    setupMainPlayerButtons();
    setupAccessibility();

    // Load information from Firebase when IDs are supplied.
    if (animeId) {
      await loadAnimeInformation();
      episodes = await loadEpisodeList();
    }

    // Resolve the current episode.
    if (episodeId) {
      episodeData = await loadEpisodeInformation();
    } else if (directUrl) {
      episodeData = {
        title: directEpisodeTitle || directTitle || "Now Playing",
        videoUrl: directUrl
      };
    } else if (episodes.length > 0) {
      episodeData = episodes[0];
    }

    // Update the page title and episode details.
    updateEpisodeInformation();

    // Read the Google Drive video URL.
    const source = getVideoSource();

    if (!source) {
      showError(
        "Video URL nahi mila. Valid Google Drive link check karo."
      );

      return;
    }

    // Load and prepare the video.
    loadVideoSource(source);

    // Populate subtitle options if available.
    const subtitleList =
      episodeData.subtitles ||
      episodeData.subtitleTracks ||
      [];

    loadSubtitleOptions(subtitleList);

    // Display the cinematic intro if available.
    showCinematicIntro();

    console.log(
      "ANIME MAX ZONE player initialized successfully."
    );
  } catch (error) {
    console.error(
      "Player initialization failed:",
      error
    );

    showError(
      "Player load nahi ho paya. Page refresh karke dobara try karo."
    );
  }
}

// ============================================================
// START PLAYER WHEN PAGE IS READY
// ============================================================

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeVideoPlayer,
    { once: true }
  );
} else {
  initializeVideoPlayer();
}

// ============================================================
// END OF VIDEO-PLAYER.JS
// ============================================================
