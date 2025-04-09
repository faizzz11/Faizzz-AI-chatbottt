import { Inter } from 'next/font/google';
import './globals.css';
import { ChatProvider } from './context/ChatContext';
import AuthProvider from './context/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Faizz AI Chatbot',
  description: 'A modern AI chatbot powered by Gemini API',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 