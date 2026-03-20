import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import { Layout } from './components/layout/Layout';
import ToastContainer from './components/ui/Toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Weddings from './pages/Weddings';
import WeddingDetail from './pages/WeddingDetail';
import Tasks from './pages/Tasks';
import Vendors from './pages/Vendors';
import Budget from './pages/Budget';
import Profile from './pages/Profile';
import Hotels from './pages/Hotels';
import Templates from './pages/Templates';
import Footer from "./components/layout/Footer";
import TopNav from "./components/layout/TopNav";

// Initialize auth state from localStorage on app mount
function AuthInit() {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);
  return null;
}

function PrivateRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) return null;
  if (!user) return <Navigate to="/landing" replace />;

  return children;
}

function PublicRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthInit />
      <ToastContainer />
      <TopNav />
      <Routes>
        {/* Public routes */}
        <Route path="/landing" element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />

        {/* Protected routes */}
        <Route element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/weddings" element={<Weddings />} />
          <Route path="/weddings/:id" element={<WeddingDetail />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
