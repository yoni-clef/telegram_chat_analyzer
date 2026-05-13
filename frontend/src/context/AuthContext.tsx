import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../services/api";

interface AuthContextValue {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  const value = useMemo(
    () => ({
      token,
      login: (nextToken: string) => {
        localStorage.setItem("token", nextToken);
        setToken(nextToken);
        api.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
      },
      logout: () => {
        localStorage.removeItem("token");
        setToken(null);
        delete api.defaults.headers.common.Authorization;
      }
    }),
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("AuthContext missing");
  }
  return context;
}
