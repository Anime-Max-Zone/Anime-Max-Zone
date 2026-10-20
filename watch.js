"use strict";

/*
 * Anime Max Zone — watch.js
 *
 * Features:
 * - Google Drive URLs only
 * - Loads anime details from Firebase Firestore
 * - Google Drive preview iframe
 * - Season and episode selection
 * - Previous / Next episode
 * - Related anime
 * - No demo video fallback
 *
 * IMPORTANT:
 * Google Drive's embedded player controls cannot be reliably
 * disabled from the parent page due to cross-origin restrictions.
 */

(() => {
  const $ = (id) => document.getElementById(id);

  const elements = {
    nativePlayerContainer: $("nativePlayerContainer"),
    iframePlayerContainer: $("iframePlayerContainer"),
    videoIframe: $("videoIframe"),
    videoPlayer: $("videoPlayer"),
    playerMessage: $("playerMessage"),

    animeTitle: $("animeTitle"),
    episodeTitle: $("episodeTitle"),
    animeType: $("animeType"),
    animeStatus: $("animeStatus"),
    animeRating: $("animeRating"),
    animeDescription: $("animeDescription"),

    seasonSelect: $("seasonSelect"),
    episodeList: $("episodeList"),
    previousEpisodeBtn: $("previousEpisodeBtn"),
    nextEpisodeBtn: $("nextEpisodeBtn"),

    relatedAnimeList: $("relatedAnimeList"),
    watchBookmarkBtn: $("watchBookmarkBtn")
  };

  let db = null;
  let currentAnime = null;
  let currentAnimeId = null;
  let episodes = [];
  let currentEpisodeIndex = -1;
  let currentSeason = "";

  const params = new URLSearchParams(window.location.search);
  currentAnimeId = params.get("id") || params.get("animeId");

  function showMessage(message, isError = false) {
    if (!elements.playerMessage) return;

    elements.playerMessage.textContent = message;
    elements.playerMessage.hidden = false;
    elements.playerMessage.dataset.error = String(isError);
  }

  function hideMessage() {
    if (!elements.playerMessage) return;
    elements.playerMessage.hidden = true;
    elements.playerMessage.textContent = "";
  }

  function getFirestore() {
    if (typeof firebase === "undefined") {
      throw new Error("Firebase SDK load nahi hua.");
    }

    if (!firebase.apps.length) {
      throw new Error(
        "Firebase initialize nahi hua. firebase-config.js check karein."
      );
    }

    return firebase.firestore();
  }

  /*
   * Accepts Google Drive file URLs and extracts the file ID.
   * Does not accept non-Google-Drive video URLs.
   */
  function getDriveFileId(rawUrl) {
    if (typeof rawUrl !== "string" || !rawUrl.trim()) {
      return null;
    }

    let url;

    try {
      url = new URL(rawUrl.trim());
    } catch {
      return null;
    }

    const hostname = url.hostname.toLowerCase();

    const allowedHosts = [
      "drive.google.com",
      "www.drive.google.com",
      "drive.usercontent.google.com"
    ];

    if (!allowedHosts.includes(hostname)) {
      return null;
    }

    // Standard URL: drive.google.com/file/d/FILE_ID/view
    const filePathMatch = url.pathname.match(
      /\/file\/d\/([a-zA-Z0-9_-]+)/
    );

    if (filePathMatch) {
      return filePathMatch[1];
    }

    // URL: drive.google.com/open?id=FILE_ID
    // URL: drive.google.com/uc?id=FILE_ID
    const queryId = url.searchParams.get("id");

    if (queryId && /^[a-zA-Z0-9_-]+$/.test(queryId)) {
      return queryId;
    }

    return null;
  }

  function getDrivePreviewUrl(rawUrl) {
    const fileId = getDriveFileId(rawUrl);

    if (!fileId) return null;

    return `https://drive.google.com/file/d/${encodeURIComponent(
      fileId
    )}/preview`;
  }

  function stopCurrentVideo() {
    if (elements.videoIframe) {
      elements.videoIframe.src = "about:blank";
    }

    if (elements.videoPlayer) {
      elements.videoPlayer.pause();
      elements.videoPlayer.removeAttribute("src");
      elements.videoPlayer.load();
    }
  }

  function renderPlayer(videoUrl) {
    stopCurrentVideo();

    if (elements.nativePlayerContainer) {
      elements.nativePlayerContainer.hidden = true;
    }

    if (elements.iframePlayerContainer) {
      elements.iframePlayerContainer.hidden = true;
    }

    const previewUrl = getDrivePreviewUrl(videoUrl);

    if (!previewUrl) {
      showMessage(
        "Valid Google Drive video URL nahi mila. Admin se video link check karwayein.",
        true
      );
      return;
    }

    if (!elements.videoIframe || !elements.iframePlayerContainer) {
      showMessage("Video player HTML elements nahi mile.", true);
      return;
    }

    elements.iframePlayerContainer.hidden = false;
    showMessage("Google Drive video load ho raha hai...");

    elements.videoIframe.onload = () => {
      /*
       * iframe.onload only indicates that the iframe document loaded.
       * It does not confirm that the video is playable.
       */
      hideMessage();
    };

    elements.videoIframe.onerror = () => {
      showMessage(
        "Video player load nahi hua. Google Drive link aur sharing permissions check karein.",
        true
      );
    };

    elements.videoIframe.src = previewUrl;
  }

  function getAnimeVideoUrl(anime) {
    // Accept the existing schema's videoUrl field.
    if (typeof anime.videoUrl === "string") {
      return anime.videoUrl.trim();
    }

    // Some records may store episodes as an array.
    const episode = getEpisodeFromAnime(anime);

    if (episode && typeof episode.videoUrl === "string") {
      return episode.videoUrl.trim();
    }

    if (episode && typeof episode.videoUrl === "undefined") {
      if (typeof episode.url === "string") {
        return episode.url.trim();
      }
    }

    return "";
  }

  function getEpisodeFromAnime(anime) {
    if (!Array.isArray(anime.episodes) || !anime.episodes.length) {
      return null;
    }

    return anime.episodes[0];
  }

  function setText(element, value) {
    if (!element) return;
    element.textContent =
      value === null || value === undefined ? "" : String(value);
  }

  function renderAnimeDetails(anime) {
    setText(elements.animeTitle, anime.title || anime.name || "Untitled Anime");
    setText(elements.animeType, anime.type || "");
    setText(elements.animeStatus, anime.status || "");
    setText(
      elements.animeRating,
      anime.rating !== undefined && anime.rating !== null
        ? `Rating: ${anime.rating}`
        : ""
    );
    setText(
      elements.animeDescription,
      anime.description || anime.synopsis || ""
    );

    document.title =
      `${anime.title || anime.name || "Watch Anime"} - Anime Max Zone`;
  }

  function normalizeEpisodes(anime) {
    const rawEpisodes = Array.isArray(anime.episodes)
      ? anime.episodes
      : [];

    return rawEpisodes.map((episode, index) => ({
      ...episode,
      _index: index,
      title:
        episode.title ||
        episode.name ||
        `Episode ${episode.episodeNumber || index + 1}`,
      season: String(episode.season ?? episode.seasonNumber ?? "1"),
      videoUrl:
        episode.videoUrl ||
        episode.url ||
        episode.driveUrl ||
        ""
    }));
  }

  function renderSeasonOptions() {
    if (!elements.seasonSelect) return;

    const seasons = [
      ...new Set(episodes.map((episode) => episode.season))
    ];

    elements.seasonSelect.replaceChildren();

    seasons.forEach((season) => {
      const option = document.createElement("option");
      option.value = season;
      option.textContent = `Season ${season}`;
      elements.seasonSelect.appendChild(option);
    });

    if (!seasons.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No seasons available";
      elements.seasonSelect.appendChild(option);
      currentSeason = "";
      return;
    }

    currentSeason = seasons[0];
    elements.seasonSelect.value = currentSeason;
  }

  function getSeasonEpisodes() {
    return episodes.filter(
      (episode) => episode.season === String(currentSeason)
    );
  }

  function renderEpisodeList() {
    if (!elements.episodeList) return;

    elements.episodeList.replaceChildren();

    const seasonEpisodes = getSeasonEpisodes();

    if (!seasonEpisodes.length) {
      const message = document.createElement("p");
      message.textContent = "Is season mein koi episode available nahi hai.";
      elements.episodeList.appendChild(message);
      updateEpisodeNavigation();
      return;
    }

    seasonEpisodes.forEach((episode) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "episode-card";
      button.textContent = episode.title;

      if (episode._index === currentEpisodeIndex) {
        button.classList.add("active");
        button.setAttribute("aria-current", "true");
      }

      button.addEventListener("click", () => {
        playEpisode(episode._index);
      });

      elements.episodeList.appendChild(button);
    });

    updateEpisodeNavigation();
  }

  function updateEpisodeNavigation() {
    const seasonEpisodes = getSeasonEpisodes();
    const visibleIndex = seasonEpisodes.findIndex(
      (episode) => episode._index === currentEpisodeIndex
    );

    if (elements.previousEpisodeBtn) {
      elements.previousEpisodeBtn.disabled = visibleIndex <= 0;
    }

    if (elements.nextEpisodeBtn) {
      elements.nextEpisodeBtn.disabled =
        visibleIndex < 0 || visibleIndex >= seasonEpisodes.length - 1;
    }
  }

  function playEpisode(index) {
    const episode = episodes[index];

    if (!episode) {
      showMessage("Episode nahi mila.", true);
      return;
    }

    currentEpisodeIndex = index;
    currentSeason = episode.season;

    if (elements.seasonSelect) {
      elements.seasonSelect.value = currentSeason;
    }

    setText(elements.episodeTitle, episode.title);

    renderEpisodeList();
    renderPlayer(episode.videoUrl);

    if (elements.animeTitle) {
      elements.animeTitle.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }

  function playFirstEpisodeOrAnimeVideo(anime) {
    if (episodes.length) {
      const firstEpisode = episodes[0];
      currentSeason = firstEpisode.season;
      currentEpisodeIndex = firstEpisode._index;

      if (elements.seasonSelect) {
        elements.seasonSelect.value = currentSeason;
      }

      setText(elements.episodeTitle, firstEpisode.title);
      renderEpisodeList();
      renderPlayer(firstEpisode.videoUrl);
      return;
    }

    setText(elements.episodeTitle, "Now Playing");

    const videoUrl = getAnimeVideoUrl(anime);
    renderPlayer(videoUrl);
  }

  async function loadAnime() {
    if (!currentAnimeId) {
      showMessage(
        "Anime ID missing hai. Page ko ?id=ANIME_DOCUMENT_ID ke saath open karein.",
        true
      );
      setText(elements.animeTitle, "Anime not found");
      return;
    }

    try {
      db = getFirestore();
      showMessage("Anime details load ho rahi hain...");

      const doc = await db.collection("anime").doc(currentAnimeId).get();

      if (!doc.exists) {
        setText(elements.animeTitle, "Anime not found");
        showMessage("Firebase mein ye anime available nahi hai.", true);
        return;
      }

      currentAnime = {
        id: doc.id,
        ...doc.data()
      };

      renderAnimeDetails(currentAnime);

      episodes = normalizeEpisodes(currentAnime);

      renderSeasonOptions();
      playFirstEpisodeOrAnimeVideo(currentAnime);

      await loadRelatedAnime(currentAnime);
    } catch (error) {
      console.error("Anime load error:", error);
      showMessage(
        "Anime load nahi hua. Firebase configuration, Firestore rules aur network check karein.",
        true
      );
    }
  }

  async function loadRelatedAnime(anime) {
    if (!elements.relatedAnimeList || !db) return;

    elements.relatedAnimeList.replaceChildren();

    try {
      const snapshot = await db
        .collection("anime")
        .limit(30)
        .get();

      const related = [];

      snapshot.forEach((doc) => {
        if (doc.id === anime.id) return;

        const data = doc.data();

        related.push({
          id: doc.id,
          title: data.title || data.name || "Untitled Anime",
          poster: data.poster || data.posterUrl || data.image || "",
          genre: data.genre || ""
        });
      });

      if (!related.length) {
        const empty = document.createElement("p");
        empty.textContent = "Abhi related anime available nahi hain.";
        elements.relatedAnimeList.appendChild(empty);
        return;
      }

      related.slice(0, 12).forEach((item) => {
        const card = document.createElement("a");
        card.className = "related-anime-card";
        card.href = `watch.html?id=${encodeURIComponent(item.id)}`;

        if (item.poster) {
          const image = document.createElement("img");
          image.src = item.poster;
          image.alt = item.title;
          image.loading = "lazy";
          image.onerror = () => image.remove();
          card.appendChild(image);
        }

        const title = document.createElement("span");
        title.textContent = item.title;
        card.appendChild(title);

        if (item.genre) {
          const genre = document.createElement("small");
          genre.textContent = item.genre;
          card.appendChild(genre);
        }

        elements.relatedAnimeList.appendChild(card);
      });
    } catch (error) {
      console.error("Related anime load error:", error);
    }
  }

  function bindEvents() {
    if (elements.seasonSelect) {
      elements.seasonSelect.addEventListener("change", (event) => {
        currentSeason = event.target.value;
        renderEpisodeList();

        const firstEpisode = getSeasonEpisodes()[0];

        if (firstEpisode) {
          playEpisode(firstEpisode._index);
        }
      });
    }

    if (elements.previousEpisodeBtn) {
      elements.previousEpisodeBtn.addEventListener("click", () => {
        const seasonEpisodes = getSeasonEpisodes();
        const index = seasonEpisodes.findIndex(
          (episode) => episode._index === currentEpisodeIndex
        );

        if (index > 0) {
          playEpisode(seasonEpisodes[index - 1]._index);
        }
      });
    }

    if (elements.nextEpisodeBtn) {
      elements.nextEpisodeBtn.addEventListener("click", () => {
        const seasonEpisodes = getSeasonEpisodes();
        const index = seasonEpisodes.findIndex(
          (episode) => episode._index === currentEpisodeIndex
        );

        if (index >= 0 && index < seasonEpisodes.length - 1) {
          playEpisode(seasonEpisodes[index + 1]._index);
        }
      });
    }

    window.addEventListener("pagehide", stopCurrentVideo);
  }

  function init() {
    bindEvents();
    loadAnime();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
