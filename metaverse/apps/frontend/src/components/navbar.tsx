import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
const Navbar=()=>{
    const navigate=useNavigate();
    const token = useAuthStore((state) => state.token);
    return (
        <div className="flex  bg-red-300 w-screen p-2 items-center">
            <h1 className="text-2xl font-bold cursor-pointer mr-auto " onClick={()=>navigate('/')}>Link Lounge</h1>
           {token==null ? <div className="flex justify-between ml-auto gap-3">
                <button className="text-white bg-blue-500 rounded-lg p-2" onClick={()=>navigate("/login")}>Login</button>
                <button className="text-white bg-blue-500 rounded-lg p-2" onClick={()=>navigate("/register")}>Register</button>
            </div> : <div className="flex justify-between ml-auto gap-3">
                <button className="text-white bg-blue-500 rounded-lg p-2" onClick={()=>navigate("/logout")}>Logout</button>
                <button className="text-white bg-blue-500 rounded-lg p-2" onClick={()=>navigate("/profile")}>Profile</button>
                </div>
            }
        </div>
    )
}
export default Navbar;