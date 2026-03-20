import React, { useState } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Brain, Loader2, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function DeepAnalysis() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const { user } = useAuth();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `You are a senior legal strategist. Analyze the following complex legal scenario deeply. 
        Consider all possible angles, precedents, opposing arguments, and strategic implications. Provide a highly detailed, reasoned analysis.
        
        Scenario: ${query}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        },
      });

      setResponse(result.text || '');
    } catch (error) {
      console.error('Error during deep analysis:', error);
      setResponse('An error occurred during the analysis process. Please try again.');
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
        createdAt: new Date().toISOString(),
      });
      alert('Analysis saved successfully!');
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('Failed to save analysis.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
        <Brain className="h-8 w-8 text-indigo-500 mr-3" />
        Deep Legal Analysis
      </h1>
      <p className="text-gray-400 mb-8">
        Powered by Gemini Pro with High Thinking Level for your most complex legal scenarios.
      </p>

      <form onSubmit={handleAnalyze} className="mb-8">
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full p-4 border border-gray-700 bg-gray-900 text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm min-h-[160px]"
            placeholder="Describe the complex legal scenario, including all relevant facts, parties, and specific legal questions..."
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
                Thinking Deeply...
              </>
            ) : (
              'Start Deep Analysis'
            )}
          </button>
        </div>
      </form>

      {response && (
        <div className="bg-gray-900 shadow-xl sm:rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-white">Analysis Results</h3>
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
        </div>
      )}
    </div>
  );
}
