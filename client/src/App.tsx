import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { ProtectedRoute } from "./components/ui/ProtectedRoutes"; // Adjust path if needed
import LandingPage from "./pages/LandingPage"; // Adjust path if needed
// import LoginPage from "./pages/LoginPage"; // Placeholder for your login component
import AuthPage from "./pages/AuthPage"; // Placeholder for your signup component
// import Dashboard from "./pages/Dashboard"; // Example authenticated page

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        {/* Example of a protected route, uncomment and implement ProtectedRoute component */}
        {/* <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> */}
      </Routes>
    </Router>
  );
};

export default App;
