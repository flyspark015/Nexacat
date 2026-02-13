import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../lib/authStore';

/**
 * Authentication Debug Component
 * Shows current auth status to help diagnose Firebase Storage permission issues
 * Remove this component after fixing the issue
 */
export function AuthDebug() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const { user, isAuthenticated, isAdmin } = useAuthStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
    });
    return unsubscribe;
  }, []);

  if (!import.meta.env.DEV) return null; // Only show in development

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-xs shadow-lg">
      <div className="mb-2 font-bold text-yellow-900">🔍 Auth Debug Info</div>
      
      <div className="space-y-2 text-yellow-800">
        <div>
          <strong>Firebase Auth:</strong>{' '}
          {firebaseUser ? (
            <span className="text-green-700">✅ Logged In</span>
          ) : (
            <span className="text-red-700">❌ Not Logged In</span>
          )}
        </div>

        {firebaseUser && (
          <>
            <div>
              <strong>Email:</strong> {firebaseUser.email}
            </div>
            <div>
              <strong>UID:</strong> {firebaseUser.uid?.substring(0, 8)}...
            </div>
          </>
        )}

        <div>
          <strong>Auth Store:</strong>{' '}
          {isAuthenticated() ? (
            <span className="text-green-700">✅ Authenticated</span>
          ) : (
            <span className="text-red-700">❌ Not Authenticated</span>
          )}
        </div>

        {user && (
          <>
            <div>
              <strong>Role:</strong>{' '}
              <span className={isAdmin() ? 'text-blue-700 font-bold' : ''}>
                {user.role}
              </span>
            </div>
            <div>
              <strong>Is Admin:</strong>{' '}
              {isAdmin() ? (
                <span className="text-green-700">✅ Yes</span>
              ) : (
                <span className="text-red-700">❌ No</span>
              )}
            </div>
          </>
        )}

        <div className="mt-3 border-t border-yellow-300 pt-2">
          <strong>Storage Upload Status:</strong>
          <div className="mt-1">
            {firebaseUser && isAuthenticated() ? (
              <span className="text-green-700">
                ✅ Should be able to upload
              </span>
            ) : (
              <span className="text-red-700">
                ❌ Cannot upload (not authenticated)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
