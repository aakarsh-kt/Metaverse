import { useState } from "react";
import Navbar from "../components/navbar";
import useAuthStore from "../stores/useAuthStore";
import { useNavigate } from "react-router-dom";

const JoinSpace = () => {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const [spaceID, setSpaceID] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleJoin(e?: React.FormEvent) {
        e?.preventDefault();
        if (!spaceID) {
            setError("Please enter a Space ID");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`http://localhost:3000/api/v1/space/${spaceID}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}`
                },
            }).then(res => res.json());

            if (res.message === "Invalid space id" || !res.dimensions) {
                setError("Invalid Space ID. Please check and try again.");
            } else {
                // Fixed: Use query param instead of state to match Lounge logic
                navigate(`/lounge?spaceId=${spaceID}`);
            }
        } catch (err) {
            console.error(err);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="h-screen w-screen bg-gray-950 flex flex-col overflow-hidden text-gray-100 font-sans pt-16">
            <Navbar showBack />

            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                ></div>

                <div className="relative bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-10 rounded-3xl shadow-2xl max-w-md w-full mx-6 animate-fade-in-up">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-blue-500/20">
                            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                            Join a Universe
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Enter the unique ID of the space you want to visit.
                        </p>
                    </div>

                    <form onSubmit={handleJoin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                Space ID
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={spaceID}
                                    onChange={(e) => {
                                        setSpaceID(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="e.g. 123e4567..."
                                    className={`
                                        w-full bg-gray-950 border rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono
                                        ${error ? "border-red-500/50 focus:border-red-500" : "border-gray-700/50 focus:border-blue-500"}
                                    `}
                                />
                                {error && (
                                    <div className="absolute right-4 top-4 text-red-400 animate-pulse">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </div>
                                )}
                            </div>
                            {error && (
                                <p className="text-red-400 text-xs mt-2 ml-1 font-medium">{error}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !spaceID}
                            className={`
                                w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]
                                ${loading
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25"}
                            `}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Connecting...</span>
                                </div>
                            ) : (
                                "Launch"
                            )}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default JoinSpace;