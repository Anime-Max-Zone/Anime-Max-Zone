"use strict";

/*
 * Anime Max Zone — Custom Player
 *
 * Works with a browser-playable video source in:
 *   <video id="videoPlayer"></video>
 *
 * Does not control Google Drive's cross-origin /preview iframe.
 */

(() => {
  const video = document.getElementById("videoPlayer");
  const container = document.getElementById("nativePlayerContainer");

  if (!video || !container) return;

  // Avoid initializing the same player twice.
  if (video.dataset.customPlayerInitialized === "true") return;
  video.dataset.customPlayerInitialized = "true";

  const player = document.createElement("div");
  player.className = "amz-custom-player";

  const controls = document.createElement("div");
  controls.className = "amz-controls";

  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.className = "amz-play-button";
  playButton.textContent = "▶";
  playButton.setAttribute("aria-label", "Play video");

  const currentTime = document.createElement("span");
  currentTime.className = "amz-current-time";
  currentTime.textContent = "0:00";

  const seekbar = document.createElement("input");
  seekbar.type = "range";
  seekbar.className = "amz-seekbar";
  seekbar.min = "0";
  seekbar.max = "1000";
  seekbar.value = "0";
  seekbar.step = "1";
  seekbar.setAttribute("aria-label", "Seek video");

  const duration = document.createElement("span");
  duration.className = "amz-duration";
  duration.textContent = "0:00";

  const muteButton = document.createElement("button");
  muteButton.type = "button";
  muteButton.className = "amz-mute-button";
  muteButton.textContent = "🔊";
  muteButton.setAttribute("aria-label", "Mute video");

  const volume = document.createElement("input");
  volume.type = "range";
  volume.className = "amz-volume";
  volume.min = "0";
  volume.max = "1";
  volume.step = "0.05";
  volume.value = String(video.volume);
  volume.setAttribute("aria-label", "Volume");

  const fullscreenButton = document.createElement("button");
  fullscreenButton.type = "button";
  fullscreenButton.className = "amz-fullscreen-button";
  fullscreenButton.textContent = "⛶";
  fullscreenButton.setAttribute("aria-label", "Enter fullscreen");

  controls.append(
    playButton,
    currentTime,
    seekbar,
    duration,
    muteButton,
    volume,
    fullscreenButton
  );

  // Keep the original video element and place controls around it.
  const originalParent = video.parentNode;
  const originalNextSibling = video.nextSibling;

  player.appendChild(video);
  player.appendChild(controls);

  if (originalParent) {
    originalParent.insertBefore(player, originalNextSibling);
  } else {
    container.appendChild(player);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(
        secs
      ).padStart(2, "0")}`;
    }

    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  function updatePlayButton() {
    const isPlaying = !video.paused && !video.ended;

    playButton.textContent = isPlaying ? "❚❚" : "▶";
    playButton.setAttribute(
      "aria-label",
      isPlaying ? "Pause video" : "Play video"
    );
  }

  function updateProgress() {
    currentTime.textContent = formatTime(video.currentTime);

    if (Number.isFinite(video.duration) && video.duration > 0) {
      duration.textContent = formatTime(video.duration);
      seekbar.value = String(
        Math.round((video.currentTime / video.duration) * 1000)
      );
    } else {
      duration.textContent = "0:00";
      seekbar.value = "0";
    }
  }

  function updateVolume() {
    muteButton.textContent =
      video.muted || video.volume === 0 ? "🔇" : "🔊";

    muteButton.setAttribute(
      "aria-label",
      video.muted || video.volume === 0 ? "Unmute video" : "Mute video"
    );

    volume.value = String(video.muted ? 0 : video.volume);
  }

  async function togglePlay() {
    try {
      if (video.paused || video.ended) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (error) {
      console.error("Video playback failed:", error);
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (player.requestFullscreen) {
        await player.requestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        // Safari / iOS fallback.
        video.webkitEnterFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen failed:", error);
    }
  }

  playButton.addEventListener("click", togglePlay);

  video.addEventListener("click", togglePlay);

  video.addEventListener("play", updatePlayButton);
  video.addEventListener("pause", updatePlayButton);
  video.addEventListener("ended", updatePlayButton);

  video.addEventListener("loadedmetadata", updateProgress);
  video.addEventListener("durationchange", updateProgress);
  video.addEventListener("timeupdate", updateProgress);
  video.addEventListener("seeking", updateProgress);
  video.addEventListener("seeked", updateProgress);

  seekbar.addEventListener("input", () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;

    video.currentTime =
      (Number(seekbar.value) / 1000) * video.duration;
  });

  muteButton.addEventListener("click", () => {
    video.muted = !video.muted;
    updateVolume();
  });

  volume.addEventListener("input", () => {
    video.volume = Number(volume.value);
    video.muted = video.volume === 0;
    updateVolume();
  });

  fullscreenButton.addEventListener("click", toggleFullscreen);

  document.addEventListener("fullscreenchange", () => {
    const isFullscreen = document.fullscreenElement === player;

    fullscreenButton.setAttribute(
      "aria-label",
      isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
    );
  });

  // Keyboard controls when the player itself is focused.
  player.tabIndex = 0;

  player.addEventListener("keydown", (event) => {
    if (event.target.matches("input, button")) return;

    switch (event.key) {
      case " ":
      case "k":
      case "K":
        event.preventDefault();
        togglePlay();
        break;

      case "ArrowLeft":
        event.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        break;

      case "ArrowRight":
        event.preventDefault();

        if (Number.isFinite(video.duration)) {
          video.currentTime = Math.min(
            video.duration,
            video.currentTime + 5
          );
        }
        break;

      case "f":
      case "F":
        event.preventDefault();
        toggleFullscreen();
        break;

      case "m":
      case "M":
        event.preventDefault();
        video.muted = !video.muted;
        updateVolume();
        break;
    }
  });

  updatePlayButton();
  updateProgress();
  updateVolume();
})();
