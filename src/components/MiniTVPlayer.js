import React, { useEffect, useRef, useState } from "react";

const MiniTVPlayer = ({ videoId, isPlaying }) => {
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const previousVideoIdRef = useRef(null);

  // Load YouTube API and init player
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    }

    function createPlayer() {
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        height: "200",
        width: "100%",
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          mute: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            setPlayerReady(true);
            previousVideoIdRef.current = videoId;
          },
        },
      });
    }
  }, []);

  // Play/pause sync
  useEffect(() => {
    if (playerReady && playerRef.current) {
      if (isPlaying && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      } else if (!isPlaying && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying, playerReady]);
  

  // 🔄 Load new video on videoId change (for Skip)
  useEffect(() => {
    if (
      playerReady &&
      videoId &&
      videoId !== previousVideoIdRef.current &&
      playerRef.current
    ) {
      playerRef.current.loadVideoById(videoId);
      previousVideoIdRef.current = videoId;
    }
  }, [videoId, playerReady]);

  return <div id="mini-tv" ref={playerContainerRef}></div>;
};

export default MiniTVPlayer;
