import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"
import { ProtectedRoute } from "./components/ProtectedRoutes";
import LandingPage from "./pages/LandingPage";
import { AuthProvider } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/DashboardPage";
import Expenses from "./pages/Expenses";
import Categories from "./pages/Categories";
import { Toaster } from "@/components/ui/sonner"

const App: React.FC = () => {
  return (

    <Router>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Toaster />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
