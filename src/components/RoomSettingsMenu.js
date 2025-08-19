import React, { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from "@mui/material";
import { Settings } from "@mui/icons-material";
import { ref, remove, update } from "firebase/database";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";


const RoomSettingsMenu = ({ roomCode, currentName }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleDeleteRoom = async () => {
    await remove(ref(db, `rooms/${roomCode}`));
    await remove(ref(db, `userRooms/${auth.currentUser.uid}/${roomCode}`));
    navigate("/create-room");
  };

  const handleEditRoom = async () => {
    const updates = {
      partyName: newName,
    };
    if (newPassword.trim()) {
      updates.password = newPassword.trim();
    }

    await update(ref(db, `rooms/${roomCode}`), updates);
    await update(ref(db, `userRooms/${auth.currentUser.uid}/${roomCode}`), updates);

    setEditOpen(false);
    handleCloseMenu();
  };

  return (
    <>
      <IconButton onClick={handleOpenMenu} size="small" sx={{ color: "#1c76c0" }}>
        <Settings />
      </IconButton>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseMenu}>
        <MenuItem onClick={() => setEditOpen(true)}>Edit Room</MenuItem>
        <MenuItem onClick={handleDeleteRoom}>Delete Room</MenuItem>
      </Menu>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit Room</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField
  label="Room Name"
  fullWidth
  margin="dense"
  variant="outlined"
  value={newName}
  onChange={(e) => setNewName(e.target.value)}
/>

<TextField
  label="New Room Password (optional)"
  type="password"
  fullWidth
  margin="dense"
  variant="outlined"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
/>

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleEditRoom} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RoomSettingsMenu;
