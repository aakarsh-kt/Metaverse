// import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useRef } from "react";
import Game from "../components/game";
import { useSearchParams } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import StatusBar from "../components/statusBar";
// import jwt from "jsonwebtoken"; 
// import { JWT_PASSWORD } from "../config";
// import client from "@repo/db/client";
interface Player {
  x: number;
  y: number;
  userID: string;
  username?: string;
  avatarID: string;
  avatarUrl?: string;

}
interface User {
  userId: string;
  x: number;
  y: number;
}
const Lounge = () => {
  //   const navigate = useNavigate();
  // const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const userID = useAuthStore((state) => state.userID);
  console.log(userID);
  // const navigate = useNavigate();
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
  const [searchParams] = useSearchParams();
  const id = searchParams.get("spaceId");
  const [elements, setElements] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [ws, setWs] = useState<WebSocket>();
  const [players, setPlayers] = useState<Player[]>([]);


  const getElements = useCallback(async () => {

    const elements = await fetch(`http://localhost:3000/api/v1/space/${id}`, {
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`
      }
    }).then(res => res.json())

    setDimensions({
      width: parseInt(elements.dimensions.split("x")[0]),
      height: parseInt(elements.dimensions.split("x")[1])
    })
    setElements(elements.elements);

  }, [id, token]);
  const activeUsersRef = useRef<Set<string>>(new Set());

  // Use a ref for handleInfo to ensure we always use the latest logic/state references if needed, 
  // though primarily we need it to access activeUsersRef which is stable.
  const handleInfo = useCallback(async (users: { x: number, y: number, userId: string }[]) => {
    // console.log("getting info", users);

    // Trust the input users list. If backend sent them, they are likely valid.
    // The previous "race condition" filter against activeUsersRef might have been too aggressive.
    if (users.length === 0) return;

    const userIds = users.map(u => u.userId).join(",");

    try {
      const res = await fetch(`http://localhost:3000/api/v1/user/metadata/bulk?ids=${userIds}`, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data && data.avatars) {
        setPlayers((prevPlayers) => {
          const updatedPlayers = data.avatars
            .map((avatar: Partial<Player> & { userID: string; username?: string }) => {
              const user = users.find(u => u.userId === avatar.userID);
              if (!user) return null;

              // Ensure we track this user as active now that we have confirmed data
              activeUsersRef.current.add(user.userId);

              return {
                ...avatar,
                // Keep GameProps happy; also preserves existing behavior if backend didn't send avatarID.
                avatarID: avatar.avatarID ?? avatar.avatarUrl ?? "",
                x: user.x,
                y: user.y,
              };
            })
            .filter((p: Player | null): p is Player => p !== null);

          return getUniquePlayers([...prevPlayers, ...updatedPlayers]);
        });
      }
    } catch (e) {
      console.error("Failed to fetch player data:", e);
    }
  }, [token]);


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



  const handleJoin = useCallback(async () => {
    const tempWs = new WebSocket("ws://localhost:3001");
    setWs(tempWs);

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

    tempWs.addEventListener("message", (msg) => {
      const data = JSON.parse(msg.data);
      // console.log(data);

      if (data.type === "space-joined") {
        console.log("Space joined", data.payload);

        // Update active users
        data.payload.users.forEach((u: User) => activeUsersRef.current.add(u.userId));

        // Add current user to active users
        if (userID) {
          activeUsersRef.current.add(userID);
        }

        const currentUser = userID ? {
          userId: userID,
          x: data.payload.spawn.x,
          y: data.payload.spawn.y,
        } : null;

        const usersToFetch = currentUser
          ? [...data.payload.users, currentUser]
          : data.payload.users;

        handleInfo(usersToFetch);
      }
      else if (data.type === "user-joined") {
        console.log("User joined:", data.payload.userID);
        const newUserId = data.payload.userID;

        if (playersRef.current.find(p => p.userID === newUserId)) {
          // console.log("User already in list (checked via ref), skipping");
          return;
        }

        // Mark as active
        activeUsersRef.current.add(newUserId);

        handleInfo([{
          userId: newUserId,
          x: data.payload.x,
          y: data.payload.y
        }]);
      }
      else if (data.type === "move") {
        console.log("[React] Received move message:", data.payload);
        // Handled by GameScene directly
      }
      else if (data.type === "user-left") {
        console.log("User left:", data.payload.userID);
        const leftUserId = data.payload.userID;

        // Mark as inactive immediately
        activeUsersRef.current.delete(leftUserId);

        setPlayers(prevPlayers => prevPlayers.filter(player => player.userID !== leftUserId));
      }
    });

    tempWs.onclose = () => {
      console.log("WebSocket closed");
      // Optional: Clear activeUsersRef?
      activeUsersRef.current.clear();
      // Keep own user?
      //   setPlayers(prev =>
      //     prev.filter(player => player.userID !== userID)
      //   );
    };
  }, [id, token, userID, handleInfo]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [ws]);


  //   async function broadCastMessage() {
  //     ws?.send(JSON.stringify({
  //       type: "space-joined",
  //       payload: {
  //         spaceID: id,
  //         token: token,
  //       },
  //     }));
  //   }

  // async function handleLeave() {
  //   if (!ws) return;
  //   // Notify server (optional if onclose handles it, but good for explicit leave)
  //   // ws.close() naturally triggers removal on server usually
  //   ws.close();
  //   navigate('/space');
  // }

  useEffect(() => {
    getElements();
    handleJoin();
    // broadCastMessage();
  }, [getElements, handleJoin])
  console.log(players?.length)
  return (
    <div className="fixed inset-0 w-full h-full bg-gray-950 overflow-hidden">
      {/* Game Filling the Full Screen */}
      <div className="absolute inset-0 w-full h-full">
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

      {/* UI Overlay */}
      <StatusBar />
    </div>
  );
};

export default Lounge;