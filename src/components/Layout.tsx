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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Scale className="h-8 w-8 text-indigo-600 mr-3" />
          <span className="text-xl font-bold text-gray-900">Lexi AI</span>
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
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <item.icon
                  className={clsx(
                    isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500',
                    'flex-shrink-0 -ml-1 mr-3 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              {user?.photoURL ? (
                <img className="h-8 w-8 rounded-full" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-medium text-sm">
                    {user?.email?.[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-gray-700 truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
