import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  userID: string | null;
  role: string | null;
  setToken: (token: string) => void;
  setUserID: (userID: string) => void;
  setRole: (role: string) => void;
  clearUserID: () => void;
  clearToken: () => void;
  clearRole: () => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userID: null,
      role: null,
      setToken: (token) => set({ token }),
      setUserID: (userID) => set({ userID }),
      setRole: (role) => set({ role }),
      clearToken: () => set({ token: null }),
      clearUserID: () => set({ userID: null }),
      clearRole: () => set({ role: null }),
      logout: () => set({ token: null, userID: null, role: null }),
    }),
    {
      name: "auth-storage", // Key for localStorage
    }
  )
);

export default useAuthStore;
