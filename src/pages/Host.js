import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue, set, remove } from "firebase/database";
import SearchAndAdd from "../components/SearchAndAdd";
import { auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import MiniTVPlayer from "../components/MiniTVPlayer";
import RoomSettingsMenu from "../components/RoomSettingsMenu";
import tvImage from "../assets/images/tv_13450157.png"
import {
  faEnvelope,
  faMobileAlt,
  faCopy,
  faMessage,
  faCirclePlay,
  faPlay,
  faPause,
  faForward,
  faCirclePlus,
} from "@fortawesome/free-solid-svg-icons";

const Host = () => {
  const { roomCode } = useParams();
  const [roomData, setRoomData] = useState(null);
  const [users, setUsers] = useState({});
  const shareUrl = `${window.location.origin}/guest/${roomCode}`;
  const shareText = roomData?.partyName
    ? `Join my Jukebox party "${roomData.partyName}" here: ${shareUrl}`
    : `Join my Jukebox party here: ${shareUrl}`;

  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomCode}`);
    console.log("ROOM REF YO", roomRef);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setRoomData(data);
      } else {
        console.error("Room not found");
      }
    });
    // Fetch users
    const usersRef = ref(db, "users");
    onValue(usersRef, (userSnap) => {
      const userData = userSnap.val();
      if (userData) {
        setUsers(userData);
      }
    });

    return () => unsubscribe();
  }, [roomCode]);
  // inside useEffect
useEffect(() => {
  if (auth.currentUser) {
    const { uid, displayName } = auth.currentUser;

    set(ref(db, `users/${uid}`), {
      name: displayName || "Host",
      icon: "🎤" // or whatever icon you want for hosts
    });
  }
}, []);

  const handlePlay = async () => {
    const currentRef = ref(db, `rooms/${roomCode}/currentVideo`);
    if (roomData?.currentVideo?.videoId) {
      await set(currentRef, {
        ...roomData.currentVideo,
        isPlaying: true,
      });
      return;
    }
    if (!roomData?.queue) {
      return;
    }

    const queueEntries = Object.entries(roomData.queue);
    const [firstKey, firstVideo] = queueEntries[0];

    await set(currentRef, {
      ...firstVideo,
      isPlaying: true,
    });

    await remove(ref(db, `rooms/${roomCode}/queue/${firstKey}`));
  };

  const handlePause = async () => {
    const currentRef = ref(db, `rooms/${roomCode}/currentVideo`);
    await set(currentRef, {
      ...roomData.currentVideo,
      isPlaying: false,
    });
  };

  const handleSkip = async () => {
    if (!roomData?.queue) {
      alert("No more songs in the queue!");
      return;
    }

    const queueEntries = Object.entries(roomData.queue);
    const [nextKey, nextVideo] = queueEntries[0];

    await set(ref(db, `rooms/${roomCode}/currentVideo`), {
      ...nextVideo,
      isPlaying: true,
    });

    await remove(ref(db, `rooms/${roomCode}/queue/${nextKey}`));
  };

  const gotoTvRoom = ()=>{
    console.log("HI")
    window.open(`/tv/${roomCode}`, "_blank");
  }

  return (
    <div className="host-dash-main">
      {roomData && (
        <div
          className="host-header"
          style={{ position: "relative", paddingRight: "3rem" }}
        >
          <div style={{ textAlign: "center" }}>
            <h1>
              <span className="juke-social-host">{roomData.partyName}</span>
            </h1>
            <h1>
              <span className="juke-title">JukeBox</span>
            </h1>
          </div>

          <div style={{ position: "absolute", top: 0, right: 0 }}>
            <RoomSettingsMenu
              roomCode={roomCode}
              currentName={roomData.partyName}
            />
          </div>
        </div>
      )}

      <div className="shareParty-box">
        {/* <h4 className="roomCode">Room Code: {roomCode}</h4> */}
        <div className="topCodeSettings">
          <div>
            {" "}
            <h4 className="roomCode"> Room Code: {roomCode} </h4>
          </div>
          <div></div>
        </div>

        <p>Share Party Room:</p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              shareUrl
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <button>
              <FontAwesomeIcon className="facebook-icon" icon={faFacebook} />
            </button>
          </a>

          <a
            href={`mailto:?subject=Join My Jukebox Party&body=${encodeURIComponent(
              shareText
            )}`}
          >
            <button>
              <FontAwesomeIcon className="mail-icon" icon={faEnvelope} />
            </button>
          </a>

          <a href={`sms:?&body=${encodeURIComponent(shareText)}`}>
            <button>
              <FontAwesomeIcon className="text-icon" icon={faMessage} />
            </button>
          </a>

          <button onClick={() => navigator.clipboard.writeText(shareUrl)}>
            <FontAwesomeIcon className="copy-icon" icon={faCopy} />
          </button>
        </div>
      </div>
      <div className="miniPlayer">
        {/* {roomData?.currentVideo?.videoId && (
          <MiniTVPlayer
            videoId={roomData.currentVideo.videoId}
            isPlaying={roomData.currentVideo.isPlaying}
          />
        )} */}
      </div>
      <div className="gotoTV" onClick={gotoTvRoom}><img src={tvImage} width={70}/></div>

      <div className="Play-Controls">
        <button onClick={handlePlay}>
          {" "}
          <FontAwesomeIcon
            className={`play-icon ${
              roomData?.currentVideo?.isPlaying ? "playing" : ""
            }`}
            icon={faCirclePlay}
          />
        </button>
        <button onClick={handlePause}>
          {" "}
          <FontAwesomeIcon
            className={`play-icon ${
              roomData?.currentVideo?.isPlaying === false ? "highlight" : ""
            }`}
            icon={faPause}
          />{" "}
        </button>
        <button onClick={handleSkip}>
          {" "}
          <FontAwesomeIcon className="play-icon" icon={faForward} />
        </button>
      </div>
      {roomData ? (
        <div className="Party-room-main">
          <h3 className="currentVid">Current Video:</h3>
          {roomData.currentVideo ? (
            <>
              <div className="current-video-block">
                <div style={{ width: "30%" }}>
                  <img
                    src={`https://img.youtube.com/vi/${roomData.currentVideo.videoId}/hqdefault.jpg`}
                    alt={roomData.currentVideo.title}
                    className="current-video-thumbnail"
                    width={80}
                  />
                </div>
                <div>
                  <p>{roomData.currentVideo.title}</p>
                  {roomData.currentVideo.submittedBy &&
                  users[roomData.currentVideo.submittedBy] ? (
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "#555",
                        fontWeight: "bold",
                      }}
                    >
                      <FontAwesomeIcon
                        className="text-icon"
                        icon={faCirclePlus}
                      />{" "}
                      Added by {users[roomData.currentVideo.submittedBy].icon}{" "}
                      {users[roomData.currentVideo.submittedBy].name}
                    </p>
                  ) : (
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "#aaa",
                        fontWeight: "bold",
                      }}
                    >
                      — Added by Unknown
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p>No video currently playing.</p>
          )}

          <h3 className="theQue">Up Next:</h3>
          <ul className="upNext-list">
            {roomData.queue ? (
              Object.entries(roomData.queue).map(([key, video]) => {
                const guest = users[video.submittedBy];
                return (
                  <li
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: ".5rem",
                    }}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${video.videoId}/default.jpg`}
                      alt={video.title}
                      width={60}
                      style={{ marginRight: "1rem", borderRadius: "4px" }}
                    />
                    <div>
                      <strong>{video.title}</strong>
                      <br />
                      {guest ? (
                        <span style={{ fontSize: "0.9rem", color: "#555" }}>
                          <FontAwesomeIcon
                            className="text-icon"
                            icon={faCirclePlus}
                          />{" "}
                          {guest.icon} {guest.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.9rem", color: "#aaa" }}>
                          — added by Unknown
                        </span>
                      )}
                    </div>
                  </li>
                );
              })
            ) : (
              <p>The queue is empty.</p>
            )}
          </ul>
        </div>
      ) : (
        <p>Loading room data...</p>
      )}
      {roomData && (
        <SearchAndAdd
          roomCode={roomCode}
          userId={roomData?.hostId || auth.currentUser?.uid}
        />
      )}
    </div>
  );
};

export default Host;
