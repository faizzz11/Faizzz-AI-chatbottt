'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children }) {
  const { status } = useSession();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Check sidebar state
  useEffect(() => {
    const checkSidebarState = () => {
      const storedState = localStorage.getItem('sidebarCollapsed');
      setIsSidebarCollapsed(storedState === 'true');
    };
    
    // Check on initial load
    checkSidebarState();
    
    // Listen for changes in localStorage
    const handleStorageChange = () => checkSidebarState();
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-200">
        <div className="space-y-4 text-center">
          <div className="inline-block h-10 w-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
          <p className="text-primary-100">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-dark-300">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {children}
      </div>
    </div>
  );
} 