/**
 * Permission Checker Component
 * Helps diagnose Firebase permission issues
 * 
 * Add this to your admin dashboard temporarily to check setup
 */

import { useState } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CheckResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  fix?: string;
}

export function PermissionChecker() {
  const { user } = useAuthStore();
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);

  const runChecks = async () => {
    if (!user) {
      setResults([{
        name: 'Authentication',
        status: 'error',
        message: 'Not logged in',
        fix: 'Please log in to run checks',
      }]);
      return;
    }

    setChecking(true);
    const checks: CheckResult[] = [];

    // Check 1: User document exists
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        checks.push({
          name: 'User Document',
          status: 'success',
          message: 'User document exists',
        });

        // Check 2: User role
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          checks.push({
            name: 'Admin Role',
            status: 'success',
            message: `Role: ${userData.role}`,
          });
        } else {
          checks.push({
            name: 'Admin Role',
            status: 'error',
            message: `Current role: ${userData.role || 'none'}`,
            fix: 'Go to Firestore → users → your user → change role to "admin"',
          });
        }
      } else {
        checks.push({
          name: 'User Document',
          status: 'error',
          message: 'User document not found',
          fix: 'Create user document in Firestore',
        });
      }
    } catch (error: any) {
      checks.push({
        name: 'User Document',
        status: 'error',
        message: `Error: ${error.message}`,
      });
    }

    // Check 3: AI Settings access
    try {
      const settingsDoc = await getDoc(doc(db, 'aiSettings', user.uid));
      checks.push({
        name: 'AI Settings Access',
        status: 'success',
        message: settingsDoc.exists() ? 'AI settings found' : 'No AI settings yet (OK)',
      });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        checks.push({
          name: 'AI Settings Access',
          status: 'error',
          message: 'Permission denied - Rules not deployed',
          fix: 'Deploy Firestore rules from /COPY_THESE_RULES.txt',
        });
      } else {
        checks.push({
          name: 'AI Settings Access',
          status: 'error',
          message: `Error: ${error.message}`,
        });
      }
    }

    // Check 4: AI Conversations query
    try {
      const q = query(
        collection(db, 'aiConversations'),
        where('adminId', '==', user.uid)
      );
      await getDocs(q);
      checks.push({
        name: 'AI Conversations Query',
        status: 'success',
        message: 'Can query conversations',
      });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        checks.push({
          name: 'AI Conversations Query',
          status: 'error',
          message: '🚨 Permission denied - THIS IS THE PROBLEM!',
          fix: 'Deploy rules from /COPY_THESE_RULES.txt to Firebase Console',
        });
      } else {
        checks.push({
          name: 'AI Conversations Query',
          status: 'error',
          message: `Error: ${error.message}`,
        });
      }
    }

    // Check 5: Product Drafts access
    try {
      const q = query(collection(db, 'productDrafts'));
      await getDocs(q);
      checks.push({
        name: 'Product Drafts Access',
        status: 'success',
        message: 'Can access drafts',
      });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        checks.push({
          name: 'Product Drafts Access',
          status: 'error',
          message: 'Permission denied',
          fix: 'Deploy Firestore rules',
        });
      } else {
        checks.push({
          name: 'Product Drafts Access',
          status: 'warning',
          message: `Warning: ${error.message}`,
        });
      }
    }

    setResults(checks);
    setChecking(false);
  };

  const hasErrors = results.some(r => r.status === 'error');
  const allSuccess = results.length > 0 && results.every(r => r.status === 'success');

  return (
    <div className="bg-surface rounded-lg border border-border p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Permission Checker</h3>
          <p className="text-sm text-muted-foreground">Diagnose Firebase permission issues</p>
        </div>
        <button
          onClick={runChecks}
          disabled={checking || !user}
          className="px-4 py-2 bg-blue-accent text-white rounded-lg hover:bg-blue-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {checking && <Loader2 className="w-4 h-4 animate-spin" />}
          {checking ? 'Checking...' : 'Run Checks'}
        </button>
      </div>

      {!user && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Not Logged In</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                Please log in as an admin to run permission checks.
              </p>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {/* Summary */}
          {allSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">All Checks Passed!</p>
                  <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                    Your permissions are configured correctly. AI Assistant should work!
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasErrors && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">Permission Errors Found</p>
                  <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                    You need to deploy Firestore rules. See fixes below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Individual checks */}
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'success'
                    ? 'bg-green-500/5 border-green-500/20'
                    : result.status === 'error'
                    ? 'bg-red-500/5 border-red-500/20'
                    : result.status === 'warning'
                    ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-muted border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                  {result.status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  {result.status === 'warning' && (
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{result.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                    {result.fix && (
                      <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Fix:</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{result.fix}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action required */}
          {hasErrors && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                🚀 Action Required
              </p>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-decimal">
                <li>Open Firebase Console: https://console.firebase.google.com</li>
                <li>Go to: Firestore Database → Rules</li>
                <li>Copy content from: <code className="bg-blue-500/20 px-1 rounded">/COPY_THESE_RULES.txt</code></li>
                <li>Paste into Firebase editor</li>
                <li>Click "Publish" button</li>
                <li>Refresh this page and run checks again</li>
              </ol>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                📚 See <code>/DEPLOY_RULES_NOW.md</code> for detailed instructions
              </p>
            </div>
          )}
        </div>
      )}

      {results.length === 0 && !checking && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Click "Run Checks" to diagnose permission issues
          </p>
        </div>
      )}
    </div>
  );
}
