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

function isValidHttpUrl(value) {
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
  return safeText(
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

function updatePageTitle() {
  const animeName = getAnimeName();
  const episodeName = getEpisodeName();

  document.title =
    `${animeName} - ${episodeName} | Anime Max Zone`;

  setText("animeTitle", animeName);
  setText("infoAnimeTitle", animeName);

  setText("episodeTitle", episodeName);
  setText("infoEpisodeTitle", episodeName);

  setText(
    "episodeDescription",
    safeText(
      episodeData.description ||
      animeData.description,
      "Enjoy your anime on Anime Max Zone."
    )
  );

  updateNextEpisode();
}

function updateHistoryUrl() {
  const url = new URL(window.location.href);

  if (animeId) {
    url.searchParams.set("anime", animeId);
  }

  if (episodeData.id != null) {
    url.searchParams.set(
      "episode",
      String(episodeData.id)
    );
  }

  history.replaceState({}, "", url);
}

// ============================================================
// LOAD FIREBASE DATA
// ============================================================

async function loadEpisodeData() {
  if (directUrl) {
    if (!isValidHttpUrl(directUrl)) {
      showError("The video URL is invalid.");
      return;
    }

    animeData = {
      title: safeText(directTitle, "Anime")
    };

    episodeData = {
      id: "direct",
      title: safeText(
        directEpisodeTitle,
        "Now Playing"
      ),
      videoUrl: directUrl,
      description: ""
    };

    episodes = [episodeData];
    currentEpisodeIndex = 0;

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

    const [
      animeSnapshot,
      episodeSnapshot,
      episodesSnapshot
    ] = await Promise.all([
      get(child(root, `anime/${animeId}`)),
      get(child(root, `anime/${animeId}/episodes/${episodeId}`)),
      get(child(root, `anime/${animeId}/episodes`))
    ]);

    if (!animeSnapshot.exists()) {
      throw new Error(
        "Anime not found in the database."
      );
    }

    if (!episodeSnapshot.exists()) {
      throw new Error(
        "This episode could not be found."
      );
    }

    animeData = animeSnapshot.val() || {};

    episodeData = {
      id: episodeId,
      ...(episodeSnapshot.val() || {})
    };

    episodes = normalizeEpisodes(
      episodesSnapshot.val()
    );

    currentEpisodeIndex = episodes.findIndex(
      (item) =>
        String(item.id) === String(episodeId)
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
    console.error(
      "Failed to load anime:",
      error
    );

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
  if (!video) {
    showError("Video player element was not found.");
    return;
  }

  const sourceUrl = getEpisodeUrl(item);

  if (!sourceUrl) {
    showError(
      "No video URL was found for this episode."
    );

    return;
  }

  if (!isValidHttpUrl(sourceUrl)) {
    showError("The video URL is invalid.");
    return;
  }

  currentVideoRequest++;

  const requestId = currentVideoRequest;

  episodeData = item;
  currentTrackUrl = sourceUrl;

  availableQualities =
    item.qualities &&
    typeof item.qualities === "object"
      ? item.qualities
      : {};

  availableSubtitles =
    item.subtitles &&
    typeof item.subtitles === "object"
      ? item.subtitles
      : {};

  renderQualityOptions();
  renderSubtitleOptions();
  renderAudioOptions();

  setLoading("Loading video...");

  clearTimeout(introTimer);

  hide("cinematicIntro");
  hide("playerError");

  video.pause();
  video.removeAttribute("src");

  video.querySelectorAll("track").forEach((track) => {
    track.remove();
  });

  video.load();

  video.src = sourceUrl;
  video.load();

  setText("currentTime", "00:00");
  setText("duration", "00:00");

  const seekBar = $("seekBar");

  if (seekBar) {
    seekBar.value = "0";
  }

  setText("qualityLabel", "Auto");

  updatePageTitle();
  updatePlayButton();

  video.dataset.requestId = String(requestId);
}

video?.addEventListener("loadedmetadata", () => {
  setText(
    "duration",
    formatTime(video.duration)
  );

  const seekBar = $("seekBar");

  if (seekBar) {
    seekBar.value = "0";
  }

  hideLoading();
  startCinematicIntro();
});

video?.addEventListener("durationchange", () => {
  if (Number.isFinite(video.duration)) {
    setText(
      "duration",
      formatTime(video.duration)
    );
  }
});

video?.addEventListener("canplay", hideLoading);

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
  if (!video.src) {
    return;
  }

  const code = video.error?.code;

  let message =
    "Unable to play this video. Please try again.";

  if (code === 1) {
    message = "Video playback was cancelled.";
  } else if (code === 2) {
    message =
      "A network error occurred while loading the video.";
  } else if (code === 3) {
    message =
      "The video format could not be decoded by this browser.";
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

  if (!intro) {
    return;
  }

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

  if (!video) {
    return;
  }

  const isPlaying =
    !video.paused &&
    !video.ended;

  if (playIcon) {
    playIcon.hidden = isPlaying;
  }

  if (pauseIcon) {
    pauseIcon.hidden = !isPlaying;
  }

  if (button) {
    button.setAttribute(
      "aria-label",
      isPlaying ? "Pause video" : "Play video"
    );

    button.title =
      isPlaying ? "Pause" : "Play";
  }
}

async function togglePlayback() {
  if (!video) {
    return;
  }

  if (video.paused || video.ended) {
    try {
      await video.play();
    } catch (error) {
      console.warn(
        "Playback failed:",
        error
      );

      setLoading(
        "Tap Play to start the video"
      );
    }
  } else {
    video.pause();
  }

  updatePlayButton();
}

$("playPause")?.addEventListener(
  "click",
  togglePlayback
);

video?.addEventListener("click", () => {
  if (controlsLocked) {
    return;
  }

  togglePlayback();
});

function seekBy(seconds) {
  if (
    !video ||
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
}

$("back10")?.addEventListener("click", () => {
  seekBy(-10);
});

$("forward10")?.addEventListener("click", () => {
  seekBy(10);
});

// ============================================================
// TIMELINE
// ============================================================

video?.addEventListener("timeupdate", () => {
  setText(
    "currentTime",
    formatTime(video.currentTime)
  );

  const seekBar = $("seekBar");

  if (
    seekBar &&
    Number.isFinite(video.duration) &&
    video.duration > 0 &&
    !seekWasPlaying
  ) {
    seekBar.value = String(
      Math.round(
        (video.currentTime / video.duration) * 1000
      )
    );
  }
});

$("seekBar")?.addEventListener(
  "pointerdown",
  () => {
    seekWasPlaying = true;
  }
);

$("seekBar")?.addEventListener(
  "input",
  (event) => {
    if (
      !video ||
      !Number.isFinite(video.duration)
    ) {
      return;
    }

    const percentage =
      Number(event.target.value) / 1000;

    setText(
      "currentTime",
      formatTime(
        video.duration * percentage
      )
    );
  }
);

function finishSeek() {
  const seekBar = $("seekBar");

  if (
    !video ||
    !seekBar ||
    !Number.isFinite(video.duration)
  ) {
    seekWasPlaying = false;
    return;
  }

  video.currentTime =
    (Number(seekBar.value) / 1000) *
    video.duration;

  seekWasPlaying = false;
}

$("seekBar")?.addEventListener(
  "change",
  finishSeek
);

$("seekBar")?.addEventListener(
  "pointerup",
  finishSeek
);

$("seekBar")?.addEventListener(
  "pointercancel",
  finishSeek
);

// ============================================================
// POPUP HELPERS
// ============================================================

const popupIds = [
  "settingsPopup",
  "tracksPopup",
  "qualityPopup",
  "episodePopup"
];

function closeAllPopups() {
  popupIds.forEach(hide);
}

function openPopup(id) {
  const popup = $(id);

  if (!popup) {
    return;
  }

  const shouldOpen = popup.hidden;

  closeAllPopups();

  popup.hidden = !shouldOpen;
}

// ============================================================
// PLAYBACK SPEED
// ============================================================

$("speedButton")?.addEventListener("click", () => {
  if (!controlsLocked) {
    openPopup("settingsPopup");
  }
});

$("speedOptions")?.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest(
      "[data-speed]"
    );

    if (!button || !video) {
      return;
    }

    const speed = Number(
      button.dataset.speed
    );

    if (
      !Number.isFinite(speed) ||
      speed <= 0
    ) {
      return;
    }

    video.playbackRate = speed;

    setText("speedValue", `${speed}x`);

    $("speedOptions")
      ?.querySelectorAll("[data-speed]")
      .forEach((option) => {
        option.classList.toggle(
          "selected",
          option === button
        );
      });

    hide("settingsPopup");
  }
);

// ============================================================
// VIDEO QUALITY
// ============================================================

function renderQualityOptions() {
  const container = $("qualityOptions");

  if (!container) {
    return;
  }

  container.replaceChildren();

  const entries = Object.entries(
    availableQualities
  );

  if (!entries.length) {
    const message = document.createElement("p");

    message.className = "empty-option";
    message.textContent =
      "Only the source quality is available for this video.";

    container.appendChild(message);
    return;
  }

  entries.forEach(([label, value], index) => {
    let url = "";

    if (typeof value === "string") {
      url = value;
    } else if (
      value &&
      typeof value === "object"
    ) {
      url = safeText(
        value.url ||
        value.videoUrl
      );
    }

    if (!url || !isValidHttpUrl(url)) {
      return;
    }

    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.dataset.qualityUrl = url;

    if (index === 0) {
      button.classList.add("selected");
    }

    container.appendChild(button);
  });
}

$("qualityButton")?.addEventListener("click", () => {
  if (!controlsLocked) {
    openPopup("qualityPopup");
  }
});

$("qualityOptions")?.addEventListener(
  "click",
  async (event) => {
    const button = event.target.closest(
      "[data-quality-url]"
    );

    if (!button || !video) {
      return;
    }

    const newUrl = button.dataset.qualityUrl;

    if (
      !newUrl ||
      !isValidHttpUrl(newUrl)
    ) {
      return;
    }

    if (newUrl === currentTrackUrl) {
      hide("qualityPopup");
      return;
    }

    const previousTime =
      Number.isFinite(video.currentTime)
        ? video.currentTime
        : 0;

    const wasPlaying = !video.paused;

    currentTrackUrl = newUrl;

    setLoading("Switching quality...");

    video.pause();
    video.src = newUrl;
    video.load();

    const restorePosition = () => {
      if (Number.isFinite(video.duration)) {
        video.currentTime = Math.min(
          previousTime,
          Math.max(0, video.duration - 0.1)
        );
      }

      if (wasPlaying) {
        video.play().catch(() => {});
      }

      hideLoading();
    };

    video.addEventListener(
      "loadedmetadata",
      restorePosition,
      { once: true }
    );

    setText(
      "qualityLabel",
      button.textContent
    );

    $("qualityOptions")
      ?.querySelectorAll("button")
      .forEach((option) => {
        option.classList.toggle(
          "selected",
          option === button
        );
      });

    hide("qualityPopup");
  }
);

// ============================================================
// AUDIO TRACKS
// ============================================================

function renderAudioOptions() {
  const container = $("audioOptions");

  if (!container) {
    return;
  }

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
    button.textContent =
      track.label || `Audio ${index + 1}`;

    button.classList.toggle(
      "selected",
      track.enabled
    );

    button.addEventListener("click", () => {
      Array.from(tracks).forEach(
        (audioTrack, trackIndex) => {
          audioTrack.enabled =
            trackIndex === index;
        }
      );

      container
        .querySelectorAll("button")
        .forEach((item) => {
          item.classList.toggle(
            "selected",
            item === button
          );
        });
    });

    container.appendChild(button);
  });
}

$("audioButton")?.addEventListener("click", () => {
  if (!controlsLocked) {
    renderAudioOptions();
    openPopup("tracksPopup");
  }
});

// ============================================================
// SUBTITLES
// ============================================================

function renderSubtitleOptions() {
  const container = $("subtitleOptions");

  if (!container) {
    return;
  }

  container.replaceChildren();

  const offButton = document.createElement("button");

  offButton.type = "button";
  offButton.textContent = "Off";
  offButton.dataset.subtitle = "off";
  offButton.classList.add("selected");

  offButton.addEventListener("click", () => {
    if (video?.textTracks) {
      Array.from(video.textTracks).forEach(
        (track) => {
          track.mode = "disabled";
        }
      );
    }

    container
      .querySelectorAll("button")
      .forEach((button) => {
        button.classList.toggle(
          "selected",
          button === offButton
        );
      });
  });

  container.appendChild(offButton);

  Object.entries(availableSubtitles).forEach(
    ([label, value]) => {
      let url = "";

      if (typeof value === "string") {
        url = value;
      } else if (
        value &&
        typeof value === "object"
      ) {
        url = safeText(value.url);
      }

      if (
        !url ||
        !isValidHttpUrl(url)
      ) {
        return;
      }

      const button = document.createElement("button");

      button.type = "button";
      button.textContent = label;

      button.addEventListener("click", () => {
        if (!video) {
          return;
        }

        video
          .querySelectorAll("track")
          .forEach((track) => track.remove());

        const trackElement =
          document.createElement("track");

        trackElement.kind = "subtitles";
        trackElement.label = label;
        trackElement.srclang = "en";
        trackElement.src = url;

        video.appendChild(trackElement);

        trackElement.addEventListener(
          "load",
          () => {
            if (video.textTracks.length) {
              const selectedTrack =
                video.textTracks[
                  video.textTracks.length - 1
                ];

              selectedTrack.mode = "showing";
            }
          }
        );

        // Some browsers fire the load event before
        // the listener is attached, so also check later.
        setTimeout(() => {
          if (video.textTracks.length) {
            const selectedTrack =
              video.textTracks[
                video.textTracks.length - 1
              ];

            if (
              selectedTrack &&
              selectedTrack.label === label
            ) {
              selectedTrack.mode = "showing";
            }
          }
        }, 300);

        container
          .querySelectorAll("button")
          .forEach((item) => {
            item.classList.toggle(
              "selected",
              item === button
            );
          });
      });

      container.appendChild(button);
    }
  );
}

$("subtitleButton")?.addEventListener("click", () => {
  if (!controlsLocked) {
    openPopup("tracksPopup");
  }
});

// ============================================================
// CLOSE POPUPS
// ============================================================

document
  .querySelectorAll("[data-close-popup]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      hide(button.dataset.closePopup);
    });
  });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAllPopups();
  }
});

// ============================================================
// LOCK / UNLOCK CONTROLS
// ============================================================

function setControlsLocked(locked) {
  controlsLocked = locked;

  const lockButton = $("lockButton");
  const lockLabel = $("lockLabel");

  if (lockButton) {
    lockButton.setAttribute(
      "aria-label",
      locked
        ? "Unlock controls"
        : "Lock controls"
    );

    lockButton.title =
      locked ? "Unlock" : "Lock";
  }

  if (lockLabel) {
    lockLabel.textContent =
      locked ? "Unlock" : "Lock";
  }

  closeAllPopups();

  if (locked) {
    show("lockOverlay");
  } else {
    hide("lockOverlay");
  }
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

  if (enterIcon) {
    enterIcon.hidden = active;
  }

  if (exitIcon) {
    exitIcon.hidden = !active;
  }

  if (button) {
    button.setAttribute(
      "aria-label",
      active
        ? "Exit fullscreen"
        : "Enter fullscreen"
    );

    button.title =
      active
        ? "Exit Fullscreen"
        : "Fullscreen";
  }
}

$("fullscreenButton")?.addEventListener(
  "click",
  async () => {
    try {
      if (isFullscreen()) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (
          document.webkitExitFullscreen
        ) {
          document.webkitExitFullscreen();
        }

      } else if (player?.requestFullscreen) {
        await player.requestFullscreen();

      } else if (
        player?.webkitRequestFullscreen
      ) {
        player.webkitRequestFullscreen();

      } else if (
        video?.webkitEnterFullscreen
      ) {
        video.webkitEnterFullscreen();
      }

    } catch (error) {
      console.warn(
        "Fullscreen request failed:",
        error
      );
    }

    updateFullscreenButton();
  }
);

document.addEventListener(
  "fullscreenchange",
  updateFullscreenButton
);

document.addEventListener(
  "webkitfullscreenchange",
  updateFullscreenButton
);

// ============================================================
// EPISODE LIST
// ============================================================

function renderEpisodeList() {
  const container = $("episodeList");

  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!episodes.length) {
    const message = document.createElement("p");

    message.className = "empty-option";
    message.textContent =
      "No episodes available.";

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

    if (
      String(item.id) ===
      String(episodeData.id)
    ) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      if (
        String(item.id) ===
        String(episodeData.id)
      ) {
        hide("episodePopup");
        return;
      }

      if (animeId) {
        const url = new URL(
          window.location.href
        );

        url.searchParams.set(
          "anime",
          animeId
        );

        url.searchParams.set(
          "episode",
          item.id
        );

        url.searchParams.delete("url");
        url.searchParams.delete("title");
        url.searchParams.delete("episodeTitle");

        window.location.href = url.toString();

      } else {
        const indexOfEpisode = episodes.findIndex(
          (episode) =>
            String(episode.id) ===
            String(item.id)
        );

        currentEpisodeIndex = indexOfEpisode;

        setupEpisodeMedia(item);
        renderEpisodeList();
        updatePageTitle();
      }

      hide("episodePopup");
    });

    container.appendChild(button);
  });
}

$("episodeButton")?.addEventListener("click", () => {
  if (!controlsLocked) {
    renderEpisodeList();
    openPopup("episodePopup");
  }
});

// ============================================================
// NEXT EPISODE
// ============================================================

function updateNextEpisode() {
  const nextSection = $("nextEpisodeSection");

  if (!nextSection) {
    return;
  }

  if (currentEpisodeIndex < 0) {
    hide("nextEpisodeSection");
    return;
  }

  const nextEpisode =
    episodes[currentEpisodeIndex + 1];

  if (!nextEpisode) {
    hide("nextEpisodeSection");
    return;
  }

  show("nextEpisodeSection");

  setText(
    "nextEpisodeTitle",
    safeText(
      nextEpisode.episodeTitle ||
      nextEpisode.title ||
      nextEpisode.episodeNumber,
      `Episode ${currentEpisodeIndex + 2}`
    )
  );
}

function goToNextEpisode() {
  const nextEpisode =
    episodes[currentEpisodeIndex + 1];

  if (!nextEpisode) {
    return;
  }

  if (animeId) {
    const url = new URL(
      window.location.href
    );

    url.searchParams.set(
      "anime",
      animeId
    );

    url.searchParams.set(
      "episode",
      nextEpisode.id
    );

    url.searchParams.delete("url");
    url.searchParams.delete("title");
    url.searchParams.delete("episodeTitle");

    window.location.href = url.toString();

  } else {
    currentEpisodeIndex++;

    setupEpisodeMedia(nextEpisode);
    renderEpisodeList();
    updatePageTitle();
  }
}

$("nextButton")?.addEventListener(
  "click",
  goToNextEpisode
);

$("nextEpisodeCard")?.addEventListener(
  "click",
  goToNextEpisode
);

video?.addEventListener("ended", () => {
  updatePlayButton();
  updateNextEpisode();
});

// ============================================================
// SHARE EPISODE
// ============================================================

$("shareButton")?.addEventListener(
  "click",
  async () => {
    const shareData = {
      title: document.title,
      text:
        "Watch this anime episode on Anime Max Zone.",
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);

      } else if (
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(
          window.location.href
        );

        alert("Episode link copied!");

      } else {
        window.prompt(
          "Copy this episode link:",
          window.location.href
        );
      }

    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(
          "Sharing failed:",
          error
        );
      }
    }
  }
);

// ============================================================
// RETRY VIDEO
// ============================================================

$("retryButton")?.addEventListener("click", () => {
  hide("playerError");

  if (episodeData && getEpisodeUrl(episodeData)) {
    setupEpisodeMedia(episodeData);
  } else {
    loadEpisodeData();
  }
});

// ============================================================
// KEYBOARD CONTROLS
// ============================================================

document.addEventListener("keydown", (event) => {
  const activeElement = document.activeElement;
  const tag = activeElement?.tagName;

  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    activeElement?.isContentEditable
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
      if (video) {
        video.muted = !video.muted;
      }
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

if (!video) {
  showError(
    "Video player element was not found in the HTML."
  );
} else {
  loadEpisodeData();
}
