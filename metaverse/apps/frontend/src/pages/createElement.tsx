import { useState } from "react";
import useAuthStore from "../stores/useAuthStore";
// import { useNavigate } from "react-router-dom";

interface GameElementData {
    id: number;
    imageUrl: string;
    width: number;
    height: number;
    static: boolean;
}

const CreateElement = () => {
    // const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const [elements, setElements] = useState<GameElementData[]>([
        { id: Date.now(), imageUrl: "", width: 1, height: 1, static: true }
    ]);
    const [submitting, setSubmitting] = useState(false);

    const presetAssets = [
        { name: "Chair", url: "/assets/chair.svg" },
        { name: "Table", url: "/assets/table.svg" },
        { name: "Static Block", url: "/assets/static.svg" },
        { name: "Carpet", url: "/assets/carpet.jpg" },
        { name: "Bomb", url: "/assets/bomb.png" }
    ];

    const addCard = () => {
        setElements([
            ...elements,
            { id: Date.now(), imageUrl: "", width: 1, height: 1, static: true }
        ]);
    };

    const removeCard = (id: number) => {
        if (elements.length > 1) {
            setElements(elements.filter(e => e.id !== id));
        }
    };

    const updateElement = (id: number, field: keyof GameElementData, value: any) => {
        setElements(elements.map(e => {
            if (e.id === id) {
                return { ...e, [field]: value };
            }
            return e;
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Filter invalid entries (e.g. no URL)
            const validElements = elements.filter(e => e.imageUrl.trim() !== "");

            if (validElements.length === 0) {
                alert("Please add at least one element with a valid Image URL.");
                setSubmitting(false);
                return;
            }

            const promises = validElements.map(e =>
                fetch("http://localhost:3000/api/v1/admin/element", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        imageUrl: e.imageUrl,
                        width: Number(e.width),
                        height: Number(e.height),
                        static: e.static
                    })
                })
            );

            await Promise.all(promises);
            alert("Elements created successfully!");
            // Reset to one empty card
            setElements([{ id: Date.now(), imageUrl: "", width: 1, height: 1, static: true }]);
        } catch (error) {
            console.error("Failed to create elements", error);
            alert("Error creating elements. Check console.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 pt-24">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Create Game Elements
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Batch create assets for the universe.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={addCard}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl border border-gray-700 transition-all font-medium flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add New
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${submitting
                                ? "bg-blue-600/50 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/20"
                                }`}
                        >
                            {submitting ? "Saving..." : "Save All Elements"}
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {elements.map((element, index) => (
                        <div
                            key={element.id}
                            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 relative group hover:border-gray-700 transition-all shadow-xl"
                        >
                            {/* Remove Button */}
                            {elements.length > 1 && (
                                <button
                                    onClick={() => removeCard(element.id)}
                                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            )}

                            <div className="space-y-6">
                                {/* Preview Area */}
                                <div className="h-48 rounded-xl bg-gray-950/50 border border-gray-800 flex items-center justify-center relative overflow-hidden">
                                    {element.imageUrl ? (
                                        <img
                                            src={element.imageUrl}
                                            alt="Preview"
                                            className="max-h-32 object-contain shadow-lg"
                                            style={{
                                                width: element.width * 50, // Visualize relative size approx
                                                height: element.height * 50
                                            }}
                                        />
                                    ) : (
                                        <div className="text-gray-600 text-sm flex flex-col items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                            No Image Selected
                                        </div>
                                    )}

                                    {/* Grid Visualizer Background */}
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                                        style={{
                                            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                                            backgroundSize: '20px 20px'
                                        }}
                                    ></div>
                                </div>

                                {/* Asset Picker */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Select Asset</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {presetAssets.map(asset => (
                                            <button
                                                key={asset.name}
                                                onClick={() => updateElement(element.id, "imageUrl", asset.url)}
                                                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${element.imageUrl === asset.url
                                                    ? "bg-blue-600 border-blue-500 text-white"
                                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                                                    }`}
                                            >
                                                {asset.name}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={element.imageUrl}
                                            onChange={(e) => updateElement(element.id, "imageUrl", e.target.value)}
                                            placeholder="Or paste custom URL..."
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Properties Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Width (Grid)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={element.width}
                                            onChange={(e) => updateElement(element.id, "width", parseInt(e.target.value))}
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Height (Grid)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={element.height}
                                            onChange={(e) => updateElement(element.id, "height", parseInt(e.target.value))}
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Static Toggle */}
                                <div className="flex items-center justify-between bg-gray-950/50 border border-gray-800 rounded-xl p-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${element.static ? "bg-green-500/10 text-green-500" : "bg-gray-800 text-gray-500"}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-200">Static Object</div>
                                            <div className="text-xs text-gray-500">Collision enabled</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updateElement(element.id, "static", !element.static)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${element.static ? "bg-green-600" : "bg-gray-700"}`}
                                    >
                                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${element.static ? "translate-x-6" : "translate-x-0"}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CreateElement;
