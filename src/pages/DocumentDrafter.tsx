import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FileText, Loader2, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function DocumentDrafter() {
  const [docType, setDocType] = useState('Contract');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const { user } = useAuth();

  const handleDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    setLoading(true);
    setDraft('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `You are an expert legal drafter. Draft a professional, legally sound ${docType} based on the following details. 
        Ensure the language is precise, formal, and covers standard clauses appropriate for this type of document.
        
        Details provided by user:
        ${details}`,
      });

      setDraft(result.text || '');
    } catch (error) {
      console.error('Error drafting document:', error);
      setDraft('An error occurred during the drafting process.');
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async () => {
    if (!user || !draft) return;
    try {
      await addDoc(collection(db, 'documents'), {
        userId: user.uid,
        title: `${docType} - ${new Date().toLocaleDateString()}`,
        content: draft,
        type: docType,
        createdAt: new Date().toISOString(),
      });
      alert('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Document Drafter</h1>
      <p className="text-gray-600 mb-8">
        Draft contracts, motions, letters, and other legal documents using Gemini Pro.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form onSubmit={handleDraft} className="bg-white shadow sm:rounded-lg p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
              >
                <option>Contract / Agreement</option>
                <option>Non-Disclosure Agreement (NDA)</option>
                <option>Cease and Desist Letter</option>
                <option>Demand Letter</option>
                <option>Motion to Dismiss</option>
                <option>Will / Testament</option>
                <option>Power of Attorney</option>
                <option>Custom Document</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specific Details & Requirements
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={8}
                className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3"
                placeholder="Enter names of parties, key terms, dates, jurisdiction, and any specific clauses to include..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !details.trim()}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Drafting...
                </>
              ) : (
                <>
                  <FileText className="-ml-1 mr-2 h-5 w-5" />
                  Generate Draft
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {draft ? (
            <div className="bg-white shadow sm:rounded-lg overflow-hidden h-full flex flex-col">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Generated Draft</h3>
                <button
                  onClick={saveDocument}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Document
                </button>
              </div>
              <div className="px-8 py-10 flex-1 overflow-y-auto bg-white prose max-w-none font-serif">
                <ReactMarkdown>{draft}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg h-full flex items-center justify-center p-12 text-center">
              <div>
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Draft Yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Fill out the form on the left and click "Generate Draft" to see the result here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
