import React, { useEffect } from "react";
import Grid from "../components/grid";
import Navbar from "../components/navbar";
// import useAuthStore from "../stores/useAuthStore";

const ArenaMap =()=>{
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
    return (
        <div className="flex flex-col items-center justify-start h-screen max-w-screen overflow-x-hidden overflow-y-hidden ">
            <Navbar/>   
            <div className="flex justify-around items-center h-full w-screen">
                <div className="bg-red-400 h-full w-3/4 flex items-center justify-center">
                    {/* Playground */}
                    <Grid rows={10} columns={10} />
                </div>
                <div className="bg-blue-500 h-full max-w-96 flex flex-wrap overflow-y-scroll items-center gap-2 p-2  ">
                    {objects.map((o)=>(
                        <div key={o.id} className="cursor-pointer hover:scale-110 transition-transform duration-300 ease-in-out ">
                            <img src={o.imageUrl} alt="logo" className="w-20 rounded-md" /> 
                            </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ArenaMap;