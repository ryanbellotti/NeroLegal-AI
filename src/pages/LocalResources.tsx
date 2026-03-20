import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function LocalResources() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse('');
    setLinks([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const config: any = {
        tools: [{ googleMaps: {} }],
      };

      if (location) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude,
            }
          }
        };
      }

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find local legal resources, courts, or lawyers related to: ${query}`,
        config,
      });

      setResponse(result.text || 'No resources found.');
      
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedLinks = chunks.map(chunk => chunk.maps?.uri || (chunk.maps?.placeAnswerSources?.reviewSnippets?.[0] as any)?.uri).filter(Boolean);
        setLinks(extractedLinks);
      }
    } catch (error) {
      console.error('Error finding resources:', error);
      setResponse('An error occurred while searching for local resources.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Local Legal Resources</h1>
      <p className="text-gray-600 mb-8">
        Find courts, law firms, and legal aid near you using Google Maps Grounding.
      </p>

      <div className="bg-white shadow sm:rounded-lg p-6 mb-8">
        <form onSubmit={handleSearch}>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Family law attorneys, Federal courthouse, Legal aid clinic..."
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Search'}
            </button>
          </div>
          {location ? (
            <p className="text-sm text-green-600 flex items-center">
              <Navigation className="h-4 w-4 mr-1" /> Using your current location
            </p>
          ) : (
            <p className="text-sm text-yellow-600 flex items-center">
              <Navigation className="h-4 w-4 mr-1" /> Location access denied. Results may not be localized.
            </p>
          )}
        </form>
      </div>

      {response && (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Results</h3>
          </div>
          <div className="px-4 py-5 sm:p-6 prose max-w-none">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
          
          {links.length > 0 && (
            <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Map Links:</h4>
              <ul className="space-y-2 text-sm text-indigo-600">
                {links.map((link, idx) => (
                  <li key={idx}>
                    <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      View on Google Maps
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
