import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

interface Space {
    spaceID: string;
    name: string;
    dimensions: string;
    thumbnail: string | null;
}

const Spaces = () => {
    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();
    const [mySpaces, setMySpaces] = useState<Space[]>([]);
    const [savedSpaces, setSavedSpaces] = useState<Space[]>([]);
    const [activeTab, setActiveTab] = useState<"my" | "saved">("my");
    const [admin, setAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAdmin();
        fetchMySpaces();
        fetchSavedSpaces();
    }, []);

    async function checkAdmin() {
        try {
            const res = await fetch('http://localhost:3000/api/v1/checkAdmin', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}`
                }
            });
            if (res.status === 200) setAdmin(true);
        } catch (e) {
            console.error("Failed to check admin status", e);
        }
    }

    async function fetchMySpaces() {
        try {
            const res = await fetch('http://localhost:3000/api/v1/space/all', {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}`
                }
            }).then(res => res.json());
            setMySpaces(res.spaces || []);
        } catch (e) {
            console.error("Failed to fetch spaces", e);
        } finally {
            setLoading(false);
        }
    }

    async function fetchSavedSpaces() {
        try {
            const res = await fetch('http://localhost:3000/api/v1/space/saved', {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}`
                }
            }).then(res => res.json());
            setSavedSpaces(res.spaces || []);
        } catch (e) {
            console.error("Failed to fetch saved spaces", e);
        }
    }

    async function handleDeleteSpace(id: string) {
        if (!confirm("Are you sure you want to delete this space?")) return;
        try {
            const res = await fetch(`http://localhost:3000/api/v1/space/${id}`, {
                method: "DELETE",
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                fetchMySpaces();
            } else {
                alert("Failed to delete space");
            }
        } catch (e) {
            console.error(e);
        }
    }

    const handleEnterSpace = (id: string) => {
        navigate(`/lounge?spaceId=${id}`);
    };

    const handleEditSpace = (id: string) => {
        navigate(`/createSpace?spaceID=${id}`);
    };

    async function handleAddToCollection() {
        const id = prompt("Enter the Space ID to add to your collection:");
        if (!id) return;

        try {
            const res = await fetch("http://localhost:3000/api/v1/space/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ spaceID: id })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Space added to collection!");
                fetchSavedSpaces();
                setActiveTab("saved");
            } else {
                alert(`Failed to add: ${data.message}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network error");
        }
    }

    async function handleRemoveFromCollection(id: string) {
        if (!confirm("Remove from your collection?")) return;

        try {
            const res = await fetch("http://localhost:3000/api/v1/space/save", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ spaceID: id })
            });

            if (res.ok) {
                fetchSavedSpaces();
            } else {
                alert("Failed to remove space");
            }
        } catch (e) {
            console.error(e);
        }
    }

    const displayedSpaces = activeTab === "my" ? mySpaces : savedSpaces;

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col text-gray-100 font-sans pt-16">
            <Navbar />

            <div className="flex-1 max-w-7xl w-full mx-auto p-8 flex flex-col gap-8">

                {/* Header & Actions */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-gray-400 mt-2">Manage your spaces and collections.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleAddToCollection}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold border border-gray-700 transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                            Add to Collection
                        </button>
                        <button
                            onClick={() => navigate("/joinSpace")}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold border border-gray-700 transition-all transform hover:scale-105"
                        >
                            Join Space
                        </button>
                        <button
                            onClick={() => navigate("/arenaSpace")}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105"
                        >
                            + Create New Space
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab("my")}
                        className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === "my"
                                ? "border-blue-500 text-blue-400"
                                : "border-transparent text-gray-500 hover:text-gray-300"
                            }`}
                    >
                        My Spaces ({mySpaces.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("saved")}
                        className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === "saved"
                                ? "border-purple-500 text-purple-400"
                                : "border-transparent text-gray-500 hover:text-gray-300"
                            }`}
                    >
                        Collection ({savedSpaces.length})
                    </button>
                </div>

                {/* Spaces Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : displayedSpaces.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800">
                        <p className="text-gray-500 text-lg">
                            {activeTab === "my"
                                ? "You haven't created any spaces yet."
                                : "You haven't added any spaces to your collection."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedSpaces.map((space) => (
                            <div key={space.spaceID} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all hover:shadow-xl group">
                                <div className="h-40 bg-gray-800 relative overflow-hidden">
                                    {/* Thumbnail Placeholder */}
                                    <div className={`absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-105 ${activeTab === "my" ? "from-blue-900/20 to-purple-900/20" : "from-purple-900/20 to-pink-900/20"}`}></div>
                                    {space.thumbnail && <img src={space.thumbnail} alt={space.name} className="w-full h-full object-cover" />}

                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-gray-300 border border-white/10">
                                        {space.dimensions}
                                    </div>

                                    {/* Ownership Badge */}
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-2">
                                        {activeTab === "my" ? (
                                            <span className="text-blue-400">OWNER</span>
                                        ) : (
                                            <span className="text-purple-400">SAVED</span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h2 className="text-xl font-bold text-white mb-1 truncate">{space.name}</h2>
                                    <p className="text-xs text-gray-500 font-mono mb-6 truncate select-all">ID: {space.spaceID}</p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleEnterSpace(space.spaceID)}
                                            className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg font-medium transition-colors border border-white/5"
                                        >
                                            Enter
                                        </button>

                                        {activeTab === "my" ? (
                                            <>
                                                <button
                                                    onClick={() => handleEditSpace(space.spaceID)}
                                                    className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 py-2 rounded-lg font-medium transition-colors border border-blue-500/10"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSpace(space.spaceID)}
                                                    className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/10"
                                                    title="Delete Space"
                                                >
                                                    ✕
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleRemoveFromCollection(space.spaceID)}
                                                className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/10"
                                                title="Remove from Collection"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Admin Arena Section */}
                {admin && (
                    <div className="mt-12 pt-12 border-t border-gray-800">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-2xl font-bold text-white">Admin Arena</h2>
                            <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-bold border border-purple-500/20">ADMIN ONLY</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div
                                onClick={() => navigate("/arenaMap")}
                                className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl hover:bg-gray-800/80 cursor-pointer transition-all hover:border-purple-500/50 group"
                            >
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 009 3.618C9 2.5 9 7 9 7"></path></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-200">Map Creator</h3>
                                <p className="text-sm text-gray-500 mt-2">Design base templates for users to clone.</p>
                            </div>

                            <div
                                onClick={() => navigate("/createElement")}
                                className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl hover:bg-gray-800/80 cursor-pointer transition-all hover:border-green-500/50 group"
                            >
                                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-200">Element Forge</h3>
                                <p className="text-sm text-gray-500 mt-2">Create furniture and assets for the world.</p>
                            </div>

                            <div
                                // onClick={() => alert("Global Map Editor coming soon")}
                                className="bg-gray-900/30 border border-gray-800 p-6 rounded-2xl opacity-50 cursor-not-allowed group"
                            >
                                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-500">Global Settings</h3>
                                <p className="text-sm text-gray-600 mt-2">Server configuration (Coming Soon).</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Spaces;