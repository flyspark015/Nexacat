/**
 * Permission Error Handler
 * Shows helpful console messages when permission errors occur
 */

let errorShown = false;

export function showPermissionErrorBanner() {
  if (errorShown) return;
  errorShown = true;

  console.clear();
  console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #EF4444; font-weight: bold; font-size: 14px;');
  console.log('%c║                                                               ║', 'color: #EF4444; font-weight: bold; font-size: 14px;');
  console.log('%c║  🚨 FIRESTORE PERMISSION ERROR - ACTION REQUIRED! 🚨         ║', 'color: #EF4444; font-weight: bold; font-size: 14px;');
  console.log('%c║                                                               ║', 'color: #EF4444; font-weight: bold; font-size: 14px;');
  console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #EF4444; font-weight: bold; font-size: 14px;');
  console.log('');
  console.log('%c⚠️  Firestore security rules need to be deployed', 'color: #F59E0B; font-weight: bold; font-size: 13px;');
  console.log('');
  console.log('%c📋 QUICK FIX (2 minutes):', 'color: #3B82F6; font-weight: bold; font-size: 12px;');
  console.log('%c   1. Open: https://console.firebase.google.com', 'color: #6B7280; font-size: 11px;');
  console.log('%c   2. Go to: Firestore Database → Rules', 'color: #6B7280; font-size: 11px;');
  console.log('%c   3. Copy rules from: /COPY_THESE_RULES.txt', 'color: #6B7280; font-size: 11px;');
  console.log('%c   4. Paste into Firebase Console', 'color: #6B7280; font-size: 11px;');
  console.log('%c   5. Click "Publish" button', 'color: #6B7280; font-size: 11px;');
  console.log('%c   6. Refresh this page', 'color: #6B7280; font-size: 11px;');
  console.log('');
  console.log('%c📚 Detailed Instructions:', 'color: #3B82F6; font-weight: bold; font-size: 12px;');
  console.log('%c   • START_HERE_PERMISSION_FIX.md - Overview', 'color: #6B7280; font-size: 11px;');
  console.log('%c   • FIX_NOW.txt - Quick steps', 'color: #6B7280; font-size: 11px;');
  console.log('%c   • DEPLOY_RULES_NOW.md - Detailed guide', 'color: #6B7280; font-size: 11px;');
  console.log('');
  console.log('%c🔍 Diagnostic Tool:', 'color: #3B82F6; font-weight: bold; font-size: 12px;');
  console.log('%c   Admin Dashboard → Settings → Click "Run Checks"', 'color: #6B7280; font-size: 11px;');
  console.log('');
  console.log('%c═══════════════════════════════════════════════════════════════', 'color: #EF4444; font-weight: bold; font-size: 14px;');
  console.log('');
}

export function checkForPermissionError(error: any): boolean {
  if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
    showPermissionErrorBanner();
    return true;
  }
  return false;
}
