/**
 * Admin Role Verification Utility
 * Use this to check if the current user has admin role
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.error('❌ User document not found');
      return false;
    }
    
    const userData = userDoc.data();
    const role = userData?.role;
    
    console.log('🔍 User Role Check:');
    console.log('  User ID:', userId);
    console.log('  Role:', role);
    console.log('  Is Admin:', role === 'admin');
    
    if (role !== 'admin') {
      console.warn('⚠️ User is not an admin. Current role:', role);
      console.log('💡 To fix: Update the role in Firestore to "admin"');
    } else {
      console.log('✅ User has admin role');
    }
    
    return role === 'admin';
  } catch (error) {
    console.error('❌ Error checking admin role:', error);
    return false;
  }
}

/**
 * Run this in browser console to verify admin access
 * Usage: 
 * import { checkAdminRole } from './lib/checkAdminRole';
 * checkAdminRole('your-user-id');
 */
