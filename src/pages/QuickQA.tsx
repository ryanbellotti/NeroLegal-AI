import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, Square, Play, Loader2, Zap } from 'lucide-react';

export function QuickQA() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access is required for this feature.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            { inlineData: { data: base64Audio, mimeType: 'audio/webm' } },
            { text: 'Transcribe this audio exactly.' }
          ]
        });
        
        setQuery(result.text || '');
      };
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse('');
    setAudioUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // 1. Get fast text response
      const textResult = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: `You are a quick legal Q&A assistant. Answer the following legal question concisely and accurately: ${query}`
      });
      
      const answerText = textResult.text || 'No answer generated.';
      setResponse(answerText);

      // 2. Generate TTS for the response
      const ttsResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: `Say clearly: ${answerText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });

      const base64Audio = ttsResult.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
        setAudioUrl(audioSrc);
      }

    } catch (error) {
      console.error('Error getting answer:', error);
      setResponse('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <Zap className="h-8 w-8 text-yellow-500 mr-3" />
        Quick Q&A
      </h1>
      <p className="text-gray-600 mb-8">
        Get fast answers to simple legal questions. Use your microphone to ask, and listen to the response.
      </p>

      <div className="bg-white shadow sm:rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`p-4 rounded-full flex items-center justify-center transition-colors ${
              recording ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {recording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
          
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 border"
              placeholder="Type your question or use the microphone..."
            />
          </div>
          
          <button
            onClick={handleAsk}
            disabled={loading || !query.trim()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Ask'}
          </button>
        </div>
        {recording && <p className="text-sm text-red-500 animate-pulse ml-16">Recording...</p>}
      </div>

      {response && (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Answer</h3>
            {audioUrl && (
              <audio controls src={audioUrl} autoPlay className="h-8">
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
          <div className="px-4 py-5 sm:p-6 text-gray-800 text-lg">
            {response}
          </div>
        </div>
      )}
    </div>
  );
}
