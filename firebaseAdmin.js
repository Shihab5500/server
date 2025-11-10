



// server/firebaseAdmin.js
// import admin from 'firebase-admin';

// let app;

// try {
//   const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
//   if (!raw) {
//     throw new Error('FIREBASE_SERVICE_ACCOUNT env missing');
//   }










import admin from 'firebase-admin';

try {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env missing');

  const sa = JSON.parse(raw);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId: sa.project_id,
    });
    console.log("✅ Firebase Admin initialized successfully");
  }
} catch (err) {
  console.error("🔥 Firebase Admin init failed:", err.message);
}

export default admin;
