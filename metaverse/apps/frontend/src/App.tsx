import { BrowserRouter,Routes,Route, } from "react-router-dom";
import Landing from "./pages/landing";
import Login from "./pages/login";
import Register from "./pages/register";
import Spaces from "./pages/spaces";
import "./index.css";
import Lounge from "./pages/lounge";
import ArenaMap from "./pages/arenaMap";
const App=()=>{
  return (
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/space" element={<Spaces/>}/>
        <Route path="/lounge" element={<Lounge/>}/>
        <Route path="/arenaMap" element={<ArenaMap/>}/>
      </Routes>
     </BrowserRouter>
  )
}

export default App;