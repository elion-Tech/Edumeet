declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

/**
 * Extracts the YouTube Video ID from various URL formats.
 * Supports: standard, short, embed, and shorts URLs.
 */
export const extractVideoId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  // Standard watch URL or any URL with ?v= or &v=
  const vMatch = url.match(/[?&]v=([^&#]+)/);
  if (vMatch && vMatch[1].length === 11) return vMatch[1];

  // youtu.be/ID, embed/ID, shorts/ID, or v/ID
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))((?:\w|-){11})(?:\S+)?$/;
  const match = url.match(regExp);
  if (match && match[1].length === 11) return match[1];

  // Fallback for tricky URLs where the ID might be after /
  const parts = url.split('/');
  const lastPart = parts[parts.length - 1].split(/[?&]/)[0];
  if (lastPart.length === 11) return lastPart;
  
  return null;
};

let apiPromise: Promise<void> | null = null;

/**
 * Singleton loader for the YouTube IFrame Player API.
 * Ensures the script is injected only once.
 */
export const loadYouTubeAPI = (): Promise<void> => {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    // If the API is already loaded and the Player constructor is ready, resolve immediately
    if (window.YT && window.YT.Player && typeof window.YT.Player === 'function') {
      resolve();
      return;
    }

    // If the script is already in the document but not ready, we just need to wait for the callback
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const originalCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (originalCallback) originalCallback();
            resolve();
        };
        return;
    }

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };
  });

  return apiPromise;
};