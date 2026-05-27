import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Users,
  GraduationCap,
  Award,
  ChevronLeft,
  Video,
  Layers,
  Calendar,
  MessageCircle,
  Megaphone,
  Store
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem: string;
  onItemClick: (item: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  roles: ('student' | 'faculty' | 'admin')[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['student', 'faculty', 'admin'] },
  { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" />, roles: ['student', 'faculty', 'admin'] },
  { id: 'live-classes', label: 'Live Classes', icon: <Video className="w-5 h-5" />, roles: ['student', 'faculty', 'admin'] },
  { id: 'assignments', label: 'Assignments', icon: <ClipboardList className="w-5 h-5" />, roles: ['student', 'faculty', 'admin'] },
  { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-5 h-5" />, roles: ['student', 'faculty', 'admin'] },
  { id: 'batches', label: 'Batches', icon: <Layers className="w-5 h-5" />, roles: ['faculty', 'admin'] },
  { id: 'students', label: 'Students', icon: <Users className="w-5 h-5" />, roles: ['faculty', 'admin'] },
  { id: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" />, roles: ['student', 'admin'] },
  { id: 'reminders', label: 'Reminders', icon: <Bell className="w-5 h-5" />, roles: ['student', 'admin'] },
  { id: 'certificates', label: 'Certificates', icon: <Award className="w-5 h-5" />, roles: ['student'] },
  { id: 'community', label: 'Community', icon: <MessageCircle className="w-5 h-5" />, roles: ['student', 'faculty', 'admin'] },
  { id: 'announcements', label: 'Announcements', icon: <Megaphone className="w-5 h-5" />, roles: ['student', 'faculty', 'admin'] },
  { id: 'marketplace', label: 'Marketplace', icon: <Store className="w-5 h-5" />, roles: ['student', 'faculty', 'admin'] },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" />, roles: ['student', 'faculty', 'admin'] },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, roles: ['student', 'faculty', 'admin'] },
];

export default function Sidebar({ isOpen, onClose, activeItem, onItemClick }: SidebarProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const filteredItems = navItems.filter(item =>
    profile?.role && item.roles.includes(profile.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                EduPro
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onItemClick(item.id);
                  onClose();
                  // Navigate to the corresponding path
                  const pathMap: Record<string, string> = {
                    'dashboard': '/dashboard',
                    'courses': '/courses',
                    'live-classes': '/live-classes',
                    'assignments': '/assignments',
                    'attendance': '/attendance',
                    'batches': '/batches',
                    'students': '/students',
                    'payments': '/payments',
                    'reminders': '/reminders',
                    'certificates': '/certificates',
                    'community': '/community',
                    'announcements': '/announcements',
                    'marketplace': '/marketplace',
                    'notifications': '/notifications',
                    'settings': '/settings',
                  };
                  if (pathMap[item.id]) {
                    navigate(pathMap[item.id]);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeItem === item.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User profile & logout */}
          <div className="px-4 py-4 border-t border-gray-700/50">
            <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-gray-800/50">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
                <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
