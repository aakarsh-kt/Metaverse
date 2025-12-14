import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

const Navbar = () => {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);

    const logout = () => {
        useAuthStore.setState({ token: null });
        navigate("/");
    };

    return (
        <div className="fixed top-0 inset-x-0 h-16 bg-gray-900/80 backdrop-blur-md border-b border-white/5 z-50 px-6 flex items-center justify-between ">
            {/* Logo */}
            <h1
                onClick={() => navigate('/')}
                className="text-2xl font-black italic tracking-tighter cursor-pointer bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
                Link Lounge
            </h1>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {token === null ? (
                    <>
                        <button
                            onClick={() => navigate("/login")}
                            className="text-gray-300 hover:text-white font-medium text-sm transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate("/register")}
                            className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-white/10"
                        >
                            Get Started
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => navigate("/space")}
                            className="hidden md:block text-gray-400 hover:text-white font-medium text-sm transition-colors mr-2"
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => navigate("/profile")}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-medium text-sm transition-all border border-gray-700 hover:border-gray-600"
                        >
                            Profile
                        </button>
                        <button
                            onClick={logout}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg font-medium text-sm transition-all border border-red-500/10 hover:border-red-500/20"
                        >
                            Logout
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Navbar;