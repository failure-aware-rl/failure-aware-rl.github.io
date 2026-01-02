(() => {
  const AUTOPLAY_SELECTOR = 'video[data-autoplay="true"]';

  function ensureAutoplayCompatible(video) {
    video.muted = true;
    video.setAttribute('muted', '');
    if (!video.hasAttribute('playsinline')) {
      video.setAttribute('playsinline', '');
    }
    video.playsInline = true;
  }

  function safePlay(video) {
    if (video.dataset.userPaused === 'true') return;
    ensureAutoplayCompatible(video);
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }

  function safePause(video) {
    video.dataset.autoPaused = 'true';
    video.pause();
    setTimeout(() => {
      if (video.dataset.autoPaused === 'true') {
        delete video.dataset.autoPaused;
      }
    }, 0);
  }

  function initAutoplayVideos() {
    const videos = Array.from(document.querySelectorAll(AUTOPLAY_SELECTOR));
    if (!videos.length) return;

    for (const video of videos) {
      if (!video.hasAttribute('preload')) {
        video.setAttribute('preload', 'none');
      }

      video.addEventListener('pause', () => {
        if (video.dataset.autoPaused === 'true') return;
        if (video.hasAttribute('controls')) {
          video.dataset.userPaused = 'true';
        }
      });

      video.addEventListener('play', () => {
        if (video.dataset.userPaused === 'true') {
          delete video.dataset.userPaused;
        }
      });
    }

    if (!('IntersectionObserver' in window)) {
      for (const video of videos) {
        safePlay(video);
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            safePlay(video);
          } else {
            safePause(video);
          }
        }
      },
      {
        rootMargin: '200px 0px 200px 0px',
        threshold: [0, 0.25],
      },
    );

    for (const video of videos) {
      observer.observe(video);
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) return;
      for (const video of videos) {
        safePause(video);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoplayVideos);
  } else {
    initAutoplayVideos();
  }
})();
