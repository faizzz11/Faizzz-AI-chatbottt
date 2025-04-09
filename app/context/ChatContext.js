'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { data: session } = useSession();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);

  // Fetch chats when session is available
  useEffect(() => {
    if (session) {
      fetchChats();
    }
  }, [session]);

  // Function to fetch all user chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat');
      const data = await response.json();
      if (data.chats) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch a specific chat
  const fetchChat = async (chatId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chat/${chatId}`);
      const data = await response.json();
      if (data.chat) {
        setCurrentChat(data.chat);
        return data.chat;
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to send a message
  const sendMessage = async (message, chatId = null, customMessages = null) => {
    try {
      setThinking(true);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          chatId,
          isNewChat: !chatId,
          customMessages: customMessages, // Send custom messages if provided (for edit functionality)
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh the chat list to show the new chat
        await fetchChats();
        
        // If it was a new chat, let's set the current chat
        if (!chatId && data.chatId) {
          await fetchChat(data.chatId);
        } else if (chatId) {
          // Update the current chat with the new message
          await fetchChat(chatId);
        }
        
        return data;
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setThinking(false);
    }
  };

  // Function to create a new chat
  const createNewChat = () => {
    setCurrentChat(null);
  };

  // Function to delete a chat
  const deleteChat = async (chatId) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove chat from local state
        setChats(chats.filter(chat => chat._id !== chatId));
        
        // If the current chat is deleted, set currentChat to null
        if (currentChat && currentChat._id === chatId) {
          setCurrentChat(null);
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const value = {
    chats,
    currentChat,
    loading,
    thinking,
    fetchChats,
    fetchChat,
    sendMessage,
    createNewChat,
    deleteChat,
    setCurrentChat,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 