let admin = null;

try {
  const firebaseAdmin = require('firebase-admin');
  const credential = buildCredential(firebaseAdmin);

  if (!firebaseAdmin.apps.length) {
    firebaseAdmin.initializeApp(credential ? { credential } : undefined);
  }

  admin = firebaseAdmin;
  console.log('Firebase Admin initialized');
} catch (e) {
  console.warn('Firebase Admin not initialized:', e.message);
}

function buildCredential(firebaseAdmin) {
  const serviceAccount = readServiceAccountFromEnv();
  if (!serviceAccount) return null;
  return firebaseAdmin.credential.cert(serviceAccount);
}

function readServiceAccountFromEnv() {
  if (process.env.FIREBASE_SA_BASE64) {
    const json = Buffer.from(process.env.FIREBASE_SA_BASE64, 'base64').toString('utf8');
    return JSON.parse(json);
  }
  if (process.env.FIREBASE_SA_JSON) {
    return JSON.parse(process.env.FIREBASE_SA_JSON);
  }
  return null;
}

module.exports = admin;
