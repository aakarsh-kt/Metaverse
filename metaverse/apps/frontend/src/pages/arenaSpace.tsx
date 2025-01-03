import React, { useEffect } from "react";
import useAuthStore from "../stores/useAuthStore";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";

interface Maps{
    mapID:string;
    name:string;
    width:number;
    height:number;
    thumbnail:string;
}

const ArenaSpace = () => {

    const token =useAuthStore((state)=>state.token);
    const [maps,setMaps]=React.useState<Maps[]>([]);
    const navigate=useNavigate();
    const [name,setName]=React.useState("");
    const [width,setWidth]=React.useState(0);
    const [height,setHeight]=React.useState(0);
    async function getMaps(){
        const res=await fetch("http://localhost:3000/api/v1/user/maps",{
            method:"GET",
            headers:{
                "Content-Type":"application/json",
                "authorization":`Bearer ${token}`
            }
          }).then(res=>res.json())
          console.log(res)
          setMaps(res.mapIDs);
    }
    useEffect(()=>{
        getMaps();
    },[]);
    const [show,setShow]=React.useState(false);
    async function createWithMap(name:string, id:string){
        try{ const res=await fetch("http://localhost:3000/api/v1/space/create",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "authorization":`Bearer ${token}`
            },
            body:JSON.stringify({
                name:name,
                dimensions:`123x123`,
                mapID:id
            })
        }).then(res=>res.json())
        console.log(res)
        navigate(`/createSpace?spaceID=${res.spaceID}`);
    }
        catch(e){
            alert("Some error occured");
            console.log(e);
        }
  
    }
    
    async function createWithoutMap(name:string, width:number, height:number){
           
        try{    
            const res=await fetch("http://localhost:3000/api/v1/space/create",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "authorization":`Bearer ${token}`
            },
            body:JSON.stringify({
                name:name,
                dimensions:`${width}x${height}`
            })
        }).then(res=>res.json())
        console.log(res);
        navigate(`/createSpace?spaceID=${res.spaceID}`);
    }
        catch(e){
            alert("Some error occured");
            console.log(e);
        }
    }
    const [mapid,setMapid]=React.useState({
        mapid:"",
        index:-1
    });
    return (
        <div>
            <Navbar/>   
        <div className="flex flex-col items-center justify-center">
            <h1 className="text-2xl ">Choose a Space</h1>
            
               {mapid.mapid=="" && <div className="bg-slate-400` flex flex-wrap items-center gap-2 p-2  ">
                   { maps.map((m,index)=>(
                        <div key={m.mapID} className="flex flex-col items-center gap-2  p-2 bg-slate-400 rounded-sm cursor-pointer" onClick={()=>setMapid({mapid:m.mapID,index:index})}>
                            <h2>{m.name}</h2>
                            <img src={m.thumbnail} alt="logo" className="w-20 rounded-md" />
                        </div>
                    ))}
                </div> }
                {
                    mapid.mapid!=="" &&
                    <div className="bg-slate-400` flex flex-col items-center gap-2 p-2  ">
                        <div className="flex flex-col items-center gap-2  p-2 bg-slate-400 rounded-sm cursor-pointer" >
                            <h2>{maps[mapid.index].name}</h2>
                            <img src={maps[mapid.index].thumbnail} alt="logo" className="w-20 rounded-md" />
                        </div>
                        <input type="text" placeholder="Name" className=" p-2 rounded-md border-2 border-gray-400 focus:border-blue-500 focus:outline-none" onChange={(e)=>setName(e.target.value)} />  
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={()=>createWithMap(name,mapid.mapid)}>Create</button>
                    </div>

                }
                <div className="flex flex-col items-center gap-2 p-2 bg">
                    <h1 className="text-2xl">Or Create your own space</h1>
                {!show &&     <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={()=>setShow(true)}>Create</button>  }          
                        {show &&  <div className="flex flex-col items-center gap-2 p-2 bg">
                        <input type="text" placeholder="Name" className=" p-2 rounded-md border-2 border-gray-400 focus:border-blue-500 focus:outline-none" onChange={(e)=>setName(e.target.value)} />
                        <div className="flex items-center">
                            <input type="number" placeholder="Width" className=" p-2 rounded-md border-2 border-gray-400 focus:border-blue-500 focus:outline-none" onChange={(e)=>setWidth(parseInt(e.target.value))} />
                            <h3 className="text-white">
                                x
                                </h3>
                                <input type="number" placeholder="Height" className=" p-2 rounded-md border-2 border-gray-400 focus:border-blue-500 focus:outline-none" onChange={(e)=>setHeight(parseInt(e.target.value))} />
                          
                                

                        </div>
                                <button className="bg-blue-500 text-white p-2 rounded-md" onClick={()=>createWithoutMap(name,width,height)} >Create</button>
                    </div>
                                }
                </div>
        </div>
        
        </div>
    );
    }
export default ArenaSpace;