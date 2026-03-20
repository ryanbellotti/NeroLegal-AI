import React, { useState } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Scale, Loader2, Save, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function AdvancedCaseAnalysis() {
  const [caseDetails, setCaseDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [citations, setCitations] = useState<any[]>([]);
  const { user } = useAuth();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseDetails.trim()) return;

    setLoading(true);
    setResponse('');
    setCitations([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
      You are an advanced legal strategist and case analyst. 
      
      Analyze the following legal decision or case details. Your output must strictly follow this structure:
      
      1. **Case Breakdown**: Summarize the core facts and the primary legal questions at hand.
      2. **Key Arguments**: Identify and explain the strongest arguments for BOTH the plaintiff and the defendant.
      3. **Strengths & Weaknesses**: Objectively assess the strengths and vulnerabilities of the case as presented.
      4. **Strategic Responses & Counterarguments**: Develop strategic responses to the weaknesses, including potential counterarguments the opposing side might use and how to defeat them.
      5. **Relevant Precedents**: Cite specific, relevant legal precedents and historical cases that impact this situation.
      
      Case Details:
      ${caseDetails}
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          tools: [{ googleSearch: {} }],
        },
      });

      setResponse(result.text || '');
      
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setCitations(chunks);
      }
    } catch (error) {
      console.error('Error during case analysis:', error);
      setResponse('An error occurred during the analysis process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = async () => {
    if (!user || !response) return;
    try {
      await addDoc(collection(db, 'cases'), {
        userId: user.uid,
        title: `Case Strategy: ${caseDetails.substring(0, 30)}...`,
        query: caseDetails,
        response,
        citations: citations.map(c => c.web?.uri || '').filter(Boolean),
        createdAt: new Date().toISOString(),
      });
      alert('Strategy saved successfully!');
    } catch (error) {
      console.error('Error saving strategy:', error);
      alert('Failed to save strategy.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <Target className="h-8 w-8 text-indigo-600 mr-3" />
        Advanced Case Strategy & Analysis
      </h1>
      <p className="text-gray-600 mb-8">
        Break down legal decisions, identify key arguments, assess strengths/weaknesses, and develop strategic responses with counterarguments and precedents.
      </p>

      <form onSubmit={handleAnalyze} className="mb-8">
        <div className="relative">
          <textarea
            value={caseDetails}
            onChange={(e) => setCaseDetails(e.target.value)}
            className="block w-full p-4 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm min-h-[160px]"
            placeholder="Paste the legal decision, case facts, or scenario you want to strategically break down..."
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading || !caseDetails.trim()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Analyzing Case Strategy...
              </>
            ) : (
              'Generate Case Strategy'
            )}
          </button>
        </div>
      </form>

      {response && (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Strategic Breakdown</h3>
            <button
              onClick={saveAnalysis}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Strategy
            </button>
          </div>
          <div className="px-4 py-5 sm:p-6 prose max-w-none">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
          
          {citations.length > 0 && (
            <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Cited Precedents & Sources:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {citations.map((chunk, idx) => (
                  chunk.web?.uri && (
                    <li key={idx}>
                      <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
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
