import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { ref, set } from "firebase/database";
import { signInAnonymously } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function generateRoomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length })
    .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
    .join("");
}

const CreateRoom = () => {
  const [partyName, setPartyName] = useState("");
  const [hostName, setHostName] = useState("");
  const [icon, setIcon] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/signin");
    }
  }, [navigate]);

  const handleCreateRoom = async () => {
    if (!partyName || !hostName) {
      alert("Please enter a party name and your name");
      return;
    }
  
    try {
      const roomCode = generateRoomCode(); // ✅ Move this to the top
  
      let uid;
      if (auth.currentUser) {
        uid = auth.currentUser.uid;
      } else {
        const result = await signInAnonymously(auth);
        uid = result.user.uid;
      }
  
      // ✅ Now you can safely save the user's room
      if (auth.currentUser) {
        await set(ref(db, `userRooms/${uid}/${roomCode}`), {
          roomCode,
          partyName,
          createdAt: Date.now(),
        });
      }
  
      await set(ref(db, `rooms/${roomCode}`), {
        hostId: uid,
        createdAt: Date.now(),
        partyName,
        password,
        currentVideo: null,
        queue: {},
        settings: {
          autoMode: false,
          keywords: "",
        },
      });
  
      await set(ref(db, `users/${uid}`), {
        name: hostName,
        icon,
        role: "host",
        activeRoom: roomCode,
      });
  
      localStorage.setItem("roomCode", roomCode);
      navigate(`/host/${roomCode}`);
    } catch (err) {
      console.error("Error creating room:", err);
    }
  };
  

  return (
    <div className="createRoom-main">
      <div className="juke-title-box">
        <h1>
          <span className="juke-create">Create</span>
          </h1>
          <h1>
          <span className="juke-title">JukeBox</span>
        </h1>
      </div>

      <div className="signInCard">
      
        <input
          placeholder="Da Party Name"
          value={partyName}
          onChange={(e) => setPartyName(e.target.value)}
        />

        <input
          placeholder="Your Alter-ego Name"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
        />

        <select
          id="icon-select"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
        >
          <option value="" disabled hidden>
            Select your icon...
          </option>
          <option value="🎧">🎧</option>
          <option value="🎤">🎤</option>
          <option value="🕺">🕺</option>
          <option value="🎶">🎶</option>
          <option value="🪩">🪩</option>
        </select>

        <input
          type="password"
          placeholder="Create Room Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="StartPartyBtn" onClick={handleCreateRoom}>
          Start Party
        </button>
        {!auth.currentUser && (
  <a className="signInbutton" href="/signin">
    Sign in / Create account
  </a>
)}

      </div>
    </div>
  );
};

export default CreateRoom;
