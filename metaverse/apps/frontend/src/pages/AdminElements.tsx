import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import useAuthStore from "../stores/useAuthStore";
import useToastStore from "../stores/useToastStore";
import useModalStore from "../stores/useModalStore";

interface Element {
    elementID: string;
    imageUrl: string;
    width: number;
    height: number;
    static: boolean;
}

const AdminElements = () => {
    const [elements, setElements] = useState<Element[]>([]);
    const [loading, setLoading] = useState(true);
    const token = useAuthStore(state => state.token);
    const addToast = useToastStore(state => state.addToast);
    const openModal = useModalStore(state => state.openModal);

    const [editingID, setEditingID] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Element>>({});

    const fetchElements = async () => {
        try {
            const res = await fetch("http://localhost:3000/api/v1/admin/elements", {
                headers: { "authorization": `Bearer ${token}` }
            }).then(r => r.json());
            setElements(res.elements || []);
        } catch (e) {
            addToast("Failed to load elements", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchElements();
    }, [token]);

    const handleDelete = async (id: string) => {
        openModal({
            title: "Delete Element?",
            message: "Deleting this element will remove it from all maps and spaces permanently.",
            type: "confirm",
            onConfirm: async () => {
                try {
                    const res = await fetch(`http://localhost:3000/api/v1/admin/element/${id}`, {
                        method: "DELETE",
                        headers: { "authorization": `Bearer ${token}` }
                    });
                    if (res.ok) {
                        addToast("Element purged from existence", "success");
                        setElements(prev => prev.filter(e => e.elementID !== id));
                    }
                } catch (e) {
                    addToast("Purge failed", "error");
                }
            },
            onCancel: () => { }
        });
    };

    const handleSaveEdit = async () => {
        if (!editingID) return;
        try {
            const res = await fetch(`http://localhost:3000/api/v1/admin/element/${editingID}`, {
                method: "PUT",
                headers: {
                    "authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                addToast("Element enhanced!", "success");
                setElements(prev => prev.map(e => e.elementID === editingID ? { ...e, ...editForm } : e));
                setEditingID(null);
            }
        } catch (e) {
            addToast("Mutation failed", "error");
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans pt-16">
            <Navbar showBack backUrl="/admin" />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-white">Elements Inventory</h1>
                        <p className="text-gray-400 mt-2">Manage all interactive objects in the metaverse.</p>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {elements.map((e) => (
                            <div key={e.elementID} className={`bg-gray-900 border ${editingID === e.elementID ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-800"} rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all shadow-xl`}>
                                <div className="h-40 bg-gray-950 flex items-center justify-center p-6 relative">
                                    <img src={e.imageUrl} alt="Element" className="max-h-full max-w-full object-contain" />
                                    <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase text-gray-400 border border-gray-800">
                                        {e.width}x{e.height}
                                    </div>
                                </div>
                                <div className="p-6">
                                    {editingID === e.elementID ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Image URL</label>
                                                <input
                                                    type="text"
                                                    value={editForm.imageUrl}
                                                    onChange={ev => setEditForm({ ...editForm, imageUrl: ev.target.value })}
                                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">W</label>
                                                    <input
                                                        type="number"
                                                        value={editForm.width}
                                                        onChange={ev => setEditForm({ ...editForm, width: parseInt(ev.target.value) })}
                                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">H</label>
                                                    <input
                                                        type="number"
                                                        value={editForm.height}
                                                        onChange={ev => setEditForm({ ...editForm, height: parseInt(ev.target.value) })}
                                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 py-1">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.static}
                                                    onChange={ev => setEditForm({ ...editForm, static: ev.target.checked })}
                                                    id={`static-${e.elementID}`}
                                                />
                                                <label htmlFor={`static-${e.elementID}`} className="text-xs font-bold text-gray-400">Static Object</label>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-blue-500/20"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingID(null)}
                                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-xl text-xs font-bold transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${e.static ? "bg-green-500" : "bg-blue-500"}`} />
                                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-tighter">
                                                        {e.static ? "Static (Collidable)" : "Dynamic"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDelete(e.elementID)}
                                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-xl text-xs font-bold transition-colors border border-red-500/20"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-xl text-xs font-bold transition-colors border border-gray-700"
                                                    onClick={() => {
                                                        setEditingID(e.elementID);
                                                        setEditForm(e);
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminElements;
