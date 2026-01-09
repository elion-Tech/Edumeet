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
  if (!url) return null;
  
  // Regex matches:
  // youtube.com/watch?v=ID
  // youtu.be/ID
  // youtube.com/embed/ID
  // youtube.com/shorts/ID
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?)|(shorts\/))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[8].length === 11) ? match[8] : null;
};

let apiPromise: Promise<void> | null = null;

/**
 * Singleton loader for the YouTube IFrame Player API.
 * Ensures the script is injected only once.
 */
export const loadYouTubeAPI = (): Promise<void> => {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };
  });

  return apiPromise;
};