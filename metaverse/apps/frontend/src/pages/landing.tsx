import Navbar from "../components/navbar";
import {useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Advertisement from "../components/advertisement";
import useAuthStore from "../stores/useAuthStore";
// import Spaces from "./spaces";
const Landing = () =>{
    const navigate=useNavigate();
    const token = useAuthStore((state) => state.token);    
    

    useEffect(()=>{
    if(token!=undefined)
        navigate('/space')
 
    },[token])
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="mb-auto"><Navbar/></div>
          
            <div className="flex flex-col items-center">
                {
                token==undefined &&
                  <Advertisement/>
                   

                }
            </div>
        </div>
    )
}
export default Landing;