import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderKanban, Calendar,
  FileSpreadsheet, BarChart3, Shield, Key, UserCog, LogOut, Menu, X,
  Bell, CalendarCheck, Scale,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import { launcherIcon } from '../assets';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissions: ['reports:read'] },
  { to: '/employees', label: 'Employees', icon: Users, permissions: ['employees:read'] },
  { to: '/projects', label: 'Projects', icon: FolderKanban, permissions: ['projects:read'] },
  { to: '/weeks', label: 'Weeks', icon: Calendar, permissions: ['weeks:read'] },
  { to: '/leaves', label: 'Leaves', icon: CalendarCheck, permissions: ['leaves:read', 'leaves:self'] },
  { to: '/leave-rules', label: 'Leave Rules', icon: Scale, permissions: ['leave_rules:read'] },
  { to: '/allocations', label: 'Allocations', icon: FileSpreadsheet, permissions: ['allocations:read'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, permissions: ['reports:read'] },
  { to: '/users', label: 'Users', icon: UserCog, permissions: ['users:read'] },
  { to: '/roles', label: 'Roles', icon: Shield, permissions: ['roles:read'] },
  { to: '/permissions', label: 'Permissions', icon: Key, permissions: ['permissions:read'] },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Layout() {
  const { user, logout, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter((item) => hasAnyPermission(...item.permissions));

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col h-screen
          transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
          shadow-lg lg:shadow-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand header with reusable logo */}
        <div className="px-6 h-20 flex items-center border-b border-gray-50">
          <BrandLogo size="sm" imageSrc={launcherIcon} />
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Callout Card */}
        <div className="p-4 border-t border-gray-50 mt-auto">
          <div className="bg-primary-50/40 rounded-2xl p-4 border border-primary-100/30 flex flex-col items-center text-center">
            <div className="relative w-16 h-12 mb-3 flex items-end justify-center gap-1.5">
              <div className="w-2.5 bg-primary-600/20 rounded-t-sm h-6"></div>
              <div className="w-2.5 bg-primary-600/50 rounded-t-sm h-9"></div>
              <div className="w-2.5 bg-primary-600 rounded-t-sm h-12"></div>
              <div className="absolute top-0 right-2 w-6 h-6 rounded-full border-2 border-primary-600/35 border-t-primary-600 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <p className="text-xs font-semibold text-gray-800 mb-2 leading-relaxed">
              Make smarter allocation decisions with real-time insights.
            </p>
            <NavLink
              to="/reports"
              className="text-xs font-bold text-primary-700 hover:text-primary-800 transition-colors inline-flex items-center gap-1"
            >
              View Reports <span className="text-sm">→</span>
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md">
          <button className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-500" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Dynamic Page Header */}
          <div className="hidden lg:block">
            {isDashboard ? (
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  {getGreeting()}, {user?.name || 'Admin'} <span className="animate-bounce">👋</span>
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">Here's what's happening with your team today.</p>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  {navItems.find(item => item.to === location.pathname)?.label || 'Resource Planning'}
                </h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 ml-auto lg:ml-0">
            {/* Notification bell */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
              <Bell className="w-[20px] h-[20px]" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[9px] text-white font-bold rounded-full flex items-center justify-center scale-90 border border-white">
                3
              </span>
            </button>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center shadow-sm font-bold border-2 border-primary-50">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block text-left leading-none">
                <p className="text-xs font-bold text-gray-900 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5 leading-none">{user?.role}</p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2.5 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 pb-6 lg:px-8 lg:pb-8 overflow-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
