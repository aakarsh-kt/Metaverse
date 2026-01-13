import { useState, useEffect } from "react";
import useModalStore from "../../stores/useModalStore";

const Modal = () => {
    const { isOpen, config, closeModal } = useModalStore();
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        if (isOpen) setInputValue("");
    }, [isOpen]);

    if (!isOpen || !config) return null;

    const handleConfirm = () => {
        config.onConfirm(config.type === 'prompt' ? inputValue : undefined);
        closeModal();
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => {
                    config.onCancel();
                    closeModal();
                }}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{config.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8">
                        {config.message}
                    </p>

                    {config.type === 'prompt' && (
                        <div className="mb-8">
                            <input
                                autoFocus
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={config.placeholder || "Enter value..."}
                                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl px-5 py-4 text-gray-900 dark:text-white outline-none transition-all font-medium"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirm();
                                    if (e.key === 'Escape') {
                                        config.onCancel();
                                        closeModal();
                                    }
                                }}
                            />
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                config.onCancel();
                                closeModal();
                            }}
                            className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white transition-all transform active:scale-95 ${config.title.toLowerCase().includes('delete')
                                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20'
                                    : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                                }`}
                        >
                            {config.type === 'confirm' ? 'Confirm' : 'Submit'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
