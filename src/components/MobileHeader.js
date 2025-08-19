import React, { useState, useEffect } from 'react';
import { Avatar, Menu, MenuItem } from '@mui/material';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, get } from 'firebase/database';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import { useNavigate } from 'react-router-dom';



const MobileHeader = () => {
  const [user, setUser] = useState(null);
  const [userRooms, setUserRooms] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [hostMenuOpen, setHostMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);
  
        if (snapshot.exists()) {
          const userData = snapshot.val();
  
          // ✅ Only allow user to be set if they’ve fully joined as guest or host
          if (
            (userData.role === 'guest' || userData.role === 'host') &&
            userData.name
          ) {
            setUser({
              ...currentUser,
              photoURL: userData.photoURL || '/default-avatar.png',
              displayName: userData.name,
            });
  
            fetchUserRooms(currentUser.uid);
          } else {
            // 🚫 prevent default avatar from showing
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
  
    return () => unsubscribe();
  }, []);
  
  
  
  

  // useEffect(() => {
  //   const fetchRoomData = async () => {
  //     const code = localStorage.getItem('roomCode');
  //     if (!code) return;

  //     setRoomCode(code);

  //     const roomRef = ref(db, `rooms/${code}`);
  //     const snapshot = await get(roomRef);

  //     if (snapshot.exists()) {
  //       const data = snapshot.val();
  //       setRoomName(data.partyName || '');

  //       const currentUID = auth.currentUser?.uid;
  //       if (currentUID && data.hostId === currentUID) {
  //         setIsHost(true);
  //       }
  //     }
  //   };

  //   fetchRoomData();
  // }, []);
  
  useEffect(() => {
    const reloadUser = async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const updatedUser = auth.currentUser;
  
        setUser({
          ...updatedUser,
          photoURL: updatedUser.photoURL || '/default-avatar.png'

        });
      }
    };
    reloadUser();
    const interval = setInterval(reloadUser, 30000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'forceReloadUser') {
        auth.currentUser.reload().then(() => {
          const updatedUser = auth.currentUser;
          setUser({
            ...updatedUser,
            photoURL: updatedUser.photoURL || '/default-avatar.png',
          });
        });
      }
    };
  
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  
  
  const fetchUserRooms = async (uid) => {
    const roomsRef = ref(db, `userRooms/${uid}`);
    const snapshot = await get(roomsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const roomList = Object.entries(data).map(([roomCode, room]) => ({
        roomCode,
        partyName: room.partyName,
      }));
      setUserRooms(roomList);
    }
  };
  

  const toggleDrawer = (open) => async () => {
    setDrawerOpen(open);
    if (open && user) {
      await fetchUserRooms(user.uid); // refetch latest rooms
    }
    if (!open) {
      setHostMenuOpen(false);
    }
  };
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      handleClose();
      navigate('/signin'); // redirect to sign-in page
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };
  

  return (
    <>
      {/* <AppBar position="static" style={{ backgroundColor: 'transparent' }}> */}
      <AppBar position="sticky" style={{ backgroundColor: 'black', top: 0, zIndex: 1100 }}>

        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleDrawer(true)}
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontFamily: "'Dancing Script', cursive", fontSize: '24px', color: '#1c76c0' }}
            >
              Social
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontFamily: "'Special Gothic Expanded One', sans-serif", fontSize: '24px' }}
            >
              JukeBox
            </Typography>
          </Box>
          {user && (
        <div>
          <IconButton className="profilePic" onClick={handleMenu} size="small">
            {/* <Avatar src={user.photoURL || '/default-avatar.png'} /> */}
            <Avatar src={user?.photoURL || '/default-avatar.png'} />

          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            
          >
<MenuItem
  sx={{
    py: 0,
    px: 1,
    fontSize: '1rem',
    minHeight: '32px',
    lineHeight: '1',
  }}
  onClick={() => navigate('/profile')}
>
  Profile
</MenuItem>
<MenuItem
  sx={{
    py: 0,
    px: 1,
    fontSize: '1rem',
    minHeight: '32px',
    lineHeight: '1',
  }}
  onClick={handleSignOut}
>
  Sign Out
</MenuItem>

          </Menu>
        </div>
      )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation">
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton onClick={toggleDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <List>
          <ListItem disablePadding>
  <ListItemButton onClick={() => setHostMenuOpen(!hostMenuOpen)}>
    <ListItemText primary="Host Party" />
    {hostMenuOpen ? <ExpandLess /> : <ExpandMore />}
  </ListItemButton>
</ListItem>

<Collapse in={hostMenuOpen} timeout="auto" unmountOnExit>
  <List component="div" disablePadding>
    <ListItem disablePadding>
      <ListItemButton component={Link} to="/create-room" sx={{ pl: 4 }}>
        <ListItemText primary="Create New Room" />
      </ListItemButton>
    </ListItem>

    {userRooms.map((room) => (
      <ListItem disablePadding key={room.roomCode}>
        <ListItemButton component={Link} to={`/host/${room.roomCode}`} sx={{ pl: 4 }}>
          <ListItemText primary={`My "${room.partyName}" Room`} />
        </ListItemButton>
      </ListItem>
    ))}
  </List>
</Collapse>


            <ListItem disablePadding>
              <ListItemButton component={Link} to="/guest">
                <ListItemText primary="Join Party" />
              </ListItemButton>
            </ListItem>

            {roomCode && (
              <ListItem disablePadding>
                <ListItemButton component={Link} to={`/tv/${roomCode}`}>
                  <ListItemText primary="TV Room" />
                </ListItemButton>
              </ListItem>
            )}

            

        

            <ListItem disablePadding>
              <ListItemButton component={Link} to="/">
                <ListItemText primary="About" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/">
                <ListItemText primary="Sign In" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default MobileHeader;
