import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    });

    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();

// Admin service functions
export const adminService = {
  // Set custom claims for a user
  async setCustomClaims(uid: string, claims: Record<string, any>) {
    try {
      await adminAuth.setCustomUserClaims(uid, claims);
      console.log(`Custom claims set for user ${uid}:`, claims);
      return { success: true, uid, claims };
    } catch (error) {
      console.error('Error setting custom claims:', error);
      throw error;
    }
  },

  // Get user by email
  async getUserByEmail(email: string) {
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      return userRecord;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  },

  // Make user admin
  async makeUserAdmin(email: string) {
    try {
      const userRecord = await this.getUserByEmail(email);
      await this.setCustomClaims(userRecord.uid, { admin: true });

      console.log(`User ${email} (${userRecord.uid}) is now an admin`);
      return {
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          isAdmin: true
        }
      };
    } catch (error) {
      console.error('Error making user admin:', error);
      throw error;
    }
  },

  // Remove admin privileges
  async removeAdminPrivileges(email: string) {
    try {
      const userRecord = await this.getUserByEmail(email);
      await this.setCustomClaims(userRecord.uid, { admin: false });

      console.log(`Admin privileges removed from ${email} (${userRecord.uid})`);
      return {
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          isAdmin: false
        }
      };
    } catch (error) {
      console.error('Error removing admin privileges:', error);
      throw error;
    }
  },

  // Verify admin token
  async verifyAdminToken(idToken: string) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const isAdmin = decodedToken.admin === true;

      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        isAdmin,
        claims: decodedToken
      };
    } catch (error) {
      console.error('Error verifying admin token:', error);
      throw error;
    }
  },

  // Get Firestore instance for direct DB access
  getDb() {
    return adminFirestore;
  }
};

export default admin;