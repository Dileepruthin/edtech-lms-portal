import { Menu, Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        {/* Left side - Menu button & Search */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses, assignments..."
              className="w-80 bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Right side - Notifications & Profile */}
        <div className="flex items-center gap-3">
          <button className="relative text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-cyan-500 rounded-full border-2 border-gray-900"></span>
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-gray-700">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {profile?.full_name?.charAt(0) || <User className="w-5 h-5" />}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white">{profile?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
