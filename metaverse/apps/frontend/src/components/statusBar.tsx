import { useState, useRef, useEffect } from "react";

const StatusBar = () => {
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [speakerOn, setSpeakerOn] = useState(true);
    const [lock, setLock] = useState(false);

    // Status State
    const [status, setStatus] = useState<"Online" | "Away" | "Busy" | "In a Call">("Online");
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const statusMenuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
                setShowStatusMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleButtonClass = (isActive: boolean, isDisabled: boolean = false) =>
        `p-3 rounded-full transition-all duration-200 ease-in-out border-2 ${isDisabled
            ? "bg-gray-800/50 border-gray-700/50 text-gray-500 cursor-not-allowed opacity-50"
            : isActive
                ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-white shadow-lg"
                : "bg-red-500 border-red-600 hover:bg-red-600 text-white shadow-red-500/50 shadow-lg"
        }`;

    const handleMicToggle = () => { if (!lock) setMicOn(!micOn); };
    const handleCameraToggle = () => { if (!lock) setCameraOn(!cameraOn); };
    const handleSpeakerToggle = () => { if (!lock) setSpeakerOn(!speakerOn); };

    const getStatusColor = (s: string) => {
        switch (s) {
            case "Online": return "bg-green-500";
            case "Away": return "bg-yellow-500";
            case "Busy": return "bg-red-500";
            case "In a Call": return "bg-purple-500";
            default: return "bg-gray-400";
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            {/* Status Dropdown Menu */}
            {showStatusMenu && (
                <div
                    ref={statusMenuRef}
                    className="absolute bottom-full left-0 mb-4 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-xl shadow-2xl p-2 min-w-[160px] animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                    {["Online", "Away", "Busy", "In a Call"].map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatus(s as any); setShowStatusMenu(false); }}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(s)}`}></span>
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-4 px-8 py-4 bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl">

                {/* Status Button */}
                <button
                    className="flex items-center gap-2 p-3 pr-4 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-all text-white mr-2"
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    title="Change Status"
                >
                    <div className="relative">
                        <div className="w-6 h-6 rounded-full bg-gray-600 overflow-hidden">
                            {/* Placeholder Avatar */}
                            <svg className="w-full h-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-800 ${getStatusColor(status)}`}></span>
                    </div>
                    <span className="text-sm font-medium">{status}</span>
                </button>

                {/* Microphone Toggle */}
                <button
                    className={toggleButtonClass(micOn, lock)}
                    onClick={handleMicToggle}
                    disabled={lock}
                    title={lock ? "Locked" : (micOn ? "Mute Microphone" : "Unmute Microphone")}
                >
                    <img
                        src={micOn ? "/assets/mic.svg" : "/assets/mic-off.svg"}
                        alt="Mic"
                        className={`w-6 h-6 invert ${lock ? "opacity-50" : ""}`}
                    />
                </button>

                {/* Camera Toggle */}
                <button
                    className={toggleButtonClass(cameraOn, lock)}
                    onClick={handleCameraToggle}
                    disabled={lock}
                    title={lock ? "Locked" : (cameraOn ? "Turn Camera Off" : "Turn Camera On")}
                >
                    <img
                        src={cameraOn ? "/assets/camera.svg" : "/assets/camera-off.svg"}
                        alt="Camera"
                        className={`w-6 h-6 invert ${lock ? "opacity-50" : ""}`}
                    />
                </button>

                {/* Speaker Toggle */}
                <button
                    className={toggleButtonClass(speakerOn, lock)}
                    onClick={handleSpeakerToggle}
                    disabled={lock}
                    title={lock ? "Locked" : (speakerOn ? "Disable Audio" : "Enable Audio")}
                >
                    <img
                        src={speakerOn ? "/assets/speaker.svg" : "/assets/speaker-off.svg"}
                        alt="Speaker"
                        className={`w-6 h-6 invert ${lock ? "opacity-50" : ""}`}
                    />
                </button>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-700 mx-2"></div>

                {/* Lock Setting */}
                <button
                    className={`p-3 rounded-full transition-all duration-200 border-2 ${lock
                            ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                            : "bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                        }`}
                    onClick={() => setLock(!lock)}
                    title={lock ? "Unlock Settings" : "Lock Settings"}
                >
                    <img
                        src={lock ? "/assets/lock.svg" : "/assets/unlock.svg"}
                        alt="Lock"
                        className={`w-6 h-6 ${lock ? "" : "invert"}`}
                    />
                </button>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-700 mx-2"></div>

                {/* Leave Button */}
                <button
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-900/20"
                    title="Leave Space"
                    onClick={() => window.location.href = '/space'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Leave
                </button>
            </div>
        </div>
    );
};

export default StatusBar;