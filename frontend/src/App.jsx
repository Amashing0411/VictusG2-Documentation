import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // <-- 1. IMPORT THIS
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Verified from './pages/Verified'; // <-- 1. IMPORT THIS

function App() {
  return (
    <Router>
      {/* 2. ADD THE TOASTER HERE (It handles Light/Dark mode automatically!) */}
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: '#1e293b', // Victus Card Color
            color: '#fff',
            border: '1px solid #334155'
          }
        }} 
      />
      
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/verified" element={<Verified />} /> {/* <-- 2. ADD THIS ROUTE */}
      </Routes>
    </Router>
  );
}

export default App;