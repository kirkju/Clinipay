import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 bg-background-alt p-6 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
