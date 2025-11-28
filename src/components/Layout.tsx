import React from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogin, onLogout, currentPage, onNavigate }) => {
  const navItemClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeNavItemClasses = "bg-amber-600 text-white";
  const inactiveNavItemClasses = "text-neutral-300 hover:bg-neutral-700 hover:text-white";

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-200">
      <nav className="bg-neutral-800/80 backdrop-blur-lg border-b border-neutral-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-amber-500">Axes & Ales</span>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <button onClick={() => onNavigate('home')} className={`${currentPage === 'home' ? activeNavItemClasses : inactiveNavItemClasses} ${navItemClasses}`}>
                    Dashboard
                  </button>
                  <button onClick={() => onNavigate('stats')} className={`${currentPage === 'stats' ? activeNavItemClasses : inactiveNavItemClasses} ${navItemClasses}`}>
                    Club Stats
                  </button>
                  {user?.isAdmin && (
                     <button onClick={() => onNavigate('admin')} className={`${currentPage === 'admin' ? activeNavItemClasses : inactiveNavItemClasses} ${navItemClasses}`}>
                        Admin Panel
                    </button>
                  )}
                  {user && !user.isAdmin && (
                     <button onClick={() => onNavigate('profile')} className={`${currentPage === 'profile' ? activeNavItemClasses : inactiveNavItemClasses} ${navItemClasses}`}>
                        My Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              {user ? (
                <div className="flex items-center gap-4">
                    <span className="text-neutral-300 text-sm">Welcome, <span className="font-bold">{user.name}</span></span>
                    <button 
                        onClick={onLogout}
                        className="bg-red-800/50 hover:bg-red-800/80 text-red-200 px-3 py-2 rounded-md text-sm font-medium border border-red-700/50 transition-colors"
                    >
                        Logout
                    </button>
                </div>
              ) : (
                <button 
                    onClick={onLogin}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                    Member Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};