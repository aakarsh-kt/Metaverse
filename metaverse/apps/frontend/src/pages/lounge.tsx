// import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Game from "../components/game";
import { useLocation } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
const Lounge = () => {
//   const navigate = useNavigate();
    const location=useLocation();
    const token=useAuthStore((state)=>state.token);
    const id=location.state?.id;
    const [elements,setElements]=useState([]);
    const [dimensions,setDimensions]=useState({width:0,height:0});
    async function getElements(){
      const elements=await fetch(`http://localhost:3000/api/v1/space/${id}`,{
        headers:{
          "Content-Type":"application/json",
          authorization:`Bearer ${token}`
        }
      }).then(res=>res.json())
      setDimensions({
        width:elements.dimensions.split("x")[0],
        height:elements.dimensions.split("x")[1]
      })
      setElements(elements.elements);
      console.log(elements.elements[0])
      console.log(elements)
    }
    useEffect(()=>{
     getElements();
    },[])
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center justify-center">
        <Game
         elements ={elements}
         dimensions={dimensions}
        />
        </div>
      </div>
    </div>
  );
};

export default Lounge;