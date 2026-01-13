import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "Elements Management",
            description: "View, edit, and delete game elements like chairs, tables, and blocks.",
            path: "/admin/elements",
            icon: "🪑"
        },
        {
            title: "Map Blueprints",
            description: "Manage universal templates and default map designs.",
            path: "/admin/maps",
            icon: "🗺️"
        },
        {
            title: "Create Element",
            description: "Add new individual assets to the system.",
            path: "/createElement",
            icon: "➕"
        },
        {
            title: "Create Map",
            description: "Design and save new map blueprints.",
            path: "/arenaMap",
            icon: "🏗️"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans pt-16">
            <Navbar showBack backUrl="/space" />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <header className="mb-12">
                    <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        Nexus Admin Control
                    </h1>
                    <p className="text-gray-400 mt-2">Manage the building blocks of the metaverse.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sections.map((s) => (
                        <div
                            key={s.path}
                            onClick={() => navigate(s.path)}
                            className="bg-gray-900 border border-gray-800 p-8 rounded-3xl hover:bg-gray-800 hover:border-blue-500/50 transition-all cursor-pointer group shadow-xl"
                        >
                            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">
                                {s.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                {s.description}
                            </p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
