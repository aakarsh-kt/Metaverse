import { useParams } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import { useEffect } from "react";

const CreateSpace =() => {
   const token = useAuthStore((state) => state.token);
    const {spaceID}=useParams<{spaceID:string}>();
    async function getSpace(){
        const res=await fetch(`http://localhost:3000/api/v1/space/${spaceID}`,{
            method:"GET",
            headers:{
                "Content-Type":"application/json",
                "authorization":`Bearer ${token}`
            }
        }).then(res=>res.json())
        console.log(res)
        setSpace(res);
    }
    useEffect(()=>{
        getSpace();
    },[])
    return (
        <div>
            <h1>Create Space With Map</h1>
        </div>
    );
};

export default CreateSpace;