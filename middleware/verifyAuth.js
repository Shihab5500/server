import admin from '../firebaseAdmin.js';

export default async function verifyAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    
    if (!token) {
        return res.status(401).json({ message: 'Missing token' });
    }

    const decoded = await admin.auth().verifyIdToken(token, true);
    req.user = decoded;
    next();
  } catch (e) {
    console.error('🔐 verifyAuth failed:', e.message);
    res.status(401).json({
      message: 'Invalid token',
      code: e.code || 'auth/invalid-token',
    });
  }
}