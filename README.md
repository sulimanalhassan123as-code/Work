// Configuration
// Set to `true` if you want to transition to main content after the intro finishes.
// Set to `false` to keep the red intro visible after the video ends.
const SHOW_MAIN_AFTER_VIDEO = true;

// Optionally set to true to loop the short tiger animation.
// The user asked for the video to run smoothly from start to finish (about 3s).
const LOOP_VIDEO = false;

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('introVideo');
  const fallback = document.getElementById('fallback');
  const tapToPlay = document.getElementById('tapToPlay');
  const intro = document.getElementById('intro');
  const mainContent = document.getElementById('mainContent');

  // Apply loop configuration if desired
  video.loop = !!LOOP_VIDEO;

  // Hide fallback by default (only show if video fails)
  fallback.style.display = 'none';
  tapToPlay.classList.add('visually-hidden');

  let didStart = false;
  let autoplayBlocked = false;

  // Try to play as soon as metadata/canplaythrough indicates the video is ready.
  function tryPlay() {
    // If already started, do not try again
    if (didStart) return;

    // Some browsers require play() to be called from a user gesture when audio is present.
    // We keep the video muted to maximize autoplay reliability.
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        didStart = true;
        // hide fallback if visible
        fallback.style.display = 'none';
        tapToPlay.classList.add('visually-hidden');
      }).catch((err) => {
        // Autoplay blocked - show a minimal "tap to play" overlay so user can start it
        autoplayBlocked = true;
        tapToPlay.classList.remove('visually-hidden');
        tapToPlay.setAttribute('aria-hidden', 'false');
        console.warn('Autoplay was blocked, user interaction required to start video.', err);
      });
    }
  }

  // If the video can play through without buffering, try starting it.
  video.addEventListener('canplaythrough', tryPlay, { once: true, passive: true });

  // For some browsers a canplaythrough isn't fired quickly — also attempt on loadedmetadata
  video.addEventListener('loadedmetadata', tryPlay, { once: true, passive: true });

  // If the network is slow or video fails to load, show fallback
  video.addEventListener('error', (e) => {
    console.error('Video error:', e);
    showFallback();
  });

  // Also handle cases where the browser can't decode or play video sources
  video.addEventListener('stalled', () => {
    // If we never started playback and video is stalled, show fallback
    if (!didStart) {
      showFallback();
    }
  });

  // When playback ends, decide whether to show main content or keep red screen
  video.addEventListener('ended', () => {
    if (LOOP_VIDEO) {
      // If loop, video will restart automatically; nothing to do here.
      return;
    }

    if (SHOW_MAIN_AFTER_VIDEO) {
      // Fade out the intro and show main content
      intro.classList.add('fade-out');
      // After fade-out duration, hide the intro and show main
      setTimeout(() => {
        intro.style.display = 'none';
        mainContent.classList.remove('hidden');
        mainContent.classList.add('fade-in');
        mainContent.setAttribute('aria-hidden', 'false');
      }, 600); // matches CSS --transition-duration
    } else {
      // Keep the red screen (do nothing). Optionally you could reset video to first frame:
      video.currentTime = Math.min(0.02, video.duration || 0);
      video.pause();
    }
  });

  // Tap to play overlay behavior (for autoplay-blocked cases)
  tapToPlay.addEventListener('click', async () => {
    try {
      // Remove the overlay immediately
      tapToPlay.classList.add('visually-hidden');
      tapToPlay.setAttribute('aria-hidden', 'true');

      // Ensure muted (autoplay allowed muted); unmute only if you want sound — note browsers block autoplay with sound
      if (!video.muted) video.muted = true;

      await video.play();
      didStart = true;
    } catch (err) {
      console.error('User-initiated play failed', err);
      // If play still fails, show fallback
      showFallback();
    }
  });

  // If the video is not playable (no supported source), show fallback
  const canPlayAnySource = Array.from(video.querySelectorAll('source')).some((s) => {
    const type = s.getAttribute('type') || '';
    // Basic support check — modern browsers support mp4/webm. This is just a best-effort guess.
    return type.includes('mp4') || type.includes('webm') || type.includes('ogg');
  });
  if (!canPlayAnySource) {
    showFallback();
  }

  // If the video remains hidden/unusable, show fallback UI
  function showFallback() {
    try {
      video.pause();
    } catch (e) { /* ignore */ }
    video.style.display = 'none';
    fallback.style.display = 'flex';
    // Keep the page background red (body already red) — fallback image is centered
    tapToPlay.classList.add('visually-hidden');
  }

  // For safety: if the video doesn't report duration or seems corrupted, show fallback after a timeout
  const safetyTimeout = setTimeout(() => {
    if (!didStart && video.readyState < 3) { // HAVE_FUTURE_DATA
      console.warn('Video did not become ready in time — showing fallback.');
      showFallback();
    }
  }, 3000); // 3 seconds safety window for this short intro

  // Clean up the timeout when the video starts or errors
  video.addEventListener('play', () => clearTimeout(safetyTimeout), { once: true });
  video.addEventListener('error', () => clearTimeout(safetyTimeout), { once: true });

  // Try immediate start in case canplay events have already fired
  tryPlay();
});
