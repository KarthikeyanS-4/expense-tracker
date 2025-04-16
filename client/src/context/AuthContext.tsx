// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextProps {
  id: string | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string, id: string) => void;
  logout: () => void;
  authReady: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [id, setId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth-token");
    const storedId = localStorage.getItem("u_id");
    if (storedToken) setToken(storedToken);
    if (storedId) setId(storedId);
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem("auth-token", token);
    else localStorage.removeItem("auth-token");
  }, [token]);

  useEffect(() => {
    if (id) localStorage.setItem("u_id", id);
    else localStorage.removeItem("u_id");
  }, [id]);

  const login = (token: string, id: string) => {
    setToken(token);
    setId(id);
  };

  const logout = () => {
    setToken(null);
    setId(null);
    localStorage.removeItem("auth-token");
    localStorage.removeItem("u_id");
  };

  return (
    <AuthContext.Provider
      value={{
        id,
        isAuthenticated: !!token,
        token,
        login,
        logout,
        authReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
