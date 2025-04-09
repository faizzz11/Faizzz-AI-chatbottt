'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useChat } from '../context/ChatContext';
import { motion } from 'framer-motion';
import { PlusCircle, Trash2, LogOut, Menu, X, MessageSquare, User, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function Sidebar() {
  const { data: session } = useSession();
  const { chats, currentChat, createNewChat, deleteChat, setCurrentChat } = useChat();
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Store sidebar state in localStorage
  useEffect(() => {
    const storedState = localStorage.getItem('sidebarCollapsed');
    if (storedState !== null) {
      setIsSidebarCollapsed(storedState === 'true');
    }
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
    // Trigger storage event for other components to react
    window.dispatchEvent(new Event('storage'));
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery('');
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter chats based on search query
  const filteredChats = searchQuery.trim() === '' 
    ? chats 
    : chats.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-primary-600 text-white md:hidden"
        onClick={toggleMobileSidebar}
      >
        {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-dark-200 shadow-lg z-40 transition-all duration-300 ease-in-out
                   ${isSidebarCollapsed ? 'w-16' : 'w-64'}
                   ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Top section */}
          <div className="p-4 relative">
            <div className="flex items-center justify-between">
              <h1 className={`text-xl font-display font-bold text-white ${isSidebarCollapsed ? 'hidden' : 'block'}`}>Faizz AI</h1>
              {isSidebarCollapsed && (
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white mx-auto">
                  F
                </div>
              )}
              
              <div className="flex items-center absolute right-2 top-2">
                {/* Search button */}
                <button
                  className="p-1.5 rounded-full bg-primary-600 text-white hidden md:flex md:items-center md:justify-center mr-1"
                  onClick={toggleSearch}
                  title="Search chats"
                >
                  <Search size={16} />
                </button>
                
                {/* Sidebar toggle button */}
                <button
                  className="p-1.5 rounded-full bg-primary-600 text-white hidden md:flex md:items-center md:justify-center"
                  onClick={toggleSidebar}
                  title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
              </div>
            </div>
            
            {/* Search input */}
            {isSearchOpen && !isSidebarCollapsed && (
              <div className="mt-3 mb-2">
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full bg-dark-100 text-white rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
            
            <button
              onClick={createNewChat}
              className={`mt-4 w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-center gap-2'} py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition`}
            >
              <PlusCircle size={18} />
              {!isSidebarCollapsed && <span>New Chat</span>}
            </button>
          </div>
          
          {/* Chat list */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {filteredChats.map((chat) => (
                <div
                  key={chat._id}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition
                            ${currentChat?._id === chat._id ? 'bg-primary-700 text-white' : 'hover:bg-dark-100'}`}
                  onClick={() => {
                    setCurrentChat(chat);
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare size={16} />
                    {!isSidebarCollapsed && <span className="truncate">{chat.title}</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat._id);
                      }}
                      className="text-gray-400 hover:text-red-400 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* User info */}
          {session?.user && (
            <div className="p-4 border-t border-gray-700">
              {isSidebarCollapsed ? (
                <div 
                  className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white mx-auto cursor-pointer hover:bg-primary-600"
                  onClick={toggleUserMenu}
                >
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
              ) : (
                <button 
                  onClick={toggleUserMenu}
                  className="flex items-center justify-between w-full p-2 rounded-md hover:bg-dark-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium truncate text-white">{session.user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                    </div>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
              )}
              
              {isUserMenuOpen && (
                <div className={`${isSidebarCollapsed ? 'absolute bottom-16 left-0 w-48 ml-4' : 'mt-2'} bg-dark-100 rounded-md overflow-hidden shadow-lg z-50`}>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full p-3 text-sm text-white hover:bg-dark-300 transition"
                  >
                    <LogOut size={16} />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
    </>
  );
} 