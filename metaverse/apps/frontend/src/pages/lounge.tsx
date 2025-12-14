// import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useRef } from "react";
import Game from "../components/game";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
// import jwt from "jsonwebtoken"; 
// import { JWT_PASSWORD } from "../config";
// import client from "@repo/db/client";
interface Player {
  x: number;
  y: number;
  userID: string;
  avatarID: string;

}
const Lounge = () => {
  //   const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const userID = useAuthStore((state) => state.userID);
  console.log(userID);
  const navigate=useNavigate();
  // let decoded: { userID: string } | null = null;
  // if (token) {
  //   try {
  //     decoded = jwt.verify(token, JWT_PASSWORD) as { userID: string };
  //     console.log(decoded.userID);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }
  // console.log(decoded?.userID);
  const id = location.state?.id;
  const [elements, setElements] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [ws, setWs] = useState<WebSocket>();
  const [players, setPlayers] = useState<Player[]>([]);


  async function getElements() {

    const elements = await fetch(`http://localhost:3000/api/v1/space/${id}`, {
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`
      }
    }).then(res => res.json())

    setDimensions({
      width: elements.dimensions.split("x")[0],
      height: elements.dimensions.split("x")[1]
    })
    setElements(elements.elements);

  }
  async function handleInfo(users: string[], spawn: { x: number, y: number }) {
    console.log("getting info");
    console.log(spawn.x, spawn.y);

    const res = await fetch(`http://localhost:3000/api/v1/user/metadata/bulk?ids=${users}`, {
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (data && data.avatars) {
      const updatedPlayers = data.avatars.map((avatar: Player) => ({
        ...avatar,
        x: spawn.x,
        y: spawn.y,
      }));

      // setPlayers((prevPlayers) => [...prevPlayers, ...updatedPlayers]);
      setPlayers((prevPlayers) => getUniquePlayers([...prevPlayers, ...updatedPlayers]));
      console.log("Updated players:", [...updatedPlayers]);
    } else {
      console.error("Failed to fetch player data or avatars are missing.");
    }
  }
  function getUniquePlayers(players: Player[]): Player[] {
    return players.filter(
      (player, index, self) =>
        index === self.findIndex((p) => p.userID === player.userID)
    );
  }
  useEffect(() => {
    console.log("Players updated:", players);
  }, [players]);
  const playersRef = useRef<Player[]>([]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  function updateLocation(x: number, y: number, userID: string) {
    console.log(playersRef.current);
    const updatedPlayers = playersRef.current.map(p => {
      if (p.userID === userID) {
        return { ...p, x, y };
      }
      return p;
    });
    // setPlayers(updatedPlayers);
    setPlayers(getUniquePlayers(updatedPlayers));
  }



  async function handleJoin() {
    const tempWs = new WebSocket("ws://localhost:3001");
    setWs(tempWs); // State update is asynchronous, so don't rely on `ws` immediately.

    tempWs.onopen = () => {
      tempWs.send(
        JSON.stringify({
          type: "join",
          payload: {
            spaceID: id,
            token: token,
          },
        })
      );
    };

    tempWs.onmessage = (msg) => {
      // console.log(msg.data);
      const data = JSON.parse(msg.data);
      console.log(data);
      if (data.type === "space-joined") {
        console.log("player joined");
        //only add the user if they are not already in the list
        console.log(data);
        if (players.find(p => p.userID === data.payload.userID)) {
          return;
        }
        console.log("Space joined", data.payload);
        // setPlayers((prev)=>[...prev,data.payload.users]); // Update players
        handleInfo(data.payload.users, data.payload.spawn);
      }
      else if (data.type === "user-joined") {
        console.log("user joined");
        console.log("Hurray New User");
        //only add the user if they are not already in the list
        console.log(data);
        if (players.find(p => p.userID === data.payload.userID)) {
          return;
        }
        console.log("Space joined", data.payload);
        // setPlayers((prev)=>[...prev,data.payload.users]); // Update players
        handleInfo(data.payload.users, data.payload.spawn);
      }
      else if (data.type === "move") {
        // console.log(data.payload); // Log move payload
        // console.log("Moving shite in lounge", data.payload)
        // console.log("Moving shite in lounge", players)
        updateLocation(data.payload.x, data.payload.y, data.payload.userID);
      }
      else if (data.type === "leave") {
        console.log("leaving")
        setPlayers(prevPlayers => prevPlayers.filter(player => player.userID !== data.payload.userID))
      }
      else if( data.type === "user-left") {
        console.log("User left")

        setPlayers(prevPlayers => prevPlayers.filter(player => player.userID !== data.payload.userID))
      }
    };

    tempWs.onclose = () => {
  console.log("WebSocket closed");
  setPlayers(prev =>
    prev.filter(player => player.userID !== userID)
  );
};

    
  }
  useEffect(() => {
  return () => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };
}, [ws]);

  
  async function broadCastMessage() {
    ws?.send(JSON.stringify({
      type: "space-joined",
      payload: {
        spaceID: id,
        token: token,
      },
    }));
  }
  async function handleLeave() {
  if (!ws) return;

  ws.send(JSON.stringify({
    type: "user-left",
    payload: {
      userID,
      spaceID: id,
    },
  }));

  ws.close(); // IMPORTANT
  navigate('/space');
}

  useEffect(() => {
    getElements();
    handleJoin();
    broadCastMessage();
  }, [])
  console.log(players?.length)
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center justify-center">
          {players.length > 0 && (
            <Game
              elements={elements}
              dimensions={dimensions}
              ws={ws}
              players={players}
              userID={userID}
            />
          )}
        </div>
        <button onClick={() => { console.log(players) }} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
          Click me
        </button>
        <button onClick={() => { alert(`Total Users: ${players.length}`) }} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
          Show Total Users in the map
        </button>
        <button onClick={() => { handleLeave() }} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
          Leave
        </button>
      </div>
    </div>
  );
};

export default Lounge;