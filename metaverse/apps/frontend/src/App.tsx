import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
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
import useThemeStore from "./stores/useThemeStore";

const App = () => {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
};

export default App;