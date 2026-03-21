import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Messenger from "./pages/Messenger";
import Friends from "./pages/Friends";
import Activity from "./pages/Activity";
import Marketplace from "./pages/Marketplace";
import PostView from "./pages/PostView";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner-circle" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner-circle" /></div>;
  return !user ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Navbar />
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <PrivateRoute>
              <Navbar />
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/messenger"
          element={
            <PrivateRoute>
              <Navbar />
              <Messenger />
            </PrivateRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <PrivateRoute>
              <Navbar />
              <Friends />
            </PrivateRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <PrivateRoute>
              <Navbar />
              <Activity />
            </PrivateRoute>
          }
        />
        <Route
          path="/post/:id"
          element={
            <PrivateRoute>
              <Navbar />
              <PostView />
            </PrivateRoute>
          }
        />
        <Route
          path="/marketplace"
          element={
            <PrivateRoute>
              <Navbar />
              <Marketplace />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
