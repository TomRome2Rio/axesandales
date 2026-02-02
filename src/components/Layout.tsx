import React, { useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop classes
  const navItemClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeNavItemClasses = "bg-amber-600 text-white";
  const inactiveNavItemClasses = "text-neutral-300 hover:bg-neutral-700 hover:text-white";

  // Mobile classes
  const mobileNavItemClasses = "block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors";
  const mobileActiveClasses = "bg-amber-900/50 text-white border-l-4 border-amber-500";
  const mobileInactiveClasses = "text-neutral-300 hover:bg-neutral-700 hover:text-white";

  const handleMobileNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

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
              
              {/* Desktop Menu */}
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
            
            {/* Desktop Login */}
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
            
            {/* Mobile Hamburger Button */}
            <div className="-mr-2 flex md:hidden">
                 <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="bg-neutral-800 inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-white"
                  >
                    <span className="sr-only">Open main menu</span>
                    {/* Icon when menu is closed */}
                    {!isMobileMenuOpen ? (
                      <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    ) : (
                      /* Icon when menu is open */
                      <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-neutral-700 bg-neutral-800 animate-fade-in">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => handleMobileNavigate('home')} className={`${currentPage === 'home' ? mobileActiveClasses : mobileInactiveClasses} ${mobileNavItemClasses}`}>
                Dashboard
              </button>
              <button onClick={() => handleMobileNavigate('stats')} className={`${currentPage === 'stats' ? mobileActiveClasses : mobileInactiveClasses} ${mobileNavItemClasses}`}>
                Club Stats
              </button>
              {user?.isAdmin && (
                  <button onClick={() => handleMobileNavigate('admin')} className={`${currentPage === 'admin' ? mobileActiveClasses : mobileInactiveClasses} ${mobileNavItemClasses}`}>
                    Admin Panel
                  </button>
              )}
              {user && !user.isAdmin && (
                  <button onClick={() => handleMobileNavigate('profile')} className={`${currentPage === 'profile' ? mobileActiveClasses : mobileInactiveClasses} ${mobileNavItemClasses}`}>
                    My Profile
                  </button>
              )}
            </div>
            <div className="pt-4 pb-4 border-t border-neutral-700">
              {user ? (
                <div className="px-5">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none text-white">{user.name}</div>
                      <div className="text-sm font-medium leading-none text-neutral-400 mt-1">{user.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    <button
                      onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-white hover:bg-neutral-700"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5">
                    <button 
                        onClick={() => { onLogin(); setIsMobileMenuOpen(false); }}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-base font-medium text-center"
                    >
                        Member Login
                    </button>
                </div>
              )}
            </div>
          </div>
        )}
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
