import useToastStore, { ToastType } from "../../stores/useToastStore";

const Toast = () => {
    const { toasts, removeToast } = useToastStore();

    const getColors = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-green-500 text-white shadow-green-500/20';
            case 'error': return 'bg-red-500 text-white shadow-red-500/20';
            case 'warning': return 'bg-amber-500 text-white shadow-amber-500/20';
            default: return 'bg-blue-600 text-white shadow-blue-500/20';
        }
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>;
            case 'error': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;
            case 'warning': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>;
            default: return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[9000] flex flex-col gap-3">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`${getColors(toast.type)} px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-300 font-medium min-w-[300px] border border-white/10`}
                >
                    <div className="bg-white/20 p-1.5 rounded-lg">
                        {getIcon(toast.type)}
                    </div>
                    <span className="flex-1">{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="hover:scale-110 transition-transform opacity-60 hover:opacity-100"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Toast;
