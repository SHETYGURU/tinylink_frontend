import React from 'react';
import Dashboard from './pages/Dashboard';
import Stats from './pages/Stats';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/code/:code' element={<Stats />} />
      </Routes>
    </BrowserRouter>
  );
}
