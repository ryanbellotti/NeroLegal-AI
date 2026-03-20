import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, Square, Loader2, Volume2, AlertCircle } from 'lucide-react';

export function VoiceConsultation() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  // Helper to convert Float32Array to base64 PCM16
  const float32ToBase64Pcm16 = (float32Array: Float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper to convert base64 PCM16 to Float32Array
  const base64Pcm16ToFloat32 = (base64: string) => {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new DataView(buffer);
    for (let i = 0; i < binary.length; i++) {
      view.setUint8(i, binary.charCodeAt(i));
    }
    const float32Array = new Float32Array(buffer.byteLength / 2);
    for (let i = 0; i < float32Array.length; i++) {
      float32Array[i] = view.getInt16(i * 2, true) / 0x8000;
    }
    return float32Array;
  };

  const playNextAudio = () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }
    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift()!;
    const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
    audioBuffer.getChannelData(0).set(audioData);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = playNextAudio;
    source.start();
  };

  const connect = async () => {
    setConnecting(true);
    setError(null);
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are a professional legal advisor. Engage in a real-time voice consultation with the user. Be concise, clear, and helpful. Always clarify you are an AI.',
        },
        callbacks: {
          onopen: () => {
            setConnected(true);
            setConnecting(false);
            processorRef.current!.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const base64Data = float32ToBase64Pcm16(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
          },
          onmessage: (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const float32Data = base64Pcm16ToFloat32(base64Audio);
              audioQueueRef.current.push(float32Data);
              if (!isPlayingRef.current) {
                playNextAudio();
              }
            }
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }
          },
          onerror: (err) => {
            console.error('Live API Error:', err);
            setError('Connection error occurred.');
            disconnect();
          },
          onclose: () => {
            disconnect();
          }
        }
      });
      
      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error('Failed to connect:', err);
      setError('Failed to start voice consultation. Please check your microphone permissions.');
      setConnecting(false);
    }
  };

  const disconnect = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {}
    }
    setConnected(false);
    setConnecting(false);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center justify-center">
        <Volume2 className="h-8 w-8 text-purple-500 mr-3" />
        Live Voice Consultation
      </h1>
      <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
        Have a real-time conversation with our AI legal advisor. Speak naturally, and the AI will respond instantly. Perfect for brainstorming and preliminary legal guidance.
      </p>

      {error && (
        <div className="mb-8 bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-md flex items-center justify-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-gray-900 shadow-2xl rounded-3xl p-12 border border-gray-800 flex flex-col items-center justify-center min-h-[400px]">
        
        <div className={`relative flex items-center justify-center w-48 h-48 rounded-full mb-8 transition-all duration-500 ${
          connected ? 'bg-purple-900/50 shadow-[0_0_60px_rgba(168,85,247,0.4)]' : 'bg-gray-800'
        }`}>
          {connected && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-purple-400 opacity-20 animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-0 rounded-full border-4 border-purple-500 opacity-40 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
            </>
          )}
          <Mic className={`h-20 w-20 ${connected ? 'text-purple-400' : 'text-gray-600'}`} />
        </div>

        {connected ? (
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Connected</h3>
            <p className="text-gray-400 mb-8">Speak now to consult with NeroLegal AI.</p>
            <button
              onClick={disconnect}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Square className="-ml-1 mr-2 h-6 w-6" />
              End Consultation
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Ready to Start</h3>
            <p className="text-gray-400 mb-8">Click the button below to begin your session.</p>
            <button
              onClick={connect}
              disabled={connecting}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
            >
              {connecting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-6 w-6" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mic className="-ml-1 mr-2 h-6 w-6" />
                  Start Consultation
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
