import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInAnonymously } from "firebase/auth";
import { db } from "../firebase";
import { ref, get, set, onValue } from "firebase/database";
import GuestAvatarUpload from "../components/GuestAvatarUpload";
import SearchAndAdd from "../components/SearchAndAdd";
import Swal from "sweetalert2";


const Guest = () => {
  const { roomCode } = useParams();
  const [userId, setUserId] = useState(null);
  const [roomExists, setRoomExists] = useState(false);
  const [name, setName] = useState("")
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // loading state
  const [queue, setQueue] = useState([]);
  const [partyName, setPartyName] = useState("");
  const [users, setUsers] = useState({});
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordRequired, setPasswordRequired] = useState(true);
  const [roomPassword, setRoomPassword] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImageURL, setProfileImageURL] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const joinRoom = async () => {
      try {
        let uid;

        if (auth.currentUser) {
          uid = auth.currentUser.uid;
        } else {
          const result = await signInAnonymously(auth);
          uid = result.user.uid;
        }

        setUserId(uid);

        const roomRef = ref(db, `rooms/${roomCode}`);
        const roomSnap = await get(roomRef);

        if (!roomSnap.exists()) {
          console.error("Room not found");
          setIsChecking(false);
          return;
        }

        const roomData = roomSnap.val();
        setRoomExists(true);
        setPartyName(roomData.partyName || "");
        setRoomPassword(roomData.password || "");
        setPasswordRequired(!!roomData.password); // ✅ SET THIS BEFORE USER CHECK

        // ✅ Wait for passwordRequired to be set before checking user auto-login
        const userRef = ref(db, `users/${uid}`);
        const userSnap = await get(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.val();
          if (userData.name && userData.icon) {
            setName(userData.name);
            
            // 👇 Do NOT auto-set isReady here
            // Guests must always enter the password manually
          }
        }

        const usersRef = ref(db, "users");
        onValue(usersRef, (snapshot) => {
          const data = snapshot.val();
          if (data) setUsers(data);
        });

        const queueRef = ref(db, `rooms/${roomCode}/queue`);
        onValue(queueRef, (snapshot) => {
          const data = snapshot.val();
          setQueue(data ? Object.values(data) : []);
        });

        setIsChecking(false);
      } catch (err) {
        console.error("Error joining as guest:", err);
        setIsChecking(false);
      }
    };

    joinRoom();
  }, [roomCode]);
  console.log("Firebase Storage Bucket:", getStorage().app.options.storageBucket);

  useEffect(() => {
    if (partyName) {
      document.title = `${partyName} - Jukebox`;
    }
  }, [partyName]);
  
  const handleJoin = async () => {
    const storage = getStorage();
    console.log("yooo storage",storage)
    let downloadURL = "";
  
    try {
      if (profileImageFile) {
        setUploadingImage(true);
        const fileRef = storageRef(storage, `userIcons/${userId}/${profileImageFile.name}`);
        await uploadBytes(fileRef, profileImageFile);
        downloadURL = await getDownloadURL(fileRef);
      }
  
      if (passwordInput !== roomPassword) {
        Swal.fire({
          icon: "error",
          title: "Access Denied",
          text: "Incorrect password. Please try again.",
          confirmButtonColor: "#ff6b6b",
        });
        return;
      }
  
      if (userId && name) {
        await set(ref(db, `users/${userId}`), {
          name,
          joinedRoom: roomCode,
          role: "guest",
          photoURL: downloadURL || "", // Fallback in case no image
        });
        setIsReady(true);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: err.message,
      });
    } finally {
      setUploadingImage(false);
    }
  };

  if (!roomExists) {
    return <p>Room not found. Check the link.</p>;
  }

  if (!isReady && !isChecking) {
    return (
      <div className="guest-signIn-main">
        <div className="guest-header">
          <h1>
            <span className="juke-social-host"> {partyName} </span>
          </h1>
          <h1>
            <span className="juke-title">JukeBox</span>
          </h1>
        </div>
        <div className="Guest-SignIN">
          <div className="signInCard">
            <h2>Join the Party</h2>
            <input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="password"
              placeholder="Room Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
<GuestAvatarUpload
  profileImageURL={profileImageURL}
  setProfileImageFile={(file) => {
    setProfileImageFile(file);
    setProfileImageURL(URL.createObjectURL(file)); // show preview
  }}
/>

        
            <button
              onClick={handleJoin}
              disabled={!name || !passwordInput}
              style={{ marginTop: "1rem" }}
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>🎉 {partyName}</h1>
      <h2>
        Welcome, {name}!
      </h2>

      <SearchAndAdd roomCode={roomCode} userId={userId} />

      <h3 style={{ marginTop: "2rem" }}>Up Next in Queue</h3>
      {queue.length > 0 ? (
        <ul>
          {queue.map((video, index) => (
            <li key={index}>
              {video.title}
              {video.submittedBy && users[video.submittedBy] ? (
                <span
                  style={{
                    marginLeft: "10px",
                    fontSize: "0.9rem",
                    color: "#555",
                  }}
                >
                  (added by {users[video.submittedBy].icon}{" "}
                  {users[video.submittedBy].name})
                </span>
              ) : (
                <span
                  style={{
                    marginLeft: "10px",
                    fontSize: "0.9rem",
                    color: "#aaa",
                  }}
                >
                  (added by Unknown)
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No songs in the queue yet!</p>
      )}
    </div>
  );
};

export default Guest;
