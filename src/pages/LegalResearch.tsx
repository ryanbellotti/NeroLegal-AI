import React, { useState } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Search, Loader2, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function LegalResearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [citations, setCitations] = useState<any[]>([]);
  const { user } = useAuth();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse('');
    setCitations([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert legal advisor with access to over 9 million legal decisions from 2000+ U.S. federal and state courts. 
        Analyze the following query, fact-check with multiple sources, and provide a comprehensive, legally sound answer. 
        Include at least 10 related cases to strengthen the response if applicable. Look at every angle, including the opposing side, to ensure a strategic and accurate response.
        
        Query: ${query}`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setResponse(result.text || '');
      
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setCitations(chunks);
      }
    } catch (error) {
      console.error('Error during research:', error);
      setResponse('An error occurred during the research process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveCase = async () => {
    if (!user || !response) return;
    try {
      await addDoc(collection(db, 'cases'), {
        userId: user.uid,
        title: query.substring(0, 50) + '...',
        query,
        response,
        citations: citations.map(c => c.web?.uri || '').filter(Boolean),
        createdAt: new Date().toISOString(),
      });
      alert('Case saved successfully!');
    } catch (error) {
      console.error('Error saving case:', error);
      alert('Failed to save case.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Deep Legal Research</h1>
      <p className="text-gray-400 mb-8">
        Powered by Gemini Pro with High Thinking Level and Google Search Grounding.
      </p>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-700 bg-gray-900 text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm min-h-[120px]"
            placeholder="Describe your legal issue, case, or question in detail..."
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Researching...
              </>
            ) : (
              'Start Research'
            )}
          </button>
        </div>
      </form>

      {response && (
        <div className="bg-gray-900 shadow-xl sm:rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-white">Research Findings</h3>
            <button
              onClick={saveCase}
              className="inline-flex items-center px-3 py-1.5 border border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save to Cases
            </button>
          </div>
          <div className="px-4 py-5 sm:p-6 prose prose-invert max-w-none">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
          
          {citations.length > 0 && (
            <div className="px-4 py-4 sm:px-6 bg-gray-800/50 border-t border-gray-800">
              <h4 className="text-sm font-medium text-white mb-3">Sources & Citations:</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {citations.map((chunk, idx) => (
                  chunk.web?.uri && (
                    <li key={idx}>
                      <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                        {chunk.web.title || chunk.web.uri}
                      </a>
                    </li>
                  )
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
