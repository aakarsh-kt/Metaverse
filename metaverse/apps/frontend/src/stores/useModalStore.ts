import { create } from 'zustand';

interface ModalConfig {
    title: string;
    message: string;
    type: 'confirm' | 'prompt';
    placeholder?: string;
    onConfirm: (value?: string) => void;
    onCancel: () => void;
}

interface ModalState {
    isOpen: boolean;
    config: ModalConfig | null;
    openModal: (config: ModalConfig) => void;
    closeModal: () => void;
}

const useModalStore = create<ModalState>((set) => ({
    isOpen: false,
    config: null,
    openModal: (config) => set({ isOpen: true, config }),
    closeModal: () => set({ isOpen: false, config: null }),
}));

export default useModalStore;
