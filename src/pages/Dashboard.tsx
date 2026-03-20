import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Mic, FileText, MessageSquare, MapPin, Zap, ImageIcon, Brain, Users, Target } from 'lucide-react';

const features = [
  {
    name: 'Master Doc Analyzer',
    description: 'Simulated team of master legal experts reviews your document for compliance, wording, and strategy.',
    href: '/master-analyzer',
    icon: Users,
    color: 'bg-emerald-600',
  },
  {
    name: 'Case Strategy',
    description: 'Break down legal decisions, find strengths/weaknesses, and develop counterarguments.',
    href: '/case-strategy',
    icon: Target,
    color: 'bg-rose-600',
  },
  {
    name: 'Legal Research',
    description: 'Deep dive into 9M+ legal decisions with Google Search grounding.',
    href: '/research',
    icon: Search,
    color: 'bg-blue-500',
  },
  {
    name: 'Deep Analysis',
    description: 'Complex legal scenario analysis with high-level AI reasoning.',
    href: '/deep',
    icon: Brain,
    color: 'bg-purple-600',
  },
  {
    name: 'Voice Consultation',
    description: 'Real-time conversational voice AI for legal brainstorming.',
    href: '/voice',
    icon: Mic,
    color: 'bg-purple-500',
  },
  {
    name: 'Case Analyzer',
    description: 'Upload documents or images for instant AI analysis.',
    href: '/analyze',
    icon: ImageIcon,
    color: 'bg-green-500',
  },
  {
    name: 'Local Resources',
    description: 'Find local courts and legal professionals using Google Maps data.',
    href: '/local',
    icon: MapPin,
    color: 'bg-red-500',
  },
  {
    name: 'Quick Q&A',
    description: 'Fast answers to simple legal questions with audio transcription.',
    href: '/quick',
    icon: Zap,
    color: 'bg-yellow-500',
  },
  {
    name: 'Document Drafter',
    description: 'Draft contracts, motions, and other legal documents.',
    href: '/draft',
    icon: FileText,
    color: 'bg-indigo-500',
  },
  {
    name: 'AI Chatbot',
    description: 'General legal chat assistant powered by Gemini Pro.',
    href: '/chat',
    icon: MessageSquare,
    color: 'bg-pink-500',
  },
];

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome to Lexi AI</h1>
      <p className="text-lg text-gray-600 mb-12">
        Select a tool below to begin your legal research, drafting, or consultation.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.name}
            to={feature.href}
            className="group relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:border-indigo-300"
          >
            <div>
              <span
                className={`inline-flex rounded-lg p-3 ring-4 ring-white ${feature.color} bg-opacity-10 text-${feature.color.replace('bg-', '')}`}
              >
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                {feature.name}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {feature.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
