import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Firebase
const mockFirebase = {
  initializeApp: () => ({}),
  getAuth: () => ({
    currentUser: null,
    onAuthStateChanged: () => () => {},
  }),
  getFirestore: () => ({}),
  getStorage: () => ({}),
  getAnalytics: () => null,
};

// Set up global mocks
global.fetch = async () => new Response();
