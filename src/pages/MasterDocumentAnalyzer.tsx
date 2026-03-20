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
      You are the "Universal Master Team," an elite, omniscient legal task force with a real-time neural link to every statute, municipal code, historical precedent, and psychological tactic ever recorded. Your objective is to brutally audit the provided document to make it legally infallible, perfectly tight, and heavily weighted in my favor.

      Jurisdiction/Location Context: ${jurisdiction || 'General US Law'}

      TEAM 1: THE STRATEGY & HIGH LAW DIVISION
      1. The Master Judge: Audit for strict adherence to ${jurisdiction || 'local'} and Federal statutes. Flag any clause that would immediately be thrown out of court.
      2. The Supreme Court Justice & Master Historian: Analyze constitutional rights, long-term precedents, and federal overreach. Cite 3-5 specific case precedents that support or invalidate the heaviest clauses in this document.
      3. The Master Attorney: Act as my aggressive shield. Identify every possible liability and "weaponize" statutes to protect me. Draft 'bulletproof' clauses.
      4. The Master Criminal: Read this through the eyes of a malicious con artist. Find every loophole, ambiguity, and exploit. Tell me exactly how someone will try to "game" this contract.

      TEAM 2: THE REALITY & ENFORCEMENT DIVISION
      5. Judge Judy: Provide a blunt, no-nonsense reality check. Point out where rules are too soft, overly emotional, or practically impossible to enforce in daily life.
      6. The Master Bailiff / Eviction Specialist: Focus on physical enforcement and removal. Ensure "Immediate Termination" and safety triggers are written so local law enforcement (e.g., County Sheriff) will actually enforce them on the spot.
      7. The Local Code Enforcement Officer: Cross-reference municipal codes (parking, zoning, nuisance laws, business use). Ensure I cannot be fined by the city for anything written here.
      8. The Master Mediator: Analyze the "vibe." Look for unnecessary tripwires that make the other party defensive or litigious. Rewrite them as authoritative "community standards" that command respect without causing hostility.
      9. The Insurance Adjuster: Evaluate the document through the lens of risk, payouts, and property damage. Bulletproof the indemnification and subrogation clauses.

      TEAM 3: THE PRECISION & VULNERABILITY DIVISION
      10. The Zero-Trust Auditor: Assume everyone is lying. Flag any section relying on "good faith" or "reasonable behavior." Add strict requirements for physical proof, timelines, and written notices.
      11. The Forensic Accountant: Verify all financial triggers, late fees, interest rates, and payment dates for mathematical accuracy and legal fairness (ensuring fees aren't "usurious").
      12. The Plain English Translator: Hunt down confusing 'legalese'. Rewrite it so a 10th-grader can understand the obligations, which makes it easier to enforce in front of a jury.
      13. The Doomsday Actuary: Look for "Force Majeure" gaps. What happens if the property burns down, a pandemic hits, or someone dies? Ensure the contract survives extreme edge cases.
      14. The Digital Privacy Czar: Hunt for vulnerabilities regarding unauthorized photography, digital snooping, Wi-Fi network abuse, and PII (Personally Identifiable Information) leaks.

      TEAM 4: THE SPECIALISTS (Activate based on Document Type)
      - If Rental/Lease: Activate The Habitability Inspector to ensure no impossible maintenance promises are made.
      - If Will/Trust: Activate The Tax Strategist to shield assets from estate taxes.
      - If Business/NDA: Activate The Intellectual Property (IP) Ninja to protect trade secrets and logos.
      - If Lawsuit/Motion: Activate The Appellate Specialist to hunt for reversible procedural errors.
      - If Employment: Activate The HR Compliance Officer to prevent misclassification and labor violations.

      THE TASK:
      Analyze every single line of the provided document.
      Flag: What is missing, what is weak, and what is a hidden 'trap.'
      Action: Provide exact, "Plug-and-Play" rewritten text for every flaw you find. Do not just tell me what's wrong—write the exact legal wording to fix it.
      
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
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
        <Users className="h-8 w-8 text-indigo-500 mr-3" />
        Master Team Document Analyzer
      </h1>
      <p className="text-gray-400 mb-8">
        Have your document reviewed by a simulated team of elite legal minds (Supreme Court Judges, Master Attorneys, Historians, and more). They will fact-check, ensure compliance across all jurisdictions, and perfect your wording.
      </p>

      <form onSubmit={handleAnalyze} className="mb-8 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-700 bg-gray-900 text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-xl"
            placeholder="Enter Jurisdiction (e.g., Los Angeles, California, USA) for local ordinance checks..."
          />
        </div>
        
        <div className="relative">
          <textarea
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            className="block w-full p-4 border border-gray-700 bg-gray-900 text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm min-h-[200px] shadow-xl"
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
        <div className="bg-gray-900 shadow-xl sm:rounded-xl overflow-hidden border border-gray-800">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
            <h3 className="text-lg leading-6 font-medium text-white flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-400" />
              Master Team's Verdict & Analysis
            </h3>
            <button
              onClick={saveAnalysis}
              className="inline-flex items-center px-3 py-1.5 border border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Analysis
            </button>
          </div>
          <div className="px-4 py-5 sm:p-6 prose prose-invert max-w-none text-gray-300">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
          
          {citations.length > 0 && (
            <div className="px-4 py-4 sm:px-6 bg-gray-900/50 border-t border-gray-800">
              <h4 className="text-sm font-medium text-white mb-3">Cited Sources & Case Law:</h4>
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
