import {  useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
const Spaces=()=>{
    const token = useAuthStore((state) => state.token);    
    type Space ={
        spaceID:string;
        name:string;
        dimensions:string;
        thumbnail:string;
    }
    const navigate=useNavigate();
    const [allspaces,setAllspaces]=useState<Space[]>([]);
    const [admin,setAdmin]=useState(false);
    async function checkAdmin(){
        const res=await fetch('http://localhost:3000/api/v1/checkAdmin',{
            method:"POST",
            headers:{
               
                "Content-Type":"application/json", 
                "authorization":`Bearer ${token}`
            }
        })
        
        if(res.status==200)
        setAdmin(true)
    }
    async function search(){

        const res=await fetch('http://localhost:3000/api/v1/space/all',{
            method:"POST",
            headers:{
               
                "Content-Type":"application/json", 
                "authorization":`Bearer ${token}`
            }
        }).then(res=>res.json())
        setAllspaces(res.spaces);
        console.log(res);
    }
    useEffect(()=>{
        search();
        checkAdmin();
    },[])
    function handleSpaceClick(id:string){
        // navigate(`/lounge?spaceID=${id}`);
        navigate("/lounge", { state: { id: id  } });
    }
    return(
        <div className="flex flex-col items-center justify-start bg-slate-500 max-w-screen h-screen  ">
            <div className=""><Navbar/></div>
            <div className="flex  items-center justify-between gap-2 p-2">
                <button className="bg-orange-400 p-2 rounded-md" onClick={()=>navigate("/arenaSpace")}>Create Space</button>
            {admin &&  <button className="bg-orange-400 p-2 rounded-md" onClick={()=>navigate("/arenaMap")}>Create Map</button>}
            <button className="bg-orange-400 p-2 rounded-md" onClick={()=>navigate("/joinSpace")}>Join Space</button>
            </div>
           {allspaces.length>0 &&
          <div className="flex flex-col items-center w-3/4 h-3/4 ">
              
                <h1 className="text-white text-2xl m-2">Your Spaces</h1>
              <div className="flex m-2 justify-between gap-2 overflow-auto flex-wrap ">
                 { allspaces.map((s)=>(
              
                        <div key={s.spaceID} className="flex flex-col bg-red-500 p-2 rounded-md cursor-pointer w-60" onClick={()=>handleSpaceClick(s.spaceID)}>
                            <h2>{s.spaceID}</h2>
                            <h2>{s.name}</h2>
                            <h2>{s.thumbnail}</h2>
                            <h2>{s.dimensions}</h2>
              
                        </div>
                    // <h1 key={s.spaceID}>{s.spaceID}</h1>
                   ))}
              </div>
          </div>
           
           }
        </div>
    )
}

export default Spaces;