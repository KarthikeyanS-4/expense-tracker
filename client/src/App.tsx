import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"
import { ProtectedRoute } from "./components/ui/ProtectedRoutes"; // Adjust path if needed
import LandingPage from "./pages/LandingPage"; // Adjust path if needed
import { AuthProvider } from "./context/AuthContext"; // Adjust path if needed
import AuthPage from "./pages/AuthPage"; // Placeholder for your signup component
import Dashboard from "./pages/DashboardPage"; // Example authenticated page

const App: React.FC = () => {
  return (

    <Router>
    <AuthProvider> {/* Wrap your app with AuthProvider to provide auth context */}
      {/* You can add a navigation bar or any other components here */}
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        {/* Example of a protected route, uncomment and implement ProtectedRoute component */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
      </ThemeProvider>
    </AuthProvider>
    </Router>
  );
};

export default App;
