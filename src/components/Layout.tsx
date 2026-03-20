import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Scale, 
  Search, 
  Mic, 
  Image as ImageIcon, 
  MapPin, 
  Zap, 
  FileText, 
  MessageSquare,
  Brain,
  Users,
  Target,
  LogOut
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Scale },
  { name: 'Legal Research', href: '/research', icon: Search },
  { name: 'Master Doc Analyzer', href: '/master-analyzer', icon: Users },
  { name: 'Case Strategy', href: '/case-strategy', icon: Target },
  { name: 'Deep Analysis', href: '/deep', icon: Brain },
  { name: 'Voice Consultation', href: '/voice', icon: Mic },
  { name: 'Evidence Analyzer', href: '/analyze', icon: ImageIcon },
  { name: 'Local Resources', href: '/local', icon: MapPin },
  { name: 'Quick Q&A', href: '/quick', icon: Zap },
  { name: 'Document Drafter', href: '/draft', icon: FileText },
  { name: 'AI Chatbot', href: '/chat', icon: MessageSquare },
];

export function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-950 flex text-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shadow-xl z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Scale className="h-8 w-8 text-indigo-500 mr-3" />
          <span className="text-xl font-bold text-white tracking-tight">NeroLegal AI</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent',
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200'
                )}
              >
                <item.icon
                  className={clsx(
                    isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300',
                    'flex-shrink-0 -ml-1 mr-3 h-5 w-5 transition-colors'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              {user?.photoURL ? (
                <img className="h-9 w-9 rounded-full ring-2 ring-gray-800" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-indigo-900 flex items-center justify-center ring-2 ring-gray-800">
                  <span className="text-indigo-300 font-medium text-sm">
                    {user?.email?.[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-700 shadow-sm text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white transition-all duration-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <main className="flex-1 overflow-y-auto p-8 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
