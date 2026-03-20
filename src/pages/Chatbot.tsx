import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MessageSquare, Send, Loader2, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Initialize chat instance
  const aiRef = useRef(new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));
  const chatRef = useRef<any>(null);

  useEffect(() => {
    chatRef.current = aiRef.current.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: 'You are an expert legal advisor. Answer questions accurately, professionally, and provide strategic advice based on U.S. law. Always clarify that you are an AI and not a substitute for formal legal counsel.',
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatRef.current) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: response.text || '' }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'An error occurred. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const saveChat = async () => {
    if (!user || messages.length === 0) return;
    try {
      await addDoc(collection(db, 'chats'), {
        userId: user.uid,
        title: messages[0].text.substring(0, 50) + '...',
        messages: JSON.stringify(messages),
        createdAt: new Date().toISOString(),
      });
      alert('Chat saved successfully!');
    } catch (error) {
      console.error('Error saving chat:', error);
      alert('Failed to save chat.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <MessageSquare className="h-8 w-8 text-indigo-500 mr-3" />
            AI Legal Chatbot
          </h1>
          <p className="text-gray-400 mt-1">
            General legal chat assistant powered by Gemini Pro.
          </p>
        </div>
        <button
          onClick={saveChat}
          disabled={messages.length === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Chat
        </button>
      </div>

      <div className="flex-1 bg-gray-900 shadow-xl sm:rounded-xl overflow-hidden flex flex-col border border-gray-800">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <MessageSquare className="h-12 w-12 mb-4 text-gray-700" />
              <p>Start a conversation by typing your legal question below.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200 border border-gray-700'
                }`}>
                  {msg.role === 'user' ? (
                    <p>{msg.text}</p>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="text-gray-400 text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <form onSubmit={handleSend} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 block w-full border-gray-700 bg-gray-800 text-white rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 border"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
