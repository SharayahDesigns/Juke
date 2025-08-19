import { Avatar, Box, Button } from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { useRef, useState } from "react";

const GuestAvatarUpload = ({ profileImageURL, setProfileImageFile }) => {
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
      <Avatar
        src={profileImageURL || "/default-avatar.png"}
        sx={{ width: 100, height: 100 }}
      />
      <input
        accept="image/*"
        type="file"
        hidden
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button
        variant="outlined"
        startIcon={<PhotoCamera />}
        onClick={() => fileInputRef.current.click()}
        sx={{ mt: 1 }}
      >
        Upload Photo
      </Button>
    </Box>
  );
};

export default GuestAvatarUpload;
