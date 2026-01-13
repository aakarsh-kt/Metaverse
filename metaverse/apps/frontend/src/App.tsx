import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "./stores/useAuthStore";
import Landing from "./pages/landing";
import Login from "./pages/login";
import Register from "./pages/register";
import Spaces from "./pages/spaces";
import "./index.css";
import Lounge from "./pages/lounge";
import ArenaMap from "./pages/arenaMap";
import ArenaSpace from "./pages/arenaSpace";
import CreateSpace from "./pages/createSpace";
import JoinSpace from "./pages/joinSpace";
import CreateElement from "./pages/createElement";
import Profile from "./pages/profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminElements from "./pages/AdminElements";
import AdminMaps from "./pages/AdminMaps";
import useThemeStore from "./stores/useThemeStore";

import Toast from "./components/ui/Toast";
import Modal from "./components/ui/Modal";

const App = () => {
  const { theme } = useThemeStore();
  const { token, role, setRole } = useAuthStore();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Sync role if missing but token exists
  useEffect(() => {
    if (token && !role) {
      fetch("http://localhost:3000/api/v1/user/metadata", {
        headers: { "authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.role) setRole(data.role);
        })
        .catch(err => console.error("Failed to sync role:", err));
    }
  }, [token, role, setRole]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/space" element={<Spaces />} />
          <Route path="/lounge" element={<Lounge />} />
          <Route path="/arenaMap" element={<ArenaMap />} />
          <Route path="/arenaSpace" element={<ArenaSpace />} />
          <Route path="/createSpace" element={<CreateSpace />} />
          <Route path="/joinSpace" element={<JoinSpace />} />
          <Route path="/createElement" element={<CreateElement />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/elements" element={<AdminElements />} />
          <Route path="/admin/maps" element={<AdminMaps />} />
        </Routes>

        {/* Global UI Elements */}
        <Toast />
        <Modal />
      </div>
    </BrowserRouter>
  );
};

export default App;