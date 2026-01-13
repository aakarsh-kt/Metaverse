import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import useAuthStore from "../stores/useAuthStore";
import useToastStore from "../stores/useToastStore";
import useModalStore from "../stores/useModalStore";

interface MapBlueprint {
    mapID: string;
    name: string;
    thumbnail: string;
    width: number;
    height: number;
}

const AdminMaps = () => {
    const navigate = useNavigate();
    const [maps, setMaps] = useState<MapBlueprint[]>([]);
    const [loading, setLoading] = useState(true);
    const token = useAuthStore(state => state.token);
    const addToast = useToastStore(state => state.addToast);
    const openModal = useModalStore(state => state.openModal);

    const fetchMaps = async () => {
        try {
            const res = await fetch("http://localhost:3000/api/v1/admin/maps", {
                headers: { "authorization": `Bearer ${token}` }
            }).then(r => r.json());
            setMaps(res.maps || []);
        } catch (e) {
            addToast("Failed to load blueprints", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaps();
    }, [token]);

    const handleDelete = async (id: string) => {
        openModal({
            title: "Discard Blueprint?",
            message: "This map template will be removed from the library forever. Existing spaces created from this template will remain unaffected.",
            type: "confirm",
            onConfirm: async () => {
                try {
                    const res = await fetch(`http://localhost:3000/api/v1/admin/map/${id}`, {
                        method: "DELETE",
                        headers: { "authorization": `Bearer ${token}` }
                    });
                    if (res.ok) {
                        addToast("Blueprint discarded", "success");
                        setMaps(prev => prev.filter(m => m.mapID !== id));
                    }
                } catch (e) {
                    addToast("Discard failed", "error");
                }
            },
            onCancel: () => { }
        });
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans pt-16">
            <Navbar showBack backUrl="/admin" />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-white">Map Library</h1>
                        <p className="text-gray-400 mt-2">Manage universal blueprints and templates.</p>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {maps.map((m) => (
                            <div key={m.mapID} className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden group hover:border-indigo-500/50 transition-all shadow-xl">
                                <div className="h-48 relative overflow-hidden">
                                    <img src={m.thumbnail || "/assets/map-placeholder.png"} alt={m.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                                    <div className="absolute bottom-4 left-6">
                                        <h3 className="text-2xl font-bold">{m.name}</h3>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">{m.width}x{m.height} Gird Units</p>
                                    </div>
                                </div>
                                <div className="p-6 flex gap-3">
                                    <button
                                        onClick={() => handleDelete(m.mapID)}
                                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-2xl text-sm font-bold transition-colors border border-red-500/20"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-2xl text-sm font-bold transition-colors border border-gray-700"
                                        onClick={() => navigate(`/arenaMap?edit=${m.mapID}`)}
                                    >
                                        Edit Blueprint
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminMaps;
