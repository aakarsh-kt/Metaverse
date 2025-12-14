import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import useAuthStore from "../stores/useAuthStore";

const SESSION_STORAGE_KEY = import.meta.env.REACT_APP_SESSION_STORAGE_KEY || "currentMapId";

interface MapElement {
    elementID: string;
    x: number;
    y: number;
    imageUrl: string;
}

interface GameObject {
    id: string;
    imageUrl: string; // The URL for the asset image
    width: number;
    height: number;
    static: boolean;
}

const ArenaMap = () => {
    const token = useAuthStore((state) => state.token);
    const [objects, setObjects] = useState<GameObject[]>([]);

    // Map State
    const [name, setName] = useState("");
    const [width, setWidth] = useState(20);
    const [height, setHeight] = useState(15);
    const [mapID, setMapID] = useState(
        sessionStorage.getItem(SESSION_STORAGE_KEY) || ""
    );

    // Draft Mode State
    const [isDraft, setIsDraft] = useState(false);

    const [selectedItem, setSelectedItem] = useState<GameObject | null>(null);
    const [mapElements, setMapElements] = useState<MapElement[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        sessionStorage.setItem(SESSION_STORAGE_KEY, mapID);
    }, [mapID]);

    useEffect(() => {
        getObjects();
    }, []);

    useEffect(() => {
        if (mapID && !isDraft) {
            getMapElements();
            getDimensions();
        }
    }, [mapID]);

    async function getObjects() {
        try {
            const res = await fetch("http://localhost:3000/api/v1/space/element/all", {
                method: "GET",
                headers: { "authorization": `Bearer ${token}` }
            }).then(res => res.json());
            setObjects(res.elements || []);
        } catch (e) {
            console.error("Failed to fetch objects", e);
        }
    }

    async function getMapElements() {
        try {
            const res = await fetch("http://localhost:3000/api/v1/admin/map/getElement", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ mapID })
            }).then(res => res.json());
            setMapElements(res.elements || []);
        } catch (e) {
            console.error(e);
        }
    }

    async function getDimensions() {
        try {
            const res = await fetch(`http://localhost:3000/api/v1/admin/map?mapID=${mapID}`, {
                method: "GET",
                headers: { "authorization": `Bearer ${token}` }
            }).then(res => res.json());
            if (res.width) setWidth(res.width);
            if (res.height) setHeight(res.height);
        } catch (e) {
            console.error(e);
        }
    }

    function initDraft() {
        if (!name) return alert("Please enter a map name");
        setIsDraft(true);
        // We set mapID to a temporary dummy string effectively acting as "created" for the UI flows
        setMapID("DRAFT-MODE");
        setMapElements([]); // Start empty
    }

    async function saveMap() {
        if (!isDraft) return;
        setLoading(true);

        try {
            const response = await fetch("http://localhost:3000/api/v1/admin/map", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    dimensions: `${width}x${height}`,
                    thumbnail: "https://placehold.co/600x400/1a1a1a/ffffff?text=Map+Preview", // Use a valid URL placeholder
                    defaultElements: mapElements.map(e => ({
                        elementID: e.elementID,
                        x: e.x,
                        y: e.y
                    }))
                })
            });

            const res = await response.json();

            if (response.ok && res.mapID) {
                setMapID(res.mapID);
                setIsDraft(false); // No longer draft
                alert("Map saved successfully!");
            } else {
                console.error("Map creation failed:", res);
                alert(`Failed to create map: ${res.message || "Unknown error"} \n${res.error ? JSON.stringify(res.error) : ""}`);
            }
        } catch (e) {
            console.error(e);
            alert("Error creating map: Network or Server Error");
        } finally {
            setLoading(false);
        }
    }

    // Handles adding elements EITHER to local state (draft) OR backend (live)
    async function handleAddElement(x: number, y: number, item: GameObject | null = selectedItem) {
        if (!item) return;

        if (isDraft) {
            // Add to local state
            const newElement: MapElement = {
                elementID: item.id,
                x,
                y,
                imageUrl: item.imageUrl
            };
            setMapElements(prev => [...prev, newElement]);
        } else {
            // Live Mode: Send to Backend
            if (!mapID) return;
            try {
                const res = await fetch("http://localhost:3000/api/v1/admin/map/element", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        mapID: mapID,
                        elementID: item.id,
                        x: x,
                        y: y
                    })
                });
                if (res.ok) {
                    getMapElements();
                } else {
                    console.error("Failed to add element");
                }
            } catch (e) {
                console.error(e);
            }
        }
    }

    // Use local state deletion for draft, API for live
    async function handleDeleteElement(x: number, y: number) {
        if (isDraft) {
            setMapElements(prev => prev.filter(e => !(e.x === x && e.y === y)));
        } else {
            // Need an API endpoint to delete element from map if desired, but for now user only asked for creation flow
            // If API supports deletion by coords or ID, we'd use it here.
            // Current code in arenaMap didn't have delete, but createSpace did. 
            // We'll leave it simple for now or just alert.
            console.log("Deletion in live map not fully implemented in UI yet");
        }
    }


    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, item: GameObject) => {
        e.dataTransfer.setData("application/json", JSON.stringify(item));
        setSelectedItem(item);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, x: number, y: number) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("application/json");
        if (data) {
            const item = JSON.parse(data) as GameObject;
            handleAddElement(x, y, item);
        }
    };


    return (
        <div className="h-screen w-screen bg-gray-950 flex flex-col overflow-hidden text-gray-100 font-sans pt-16">
            <Navbar />

            <div className="flex-1 flex overflow-hidden">

                {/* Main Workspace (Left) */}
                <div className="flex-1 relative flex bg-gray-950 relative overflow-hidden flex-col items-center justify-center">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    ></div>

                    {/* Creation Modal / Overlay */}
                    {!mapID && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
                            <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full space-y-6">
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                        Create New Map
                                    </h1>
                                    <p className="text-gray-400 mt-2">Define the dimensions of your new universe.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Map Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="e.g. Cyber City"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Width</label>
                                            <input
                                                type="number"
                                                value={width}
                                                onChange={(e) => setWidth(parseInt(e.target.value))}
                                                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Height</label>
                                            <input
                                                type="number"
                                                value={height}
                                                onChange={(e) => setHeight(parseInt(e.target.value))}
                                                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={initDraft}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25"
                                >
                                    Start Creating
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Grid Canvas */}
                    {mapID && (
                        <div className="w-full h-full overflow-auto p-12 flex items-center justify-center relative z-0 custom-scrollbar">
                            <div className="relative shadow-2xl border border-gray-800 rounded-lg overflow-hidden ring-1 ring-white/5 bg-gray-900/50 backdrop-blur-sm">
                                <div
                                    className="grid"
                                    style={{
                                        gridTemplateColumns: `repeat(${width}, 40px)`,
                                        gridTemplateRows: `repeat(${height}, 40px)`,
                                    }}
                                >
                                    {Array.from({ length: height * width }).map((_, i) => {
                                        const x = i % width;
                                        const y = Math.floor(i / width);
                                        const existingElement = mapElements.find(e => e.x === x && e.y === y);

                                        return (
                                            <div
                                                key={`${x}-${y}`}
                                                className={`
                                                    border border-white/[0.05] w-10 h-10 flex items-center justify-center relative group
                                                    ${existingElement ? "" : "hover:bg-blue-500/20 cursor-pointer"}
                                                `}
                                                onClick={() => {
                                                    if (existingElement) {
                                                        handleDeleteElement(x, y);
                                                    } else {
                                                        handleAddElement(x, y);
                                                    }
                                                }}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, x, y)}
                                            >
                                                {/* Render Element */}
                                                {existingElement && (
                                                    <div className="relative w-full h-full group/item">
                                                        <img
                                                            src={existingElement.imageUrl}
                                                            alt="placed-obj"
                                                            className="w-full h-full object-contain p-0.5 pointer-events-none select-none"
                                                        />
                                                    </div>
                                                )}

                                                {/* Ghost Preview (Click Mode) */}
                                                {!existingElement && selectedItem && (
                                                    <div className="absolute inset-0 hidden group-hover:flex items-center justify-center opacity-40 pointer-events-none">
                                                        <img src={selectedItem.imageUrl} className="w-full h-full object-contain filter grayscale" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Top Bar for Map Info */}
                    {mapID && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-md border border-gray-800 px-6 py-2 rounded-full flex items-center gap-4 shadow-lg z-20">
                            {isDraft ? (
                                <>
                                    <span className="text-yellow-400 font-bold text-sm tracking-wide">DRAFT MODE</span>
                                    <div className="h-4 w-px bg-gray-700"></div>
                                    <button
                                        onClick={saveMap}
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-all"
                                    >
                                        {loading ? "Saving..." : "Save & Publish"}
                                    </button>
                                </>
                            ) : (
                                <span className="text-green-400 font-bold text-sm tracking-wide">PUBLISHED</span>
                            )}

                            <div className="h-4 w-px bg-gray-700"></div>

                            <button
                                onClick={() => {
                                    if (isDraft && !confirm("Discard unsaved map?")) return;
                                    sessionStorage.removeItem(SESSION_STORAGE_KEY);
                                    setMapID("");
                                    setMapElements([]);
                                    setIsDraft(false);
                                }}
                                className="text-xs text-red-400 hover:text-red-300 font-medium"
                            >
                                Exit
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar - Objects (Right) */}
                {mapID && (
                    <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-20 shadow-2xl">
                        <div className="p-5 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Map Assets
                            </h2>
                            <p className="text-xs text-gray-500 mt-2">
                                Drag & Drop items onto the grid.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-900/30">
                            <div className="grid grid-cols-2 gap-3">
                                {objects.map((o) => (
                                    <div
                                        key={o.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, o)}
                                        className={`
                                            cursor-grab active:cursor-grabbing p-3 rounded-xl border transition-all group relative
                                            ${selectedItem?.id === o.id
                                                ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                                : "bg-gray-800/40 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600"}
                                        `}
                                        onClick={() => setSelectedItem(o)}
                                    >
                                        <div className="aspect-square flex items-center justify-center bg-gray-950/50 rounded-lg mb-3 p-2 group-hover:bg-gray-950 transition-colors">
                                            <img src={o.imageUrl} alt="asset" className="w-full h-full object-contain drop-shadow-md select-none" />
                                        </div>
                                        <div className="text-xs font-medium text-gray-300 text-center truncate">{o.width}x{o.height}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ArenaMap;