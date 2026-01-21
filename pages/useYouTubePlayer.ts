import { useEffect, useRef } from 'react';
import { loadYouTubeAPI } from './youtube';

interface UseYouTubePlayerProps {
  videoId: string | null;
  onStateChange?: (event: any) => void;
}

export const useYouTubePlayer = ({ videoId, onStateChange }: UseYouTubePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    let isMounted = true;

    const initPlayer = async () => {
      await loadYouTubeAPI();
      
      if (!window.YT || !window.YT.Player) return;

      if (!isMounted || !containerRef.current) return;

      // Create a dedicated target element for the player to replace
      // This ensures the containerRef itself isn't replaced by the iframe
      containerRef.current.innerHTML = '';
      const playerTarget = document.createElement('div');
      containerRef.current.appendChild(playerTarget);

      playerRef.current = new window.YT.Player(playerTarget, {
        videoId,
        host: 'https://www.youtube-nocookie.com', // Use privacy-enhanced mode
        width: '100%',
        height: '100%',
        playerVars: {
          modestbranding: 1,
          rel: 0,
          autoplay: 0,
          origin: window.location.origin, // Explicitly set origin
          enablejsapi: 1,
        },
        events: {
          onStateChange: (event: any) => {
             if (onStateChange) onStateChange(event);
          }
        }
      });
    };

    initPlayer();

    return () => {
      isMounted = false;
      if (playerRef.current) {
        try {
            playerRef.current.destroy();
        } catch (e) {
            // Ignore errors during destruction
        }
      }
    };
  }, [videoId]);

  return containerRef;
};