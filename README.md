# Faizz AI Chatbot

A modern AI chatbot powered by Google's Gemini API. This application provides a user-friendly interface for interacting with AI and storing conversation history.

## Features

- 🤖 AI-powered chat using Gemini API  
- 🔒 User authentication (sign up/login)  
- 💬 Chat history storage  
- 🎙️ Voice input support  
- 📱 Responsive design for all devices  
- 🌙 Modern dark theme UI  

## Tech Stack

- **Next.js** (React framework)  
- **Tailwind CSS** (Styling)  
- **MongoDB** (Database)  
- **Next Auth** (Authentication)  
- **Framer Motion** (Animations)  
- **Google's Generative AI SDK**

## Getting Started

### Prerequisites

- Node.js (v14 or later)  
- MongoDB (local instance or MongoDB Atlas)

### Installation

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd faizz-ai-chatbot
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env.local` file in the root directory with the following variables:

    ```env
    MONGODB_URI=mongodb://localhost:27017/faizz-ai-chatbot
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your-secret-key
    GEMINI_API_KEY=your-gemini-api-key
    ```

4. Start the development server:

    ```bash
    npm run dev
    ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Register for a new account or log in with existing credentials  
2. Start chatting with the AI  
3. Use the voice input feature by clicking the microphone icon  
4. Access your chat history from the sidebar  
5. Create new chats with the "New Chat" button

## License

This project is licensed under the **MIT License** – see the LICENSE file for details.

---

**Project:** `Faizzz-AI`
