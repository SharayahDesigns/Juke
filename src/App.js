// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateRoom from './pages/CreateRoom';
import Host from './pages/Host';
import TV from './pages/TV';
import Guest from './pages/Guest';
import JoinRoomManually from './pages/JoinRoomManually';
import MainLayout from './components/MainLayout';
import SignIn from './pages/SignIn';
import './styles/main.css';
import Profile from './pages/profile';
import { ThemeProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import Home from './pages/Home';


function App() {
  return (
    <ThemeProvider theme={theme}>
    <CssBaseline />
    <Router>
      <Routes>
        {/* Layout route with MobileHeader */}
        <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />

          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/signIn" element={<SignIn />} />
          <Route path="/host/:roomCode" element={<Host />} />
          <Route path="/guest" element={<JoinRoomManually />} />
          <Route path="/guest/:roomCode" element={<Guest />} />
          <Route path="/profile" element={<Profile/>}/>
        </Route>

        {/* No header layout */}
        <Route path="/tv/:roomCode" element={<TV />} />
      </Routes>
    </Router>
  </ThemeProvider>
    
  );
}

export default App;
