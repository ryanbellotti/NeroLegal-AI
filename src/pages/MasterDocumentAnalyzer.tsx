import React, { useState } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Users, Loader2, Save, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function MasterDocumentAnalyzer() {
  const [documentText, setDocumentText] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [citations, setCitations] = useState<any[]>([]);
  const { user } = useAuth();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentText.trim()) return;

    setLoading(true);
    setResponse('');
    setCitations([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
      You are a simulated "Master Team" of legally omniscient experts with real-time internet access. 
      The team consists of: a Master Judge, Master Attorney, Master Legal Eagle, Master Criminal, Master Psychologist, Master Law Professor, Master Prosecutor, Master Defendant, Master Historian, Judge Judy, a former Attorney General, and a Supreme Court Judge.
      
      Your task is to thoroughly analyze the provided legal document. 
      
      Jurisdiction/Location Context: ${jurisdiction || 'General US Law'}
      
      Directives:
      1. Analyze every part of the entire document to ensure it is legally sound.
      2. Ensure the user's best interests are reflected. Point out missing elements or additions that would make it stronger.
      3. Check compliance against local ordinances, city, county, state, and federal laws based on the jurisdiction provided.
      4. Ensure the wording is perfect, tight, and matches the standard of similar top-tier documents.
      5. Verify all required criteria are present.
      6. Fact-check multiple times using your search capabilities.
      7. Cite historical cases and precedents that match or strengthen the document.
      8. Ask relevant clarifying questions to the user if needed.
      9. Above all: MAKE SURE IT IS LEGAL.
      
      Document to analyze:
      ${documentText}
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
      console.error('Error during master analysis:', error);
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
        title: `Master Analysis: ${documentText.substring(0, 30)}...`,
        query: documentText,
        response,
        citations: citations.map(c => c.web?.uri || '').filter(Boolean),
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <Users className="h-8 w-8 text-indigo-600 mr-3" />
        Master Team Document Analyzer
      </h1>
      <p className="text-gray-600 mb-8">
        Have your document reviewed by a simulated team of elite legal minds (Supreme Court Judges, Master Attorneys, Historians, and more). They will fact-check, ensure compliance across all jurisdictions, and perfect your wording.
      </p>

      <form onSubmit={handleAnalyze} className="mb-8 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter Jurisdiction (e.g., Los Angeles, California, USA) for local ordinance checks..."
          />
        </div>
        
        <div className="relative">
          <textarea
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            className="block w-full p-4 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm min-h-[200px]"
            placeholder="Paste the full text of the legal document you want the Master Team to analyze..."
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !documentText.trim()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                The Master Team is Reviewing...
              </>
            ) : (
              'Convene the Master Team'
            )}
          </button>
        </div>
      </form>

      {response && (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center bg-indigo-50">
            <h3 className="text-lg leading-6 font-medium text-indigo-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Master Team's Verdict & Analysis
            </h3>
            <button
              onClick={saveAnalysis}
              className="inline-flex items-center px-3 py-1.5 border border-indigo-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Analysis
            </button>
          </div>
          <div className="px-4 py-5 sm:p-6 prose max-w-none">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
          
          {citations.length > 0 && (
            <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Cited Sources & Case Law:</h4>
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
