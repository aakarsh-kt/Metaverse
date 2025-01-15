import { useState } from "react";
import Navbar from "../components/navbar";
import useAuthStore from "../stores/useAuthStore";

const JoinSpace = () => {
    const token = useAuthStore((state) => state.token);
    const [spaceID,setSpaceID]=useState("");
    async function handleJoin(){
        const res=await fetch("http://localhost:3000/api/v1/space/join",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "authorization":`Bearer ${token}`
            },
            body:JSON.stringify({
                spaceID:spaceID
            })
        }).then(res=>res.json())
        console.log(res)
    }
    return (
        <div className="flex flex-col items-center h-screen">
            <Navbar/>
                <h1 className="text-2xl m-8">Join Space</h1>
                <h2 className="text-xl">Enter the space ID</h2>
                <input type="text" placeholder="Space ID" className="p-2 m-4" onChange={(e)=>setSpaceID(e.target.value)}/>
                <button className="bg-green-400 text-white p-2 rounded-md" onClick={()=>handleJoin()}>Join</button>
           
        </div>
    );
};

export default JoinSpace;