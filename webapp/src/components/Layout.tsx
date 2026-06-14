import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderKanban, Calendar,
  FileSpreadsheet, BarChart3, Shield, Key, UserCog, LogOut, Menu, X,
  Bell, CalendarCheck, Scale, ChevronDown, CalendarDays,
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
  { to: '/allocations', label: 'Allocations', icon: FileSpreadsheet, permissions: ['allocations:read'] },
  { to: '/users', label: 'Users', icon: UserCog, permissions: ['users:read'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, permissions: ['reports:read', 'reports:payroll'] },
];

const reportSubItems = [
  { to: '/reports', label: 'Allocation Reports', permissions: ['reports:read'] },
  { to: '/reports/payroll', label: 'Leave Reports', permissions: ['reports:payroll'] },
];

const masterSetupItems = [
  { to: '/holidays', label: 'Holidays', permissions: ['holidays:read'] },
  { to: '/leave-rules', label: 'Leave Rules', permissions: ['leave_rules:read'] },
  { to: '/roles', label: 'Roles', permissions: ['roles:read'] },
  { to: '/permissions', label: 'Permissions', permissions: ['permissions:read'] },
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
  const visibleReportSubItems = reportSubItems.filter((item) => hasAnyPermission(...item.permissions));
  const hasVisibleReports = visibleReportSubItems.length > 0;
  const visibleMasterItems = masterSetupItems.filter((item) => hasAnyPermission(...item.permissions));
  const hasVisibleMasterSetups = visibleMasterItems.length > 0;

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  // Reports expand state
  const isOnReports = location.pathname.startsWith('/reports');
  const [reportsExpanded, setReportsExpanded] = useState(isOnReports);

  // Master Setups expand state
  const isOnMasterSetup = ['/holidays', '/leave-rules', '/roles', '/permissions'].some(p => location.pathname.startsWith(p));
  const [masterExpanded, setMasterExpanded] = useState(isOnMasterSetup);

  // Auto-expand
  useEffect(() => {
    if (isOnReports) setReportsExpanded(true);
  }, [isOnReports]);

  useEffect(() => {
    if (isOnMasterSetup) setMasterExpanded(true);
  }, [isOnMasterSetup]);

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
          {visibleItems.map((item) => {
            // Special case: Reports is an expandable group with sub-items
            if (item.to === '/reports' && hasVisibleReports) {
              return (
                <div key={item.to}>
                  <button
                    onClick={() => { setReportsExpanded(!reportsExpanded); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isOnReports
                        ? 'bg-primary-50 text-primary-700 shadow-sm font-semibold'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-[18px] h-[18px]" />
                      <span>Reports</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${reportsExpanded ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${reportsExpanded ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-3 border-l-2 border-primary-100 pl-3 space-y-0.5">
                      {visibleReportSubItems.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `block px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                              isActive
                                ? 'bg-primary-50/80 text-primary-700 font-semibold'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            return (
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
            );
          })}

          {/* Master Setups Section */}
          {hasVisibleMasterSetups && (
            <div className="pt-4">
              <div className="px-4 pb-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Master Setups</p>
              </div>
              {visibleMasterItems.map((item) => (
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
                  {item.to === '/holidays' && <CalendarDays className="w-[18px] h-[18px]" />}
                  {item.to === '/leave-rules' && <Scale className="w-[18px] h-[18px]" />}
                  {item.to === '/roles' && <Shield className="w-[18px] h-[18px]" />}
                  {item.to === '/permissions' && <Key className="w-[18px] h-[18px]" />}
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
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
                  {location.pathname.startsWith('/reports')
                    ? 'Reports'
                    : navItems.find(item => item.to === location.pathname)?.label
                    || (location.pathname === '/holidays' ? 'Holidays'
                      : location.pathname === '/leave-rules' ? 'Leave Rules'
                      : location.pathname === '/roles' ? 'Roles'
                      : location.pathname === '/permissions' ? 'Permissions'
                      : 'Resource Planning')}
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
