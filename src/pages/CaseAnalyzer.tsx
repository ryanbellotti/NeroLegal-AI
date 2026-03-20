import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Upload, Loader2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function CaseAnalyzer() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    setAnalysis('');

    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: 'Analyze this legal document, evidence, or scene. Provide a detailed breakdown of its legal significance, potential issues, and how it might be used in a case.' }
          ]
        }
      });

      setAnalysis(result.text || 'No analysis generated.');
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysis('An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Case Analyzer</h1>
      <p className="text-gray-400 mb-8">
        Upload legal documents, evidence photos, or contracts for instant AI analysis using Gemini Pro.
      </p>

      <div className="bg-gray-900 shadow-xl sm:rounded-xl p-6 mb-8 border border-gray-800">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg p-12 text-center hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-12 w-12 text-gray-500 mb-4" />
          <p className="text-sm text-gray-400">Click to upload an image or document</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {image && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-white mb-4">Preview</h3>
            <img src={image} alt="Uploaded evidence" className="max-h-96 rounded-lg shadow-sm border border-gray-700" />
            <div className="mt-4 flex justify-end">
              <button
                onClick={analyzeImage}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileText className="-ml-1 mr-2 h-4 w-4" />
                    Analyze Evidence
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {analysis && (
        <div className="bg-gray-900 shadow-xl sm:rounded-xl overflow-hidden border border-gray-800">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-800">
            <h3 className="text-lg leading-6 font-medium text-white">Analysis Results</h3>
          </div>
          <div className="px-4 py-5 sm:p-6 prose prose-invert max-w-none">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
