'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useChat } from '../context/ChatContext';
import { Send, Mic, MicOff, Loader2, Copy, Check, Edit2, ClipboardCopy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechRecognition } from '../lib/speechRecognition';
import ReactMarkdown from 'react-markdown';

export default function ChatArea() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { currentChat, sendMessage, thinking } = useChat();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editedMessage, setEditedMessage] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const { isBrowserSupported, startRecording, stopRecording } = useSpeechRecognition();

  // Redirect if not authenticated
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat, thinking]);

  // Reset copied message indicator after 2 seconds
  useEffect(() => {
    if (copiedMessageIndex !== null) {
      const timer = setTimeout(() => {
        setCopiedMessageIndex(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [copiedMessageIndex]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!message.trim()) return;
    
    const messageToSend = message;
    setMessage('');
    
    try {
      await sendMessage(messageToSend, currentChat?._id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
      if (interimTranscript.trim()) {
        setMessage(prevMessage => prevMessage + ' ' + interimTranscript.trim());
      }
      setInterimTranscript('');
    } else {
      const success = startRecording(
        (finalTranscript, interim) => {
          if (finalTranscript) {
            setMessage(prevMessage => prevMessage + ' ' + finalTranscript);
          }
          if (interim) {
            setInterimTranscript(interim);
          }
        },
        () => {
          setIsRecording(false);
        }
      );
      
      if (success) {
        setIsRecording(true);
      }
    }
  };

  const handleCopyMessage = (index, content) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageIndex(index);
    });
  };

  const handleEditMessage = (index, content) => {
    setEditingMessageIndex(index);
    setEditedMessage(content);
  };

  const submitEditedMessage = async () => {
    if (!editedMessage.trim()) return;
    
    try {
      // Get the current messages
      if (!currentChat) return;
      
      // Find the index of the message being edited and its corresponding response
      const editedMsgIndex = editingMessageIndex;
      
      // A user message is typically followed by an assistant response
      // So we'll need to remove both the user message and the assistant's response
      
      // Create a new messages array without the edited message and its response
      let updatedMessages = [...currentChat.messages];
      
      // If this is the last message in the chat, just remove it
      if (editedMsgIndex === currentChat.messages.length - 1) {
        updatedMessages.pop();
      } 
      // If there's a following message and it's from the assistant, remove both
      else if (
        editedMsgIndex + 1 < currentChat.messages.length && 
        currentChat.messages[editedMsgIndex + 1].role === 'assistant'
      ) {
        // Remove both the user message and the assistant's response
        updatedMessages.splice(editedMsgIndex, 2);
      } 
      // Otherwise just remove the edited message
      else {
        updatedMessages.splice(editedMsgIndex, 1);
      }
      
      // Clear the editing state
      setEditingMessageIndex(null);
      setEditedMessage('');
      
      // Send the edited message to get a new response
      await sendMessage(editedMessage, currentChat._id, updatedMessages);
    } catch (error) {
      console.error('Error sending edited message:', error);
    }
  };

  // Function to format message content with Markdown and code blocks
  const formatMessageContent = (content) => {
    // Simple regex to detect code blocks - anything between ```
    const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }

      // Add code block
      const language = match[1] || '';
      const code = match[2] || '';
      parts.push({
        type: 'code',
        language,
        content: code
      });

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text after the last code block
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    // If no code blocks were found, return the content as is with markdown
    if (parts.length === 0) {
      return (
        <div className="markdown-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }

    // Otherwise, render the parts
    return (
      <div className="space-y-3">
        {parts.map((part, i) => {
          if (part.type === 'text') {
            return (
              <div key={i} className="markdown-content">
                <ReactMarkdown>{part.content}</ReactMarkdown>
              </div>
            );
          } else {
            return (
              <div key={i} className="relative group rounded-md overflow-hidden">
                <div className="flex items-center justify-between bg-gray-800 px-4 py-2 text-xs font-mono text-gray-400">
                  <span>{part.language || 'code'}</span>
                  <button 
                    className="p-1 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={() => navigator.clipboard.writeText(part.content)}
                    title="Copy code"
                  >
                    <ClipboardCopy size={14} />
                  </button>
                </div>
                <pre className="p-4 bg-gray-900 overflow-x-auto text-sm font-mono text-gray-300">
                  <code>{part.content}</code>
                </pre>
              </div>
            );
          }
        })}
      </div>
    );
  };

  // No need to add ml-16 or ml-64 here as it's now handled in the dashboard layout
  return (
    <div className="flex flex-col h-screen w-full">
      {/* Chat messages area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto"
      >
        {!currentChat ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-center p-8 rounded-lg bg-dark-200 max-w-md">
              <h2 className="text-2xl font-display font-bold mb-4 text-primary-400">Welcome to Faizz AI</h2>
              <p className="text-gray-300 mb-6">Ask me anything! I'm powered by the Gemini API and ready to assist you with information, creative content, or problem-solving.</p>
              <p className="text-gray-400 text-sm">Start by typing a message below or create a new chat.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {currentChat.messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {editingMessageIndex === index ? (
                    <div className="max-w-[80%] w-full">
                      <textarea
                        value={editedMessage}
                        onChange={(e) => setEditedMessage(e.target.value)}
                        className="w-full bg-dark-100 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingMessageIndex(null)}
                          className="px-3 py-1 bg-dark-300 text-white rounded-md hover:bg-dark-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={submitEditedMessage}
                          className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`relative max-w-[80%] rounded-lg p-3 group ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white rounded-tr-none'
                          : 'bg-dark-100 text-gray-100 rounded-tl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {formatMessageContent(msg.content)}
                      </div>
                      
                      {/* Action buttons */}
                      <div className={`absolute ${msg.role === 'user' ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full mr-2'} top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                        {msg.role === 'user' ? (
                          <button
                            onClick={() => handleEditMessage(index, msg.content)}
                            className="p-1.5 rounded-full bg-dark-200 text-primary-400 hover:bg-dark-300 hover:text-primary-300 transition-colors"
                            title="Edit message"
                          >
                            <Edit2 size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCopyMessage(index, msg.content)}
                            className="p-1.5 rounded-full bg-dark-200 text-primary-400 hover:bg-dark-300 hover:text-primary-300 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedMessageIndex === index ? (
                              <Check size={16} className="text-green-500" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* Bottom copy button for AI responses */}
                      {msg.role === 'assistant' && (
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => handleCopyMessage(index, msg.content)}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-dark-200 text-primary-400 hover:bg-dark-300 hover:text-primary-300 transition-colors"
                            title="Copy entire response"
                          >
                            {copiedMessageIndex === index ? (
                              <>
                                <Check size={14} className="text-green-500" />
                                <span className="text-green-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copy response</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {thinking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-start"
              >
                <div className="bg-dark-100 text-gray-100 rounded-lg rounded-tl-none p-4 max-w-[80%]">
                  <div className="flex items-center gap-1">
                    <span>Faizz is thinking</span>
                    <span className="thinking-dot h-2 w-2 bg-gray-400 rounded-full"></span>
                    <span className="thinking-dot h-2 w-2 bg-gray-400 rounded-full"></span>
                    <span className="thinking-dot h-2 w-2 bg-gray-400 rounded-full"></span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input area */}
      <div className="p-[18px] border-t border-gray-800 bg-dark-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full bg-dark-100 text-white rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {interimTranscript && (
              <div className="absolute bottom-full left-0 mb-2 p-2 bg-dark-100 rounded text-gray-300 text-sm max-w-full truncate">
                {interimTranscript}
              </div>
            )}
          </div>
          
          {isBrowserSupported && (
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`p-3 rounded-lg ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-dark-100 hover:bg-dark-300'
              } text-white transition-colors`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
          
          <button
            type="submit"
            disabled={!message.trim() || thinking}
            className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {thinking ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
} 