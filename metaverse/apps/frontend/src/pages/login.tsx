import {  useState } from "react";
import Navbar from "../components/navbar";  
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
const Login=()=>{
    const navigate=useNavigate();
      const [username,setUsername]=useState("");
      const [password,setPassword]=useState("");
      const setToken = useAuthStore((state) => state.setToken);
      const setUserID = useAuthStore((state) => state.setUserID);
      async function handleSubmit(){
          event?.preventDefault();
          interface Payload{
            username:string;
            password:string;
          }
          const payload:Payload={
                 "username":username,
                "password":password,
                
                }
                console.log(payload);
                let stat:number=0;
          const res=await fetch(`http://localhost:3000/api/v1/signin`,{
              method:"POST",
              headers:{
                  "Content-Type":"application/json",
                  // "access-control-allow-origin":"*",
                  
              },
              body:JSON.stringify(payload)
              
          })
          stat=res.status;
          const response=await res.json();
    
          if(stat==200){
              setToken(response.token);
              setUserID(response.userID!);
              navigate(`/`);
          }
          else{
              console.log(response.message);
          }
            
      }
     
       

    return (
        <div className="flex flex-col items-center ">
            <Navbar/>
            Login
            <div className="flex flex-col m-2 p-2">
                <form className="flex flex-col">
                <input type="text" placeholder="Username" onChange={e=>setUsername(e.target.value)}/>
                <input type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)}/>
                <div className="items-center flex flex-col" >
                

                </div>
             
                <button type="submit" onClick={handleSubmit}>Submit</button>
                </form>

            </div>
        </div>
    )
}

export default Login;