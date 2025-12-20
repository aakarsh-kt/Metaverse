import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "../stores/useAuthStore";

const Landing = () => {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        if (token !== undefined && token !== null) {
            navigate('/space');
        }
    }, [token, navigate]);

    const features = [
        {
            title: "Spatial Atmosphere",
            description: "Experience presence like never before with high-fidelity spatial interactions.",
            icon: "🌐"
        },
        {
            title: "Custom Avatars",
            description: "Express your digital identity with a wide range of customizable avatars.",
            icon: "🎭"
        },
        {
            title: "Real-time Collaboration",
            description: "Connect your workplace seamlessly with friends and colleagues across the globe.",
            icon: "⚡"
        },
        {
            title: "Persistent Spaces",
            description: "Create and join unique digital environments that stay active 24/7.",
            icon: "🏢"
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white selection:bg-blue-500/30 overflow-x-hidden transition-colors">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 dark:bg-blue-600/20 blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 dark:bg-purple-600/20 blur-[120px]" />
                </div>

                <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 text-center lg:text-left">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6">
                            Your Workspace, <br />
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-500 bg-clip-text text-transparent">
                                Reimagined.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-700 dark:text-gray-400 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                            Meta Mesh is the next-generation metaverse platform where collaboration meets immersion.
                            Connect, work, and hangout in a persistent digital world designed for the future.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <button
                                onClick={() => navigate("/register")}
                                className="w-full sm:w-auto px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-xl shadow-black/10 dark:shadow-white/10 active:scale-95"
                            >
                                Get Started for Free
                            </button>
                            <button
                                onClick={() => navigate("/login")}
                                className="w-full sm:w-auto px-8 py-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-full font-bold text-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-2xl">
                        <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-[0_0_50px_-12px_rgba(59,130,246,0.15)] dark:shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] bg-gray-50 dark:bg-slate-900 group">
                            {/* Gradients and mesh */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.1),transparent)] dark:bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.15),transparent)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.1),transparent)] dark:bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.15),transparent)]" />

                            {/* Floating tech elements */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-full h-full p-8 flex flex-col justify-between">
                                    {/* Mock UI elements */}
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <div className="h-2 w-24 bg-blue-600/10 dark:bg-blue-500/20 rounded-full" />
                                            <div className="h-2 w-16 bg-gray-200 dark:bg-white/10 rounded-full" />
                                        </div>
                                        <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10" />
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <div className="text-6xl font-black italic tracking-tighter text-black dark:text-white opacity-10 dark:opacity-20 select-none group-hover:opacity-20 dark:group-hover:opacity-40 transition-opacity duration-700">
                                            META MESH
                                        </div>
                                        <div className="mt-4 flex gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-600/10 dark:bg-blue-500/20 border border-blue-600/20 dark:border-blue-500/30 animate-pulse" />
                                            <div className="h-10 w-10 rounded-full bg-purple-600/10 dark:bg-purple-500/20 border border-purple-600/20 dark:border-purple-500/30 animate-pulse [animation-delay:200ms]" />
                                            <div className="h-10 w-10 rounded-full bg-indigo-600/10 dark:bg-indigo-500/20 border border-indigo-600/20 dark:border-indigo-500/30 animate-pulse [animation-delay:400ms]" />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <div className="h-12 w-32 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-600/20 dark:to-indigo-600/20 border border-gray-200 dark:border-white/10 backdrop-blur-md" />
                                    </div>
                                </div>
                            </div>

                            {/* Scanline effect */}
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(0,0,0,0.02),rgba(0,0,0,0.01),rgba(0,0,0,0.02))] dark:bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%]" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative py-24 px-6 bg-gray-50 dark:bg-white/[0.02] transition-colors">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Built for a New Era</h2>
                        <p className="text-gray-700 dark:text-gray-400 text-lg">Powerful features to enhance your digital presence.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-8 rounded-3xl hover:bg-gray-50 dark:hover:bg-white/10 hover:border-blue-500/30 transition-all group cursor-default shadow-sm dark:shadow-none"
                            >
                                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-700 dark:text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Footer Section */}
            <section className="relative py-24 px-6 text-center">
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-600/10 dark:to-purple-600/10 border border-gray-200 dark:border-white/10 p-12 md:p-20 rounded-[3rem] shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.05),transparent)] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.15),transparent)]" />
                    <h2 className="relative text-3xl md:text-5xl font-bold mb-6">
                        Ready to step into the <br />
                        <span className="text-blue-600 dark:text-blue-400">future?</span>
                    </h2>
                    <p className="relative text-gray-700 dark:text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                        Join thousands of users who are already redefining how they collaborate in the metaverse.
                    </p>
                    <button
                        onClick={() => navigate("/register")}
                        className="relative px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-xl transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        Create Your Space Now
                    </button>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="py-12 px-6 border-t border-gray-100 dark:border-white/5 text-center text-gray-500 text-sm transition-colors">
                <p>&copy; 2025 Meta Mesh. All rights reserved.</p>
            </footer>
        </div>
    );
};


export default Landing;