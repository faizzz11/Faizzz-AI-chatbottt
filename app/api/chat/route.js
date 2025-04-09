import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import connectToDatabase from '../../lib/db';
import Chat from '../../models/Chat';
import { generateResponse } from '../../lib/gemini';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { chatId, message, isNewChat, customMessages } = await request.json();
    
    await connectToDatabase();

    let chat;

    if (isNewChat) {
      // Create a new chat
      chat = new Chat({
        userId: session.user.id,
        title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
        messages: [{ role: 'user', content: message }],
      });
    } else {
      // Get existing chat
      chat = await Chat.findOne({ _id: chatId, userId: session.user.id });
      
      if (!chat) {
        return new Response(JSON.stringify({ error: 'Chat not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // If customMessages is provided (for edit functionality), replace the messages array
      if (customMessages) {
        chat.messages = customMessages;
      }
      
      // Add user message to chat
      chat.messages.push({ role: 'user', content: message });
    }

    // Save the user message
    await chat.save();

    // Generate response from Gemini API
    const aiResponse = await generateResponse(chat.messages);

    // Add AI response to chat
    chat.messages.push({ role: 'assistant', content: aiResponse });
    await chat.save();

    return new Response(JSON.stringify({ 
      message: aiResponse, 
      chatId: chat._id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await connectToDatabase();

    // Get all chats for the user
    const chats = await Chat.find({ userId: session.user.id }).sort({ updatedAt: -1 });

    return new Response(JSON.stringify({ chats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get chats API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 