import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Dashboard from "./pages/Dashboard";
import Bans from "./pages/Bans";
import Statistics from "./pages/Statistics";
import Profile from "./pages/Profile";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/bans" element={<Bans />} />
              <Route path="/statistics" element={<Statistics />} />

              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 page */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-dark-300">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-primary">404</h1>
                  <p className="text-xl text-gray-300 mt-4">Page Not Found</p>
                  <button onClick={() => (window.location.href = "/dashboard")} className="mt-6 px-4 py-2 bg-primary text-black rounded-md hover:bg-accent">
                    Return to Dashboard
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
