import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ref, get } from "firebase/database";
import { db } from "../firebase"; // make sure this is your initialized db
import swalBaseOptions from "../utils/SwalOptions";

const JoinRoomManually = () => {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) return;

    try {
      const roomRef = ref(db, `rooms/${code}`);
      const snapshot = await get(roomRef);

      if (snapshot.exists()) {
        navigate(`/guest/${code}`);
      } else {
        Swal.fire({
          ...swalBaseOptions,
          icon: "error",
          title: "Room Not Found",
          text: `The room code "${code}" does not exist.`,
        });
      }
    } catch (err) {
      console.error("Error checking room:", err);
      Swal.fire({
        ...swalBaseOptions,
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <div className="joinRoom-main">
      <div className="guest-header manualJoin">
        <span className="juke-title-room">JukeBox Room</span>
      </div>
      <div className="Guest-SignIN ">
        <div className="signInCard">
          <input
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button onClick={handleJoin} disabled={!roomCode.trim()}>
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomManually;
