import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import useThemeStore from "../stores/useThemeStore";

interface NavbarProps {
    showBack?: boolean;
    backUrl?: string;
}

const Navbar = ({ showBack = false, backUrl }: NavbarProps) => {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const role = useAuthStore((state) => state.role);
    const logoutStore = useAuthStore((state) => state.logout);
    const { theme, toggleTheme } = useThemeStore();

    const logout = () => {
        logoutStore();
        navigate("/");
    };

    const handleBack = () => {
        if (backUrl) {
            navigate(backUrl);
        } else {
            navigate("/space");
        }
    };

    return (
        <div className="fixed top-0 inset-x-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 z-50 px-6 flex items-center justify-between transition-colors">
            {/* Left Section: Back or Logo */}
            <div className="flex items-center gap-4">
                {showBack && (
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors mr-2"
                        title="Go Back"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                )}
                <h1
                    onClick={() => navigate('/')}
                    className="text-2xl font-black italic tracking-tighter cursor-pointer bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                >
                    Meta Mesh
                </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    {theme === 'light' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                    )}
                </button>

                {token === null ? (
                    <>
                        <button
                            onClick={() => navigate("/login")}
                            className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium text-sm transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate("/register")}
                            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-black/10 dark:shadow-white/10"
                        >
                            Get Started
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => navigate("/space")}
                            className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white font-medium text-sm transition-colors mr-2"
                        >
                            Dashboard
                        </button>
                        {role === 'admin' && (
                            <button
                                onClick={() => navigate("/admin")}
                                className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg font-bold text-xs transition-all border border-blue-600/20 mr-2"
                            >
                                Admin Area
                            </button>
                        )}
                        <button
                            onClick={() => navigate("/profile")}
                            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium text-sm transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
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