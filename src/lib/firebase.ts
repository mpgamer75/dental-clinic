
// This file is no longer used for form submissions as the application
// has been migrated to use Supabase for data storage via src/lib/supabase.ts
// and src/app/actions.ts.

// If other parts of the application still rely on Firebase for other services 
// (e.g., Firebase Auth, Storage, etc.), this file might still be needed for those.
// However, for the database operations related to appointments, contact messages,
// and testimonials, Supabase is now the primary backend.

// import { initializeApp, getApps, getApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// // Initialize Firebase
// let app;
// if (!getApps().length) {
//   app = initializeApp(firebaseConfig);
// } else {
//   app = getApp();
// }

// const db = getFirestore(app);

// export { db, app };

// If Firebase is completely removed, you can delete this file.
// For now, it's commented out to reflect the shift to Supabase for DB operations.
export {}; // Add an empty export to make this a module if all content is commented out
