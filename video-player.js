/* =========================================================
   ANIME MAX ZONE — VIDEO PLAYER
   File: video-player.js
   Firebase Realtime Database + Custom Video Controls
========================================================= */

"use strict";

/* =========================================================
   1. FIREBASE CONFIGURATION
========================================================= */

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

let firebaseApp = null;
let firebaseDatabase = null;
let firebaseReady = false;

/* =========================================================
   2. ELEMENT REFERENCES
========================================================= */

const $ = (id) => document.getElementById(id);

const video = $("videoPlayer");
const player = $("playerContainer");

const ui = {
  animeTitle: $("animeTitle"),
  episodeTitle: $("episodeTitle"),
  infoAnimeTitle: $("infoAnimeTitle"),
  infoEpisodeTitle: $("infoEpisodeTitle"),
  episodeDescription: $("episodeDescription"),

  intro: $("cinematicIntro"),

  loading: $("videoLoading"),
  loadingText: $("loadingText"),

  error: $("playerError"),
  errorMessage: $("errorMessage"),
  retryButton: $("retryButton"),

  controls: $("customControls"),
  centerControls: $("centerControls"),

  playPause: $("playPause"),
  playIcon: $("playIcon"),
  pauseIcon: $("pauseIcon"),

  back10: $("back10"),
  forward10: $("forward10"),

  seekBar: $("seekBar"),
  currentTime: $("currentTime"),
  duration: $("duration"),

  volumeSlider: $("volumeSlider"),
  muteButton: $("muteButton"),
  volumeIcon: $("volumeIcon"),
  mutedIcon: $("mutedIcon"),

  brightnessSlider: $("brightnessSlider"),

  speedButton: $("speedButton"),
  speedValue: $("speedValue"),
  speedOptions: $("speedOptions"),

  qualityButton: $("qualityButton"),
  qualityLabel: $("qualityLabel"),
  qualityOptions: $("qualityOptions"),

  lockButton: $("lockButton"),
  lockLabel: $("lockLabel"),
  lockOverlay: $("lockOverlay"),
  unlockButton: $("unlockButton"),

  audioSubtitleButton: $("audioSubtitleButton"),
  audioOptions: $("audioOptions"),
  subtitleOptions: $("subtitleOptions"),

  episodeButton: $("episodeButton"),
  episodeList: $("episodeList"),
  nextButton: $("nextButton"),

  shareButton: $("shareButton"),

  settingsPopup: $("settingsPopup"),
  tracksPopup: $("tracksPopup"),
  qualityPopup: $("qualityPopup"),
  episodePopup: $("episodePopup"),

  nextEpisodeSection: $("nextEpisodeSection"),
  nextEpisodeCard: $("nextEpisodeCard"),
  nextEpisodeTitle: $("nextEpisodeTitle")
};

/* =========================================================
   3. PLAYER STATE
========================================================= */

const state = {
  animeId: "",
  episodeId: "",

  anime: null,
  episode: null,

  episodes: [],
  qualities: [],
  subtitles: [],

  currentVideoUrl: "",
  currentQuality: "Auto",

  isSeeking: false,
  isLocked: false,

  previousVolume: 1,
  brightness: 1,

  introTimer: null,
  controlsTimer: null,
  progressSaveTimer: null,

  lastPosition: 0,
  playbackKey: ""
};

/* =========================================================
   4. GENERAL UTILITIES
========================================================= */

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }

  seconds = Math.floor(seconds);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return (
      String(hours) + ":" +
      String(minutes).padStart(2, "0") + ":" +
      String(secs).padStart(2, "0")
    );
  }

  return (
    String(minutes).padStart(2, "0") + ":" +
    String(secs).padStart(2, "0")
  );
}

function setText(element, value) {
  if (!element) return;

  element.textContent = value == null ? "" : String(value);
}

function isValidUrl(value) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function getParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    animeId: params.get("anime") || "",
    episodeId: params.get("episode") || "",
    directUrl: params.get("url") || "",
    title: params.get("title") || ""
  };
}

function showLoading(message = "Loading video...") {
  if (ui.loadingText) {
    ui.loadingText.textContent = message;
  }

  if (ui.loading) {
    ui.loading.hidden = false;
  }
}

function hideLoading() {
  if (ui.loading) {
    ui.loading.hidden = true;
  }
}

function showError(message) {
  hideLoading();

  setText(ui.errorMessage, message);

  if (ui.error) {
    ui.error.hidden = false;
  }
}

function hideError() {
  if (ui.error) {
    ui.error.hidden = true;
  }
}

function closePopups() {
  [
    ui.settingsPopup,
    ui.tracksPopup,
    ui.qualityPopup,
    ui.episodePopup
  ].forEach((popup) => {
    if (popup) popup.hidden = true;
  });
}

function togglePopup(popup) {
  if (!popup) return;

  const wasOpen = !popup.hidden;

  closePopups();

  if (!wasOpen) {
    popup.hidden = false;
  }

  showControls();
}

/* =========================================================
   5. FIREBASE INITIALIZATION
========================================================= */

async function initializeFirebase() {
  try {
    const [
      appModule,
      databaseModule
    ] = await Promise.all([
      import(
        "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js"
      ),
      import(
        "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js"
      )
    ]);

    const existingApp = appModule
      .getApps()
      .find((app) => app.name === "animeMaxPlayer");

    firebaseApp = existingApp ||
      appModule.initializeApp(
        firebaseConfig,
        "animeMaxPlayer"
      );

    firebaseDatabase = {
      ref: databaseModule.ref,
      get: databaseModule.get
    };

    firebaseReady = true;

    console.log(
      "[Anime Max Zone] Firebase initialized successfully."
    );

    return true;
  } catch (error) {
    console.error(
      "[Anime Max Zone] Firebase initialization failed:",
      error
    );

    firebaseReady = false;
    return false;
  }
}

async function getDatabaseValue(path) {
  if (!firebaseReady || !firebaseDatabase) {
    throw new Error("Firebase is not initialized.");
  }

  const reference = firebaseDatabase.ref(
    firebaseApp,
    path
  );

  const snapshot = await firebaseDatabase.get(reference);

  return snapshot.exists() ? snapshot.val() : null;
}

/* =========================================================
   6. LOAD ANIME AND EPISODE
========================================================= */

/*
  EXPECTED EXAMPLE DATABASE:

  anime/
    naruto/
      animeName: "Naruto"
      description: "Anime description"

      episodes/
        episode1/
          title: "Episode 1"
          episodeNumber: 1
          videoUrl: "https://example.com/video.mp4"

        episode2/
          title: "Episode 2"
          episodeNumber: 2
          videoUrl: "https://example.com/video2.mp4"

  IMPORTANT:
  Your actual Admin Panel database structure may differ.
*/

async function loadAnime(animeId, episodeId) {
  if (!animeId || !episodeId) {
    throw new Error(
      "Anime ID or episode ID is missing."
    );
  }

  const anime = await getDatabaseValue(
    `anime/${animeId}`
  );

  if (!anime) {
    throw new Error(
      "Anime was not found in Firebase."
    );
  }

  const episode = await getDatabaseValue(
    `anime/${animeId}/episodes/${episodeId}`
  );

  if (!episode) {
    throw new Error(
      "Episode was not found in Firebase."
    );
  }

  state.animeId = animeId;
  state.episodeId = episodeId;

  state.anime = anime;
  state.episode = episode;

  state.playbackKey =
    `${animeId}_${episodeId}`;

  state.episodes = Object.entries(
    anime.episodes || {}
  ).map(([id, item]) => ({
    id,
    ...(item || {})
  }));

  state.episodes.sort((a, b) => {
    return (
      Number(a.episodeNumber || 0) -
      Number(b.episodeNumber || 0)
    );
  });

  state.qualities = [];

  if (episode.qualities) {
    Object.entries(episode.qualities).forEach(
      ([label, url]) => {
        if (
          typeof url === "string" &&
          isValidUrl(url)
        ) {
          state.qualities.push({
            label,
            url
          });
        }
      }
    );
  }

  if (
    episode.videoUrl &&
    isValidUrl(episode.videoUrl) &&
    !state.qualities.some(
      (quality) => quality.url === episode.videoUrl
    )
  ) {
    state.qualities.unshift({
      label: episode.quality || "Default",
      url: episode.videoUrl
    });
  }

  state.subtitles = [];

  if (episode.subtitles) {
    Object.entries(episode.subtitles).forEach(
      ([label, value]) => {
        if (typeof value === "string" && value.trim()) {
          state.subtitles.push({
            label,
            url: value,
            language: "en"
          });
        } else if (
          value &&
          typeof value === "object" &&
          typeof value.url === "string"
        ) {
          state.subtitles.push({
            label,
            url: value.url,
            language: value.language || "en"
          });
        }
      }
    );
  }

  renderAnimeInformation();
  renderEpisodeList();
  renderQualityOptions();
  renderNextEpisode();

  const videoUrl =
    episode.videoUrl ||
    state.qualities[0]?.url ||
    "";

  if (!videoUrl) {
    throw new Error(
      "No valid video URL is available for this episode."
    );
  }

  state.currentQuality =
    state.qualities[0]?.label || "Default";

  renderSubtitleOptions();

  await loadVideo(videoUrl, {
    restore: true
  });
}

/* =========================================================
   7. UPDATE PAGE TITLE AND DETAILS
========================================================= */

function renderAnimeInformation() {
  const anime = state.anime || {};
  const episode = state.episode || {};

  const animeName =
    anime.animeName ||
    anime.title ||
    anime.name ||
    "Anime Max Zone";

  const episodeName =
    episode.episodeTitle ||
    episode.title ||
    (
      episode.episodeNumber
        ? `Episode ${episode.episodeNumber}`
        : "Now Playing"
    );

  document.title = `${animeName} - ${episodeName} | Anime Max Zone`;

  setText(ui.animeTitle, animeName);
  setText(ui.episodeTitle, episodeName);

  setText(ui.infoAnimeTitle, animeName);
  setText(ui.infoEpisodeTitle, episodeName);

  setText(
    ui.episodeDescription,
    episode.description ||
    anime.description ||
    "Watch anime on Anime Max Zone."
  );
}

/* =========================================================
   8. LOAD VIDEO SOURCE
========================================================= */

async function loadVideo(url, options = {}) {
  if (!video) {
    showError(
      "Video element #videoPlayer was not found in HTML."
    );
    return;
  }

  if (!isValidUrl(url)) {
    showError(
      "Invalid video URL. Please check the Admin Panel."
    );
    return;
  }

  state.currentVideoUrl = url;

  hideError();
  showLoading("Loading video...");

  video.pause();

  video.removeAttribute("src");

  video.querySelectorAll("track").forEach(
    (track) => track.remove()
  );

  video.src = url;
  video.preload = "metadata";
  video.load();

  if (options.restore) {
    const savedPosition = getSavedPosition();

    if (savedPosition > 0) {
      state.lastPosition = savedPosition;
    } else {
      state.lastPosition = 0;
    }
  } else if (Number.isFinite(options.resumeAt)) {
    state.lastPosition = options.resumeAt;
  } else {
    state.lastPosition = 0;
  }

  if (state.lastPosition > 0) {
    const restorePosition = () => {
      if (Number.isFinite(video.duration)) {
        video.currentTime = Math.min(
          state.lastPosition,
          Math.max(0, video.duration - 1)
        );
      }

      video.removeEventListener(
        "loadedmetadata",
        restorePosition
      );
    };

    video.addEventListener(
      "loadedmetadata",
      restorePosition
    );
  }

  try {
    await video.play();
  } catch (error) {
    /*
      Autoplay may be blocked by the browser.
      User can start playback using the custom Play button.
    */

    console.info(
      "[Anime Max Zone] Autoplay was blocked:",
      error
    );

    hideLoading();
    updatePlayButton();
  }
}

/* =========================================================
   9. PLAY AND PAUSE
========================================================= */

function updatePlayButton() {
  if (!video) return;

  const playing = !video.paused && !video.ended;

  if (ui.playIcon) {
    ui.playIcon.hidden = playing;
  }

  if (ui.pauseIcon) {
    ui.pauseIcon.hidden = !playing;
  }

  if (ui.playPause) {
    ui.playPause.setAttribute(
      "aria-label",
      playing ? "Pause video" : "Play video"
    );
  }
}

async function togglePlay() {
  if (!video || state.isLocked) return;

  try {
    if (video.paused || video.ended) {
      if (video.ended) {
        video.currentTime = 0;
      }

      await video.play();
    } else {
      video.pause();
    }
  } catch (error) {
    console.error("Playback failed:", error);

    showError(
      "Unable to play this video. Check its URL and format."
    );
  }

  updatePlayButton();
}

function seekBy(seconds) {
  if (
    !video ||
    state.isLocked ||
    !Number.isFinite(video.duration)
  ) {
    return;
  }

  video.currentTime = Math.max(
    0,
    Math.min(
      video.duration,
      video.currentTime + seconds
    )
  );

  showControls();
}

/* =========================================================
   10. SEEK BAR
========================================================= */

function updateSeekbar() {
  if (
    !video ||
    !Number.isFinite(video.duration) ||
    video.duration <= 0
  ) {
    return;
  }

  const progress =
    video.currentTime / video.duration;

  if (ui.seekBar && !state.isSeeking) {
    ui.seekBar.value = String(
      Math.round(progress * 1000)
    );

    ui.seekBar.style.setProperty(
      "--progress",
      `${progress * 100}%`
    );
  }

  setText(
    ui.currentTime,
    formatTime(video.currentTime)
  );

  setText(
    ui.duration,
    formatTime(video.duration)
  );
}

function handleSeekInput() {
  if (
    !video ||
    state.isLocked ||
    !Number.isFinite(video.duration)
  ) {
    return;
  }

  state.isSeeking = true;

  const progress =
    Number(ui.seekBar.value) / 1000;

  setText(
    ui.currentTime,
    formatTime(progress * video.duration)
  );
}

function handleSeekChange() {
  if (
    !video ||
    state.isLocked ||
    !Number.isFinite(video.duration)
  ) {
    return;
  }

  video.currentTime =
    (Number(ui.seekBar.value) / 1000) *
    video.duration;

  state.isSeeking = false;

  updateSeekbar();
}

/* =========================================================
   11. VOLUME
========================================================= */

function updateVolumeUI() {
  if (!video) return;

  const volume = video.muted ? 0 : video.volume;

  if (ui.volumeSlider) {
    ui.volumeSlider.value = String(
      Math.round(volume * 100)
    );
  }

  if (ui.volumeIcon) {
    ui.volumeIcon.hidden = volume === 0;
  }

  if (ui.mutedIcon) {
    ui.mutedIcon.hidden = volume !== 0;
  }
}

function setVolume(value) {
  if (!video) return;

  const volume = Math.max(
    0,
    Math.min(1, value)
  );

  video.volume = volume;
  video.muted = volume === 0;

  if (volume > 0) {
    state.previousVolume = volume;
  }

  updateVolumeUI();
}

function toggleMute() {
  if (!video) return;

  if (video.muted || video.volume === 0) {
    video.muted = false;
    video.volume = state.previousVolume || 1;
  } else {
    state.previousVolume = video.volume;
    video.muted = true;
  }

  updateVolumeUI();
}

/* =========================================================
   12. BRIGHTNESS
========================================================= */

function setBrightness(value) {
  state.brightness = Math.max(
    0.3,
    Math.min(1, value)
  );

  if (video) {
    video.style.filter =
      `brightness(${state.brightness})`;
  }

  if (ui.brightnessSlider) {
    ui.brightnessSlider.value = String(
      Math.round(state.brightness * 100)
    );
  }
}

/* =========================================================
   13. PLAYBACK SPEED
========================================================= */

function setPlaybackSpeed(speed) {
  if (!video || state.isLocked) return;

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

  if (!allowedSpeeds.includes(speed)) return;

  video.playbackRate = speed;

  setText(ui.speedValue, `${speed}x`);

  if (ui.speedOptions) {
    ui.speedOptions
      .querySelectorAll("[data-speed]")
      .forEach((button) => {
        const selected =
          Number(button.dataset.speed) === speed;

        button.classList.toggle(
          "selected",
          selected
        );

        button.setAttribute(
          "aria-pressed",
          String(selected)
        );
      });
  }

  closePopups();
}

/* =========================================================
   14. QUALITY SELECTOR
========================================================= */

function renderQualityOptions() {
  if (!ui.qualityOptions) return;

  ui.qualityOptions.replaceChildren();

  if (!state.qualities.length) {
    const message = document.createElement("p");

    message.textContent =
      "No alternative quality sources available.";

    ui.qualityOptions.appendChild(message);
    return;
  }

  state.qualities.forEach((quality) => {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = quality.label;

    button.classList.toggle(
      "selected",
      quality.label === state.currentQuality
    );

    button.addEventListener("click", async () => {
      const currentTime = video.currentTime;
      const wasPlaying = !video.paused;

      state.currentQuality = quality.label;

      setText(
        ui.qualityLabel,
        quality.label
      );

      closePopups();

      await loadVideo(quality.url, {
        resumeAt: currentTime
      });

      if (!wasPlaying) {
        video.pause();
      }

      renderQualityOptions();
    });

    ui.qualityOptions.appendChild(button);
  });
}

/* =========================================================
   15. SUBTITLES
========================================================= */

function renderSubtitleOptions() {
  if (!ui.subtitleOptions) return;

  ui.subtitleOptions.replaceChildren();

  const offButton = document.createElement("button");

  offButton.type = "button";
  offButton.textContent = "Off";
  offButton.classList.add("selected");

  offButton.addEventListener("click", () => {
    video.querySelectorAll("track").forEach(
      (track) => {
        if (track.track) {
          track.track.mode = "disabled";
        }
      }
    );

    ui.subtitleOptions
      .querySelectorAll("button")
      .forEach((button) => {
        button.classList.remove("selected");
      });

    offButton.classList.add("selected");
  });

  ui.subtitleOptions.appendChild(offButton);

  state.subtitles.forEach((subtitle) => {
    if (!isValidUrl(subtitle.url)) return;

    const button = document.createElement("button");

    button.type = "button";
    button.textContent = subtitle.label;

    const trackElement =
      document.createElement("track");

    trackElement.kind = "subtitles";
    trackElement.label = subtitle.label;
    trackElement.srclang =
      subtitle.language || "en";
    trackElement.src = subtitle.url;

    video.appendChild(trackElement);

    button.addEventListener("click", () => {
      video.querySelectorAll("track").forEach(
        (track) => {
          if (track.track) {
            track.track.mode = "disabled";
          }
        }
      );

      if (trackElement.track) {
        trackElement.track.mode = "showing";
      }

      ui.subtitleOptions
        .querySelectorAll("button")
        .forEach((item) => {
          item.classList.remove("selected");
        });

      button.classList.add("selected");
    });

    ui.subtitleOptions.appendChild(button);
  });
}

/* =========================================================
   16. AUDIO TRACKS
========================================================= */

function renderAudioOptions() {
  if (!ui.audioOptions) return;

  ui.audioOptions.replaceChildren();

  const audioTracks = video?.audioTracks;

  if (audioTracks && audioTracks.length > 0) {
    Array.from(audioTracks).forEach(
      (track, index) => {
        const button =
          document.createElement("button");

        button.type = "button";

        button.textContent =
          track.label ||
          track.language ||
          `Audio ${index + 1}`;

        button.addEventListener("click", () => {
          Array.from(audioTracks).forEach(
            (item, itemIndex) => {
              item.enabled = itemIndex === index;
            }
          );

          renderAudioOptions();
        });

        ui.audioOptions.appendChild(button);
      }
    );

    return;
  }

  const message = document.createElement("p");

  message.textContent =
    "Audio track selection is not supported for this video source in this browser.";

  ui.audioOptions.appendChild(message);
}

/* =========================================================
   17. EPISODE LIST
========================================================= */

function renderEpisodeList() {
  if (!ui.episodeList) return;

  ui.episodeList.replaceChildren();

  if (!state.episodes.length) {
    const message = document.createElement("p");

    message.textContent = "No episodes available.";

    ui.episodeList.appendChild(message);
    return;
  }

  state.episodes.forEach((episode, index) => {
    const button = document.createElement("button");

    button.type = "button";

    button.textContent =
      episode.episodeTitle ||
      episode.title ||
      `Episode ${episode.episodeNumber || index + 1}`;

    if (episode.id === state.episodeId) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      navigateToEpisode(episode.id);
    });

    ui.episodeList.appendChild(button);
  });
}

function getNextEpisode() {
  const index = state.episodes.findIndex(
    (episode) => episode.id === state.episodeId
  );

  if (index < 0) return null;

  return state.episodes[index + 1] || null;
}

function renderNextEpisode() {
  const next = getNextEpisode();

  if (!ui.nextEpisodeSection) return;

  if (!next) {
    ui.nextEpisodeSection.hidden = true;
    return;
  }

  ui.nextEpisodeSection.hidden = false;

  setText(
    ui.nextEpisodeTitle,
    next.episodeTitle ||
    next.title ||
    `Episode ${next.episodeNumber || ""}`
  );

  if (ui.nextEpisodeCard) {
    ui.nextEpisodeCard.onclick = () => {
      navigateToEpisode(next.id);
    };
  }

  if (ui.nextButton) {
    ui.nextButton.onclick = () => {
      navigateToEpisode(next.id);
    };
  }
}

function navigateToEpisode(episodeId) {
  if (!state.animeId || !episodeId) return;

  const params = new URLSearchParams(
    window.location.search
  );

  params.set("anime", state.animeId);
  params.set("episode", episodeId);
  params.delete("url");

  window.location.href =
    `${window.location.pathname}?${params.toString()}`;
}

/* =========================================================
   18. PLAYER LOCK
========================================================= */

function setLocked(locked) {
  state.isLocked = locked;

  if (ui.lockOverlay) {
    ui.lockOverlay.hidden = !locked;
  }

  if (ui.controls) {
    ui.controls.style.display =
      locked ? "none" : "";
  }

  if (ui.centerControls) {
    ui.centerControls.style.display =
      locked ? "none" : "";
  }

  setText(
    ui.lockLabel,
    locked ? "Unlock" : "Lock"
  );

  closePopups();
}

function unlockPlayer() {
  setLocked(false);
  showControls();
}

/* =========================================================
   19. AUTO-HIDE CONTROLS
========================================================= */

function showControls() {
  if (state.isLocked || !player) return;

  player.classList.remove("controls-hidden");
  player.classList.add("controls-visible");

  clearTimeout(state.controlsTimer);

  state.controlsTimer = setTimeout(() => {
    if (!video.paused && !state.isLocked) {
      player.classList.add("controls-hidden");
      player.classList.remove("controls-visible");
    }
  }, 3500);
}

/* =========================================================
   20. FULLSCREEN
========================================================= */

async function toggleFullscreen() {
  if (!player || state.isLocked) return;

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (player.requestFullscreen) {
      await player.requestFullscreen();
    } else if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  } catch (error) {
    console.error(
      "Fullscreen could not be activated:",
      error
    );
  }
}

/* =========================================================
   21. PICTURE IN PICTURE
========================================================= */

async function togglePiP() {
  if (!video || state.isLocked) return;

  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (
      document.pictureInPictureEnabled &&
      video.requestPictureInPicture
    ) {
      await video.requestPictureInPicture();
    } else {
      console.warn(
        "Picture-in-Picture is not supported."
      );
    }
  } catch (error) {
    console.error("PiP error:", error);
  }
}

/* =========================================================
   22. SHARE EPISODE
========================================================= */

async function shareEpisode() {
  const shareData = {
    title: document.title,
    text: `Watch on Anime Max Zone: ${document.title}`,
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(
        window.location.href
      );

      alert("Episode link copied!");
    } else {
      prompt(
        "Copy episode URL:",
        window.location.href
      );
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Share failed:", error);
    }
  }
}

/* =========================================================
   23. SAVE AND RESTORE PROGRESS
========================================================= */

function getSavedPosition() {
  if (!state.playbackKey) return 0;

  try {
    const raw = localStorage.getItem(
      `amz-progress-${state.playbackKey}`
    );

    if (!raw) return 0;

    const data = JSON.parse(raw);

    return Number.isFinite(data.currentTime)
      ? data.currentTime
      : 0;
  } catch {
    return 0;
  }
}

function saveProgress() {
  if (
    !video ||
    !state.playbackKey ||
    !Number.isFinite(video.currentTime)
  ) {
    return;
  }

  try {
    localStorage.setItem(
      `amz-progress-${state.playbackKey}`,
      JSON.stringify({
        currentTime: video.currentTime,
        duration: Number.isFinite(video.duration)
          ? video.duration
          : 0,
        updatedAt: Date.now()
      })
    );
  } catch (error) {
    console.warn(
      "Unable to save playback progress:",
      error
    );
  }
}

/* =========================================================
   24. CINEMATIC INTRO — 3 SECONDS
========================================================= */

function runIntro() {
  if (!ui.intro) return;

  ui.intro.hidden = false;
  ui.intro.classList.remove("hide");

  clearTimeout(state.introTimer);

  state.introTimer = setTimeout(() => {
    ui.intro.classList.add("hide");

    setTimeout(() => {
      if (ui.intro) {
        ui.intro.hidden = true;
      }
    }, 500);
  }, 3000);
}

/* =========================================================
   25. RETRY PLAYBACK
========================================================= */

async function retryPlayback() {
  hideError();

  if (state.currentVideoUrl) {
    await loadVideo(state.currentVideoUrl);
    return;
  }

  const params = getParams();

  if (params.directUrl) {
    await loadVideo(params.directUrl);
    return;
  }

  if (params.animeId && params.episodeId) {
    try {
      showLoading("Retrying...");

      await loadAnime(
        params.animeId,
        params.episodeId
      );
    } catch (error) {
      showError(error.message);
    }
  }
}

/* =========================================================
   26. FULLSCREEN BUTTON
========================================================= */

function createFullscreenButton() {
  if (!ui.controls) return;

  if ($("fullscreenButton")) return;

  const button = document.createElement("button");

  button.id = "fullscreenButton";
  button.type = "button";
  button.className = "toolbar-button";
  button.title = "Fullscreen";
  button.setAttribute(
    "aria-label",
    "Toggle fullscreen"
  );

  button.textContent = "Fullscreen";

  button.addEventListener(
    "click",
    toggleFullscreen
  );

  const toolbar = ui.controls.querySelector(".toolbar");

  if (toolbar) {
    toolbar.appendChild(button);
  }
}

/* =========================================================
   27. EVENT LISTENERS
========================================================= */

function bindEvents() {
  if (!video) {
    console.error(
      "Missing <video id='videoPlayer'> element."
    );

    return;
  }

  ui.playPause?.addEventListener(
    "click",
    togglePlay
  );

  ui.back10?.addEventListener(
    "click",
    () => seekBy(-10)
  );

  ui.forward10?.addEventListener(
    "click",
    () => seekBy(10)
  );

  ui.seekBar?.addEventListener(
    "input",
    handleSeekInput
  );

  ui.seekBar?.addEventListener(
    "change",
    handleSeekChange
  );

  ui.volumeSlider?.addEventListener(
    "input",
    () => {
      setVolume(
        Number(ui.volumeSlider.value) / 100
      );
    }
  );

  ui.muteButton?.addEventListener(
    "click",
    toggleMute
  );

  ui.brightnessSlider?.addEventListener(
    "input",
    () => {
      setBrightness(
        Number(ui.brightnessSlider.value) / 100
      );
    }
  );

  ui.speedButton?.addEventListener(
    "click",
    () => togglePopup(ui.settingsPopup)
  );

  ui.qualityButton?.addEventListener(
    "click",
    () => {
      renderQualityOptions();
      togglePopup(ui.qualityPopup);
    }
  );

  ui.lockButton?.addEventListener(
    "click",
    () => setLocked(true)
  );

  ui.unlockButton?.addEventListener(
    "click",
    unlockPlayer
  );

  ui.audioSubtitleButton?.addEventListener(
    "click",
    () => {
      renderAudioOptions();
      renderSubtitleOptions();
      togglePopup(ui.tracksPopup);
    }
  );

  ui.episodeButton?.addEventListener(
    "click",
    () => {
      renderEpisodeList();
      togglePopup(ui.episodePopup);
    }
  );

  ui.shareButton?.addEventListener(
    "click",
    shareEpisode
  );

  ui.retryButton?.addEventListener(
    "click",
    retryPlayback
  );

  ui.speedOptions
    ?.querySelectorAll("[data-speed]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        setPlaybackSpeed(
          Number(button.dataset.speed)
        );
      });
    });

  document
    .querySelectorAll("[data-close-popup]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const popup = $(
          button.dataset.closePopup
        );

        if (popup) popup.hidden = true;
      });
    });

  video.addEventListener(
    "play",
    updatePlayButton
  );

  video.addEventListener(
    "pause",
    updatePlayButton
  );

  video.addEventListener(
    "ended",
    () => {
      updatePlayButton();
      saveProgress();

      const next = getNextEpisode();

      if (next) {
        renderNextEpisode();
      }
    }
  );

  video.addEventListener(
    "loadedmetadata",
    () => {
      hideLoading();
      updateSeekbar();
      renderAudioOptions();
    }
  );

  video.addEventListener(
    "timeupdate",
    () => {
      if (!state.isSeeking) {
        updateSeekbar();
      }
    }
  );

  video.addEventListener(
    "waiting",
    () => {
      if (!video.paused) {
        showLoading("Buffering...");
      }
    }
  );

  video.addEventListener(
    "stalled",
    () => {
      if (!video.paused) {
        showLoading("Buffering...");
      }
    }
  );

  video.addEventListener(
    "playing",
    () => {
      hideLoading();
      hideError();
      updatePlayButton();
    }
  );

  video.addEventListener(
    "canplay",
    hideLoading
  );

  video.addEventListener(
    "volumechange",
    updateVolumeUI
  );

  video.addEventListener(
    "click",
    () => {
      if (!state.isLocked) {
        showControls();
      }
    }
  );

  player?.addEventListener(
    "mousemove",
    showControls
  );

  player?.addEventListener(
    "touchstart",
    showControls,
    { passive: true }
  );

  player?.addEventListener(
    "dblclick",
    (event) => {
      if (state.isLocked) return;

      const rect = player.getBoundingClientRect();

      const x = event.clientX - rect.left;

      if (x < rect.width * 0.35) {
        seekBy(-10);
      } else if (x > rect.width * 0.65) {
        seekBy(10);
      } else {
        togglePlay();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        event.target?.isContentEditable
      ) {
        return;
      }

      if (state.isLocked) {
        if (event.key === "Escape") {
          unlockPlayer();
        }

        return;
      }

      switch (event.key.toLowerCase()) {
        case " ":
        case "k":
          event.preventDefault();
          togglePlay();
          break;

        case "arrowleft":
          event.preventDefault();
          seekBy(-10);
          break;

        case "arrowright":
          event.preventDefault();
          seekBy(10);
          break;

        case "arrowup":
          event.preventDefault();

          setVolume(
            Math.min(1, video.volume + 0.05)
          );

          break;

        case "arrowdown":
          event.preventDefault();

          setVolume(
            Math.max(0, video.volume - 0.05)
          );

          break;

        case "m":
          toggleMute();
          break;

        case "f":
          toggleFullscreen();
          break;

        case "escape":
          closePopups();
          break;
      }
    }
  );

  document.addEventListener(
    "fullscreenchange",
    showControls
  );

  window.addEventListener(
    "pagehide",
    saveProgress
  );

  window.addEventListener(
    "beforeunload",
    saveProgress
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        saveProgress();
      }
    }
  );

  window.addEventListener(
    "online",
    () => {
      if (video.error) {
        retryPlayback();
      }
    }
  );

  state.progressSaveTimer = setInterval(
    saveProgress,
    10000
  );
}

/* =========================================================
   28. INITIALIZE PLAYER
========================================================= */

async function initializePlayer() {
  const params = getParams();

  setText(
    $("currentYear"),
    new Date().getFullYear()
  );

  createFullscreenButton();

  setVolume(1);
  setBrightness(1);
  updatePlayButton();

  runIntro();

  /*
    DIRECT URL MODE

    video-player.html?url=ENCODED_VIDEO_URL&title=Naruto

    FIREBASE MODE

    video-player.html?anime=naruto&episode=episode1
  */

  if (params.title) {
    document.title =
      `${params.title} | Anime Max Zone`;

    setText(ui.animeTitle, params.title);
    setText(ui.infoAnimeTitle, params.title);
  }

  if (params.directUrl) {
    let directUrl = params.directUrl;

    try {
      directUrl = decodeURIComponent(directUrl);
    } catch {
      // URLSearchParams already decodes parameters.
    }

    if (!isValidUrl(directUrl)) {
      showError("Invalid video URL.");
      return;
    }

    setText(
      ui.episodeTitle,
      params.title || "Now Playing"
    );

    setText(
      ui.infoEpisodeTitle,
      params.title || "Now Playing"
    );

    state.playbackKey =
      `direct_${params.title || "video"}`;

    await loadVideo(directUrl);
    return;
  }

  if (!params.animeId || !params.episodeId) {
    showError(
      "Episode not selected. Open this page with an anime ID and episode ID."
    );

    return;
  }

  showLoading("Connecting to Anime Max Zone...");

  const ready = await initializeFirebase();

  if (!ready) {
    showError(
      "Could not connect to Firebase. Check your Firebase configuration and network connection."
    );

    return;
  }

  try {
    await loadAnime(
      params.animeId,
      params.episodeId
    );
  } catch (error) {
    console.error(
      "[Anime Max Zone] Episode loading failed:",
      error
    );

    showError(
      error.message ||
      "Unable to load this episode."
    );
  }
}

/* =========================================================
   29. START PLAYER
========================================================= */

if (video && player) {
  bindEvents();
  initializePlayer();
} else {
  console.error(
    "Player initialization failed. Check video-player.html IDs: videoPlayer and playerContainer."
  );
}
