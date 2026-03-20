import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { Sidebar } from './Sidebar';

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="animate-spin h-8 w-8 border-2 border-stone-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] relative">
      {/* Dark background patch behind the sidebar's top rounded corner so it blends with hero headers */}
      <div className="hidden lg:block fixed top-14 left-0 w-60 h-20 bg-stone-900 z-20" />
      <Sidebar />
      <main className="lg:ml-60 min-h-[calc(100vh-56px)]">
        <Outlet />
      </main>
    </div>
  );
}
