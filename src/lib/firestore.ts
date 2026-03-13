/**
 * Firebase Admin SDK singleton for server-side Firestore access.
 * Credentials come from environment variables set in Vercel (or .env.local for dev).
 */

import "server-only";
import admin from "firebase-admin";

function getApp(): admin.app.App {
  if (admin.apps.length > 0) return admin.apps[0]!;

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel stores multiline env vars with literal \n — replace them
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export function getFirestore(): admin.firestore.Firestore {
  return getApp().firestore();
}
