import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import {
  LayoutDashboard,
  BookOpen,
  Baby,
  Calendar,
  Video,
  FileText,
  Newspaper,
  Users,
  Languages,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  section?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Lexicon', path: '/admin/lexicon', icon: <BookOpen className="w-5 h-5" />, section: 'Content' },
  { label: 'Baby Names', path: '/admin/baby-names', icon: <Baby className="w-5 h-5" />, section: 'Content' },
  { label: 'Daily Words', path: '/admin/daily-words', icon: <Calendar className="w-5 h-5" />, section: 'Content' },
  { label: 'Videos', path: '/admin/videos', icon: <Video className="w-5 h-5" />, section: 'Content' },
  { label: 'Blog', path: '/admin/blog', icon: <FileText className="w-5 h-5" />, section: 'Content' },
  { label: 'News', path: '/admin/news', icon: <Newspaper className="w-5 h-5" />, section: 'Content' },
  { label: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" />, section: 'System' },
  { label: 'Translations', path: '/admin/translations', icon: <Languages className="w-5 h-5" />, section: 'System' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const exitAdminMode = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderNavItems = () => {
    let currentSection = '';
    return navItems.map((item, index) => {
      const showSection = item.section && item.section !== currentSection;
      if (item.section) {
        currentSection = item.section;
      }

      const isActive = location.pathname === item.path;

      return (
        <div key={item.path}>
          {showSection && (
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">
              {item.section}
            </div>
          )}
          <Link
            to={item.path + '?node=raton-noir-189843'}
            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-background border border-border shadow-md"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-background border-r border-border transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 border-2 border-foreground flex items-center justify-center">
                <span className="text-xs">सं</span>
              </div>
              <span className="text-lg font-semibold">Admin Panel</span>
            </div>
            <p className="text-xs text-muted-foreground">संस्कृत रोज़</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {renderNavItems()}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            {user && (
              <div className="flex items-center space-x-3 mb-3 px-3 py-2">
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={exitAdminMode}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-md transition-colors mb-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Admin Mode</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-background border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4 lg:ml-0 ml-12">
              <h1 className="text-2xl font-bold">
                {navItems.find(item => item.path === location.pathname)?.label || 'Admin'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
