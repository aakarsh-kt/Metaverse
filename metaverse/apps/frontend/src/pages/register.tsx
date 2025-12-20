import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { fetchAvatars, type Avatar } from "../lib/avatars";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  interface RadioOption {
    value: string;
    label: string;
  }

  const options: RadioOption[] = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
  ];

  const [selectedValue, setSelectedValue] = useState<string>('user');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatarID, setSelectedAvatarID] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
        if (mounted) setError("Failed to load avatars. Run db seed:avatars and refresh.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        username,
        password,
        type: selectedValue
      };

      const res = await fetch(`http://localhost:3000/api/v1/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const response = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(response?.message ?? "Signup failed");
        setLoading(false);
        return;
      }

      // If user picked an avatar, attach it to the user via metadata.
      if (selectedAvatarID && selectedValue !== "admin") {
        const signIn = await fetch(`http://localhost:3000/api/v1/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const signInJson = await signIn.json().catch(() => ({}));
        if (signIn.ok && signInJson?.token) {
          await fetch(`http://localhost:3000/api/v1/user/metadata`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${signInJson.token}`,
            },
            body: JSON.stringify({ avatarID: selectedAvatarID }),
          });
        }
      }

      navigate("/login");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white selection:bg-blue-500/30 transition-colors">
      <Navbar />

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 dark:bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 dark:bg-purple-600/20 blur-[120px]" />
      </div>

      <main className="relative pt-32 pb-12 px-6 flex items-center justify-center">
        <div className="w-full max-w-xl">
          {/* Glassmorphism Card */}
          <div className="bg-gray-50/50 dark:bg-white/5 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">
                Create Account
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Join Meta Mesh and experience the metaverse</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter username"
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 ml-1">Select Role</label>
                <div className="flex gap-4">
                  {options.map((option) => (
                    <label
                      key={option.value}
                      className={`flex-1 flex items-center justify-center p-4 rounded-xl border transition-all cursor-pointer ${selectedValue === option.value
                          ? "bg-blue-600/20 border-blue-500 text-blue-600 dark:text-white shadow-lg shadow-blue-500/10"
                          : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                        }`}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        value={option.value}
                        checked={selectedValue === option.value}
                        onChange={(e) => setSelectedValue(e.target.value)}
                      />
                      <span className="font-semibold">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedValue === "user" && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Pick an Avatar</label>
                  {avatars.length === 0 ? (
                    <div className="text-xs text-gray-500 bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 text-center">
                      No avatars found. Ask admin to seed avatars.
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
                      {avatars.map((a) => (
                        <button
                          key={a.avatarID}
                          type="button"
                          onClick={() => setSelectedAvatarID(a.avatarID)}
                          className={`group relative aspect-square rounded-xl border overflow-hidden transition-all ${selectedAvatarID === a.avatarID
                              ? "border-blue-500 ring-2 ring-blue-500/50 bg-blue-500/10"
                              : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/30"
                            }`}
                          title={a.name}
                        >
                          <img
                            src={a.imageUrl}
                            alt={a.name}
                            className={`w-full h-full object-cover transition-transform group-hover:scale-110 ${selectedAvatarID === a.avatarID ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-500 text-sm py-3 px-4 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg shadow-blue-500/20 mt-4 active:scale-[0.98]"
              >
                {loading ? "Creating Account..." : "Register"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
