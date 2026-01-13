import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import useAuthStore from "../stores/useAuthStore";
import useToastStore from "../stores/useToastStore";
import { fetchAvatars, type Avatar } from "../lib/avatars";

const Profile = () => {
    const token = useAuthStore((s) => s.token);

    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [selectedAvatarID, setSelectedAvatarID] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const list = await fetchAvatars();
                if (!mounted) return;
                setAvatars(list);
                if (list[0]?.avatarID) setSelectedAvatarID(list[0].avatarID);
            } catch (e) {
                console.error(e);
                if (mounted) addToast("Failed to load avatars.", "error");
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!token) return;
        let mounted = true;
        (async () => {
            try {
                const res = await fetch("http://localhost:3000/api/v1/user/metadata", {
                    method: "GET",
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                });
                if (!res.ok) return;
                const j = await res.json();
                if (!mounted) return;
                if (typeof j?.username === "string") setUsername(j.username);
                if (typeof j?.avatarID === "string") setSelectedAvatarID(j.avatarID);
            } catch (e) {
                console.error(e);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [token]);

    async function saveAvatar() {
        if (!token) {
            addToast("Please login first.", "warning");
            return;
        }
        if (!selectedAvatarID) return;

        setSaving(true);

        try {
            const res = await fetch("http://localhost:3000/api/v1/user/metadata", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ avatarID: selectedAvatarID }),
            });

            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                addToast(j?.message ?? "Failed to update avatar", "error");
                return;
            }

            addToast("Avatar updated!", "success");
        } catch (e) {
            console.error(e);
            addToast("Network error", "error");
        } finally {
            setSaving(false);
        }
    }

    async function saveUsername() {
        if (!token) {
            addToast("Please login first.", "warning");
            return;
        }
        const trimmed = username.trim();
        if (trimmed.length < 3) {
            addToast("Username must be at least 3 characters.", "warning");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch("http://localhost:3000/api/v1/user/metadata", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ username: trimmed }),
            });

            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                addToast(j?.message ?? "Failed to update username", "error");
                return;
            }

            addToast("Username updated!", "success");
        } catch (e) {
            console.error(e);
            addToast("Network error", "error");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col text-black dark:text-gray-100 font-sans pt-16 transition-colors">
            <Navbar showBack />

            <div className="flex-1 max-w-3xl w-full mx-auto p-8">
                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Profile</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">Pick an avatar. This will be used for your user metadata.</p>

                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-colors">
                    <div className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">Username</div>
                    <div className="flex gap-3 items-center">
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Set your username"
                            className="flex-1 bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={saveUsername}
                            disabled={saving || !token}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-5 py-2 rounded-xl font-bold"
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>

                    <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-6 transition-colors">
                        <div className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">Avatars</div>
                        {avatars.length === 0 ? (
                            <div className="text-gray-400 text-sm">No avatars available.</div>
                        ) : (
                            <div className="grid grid-cols-5 gap-3">
                                {avatars.map((a) => (
                                    <button
                                        key={a.avatarID}
                                        type="button"
                                        onClick={() => setSelectedAvatarID(a.avatarID)}
                                        className={`rounded-xl border p-2 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors ${selectedAvatarID === a.avatarID ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200 dark:border-gray-700"
                                            }`}
                                        title={a.name}
                                    >
                                        <img src={a.imageUrl} alt={a.name} className="w-full h-auto" />
                                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 truncate">{a.name}</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={saveAvatar}
                                disabled={saving || !token}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-5 py-2 rounded-xl font-bold"
                            >
                                {saving ? "Saving..." : "Save avatar"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
