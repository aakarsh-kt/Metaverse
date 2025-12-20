import { useCallback, useEffect, useState } from "react";
import useAuthStore from "../stores/useAuthStore";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";

interface MapTemplate {
    mapID: string;
    name: string;
    width: number;
    height: number;
    thumbnail: string;
}

const ArenaSpace = () => {
    const token = useAuthStore((state) => state.token);
    const [maps, setMaps] = useState<MapTemplate[]>([]);
    const [, setLoading] = useState(true);
    const navigate = useNavigate();

    // Creation State
    const [selectedMap, setSelectedMap] = useState<MapTemplate | null>(null);
    const [spaceName, setSpaceName] = useState("");
    const [isCustom, setIsCustom] = useState(false);
    const [customWidth, setCustomWidth] = useState(20);
    const [customHeight, setCustomHeight] = useState(20);

    const getMaps = useCallback(async () => {
        try {
            const res = await fetch("http://localhost:3000/api/v1/user/maps", {
                method: "GET",
                headers: { "authorization": `Bearer ${token}` }
            }).then(res => res.json());
            setMaps(res.mapIDs || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        getMaps();
    }, [getMaps]);

    async function handleCreate() {
        if (!spaceName) return alert("Please name your space");

        const payload = isCustom
            ? { name: spaceName, dimensions: `${customWidth}x${customHeight}` }
            : { name: spaceName, dimensions: `${selectedMap?.width}x${selectedMap?.height}`, mapID: selectedMap?.mapID };

        try {
            const res = await fetch("http://localhost:3000/api/v1/space/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            }).then(res => res.json());

            if (res.spaceID) {
                navigate(`/createSpace?spaceID=${res.spaceID}`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to create space");
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-4">
                        Choose Your Universe
                    </h1>
                    <p className="text-xl text-gray-400">Select a template or start from scratch.</p>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Create Custom Card */}
                    <div
                        onClick={() => { setSelectedMap(null); setIsCustom(true); setSpaceName(""); }}
                        className={`
                            group relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer h-80 flex flex-col items-center justify-center gap-4 bg-gray-900/50 backdrop-blur-sm
                            ${isCustom ? "border-blue-500 ring-4 ring-blue-500/20" : "border-gray-800 hover:border-gray-600 hover:bg-gray-800"}
                        `}
                    >
                        <div className="p-4 rounded-full bg-gray-800 group-hover:bg-blue-600/20 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-blue-400"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-200">Empty Void</h3>
                        <p className="text-gray-500">Start with a blank canvas</p>
                    </div>

                    {/* Map Templates */}
                    {maps.map((map) => (
                        <div
                            key={map.mapID}
                            onClick={() => { setSelectedMap(map); setIsCustom(false); setSpaceName(map.name + " Instance"); }}
                            className={`
                                group relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer h-80
                                ${selectedMap?.mapID === map.mapID ? "border-blue-500 ring-4 ring-blue-500/20" : "border-gray-800 hover:border-gray-600"}
                            `}
                        >
                            {/* Image/Thumbnail */}
                            <div className="absolute inset-0">
                                <img src={map.thumbnail || "/assets/map-placeholder.png"} alt={map.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent"></div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <h3 className="text-2xl font-bold text-white mb-1">{map.name}</h3>
                                <p className="text-gray-400 text-sm flex items-center gap-2">
                                    <span className="bg-gray-800 px-2 py-0.5 rounded text-xs">{map.width}x{map.height}</span>
                                    <span>Grid Size</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Creation Modal (Bottom Sheet similar) */}
            {(selectedMap || isCustom) && (
                <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-6 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300">
                    <div className="max-w-4xl mx-auto flex items-end gap-6">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Space Name</label>
                            <input
                                type="text"
                                value={spaceName}
                                onChange={(e) => setSpaceName(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                placeholder="Name your new space..."
                                autoFocus
                            />
                        </div>

                        {isCustom && (
                            <div className="flex gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Width</label>
                                    <input type="number" value={customWidth} onChange={(e) => setCustomWidth(parseInt(e.target.value))} className="w-24 bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Height</label>
                                    <input type="number" value={customHeight} onChange={(e) => setCustomHeight(parseInt(e.target.value))} className="w-24 bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleCreate}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all mb-[1px]"
                        >
                            Launch Space
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArenaSpace;