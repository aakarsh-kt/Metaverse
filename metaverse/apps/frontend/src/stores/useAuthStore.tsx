import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  userID:string | null;
  setToken: (token: string) => void;
  setUserID: (userID: string) => void;
  clearUserID: () => void;
  clearToken: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
      userID:null,
      setUserID: (userID) => set({ userID }),
      clearUserID: () => set({ userID: null }),
    }),
    {
      name: "auth-storage", // Key for localStorage
    }
  )
);

export default useAuthStore;
