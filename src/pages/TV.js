import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { ref, onValue, set, get } from 'firebase/database';
import isMobile from '../utils/isMobile';
import MobileHeader from '../components/MobileHeader';

const TV = () => {
  const { roomCode } = useParams();
  const playerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(null); // ⬅️ track current loaded video

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => setIsPlayerReady(true),
          onStateChange: async (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              const queueRef = ref(db, `rooms/${roomCode}/queue`);
              const snapshot = await get(queueRef);
              const queueData = snapshot.val();

              if (queueData) {
                const [nextKey, nextVideo] = Object.entries(queueData)[0];

                await set(ref(db, `rooms/${roomCode}/currentVideo`), {
                  ...nextVideo,
                  isPlaying: true
                });

                await set(ref(db, `rooms/${roomCode}/queue/${nextKey}`), null);
              } else {
                await set(ref(db, `rooms/${roomCode}/currentVideo`), null);
              }
            }
          },
        },
      });
    };
  }, [roomCode]);

  useEffect(() => {
    const currentRef = ref(db, `rooms/${roomCode}/currentVideo`);
    const unsubscribe = onValue(currentRef, (snapshot) => {
      const videoData = snapshot.val();
      if (videoData?.videoId && isPlayerReady && playerRef.current && playerRef.current.playVideo) {
        const isSameVideo = videoData.videoId === currentVideoId;

        if (videoData.isPlaying) {
          if (isSameVideo) {
            // 👇 resume playback if already loaded
            playerRef.current.playVideo();
          } else {
            // 👇 load new video
            playerRef.current.loadVideoById(videoData.videoId);
            setCurrentVideoId(videoData.videoId);
          }
        } else {
            if (isSameVideo && typeof playerRef.current.pauseVideo === 'function') {
                playerRef.current.pauseVideo();
              }
        }
      }
    });

    return () => unsubscribe();
  }, [roomCode, isPlayerReady, currentVideoId]);

  return (
    <div style={{ background: 'black', height: '100vh', padding: 0, margin: 0 }}>
          {isMobile() && <MobileHeader />} {/* 👈 Show header only on mobile */}
      <div id="yt-player"></div>
    </div>
  );
};

export default TV;
