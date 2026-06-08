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

    const initPlayer = () => {
      if (!isMounted || !containerRef.current || !window.YT || !window.YT.Player) return;

      // Clear container and create fresh target
      containerRef.current.innerHTML = '';
      const playerTarget = document.createElement('div');
      playerTarget.id = `yt-player-${Math.random().toString(36).substr(2, 9)}`;
      containerRef.current.appendChild(playerTarget);

      try {
        playerRef.current = new window.YT.Player(playerTarget, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            modestbranding: 1,
            rel: 0,
            autoplay: 0,
            showinfo: 0,
            // Use the current origin for the security handshake
            origin: window.location.origin, 
            enablejsapi: 1,
          },
          events: {
            onStateChange: (event: any) => {
               if (isMounted && onStateChange) onStateChange(event);
            },
            onError: (e: any) => console.error("YT Player Error:", e.data)
          }
        });
      } catch (err) {
        console.error("YT Construction Failed:", err);
      }
    };

    const start = async () => {
      try {
        await loadYouTubeAPI();
        if (!isMounted) return;

        // Ensure window.YT is fully ready before proceeding
        let checkCount = 0;
        while (!window.YT?.Player && checkCount < 20) {
          await new Promise(r => setTimeout(r, 50));
          checkCount++;
        }

        setTimeout(initPlayer, 100);
      } catch (err) {
        console.error("YouTube API Loading Failed", err);
      }
    };

    start();

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