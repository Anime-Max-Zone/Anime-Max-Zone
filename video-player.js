// ============================================================
// ANIME MAX ZONE — VIDEO PLAYER
// File: video-player.js
// ============================================================

import { initializeApp, getApps } from
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

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

// Optional direct video URL mode:
// video-player.html?url=ENCODED_VIDEO_URL&title=Naruto
const directUrl = params.get("url");
const directTitle = params.get("title");

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

// ============================================================
// GENERAL HELPERS
// ============================================================

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value ?? "";
}

function show(id) {
  const element = $(id);
  if (element) element.hidden = false;
}

function hide(id) {
  const element = $(id);
  if (element) element.hidden = true;
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

function safeText(value, fallback = "") {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function normalizeEpisodes(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item, index) => ({
        id: String(index),
        ...(item || {})
      }))
      .filter((item) => item.videoUrl || item.url || item.audioUrl);
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([id, item]) => ({
        id,
        ...(item || {})
      }))
      .filter((item) => item.videoUrl || item.url || item.audioUrl);
  }

  return [];
}

function updatePageTitle() {
  const animeName = safeText(
    animeData.title || animeData.animeName || animeData.name,
    directTitle || "Anime"
  );

  const episodeName = safeText(
    episodeData.title ||
    episodeData.episodeTitle ||
    episodeData.episodeNumber
  );

  document.title = episodeName
    ? `${animeName} - ${episodeName} | Anime Max Zone`
    : `${animeName} | Anime Max Zone`;

  setText("animeTitle", animeName);
  setText("infoAnimeTitle", animeName);

  setText(
    "episodeTitle",
    episodeName || "Now Playing"
  );

  setText(
    "infoEpisodeTitle",
    episodeName || "Now Playing"
  );

  setText(
    "episodeDescription",
    safeText(
      episodeData.description || animeData.description,
      "Enjoy your anime on Anime Max Zone."
    )
  );
}

function getEpisodeUrl(item) {
  return safeText(
    item?.videoUrl ||
    item?.url ||
    item?.audioUrl ||
    item?.streamUrl
  );
}

function updateHistoryUrl() {
  const url = new URL(window.location.href);

  if (animeId) url.searchParams.set("anime", animeId);
  if (episodeData.id) {
    url.searchParams.set("episode", episodeData.id);
  }

  // Keep direct URL mode intact if used.
  history.replaceState({}, "", url);
}

// ============================================================
// LOAD FIREBASE DATA
// ============================================================

async function loadEpisodeData() {
  if (directUrl) {
    animeData = {
      title: safeText(directTitle, "Anime")
    };

    episodeData = {
      id: "direct",
      title: safeText(params.get("episodeTitle"), "Now Playing"),
      videoUrl: directUrl,
      description: ""
    };

    episodes = [episodeData];

    updatePageTitle();
    renderEpisodeList();
    setupEpisodeMedia(episodeData);

    return;
  }

  if (!animeId || !episodeId) {
    showError(
      "Anime or episode ID is missing. Please open an episode from the anime page."
    );
    return;
  }

  setLoading("Loading anime details...");

  try {
    const root = ref(database);

    const [animeSnapshot, episodeSnapshot, episodesSnapshot] =
      await Promise.all([
        get(child(root, `anime/${animeId}`)),
        get(child(root, `anime/${animeId}/episodes/${episodeId}`)),
        get(child(root, `anime/${animeId}/episodes`))
      ]);

    if (!animeSnapshot.exists()) {
      throw new Error("Anime not found in the database.");
    }

    if (!episodeSnapshot.exists()) {
      throw new Error("This episode could not be found.");
    }

    animeData = animeSnapshot.val() || {};
    episodeData = {
      id: episodeId,
      ...(episodeSnapshot.val() || {})
    };

    episodes = normalizeEpisodes(episodesSnapshot.val());

    // If episode IDs are stored as database keys, preserve them.
    currentEpisodeIndex = episodes.findIndex(
      (item) => String(item.id) === String(episodeId)
    );

    if (currentEpisodeIndex < 0) {
      episodes.push(episodeData);
      currentEpisodeIndex = episodes.length - 1;
    }

    updatePageTitle();
    renderEpisodeList();
    updateNextEpisode();
    setupEpisodeMedia(episodeData);
    updateHistoryUrl();

  } catch (error) {
    console.error("Failed to load anime:", error);

    showError(
      error.message ||
      "Unable to load episode details. Check your Firebase database rules and data."
    );
  }
}

// ============================================================
// VIDEO SOURCE
// ============================================================

function setupEpisodeMedia(item) {
  if (!video) return;

  const sourceUrl = getEpisodeUrl(item);

  if (!sourceUrl) {
    showError("No video URL was found for this episode.");
    return;
  }

  episodeData = item;

  availableQualities =
    item.qualities && typeof item.qualities === "object"
      ? item.qualities
      : {};

  availableSubtitles =
    item.subtitles && typeof item.subtitles === "object"
      ? item.subtitles
      : {};

  renderQualityOptions();
  renderSubtitleOptions();
  renderAudioOptions();

  setLoading("Loading video...");

  clearTimeout(introTimer);
  hide("cinematicIntro");

  video.pause();
  video.removeAttribute("src");

  // Remove old tracks from the previous episode.
  video.querySelectorAll("track").forEach((track) => track.remove());

  video.src = sourceUrl;
  video.load();

  setText("currentTime", "00:00");
  setText("duration", "00:00");

  const qualityLabel = $("qualityLabel");
  if (qualityLabel) {
    qualityLabel.textContent = "Auto";
  }

  updatePageTitle();
}

video?.addEventListener("loadedmetadata", () => {
  setText("duration", formatTime(video.duration));

  const seekBar = $("seekBar");
  if (seekBar) seekBar.value = "0";

  hideLoading();
  startCinematicIntro();
});

video?.addEventListener("durationchange", () => {
  if (Number.isFinite(video.duration)) {
    setText("duration", formatTime(video.duration));
  }
});

video?.addEventListener("canplay", () => {
  hideLoading();
});

video?.addEventListener("waiting", () => {
  if (!video.paused) {
    setLoading("Buffering...");
  }
});

video?.addEventListener("playing", () => {
  hideLoading();
  updatePlayButton();
});

video?.addEventListener("pause", updatePlayButton);
video?.addEventListener("play", updatePlayButton);

video?.addEventListener("error", () => {
  const code = video.error?.code;

  let message = "Unable to play this video. Please try again.";

  if (code === 2) {
    message = "A network error occurred while loading the video.";
  } else if (code === 3) {
    message = "The video format could not be decoded by this browser.";
  } else if (code === 4) {
    message =
      "This video source is unsupported or unavailable. Check the video URL and sharing permissions.";
  }

  showError(message);
});

// ============================================================
// CINEMATIC INTRO
// ============================================================

function startCinematicIntro() {
  const intro = $("cinematicIntro");
  if (!intro) return;

  clearTimeout(introTimer);

  intro.hidden = false;

  introTimer = setTimeout(() => {
    intro.hidden = true;
  }, 3000);
}

// ============================================================
// PLAY / PAUSE
// ============================================================

function updatePlayButton() {
  const playIcon = $("playIcon");
  const pauseIcon = $("pauseIcon");
  const button = $("playPause");

  if (!video) return;

  const isPlaying = !video.paused && !video.ended;

  if (playIcon) playIcon.hidden = isPlaying;
  if (pauseIcon) pauseIcon.hidden = !isPlaying;

  if (button) {
    button.setAttribute(
      "aria-label",
      isPlaying ? "Pause video" : "Play video"
    );
  }
}

async function togglePlayback() {
  if (!video) return;

  if (video.paused || video.ended) {
    try {
      await video.play();
    } catch (error) {
      console.warn("Playback requires a user gesture or valid source:", error);
      setLoading("Tap Play to start");
    }
  } else {
    video.pause();
  }

  updatePlayButton();
}

$("playPause")?.addEventListener("click", togglePlayback);

video?.addEventListener("click", () => {
  if (controlsLocked) return;
  togglePlayback();
});

function seekBy(seconds) {
  if (!video || !Number.isFinite(video.duration)) return;

  video.currentTime = Math.max(
    0,
    Math.min(video.duration, video.currentTime + seconds)
  );
}

$("back10")?.addEventListener("click", () => seekBy(-10));
$("forward10")?.addEventListener("click", () => seekBy(10));

// ============================================================
// TIMELINE
// ============================================================

video?.addEventListener("timeupdate", () => {
  if (!video) return;

  setText("currentTime", formatTime(video.currentTime));

  const seekBar = $("seekBar");

  if (
    seekBar &&
    Number.isFinite(video.duration) &&
    video.duration > 0 &&
    !seekWasPlaying
  ) {
    seekBar.value = String(
      Math.round((video.currentTime / video.duration) * 1000)
    );
  }
});

$("seekBar")?.addEventListener("pointerdown", () => {
  seekWasPlaying = true;
});

$("seekBar")?.addEventListener("input", (event) => {
  if (!video || !Number.isFinite(video.duration)) return;

  const percentage = Number(event.target.value) / 1000;

  setText(
    "currentTime",
    formatTime(video.duration * percentage)
  );
});

function finishSeek() {
  const seekBar = $("seekBar");

  if (!video || !seekBar || !Number.isFinite(video.duration)) {
    seekWasPlaying = false;
    return;
  }

  video.currentTime =
    (Number(seekBar.value) / 1000) * video.duration;

  seekWasPlaying = false;
}

$("seekBar")?.addEventListener("change", finishSeek);
$("seekBar")?.addEventListener("pointerup", finishSeek);

// ============================================================
// PLAYBACK SPEED
// ============================================================

function openPopup(id) {
  [
    "settingsPopup",
    "tracksPopup",
    "qualityPopup",
    "episodePopup"
  ].forEach((popupId) => {
    if (popupId !== id) hide(popupId);
  });

  const popup = $(id);
  if (popup) popup.hidden = !popup.hidden;
}

$("speedButton")?.addEventListener("click", () => {
  if (!controlsLocked) openPopup("settingsPopup");
});

$("speedOptions")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-speed]");
  if (!button || !video) return;

  const speed = Number(button.dataset.speed);

  if (!Number.isFinite(speed) || speed <= 0) return;

  video.playbackRate = speed;

  setText("speedValue", `${speed}x`);

  $("speedOptions")
    .querySelectorAll("[data-speed]")
    .forEach((option) => {
      option.classList.toggle("selected", option === button);
    });

  hide("settingsPopup");
});

// ============================================================
// QUALITY
// ============================================================

function renderQualityOptions() {
  const container = $("qualityOptions");
  if (!container) return;

  container.replaceChildren();

  const entries = Object.entries(availableQualities);

  if (!entries.length) {
    const message = document.createElement("p");
    message.className = "empty-option";
    message.textContent =
      "Only the source quality is available for this video.";
    container.appendChild(message);
    return;
  }

  entries.forEach(([label, url], index) => {
    if (typeof url !== "string" || !url.trim()) return;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.qualityUrl = url;

    if (index === 0) button.classList.add("selected");

    container.appendChild(button);
  });
}

$("qualityButton")?.addEventListener("click", () => {
  if (!controlsLocked) openPopup("qualityPopup");
});

$("qualityOptions")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quality-url]");
  if (!button) return;

  const newUrl = button.dataset.qualityUrl;
  const previousTime = video?.currentTime || 0;
  const wasPlaying = Boolean(video && !video.paused);

  if (!video || !newUrl) return;

  video.src = newUrl;
  video.load();

  video.addEventListener("loadedmetadata", function restorePosition() {
    video.removeEventListener("loadedmetadata", restorePosition);

    if (Number.isFinite(video.duration)) {
      video.currentTime = Math.min(previousTime, video.duration);
    }

    if (wasPlaying) {
      video.play().catch(() => {});
    }
  });

  setText("qualityLabel", button.textContent);

  $("qualityOptions")
    .querySelectorAll("button")
    .forEach((option) => {
      option.classList.toggle("selected", option === button);
    });

  hide("qualityPopup");
});

// ============================================================
// AUDIO TRACKS
// ============================================================

function renderAudioOptions() {
  const container = $("audioOptions");
  if (!container) return;

  container.replaceChildren();

  const tracks = video?.audioTracks;

  if (!tracks || tracks.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-option";
    message.textContent =
      "Audio track selection is not supported for this source in this browser.";
    container.appendChild(message);
    return;
  }

  Array.from(tracks).forEach((track, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = track.label || `Audio ${index + 1}`;
    button.classList.toggle("selected", track.enabled);

    button.addEventListener("click", () => {
      Array.from(tracks).forEach((audioTrack, trackIndex) => {
        audioTrack.enabled = trackIndex === index;
      });

      container.querySelectorAll("button").forEach((item) => {
        item.classList.toggle("selected", item === button);
      });
    });

    container.appendChild(button);
  });
}

$("audioButton")?.addEventListener("click", () => {
  if (!controlsLocked) openPopup("tracksPopup");
});

// ============================================================
// SUBTITLES
// ============================================================

function renderSubtitleOptions() {
  const container = $("subtitleOptions");
  if (!container) return;

  container.replaceChildren();

  const offButton = document.createElement("button");
  offButton.type = "button";
  offButton.textContent = "Off";
  offButton.dataset.subtitle = "off";
  offButton.classList.add("selected");

  offButton.addEventListener("click", () => {
    if (video?.textTracks) {
      Array.from(video.textTracks).forEach((track) => {
        track.mode = "disabled";
      });
    }

    container.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("selected", button === offButton);
    });
  });

  container.appendChild(offButton);

  Object.entries(availableSubtitles).forEach(([label, url]) => {
    if (typeof url !== "string" || !url.trim()) return;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;

    button.addEventListener("click", () => {
      // Replace existing tracks with the selected subtitle.
      video?.querySelectorAll("track").forEach((track) => track.remove());

      const trackElement = document.createElement("track");
      trackElement.kind = "subtitles";
      trackElement.label = label;
      trackElement.srclang = "en";
      trackElement.src = url;
      trackElement.default = true;

      video.appendChild(trackElement);

      trackElement.addEventListener("load", () => {
        if (video.textTracks.length) {
          video.textTracks[video.textTracks.length - 1].mode = "showing";
        }
      });

      container.querySelectorAll("button").forEach((item) => {
        item.classList.toggle("selected", item === button);
      });
    });

    container.appendChild(button);
  });
}

$("subtitleButton")?.addEventListener("click", () => {
  if (!controlsLocked) openPopup("tracksPopup");
});

// ============================================================
// CLOSE POPUPS
// ============================================================

document.querySelectorAll("[data-close-popup]").forEach((button) => {
  button.addEventListener("click", () => {
    hide(button.dataset.closePopup);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    [
      "settingsPopup",
      "tracksPopup",
      "qualityPopup",
      "episodePopup"
    ].forEach(hide);
  }
});

// ============================================================
// LOCK CONTROLS
// ============================================================

function setControlsLocked(locked) {
  controlsLocked = locked;

  const lockButton = $("lockButton");
  const lockLabel = $("lockLabel");

  if (lockButton) {
    lockButton.setAttribute(
      "aria-label",
      locked ? "Unlock controls" : "Lock controls"
    );
    lockButton.title = locked ? "Unlock" : "Lock";
  }

  if (lockLabel) {
    lockLabel.textContent = locked ? "Unlock" : "Lock";
  }

  show("lockOverlay");

  if (!locked) {
    hide("lockOverlay");
  }

  [
    "settingsPopup",
    "tracksPopup",
    "qualityPopup",
    "episodePopup"
  ].forEach(hide);
}

$("lockButton")?.addEventListener("click", () => {
  setControlsLocked(true);
});

$("unlockButton")?.addEventListener("click", () => {
  setControlsLocked(false);
});

// ============================================================
// FULLSCREEN
// ============================================================

function isFullscreen() {
  return Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement
  );
}

function updateFullscreenButton() {
  const active = isFullscreen();

  const enterIcon = $("fullscreenIcon");
  const exitIcon = $("exitFullscreenIcon");
  const button = $("fullscreenButton");

  if (enterIcon) enterIcon.hidden = active;
  if (exitIcon) exitIcon.hidden = !active;

  if (button) {
    button.setAttribute(
      "aria-label",
      active ? "Exit fullscreen" : "Enter fullscreen"
    );

    button.title = active ? "Exit Fullscreen" : "Fullscreen";
  }
}

$("fullscreenButton")?.addEventListener("click", async () => {
  try {
    if (isFullscreen()) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else if (player?.requestFullscreen) {
      await player.requestFullscreen();
    } else if (player?.webkitRequestFullscreen) {
      player.webkitRequestFullscreen();
    } else if (video?.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  } catch (error) {
    console.warn("Fullscreen request failed:", error);
  }

  updateFullscreenButton();
});

document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("webkitfullscreenchange", updateFullscreenButton);

// ============================================================
// EPISODE LIST
// ============================================================

function renderEpisodeList() {
  const container = $("episodeList");
  if (!container) return;

  container.replaceChildren();

  if (!episodes.length) {
    const message = document.createElement("p");
    message.className = "empty-option";
    message.textContent = "No episodes available.";
    container.appendChild(message);
    return;
  }

  episodes.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";

    const name = safeText(
      item.episodeTitle ||
      item.title ||
      item.episodeNumber,
      `Episode ${index + 1}`
    );

    button.textContent = name;

    if (String(item.id) === String(episodeData.id)) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      if (String(item.id) === String(episodeData.id)) {
        hide("episodePopup");
        return;
      }

      if (animeId) {
        const url = new URL(window.location.href);
        url.searchParams.set("anime", animeId);
        url.searchParams.set("episode", item.id);
        url.searchParams.delete("url");

        window.location.href = url.toString();
      } else {
        episodeData = item;
        updatePageTitle();
        setupEpisodeMedia(item);
        renderEpisodeList();
      }

      hide("episodePopup");
    });

    container.appendChild(button);
  });
}

$("episodeButton")?.addEventListener("click", () => {
  if (!controlsLocked) openPopup("episodePopup");
});

// ============================================================
// NEXT EPISODE
// ============================================================

function updateNextEpisode() {
  if (currentEpisodeIndex < 0) {
    hide("nextEpisodeSection");
    return;
  }

  const nextEpisode = episodes[currentEpisodeIndex + 1];

  if (!nextEpisode) {
    hide("nextEpisodeSection");
    return;
  }

  show("nextEpisodeSection");

  setText(
    "nextEpisodeTitle",
    safeText(
      nextEpisode.episodeTitle || nextEpisode.title,
      `Episode ${currentEpisodeIndex + 2}`
    )
  );
}

function goToNextEpisode() {
  const nextEpisode = episodes[currentEpisodeIndex + 1];

  if (!nextEpisode) return;

  if (animeId) {
    const url = new URL(window.location.href);
    url.searchParams.set("anime", animeId);
    url.searchParams.set("episode", nextEpisode.id);
    url.searchParams.delete("url");

    window.location.href = url.toString();
  } else {
    currentEpisodeIndex++;
    episodeData = nextEpisode;
    updatePageTitle();
    setupEpisodeMedia(nextEpisode);
    renderEpisodeList();
    updateNextEpisode();
  }
}

$("nextButton")?.addEventListener("click", goToNextEpisode);
$("nextEpisodeCard")?.addEventListener("click", goToNextEpisode);

video?.addEventListener("ended", () => {
  updatePlayButton();
  updateNextEpisode();
});

// ============================================================
// SHARE EPISODE
// ============================================================

$("shareButton")?.addEventListener("click", async () => {
  const shareData = {
    title: document.title,
    text: "Watch this anime episode on Anime Max Zone.",
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(window.location.href);
      alert("Episode link copied!");
    } else {
      window.prompt("Copy this episode link:", window.location.href);
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Sharing failed:", error);
    }
  }
});

// ============================================================
// RETRY
// ============================================================

$("retryButton")?.addEventListener("click", () => {
  hide("playerError");

  if (episodeData) {
    setupEpisodeMedia(episodeData);
  } else {
    loadEpisodeData();
  }
});

// ============================================================
// KEYBOARD CONTROLS
// ============================================================

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement?.tagName;

  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    document.activeElement?.isContentEditable
  ) {
    return;
  }

  if (controlsLocked) {
    if (event.key === "Escape") {
      setControlsLocked(false);
    }
    return;
  }

  switch (event.key.toLowerCase()) {
    case " ":
    case "k":
      event.preventDefault();
      togglePlayback();
      break;

    case "arrowleft":
      event.preventDefault();
      seekBy(-10);
      break;

    case "arrowright":
      event.preventDefault();
      seekBy(10);
      break;

    case "f":
      $("fullscreenButton")?.click();
      break;

    case "m":
      if (video) video.muted = !video.muted;
      break;
  }
});

// ============================================================
// KEEP BRIGHTNESS AND VOLUME CONTROLS HIDDEN
// ============================================================

hide("brightnessControl");
hide("volumeControl");

// ============================================================
// INITIALIZE
// ============================================================

updateFullscreenButton();
updatePlayButton();
loadEpisodeData();
