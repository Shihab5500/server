



// server/firebaseAdmin.js
// import admin from 'firebase-admin';

// let app;

// try {
//   const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
//   if (!raw) {
//     throw new Error('FIREBASE_SERVICE_ACCOUNT env missing');
//   }

//   const sa = JSON.parse(raw); // one-line JSON with \n in private_key

//   if (!admin.apps.length) {
//     app = admin.initializeApp({
//       credential: admin.credential.cert(sa),
//       // enforce same project (helps catch mismatches)
//       projectId: sa.project_id,
//     });
//   }
// } catch (e) {
//   console.error('🔥 Firebase Admin init failed:', e?.message || e);
//   // Keep process alive; verifyAuth will 500 if admin not ready
// }










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
