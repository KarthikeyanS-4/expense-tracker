// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextProps {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  authReady: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth-token");
    if (storedToken) setToken(storedToken);
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem("auth-token", token);
    else localStorage.removeItem("auth-token");
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        login: setToken,
        logout: () => setToken(null),
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
