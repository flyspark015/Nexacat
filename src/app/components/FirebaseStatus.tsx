import { useEffect, useState } from 'react';
import { db, auth, storage } from '../lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { AlertCircle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface FirebaseStatus {
  auth: 'checking' | 'connected' | 'error';
  firestore: 'checking' | 'connected' | 'error';
  storage: 'checking' | 'connected' | 'error';
  error?: string;
}

export function FirebaseStatus() {
  const [status, setStatus] = useState<FirebaseStatus>({
    auth: 'checking',
    firestore: 'checking',
    storage: 'checking',
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkFirebaseServices();
  }, []);

  const checkFirebaseServices = async () => {
    // Check Auth
    try {
      if (auth) {
        setStatus(prev => ({ ...prev, auth: 'connected' }));
      } else {
        setStatus(prev => ({ ...prev, auth: 'error' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, auth: 'error', error: String(error) }));
    }

    // Check Firestore
    try {
      // Try to read a collection (will fail if Firestore is not set up)
      const testQuery = query(collection(db, 'settings'), limit(1));
      await getDocs(testQuery);
      setStatus(prev => ({ ...prev, firestore: 'connected' }));
    } catch (error: any) {
      console.error('Firestore check error:', error);
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        setStatus(prev => ({ 
          ...prev, 
          firestore: 'error',
          error: 'Firestore not set up. Please follow setup instructions.' 
        }));
      } else {
        setStatus(prev => ({ ...prev, firestore: 'error', error: error.message }));
      }
    }

    // Check Storage
    try {
      if (storage) {
        setStatus(prev => ({ ...prev, storage: 'connected' }));
      } else {
        setStatus(prev => ({ ...prev, storage: 'error' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, storage: 'error', error: String(error) }));
    }
  };

  const allConnected = status.auth === 'connected' && 
                       status.firestore === 'connected' && 
                       status.storage === 'connected';

  const hasErrors = status.auth === 'error' || 
                    status.firestore === 'error' || 
                    status.storage === 'error';

  if (allConnected && !showDetails) {
    return null; // Hide when everything is working
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">
                Firebase Setup Required
              </h3>
              
              <div className="space-y-2 mb-3">
                <StatusItem 
                  label="Authentication" 
                  status={status.auth} 
                />
                <StatusItem 
                  label="Firestore Database" 
                  status={status.firestore} 
                />
                <StatusItem 
                  label="Storage" 
                  status={status.storage} 
                />
              </div>

              {status.error && (
                <div className="text-sm text-red-700 mb-3 p-2 bg-red-100 rounded">
                  <strong>Error:</strong> {status.error}
                </div>
              )}

              <div className="text-sm text-red-800 space-y-2">
                <p className="font-medium">📋 Quick Setup Steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Open Firebase Console</li>
                  <li>Enable Authentication (Email/Password)</li>
                  <li>Create Firestore Database</li>
                  <li>Deploy Security Rules</li>
                  <li>Refresh this page</li>
                </ol>
              </div>

              <div className="flex gap-2 mt-3">
                <a
                  href="https://console.firebase.google.com/project/flyspark-cb85e"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  Open Firebase Console
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 bg-white text-red-600 text-sm font-medium rounded-md border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Retry Connection
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs text-red-700">
                  📖 Need help? Check <code className="px-1 py-0.5 bg-red-100 rounded">QUICK_START_GUIDE.md</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasErrors && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Firebase Connected
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="ml-auto text-xs text-green-700 hover:text-green-900"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
          </div>
          
          {showDetails && (
            <div className="mt-2 space-y-1">
              <StatusItem label="Auth" status={status.auth} />
              <StatusItem label="Firestore" status={status.firestore} />
              <StatusItem label="Storage" status={status.storage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'connected' && (
        <>
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <span className="text-green-800">{label}</span>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          <span className="text-red-800">{label}</span>
        </>
      )}
      {status === 'checking' && (
        <>
          <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <span className="text-gray-600">{label}</span>
        </>
      )}
    </div>
  );
}
