import { create } from "zustand";
import api from "@/lib/api";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    tenant_id: number;
}

interface AuthState {
    user: User | null;
    tenant: any | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: any) => Promise<User>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    switchTenant: (tenant: any) => void;
}

export const useAuth = create<AuthState>((set) => ({
    user: null,
    tenant: null,
    token: localStorage.getItem("auth_token"),
    isAuthenticated: !!localStorage.getItem("auth_token"),
    isLoading: true,

    login: async (credentials) => {
        set({ isLoading: true });
        try {
            const response = await api.post("/login", credentials);
            const { user, token, tenant } = response.data;

            localStorage.setItem("auth_token", token);
            localStorage.setItem("tenant_slug", tenant.slug);

            set({
                user,
                token,
                tenant,
                isAuthenticated: true,
                isLoading: false,
            });
            return user;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        try {
            await api.post("/logout");
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("tenant_slug");
            set({
                user: null,
                token: null,
                tenant: null,
                isAuthenticated: false,
            });
        }
    },

    checkAuth: async () => {
        if (!localStorage.getItem("auth_token")) {
            set({ isLoading: false });
            return;
        }

        try {
            const response = await api.get("/user");
            const { user, tenant } = response.data;
            set({ user, tenant, isAuthenticated: true, isLoading: false });
        } catch (error) {
            localStorage.removeItem("auth_token");
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
    },
    switchTenant: (tenant) => {
        localStorage.setItem("tenant_slug", tenant.slug);
        set({ tenant });
        // Optional: refresh page to ensure all data is re-fetched for the new tenant
        window.location.reload();
    },
}));
