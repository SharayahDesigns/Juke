// src/components/MainLayout.js
import React from 'react';
import MobileHeader from './MobileHeader';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <>
      <MobileHeader />
      <Outlet />
    </>
  );
};

export default MainLayout;
