import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ClientGate from './components/client/ClientGate';
import AdminGate from './components/admin/AdminGate';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Client POS Terminal (Route: "/") */}
        <Route path="/" element={<ClientGate />} />

        {/* Hidden Admin Management Control Panel (Route: "/admin") */}
        <Route path="/admin" element={<AdminGate />} />

        {/* Fallback to Client Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
