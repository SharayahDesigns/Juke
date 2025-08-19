import React, { useState, useEffect, useRef } from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  IconButton,
  Stack,
  Paper,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { auth } from "../firebase";
import { updateProfile, updatePassword, onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";


import swalBaseOptions from "../utils/SwalOptions";

const Profile = () => {
  // const user = auth.currentUser;
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const fileInputRef = useRef();

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
    }
  }, [user]);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.displayName || "");
        setPhotoURL(currentUser.photoURL || "");
      }
    });
  
    return () => unsubscribe();
  }, []);

  useEffect(() => {
  const handleStorageChange = (event) => {
    if (event.key === 'forceReloadUser') {
      auth.currentUser?.reload().then(() => {
        const updatedUser = auth.currentUser;
        setUser({
          ...updatedUser,
          photoURL: updatedUser.photoURL || '/default-avatar.png',
        });
      });
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}, []);

  

  const handleUpdateName = async () => {
    try {
      await updateProfile(user, { displayName: name });
      Swal.fire({
        ...swalBaseOptions,
        icon: "success",
        title: "Updated!",
        text: "Name updated successfully."
      });
   
    } catch (err) {
        Swal.fire({
            ...swalBaseOptions,
            icon: "error",
            title: "Error",
            text: err.message,
          });
    }
  };

  const handleUpdatePassword = async () => {
    try {
      await updatePassword(user, newPassword);
      Swal.fire({
        ...swalBaseOptions,
        icon: "success",
        title: "Success",
        text: "Password updated!"
      });
            setNewPassword("");
    } catch (err) {
        Swal.fire({
            ...swalBaseOptions,
            icon: "error",
            title: "Error",
            text: err.message,
          });
              }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    console.log("Selected file:", file); // 👈 Add this
    if (!file || !user) return;
  
    const storage = getStorage(undefined, "gs://jukebox-social-18ebf.firebasestorage.app");

    const fileRef = storageRef(storage, `userAvatars/${user.uid}/${file.name}`);
  
    try {
      // Upload the file
      await uploadBytes(fileRef, file);
  
      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef);
  
      // Update the user's profile with real hosted URL
      await updateProfile(user, { photoURL: downloadURL });
      await auth.currentUser.reload(); // refresh Firebase auth state
  
      setPhotoURL(downloadURL); // update UI
  // Notify other tabs/components to reload user
      localStorage.setItem('forceReloadUser', Date.now());

      Swal.fire({
        ...swalBaseOptions,
        icon: "success",
        title: "Updated!",
        text: "Profile picture updated!"
      });
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire({
        ...swalBaseOptions,
        icon: "error",
        title: "Error",
        text: err.message,
      });
    }
  };
  
  

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, mt: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
          <Avatar
            src={photoURL || "/default-avatar.png"}
            sx={{ width: 100, height: 100 }}
          />
          <input
            accept="image/*"
            type="file"
            hidden
            ref={fileInputRef}
            onChange={handlePhotoUpload}
          />
          <Button
            variant="outlined"
            startIcon={<PhotoCamera />}
            onClick={() => fileInputRef.current.click()}
            sx={{ mt: 1 }}
          >
            Change Photo
          </Button>
        </Box>
        <Stack spacing={2}>
          <TextField
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleUpdateName}>
            Update Name
          </Button>
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
          />
          <Button variant="contained" color="secondary" onClick={handleUpdatePassword}>
            Change Password
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Profile;
