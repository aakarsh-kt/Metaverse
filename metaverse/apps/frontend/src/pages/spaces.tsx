import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import useToastStore from "../stores/useToastStore";
import useModalStore from "../stores/useModalStore";

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
    const addToast = useToastStore((state) => state.addToast);
    const openModal = useModalStore((state) => state.openModal);

    useEffect(() => {
        checkAdmin();
        fetchAllSpaces();
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

    async function fetchAllSpaces() {
        try {
            const res = await fetch('http://localhost:3000/api/v1/space/all', {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}`
                }
            }).then(res => res.json());

            setMySpaces(res.owned || []);
            setSavedSpaces(res.saved || []);
        } catch (e) {
            console.error("Failed to fetch spaces", e);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteSpace(id: string) {
        openModal({
            title: "Delete Space",
            message: "Are you sure you want to permanently delete this space? This action cannot be undone.",
            type: "confirm",
            onConfirm: async () => {
                try {
                    const res = await fetch(`http://localhost:3000/api/v1/space/${id}`, {
                        method: "DELETE",
                        headers: {
                            "authorization": `Bearer ${token}`
                        }
                    });
                    if (res.ok) {
                        fetchAllSpaces();
                        addToast("Space deleted successfully", "success");
                    } else {
                        addToast("Failed to delete space", "error");
                    }
                } catch (e) {
                    console.error(e);
                    addToast("An error occurred during deletion", "error");
                }
            },
            onCancel: () => { }
        });
    }

    const handleEnterSpace = (id: string) => {
        navigate(`/lounge?spaceId=${id}`);
    };

    const handleEditSpace = (id: string) => {
        navigate(`/createSpace?spaceID=${id}`);
    };

    async function handleAddToCollection() {
        openModal({
            title: "Add to Collection",
            message: "Enter the unique Space ID of the world you want to add to your personal collection.",
            type: "prompt",
            placeholder: "e.g. cmj...",
            onConfirm: async (id) => {
                if (!id) return;
                const trimmedId = id.trim();

                try {
                    const res = await fetch("http://localhost:3000/api/v1/space/join", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ spaceID: trimmedId })
                    });

                    const data = await res.json();
                    if (res.ok) {
                        addToast("Space added to collection!", "success");
                        fetchAllSpaces();
                        setActiveTab("saved");
                    } else {
                        addToast(`Failed to add: ${data.message}`, "error");
                    }
                } catch (e) {
                    console.error(e);
                    addToast("Network error occurred", "error");
                }
            },
            onCancel: () => { }
        });
    }

    async function handleRemoveFromCollection(id: string) {
        openModal({
            title: "Remove from Collection",
            message: "Are you sure you want to remove this space from your collection?",
            type: "confirm",
            onConfirm: async () => {
                try {
                    const res = await fetch("http://localhost:3000/api/v1/space/join", {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            "authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ spaceID: id })
                    });

                    if (res.ok) {
                        addToast("Removed from collection", "success");
                        fetchAllSpaces();
                    } else {
                        addToast("Failed to remove space", "error");
                    }
                } catch (e) {
                    console.error(e);
                    addToast("An error occurred", "error");
                }
            },
            onCancel: () => { }
        });
    }

    const displayedSpaces = activeTab === "my" ? mySpaces : savedSpaces;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col text-black dark:text-gray-100 font-sans pt-16 transition-colors">
            <Navbar />

            <div className="flex-1 max-w-7xl w-full mx-auto p-8 flex flex-col gap-8">

                {/* Header & Actions */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">M</div>
                            <span className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">Meta Mesh Universe</span>
                        </div>
                        <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-500 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Manage your digital realms and curated collections.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleAddToCollection}
                            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-bold border border-gray-200 dark:border-gray-700 transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                            Add to Collection
                        </button>
                        <button
                            onClick={() => navigate("/joinSpace")}
                            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-bold border border-gray-200 dark:border-gray-700 transition-all transform hover:scale-105"
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
                <div className="flex border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setActiveTab("my")}
                        className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === "my"
                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        My Spaces ({mySpaces.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("saved")}
                        className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === "saved"
                            ? "border-purple-500 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
                    <div className="text-center py-24 bg-gray-50/50 dark:bg-gray-900/40 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 transition-all">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 012 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">
                            {activeTab === "my"
                                ? "Your multiverse is currently empty."
                                : "Your collection is waiting to be filled."}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Create or join a space to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedSpaces.map((space) => (
                            <div key={space.spaceID} className="bg-white dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden hover:border-blue-500/50 dark:hover:border-blue-500/30 transition-all hover:shadow-[0_20px_50px_rgba(59,130,246,0.1)] group flex flex-col h-full">
                                <div className="h-48 relative overflow-hidden">
                                    {/* Thumbnail */}
                                    <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800">
                                        {space.thumbnail ? (
                                            <img src={space.thumbnail} alt={space.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-br ${activeTab === "my" ? "from-blue-600/20 to-indigo-600/20" : "from-purple-600/20 to-pink-600/20"}`}></div>
                                        )}
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                                    {/* Dimensions Badge */}
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold text-white border border-white/10 tracking-widest uppercase">
                                        {space.dimensions}
                                    </div>

                                    {/* Ownership Badge */}
                                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black border border-gray-200 dark:border-white/10 flex items-center gap-2 tracking-widest uppercase">
                                        {activeTab === "my" ? (
                                            <span className="text-blue-600 dark:text-blue-400">OWNER</span>
                                        ) : (
                                            <span className="text-purple-600 dark:text-purple-400">SAVED</span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 transition-colors">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">{space.name}</h2>
                                    <p className="text-xs text-gray-500 font-mono mb-6 truncate select-all">ID: {space.spaceID}</p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleEnterSpace(space.spaceID)}
                                            className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition-colors border border-gray-200 dark:border-white/5"
                                        >
                                            Enter
                                        </button>

                                        {activeTab === "my" ? (
                                            <>
                                                <button
                                                    onClick={() => handleEditSpace(space.spaceID)}
                                                    className="flex-1 bg-blue-50 dark:bg-blue-600/10 hover:bg-blue-100 dark:hover:bg-blue-600/20 text-blue-700 dark:text-blue-400 py-2 rounded-lg font-medium transition-colors border border-blue-200 dark:border-blue-500/10"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSpace(space.spaceID)}
                                                    className="px-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors border border-red-200 dark:border-red-500/10"
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
                    <div className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-800 transition-colors">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Arena</h2>
                            <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-bold border border-purple-500/20">ADMIN ONLY</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div
                                onClick={() => navigate("/arenaMap")}
                                className="bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800/80 cursor-pointer transition-all hover:border-purple-500/50 group"
                            >
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 009 3.618C9 2.5 9 7 9 7"></path></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-200">Map Creator</h3>
                                <p className="text-sm text-gray-500 mt-2">Design base templates for users to clone.</p>
                            </div>

                            <div
                                onClick={() => navigate("/createElement")}
                                className="bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800/80 cursor-pointer transition-all hover:border-green-500/50 group"
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