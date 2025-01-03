import React, { useEffect } from "react";
import Grid from "../components/grid";
import Navbar from "../components/navbar";
import useAuthStore from "../stores/useAuthStore";
const SESSION_STORAGE_KEY=import.meta.env.REACT_APP_SESSION_STORAGE_KEY;
// import useAuthStore from "../stores/useAuthStore";
interface mapObject{
    elementID:string;
    x:number;
    y:number;
    imageUrl:string;
}
const ArenaMap =()=>{
  
    const token = useAuthStore((state) => state.token);
    interface Object{
        id:string;
        imageUrl:string;
        width:number;
        height:number;
    }
    const [objects,setObjects]=React.useState<Object[]>([]);
    // const token = useAuthStore((state) => state.token);
    async function getObjects(){
        const res=await fetch("http://localhost:3000/api/v1/space/element/all",{
            method:"GET", 
        }).then(res=>res.json())
        console.log(res)
        setObjects(res.elements);
    }
    useEffect(()=>{
        getObjects();
    },[]);
    const [name,setName]=React.useState("");
    const [width,setWidth]=React.useState(0);
    const [height,setHeight]=React.useState(0);
    const [mapID,setMapID]=React.useState(
        sessionStorage.getItem(SESSION_STORAGE_KEY||"default")||""
    );
    const [draggedItem,setDraggedItem]=React.useState<Object|null>(null);
    const [mapElements,setMapElements]=React.useState<mapObject[]|null>([]);
    useEffect(()=>{
        sessionStorage.setItem(SESSION_STORAGE_KEY||"default",mapID)
    },[mapID])
    
    async function getMapElements(){
      const res=await fetch("http://localhost:3000/api/v1/admin/map/getElement",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "authorization":`Bearer ${token}`
        },
        body:JSON.stringify({
          mapID:mapID
        })
      }).then(res=>res.json())
      console.log(res.elements)
      setMapElements(res.elements);
    }
    async function getdimensions(){
        const res=await fetch(`http://localhost:3000/api/v1/admin/map?mapID=${mapID}`,{
            method:"GET",
            headers:{
                "Content-Type":"application/json",
                "authorization":`Bearer ${token}`
            }
          }).then(res=>res.json())
          console.log(res)
          setWidth(res.width);
          setHeight(res.height);
    }
    useEffect(()=>{
      getMapElements();
      getdimensions();
    },[mapID]);
    async function createMap(){
        const res=await fetch("http://localhost:3000/api/v1/admin/map",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "authorization":`Bearer ${token}`
            },
            body:JSON.stringify({
                name:name,
                dimensions:`${width}x${height}`,
            
                thumbnail:"https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
            })
        }).then(res=>res.json())
        console.log(res)
        setMapID(res.mapID);
    }
    return (
        <div className="flex flex-col items-center justify-start h-screen max-w-screen overflow-x-hidden overflow-y-hidden ">
            <Navbar/>   
            <div className="flex justify-around items-center h-full w-screen">
                <div className="bg-red-400 h-full w-full flex flex-col items-center justify-center">
                    {/* Playground */}
                    {mapID=="" && <div className="flex items-center flex-col gap-2">
                        <input type="text" placeholder="Name" onChange={(e)=>setName(e.target.value)} className=" p-2 rounded-md border-2 border-gray-400 focus:border-blue-500 focus:outline-none" />
                        <div className="flex items-center">
                            <input type="number" placeholder="Width" onChange={(e)=>setWidth(parseInt(e.target.value))} className=" p-2 rounded-md border-2 border-gray-400 focus:border-blue-500 focus:outline-none" />
                            <h3 className="text-white">
                                x
                            </h3>
                            <input type="number" placeholder="Height" onChange={(e)=>setHeight(parseInt(e.target.value))} className=" p-2 rounded-md border-2 border-gray-400 focus:border-blue-500 focus:outline-none" />
                            <button onClick={()=>sessionStorage.clear()}>Reset</button>
                        </div>
                        <button className="bg-blue-500 text-white p-2 rounded-md" onClick={createMap}>Create</button>
                    </div>}
                   {mapID!=="" && <div className="overflow-x-auto overflow-y-auto p-2 max-w-fit">
                       <Grid rows={height} columns={width} draggedItem={draggedItem}  mapID={mapID} mapElements={mapElements} />
                   </div>}
                </div>
              { mapID!="" && <div className="bg-blue-500 h-full max-w-96 flex flex-wrap overflow-y-scroll items-center gap-2 p-2  ">
                    {objects.map((o)=>(
                        <div key={o.id} className="cursor-pointer hover:scale-110 transition-transform duration-300 ease-in-out " onClick={()=>setDraggedItem(o)}>
                            <img src={o.imageUrl} alt="logo" className="w-20 rounded-md" /> 
                            </div>
                    ))}
                </div>}
                
            </div>
        </div>
    )
}

export default ArenaMap;