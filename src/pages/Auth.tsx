import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Scale, AlertCircle } from 'lucide-react';

export function Auth() {
  const { signIn } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signIn();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please ensure this domain is authorized in Firebase Console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Scale className="h-14 w-14 text-indigo-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          NeroLegal AI
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          State-of-the-art legal intelligence and drafting.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900 py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-gray-800">
          {error && (
            <div className="mb-4 bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-md flex items-center text-sm">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
