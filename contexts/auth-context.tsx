"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"; // Added useCallback
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  AuthError, // Import AuthError
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  FieldValue, // Import FieldValue
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User, UserRole } from "@/types";
import { useFirebase } from "./firebase-context"; // Import useFirebase

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define an interface for the data written to Firestore during signup
interface UserWriteData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: UserRole;
  createdAt: FieldValue; // Allow FieldValue for creation
  // Add other fields as necessary, matching the structure but allowing FieldValue for timestamps
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { createRepairerProfile } = useFirebase(); // Get createRepairerProfile

  // Fetch user data from Firestore
  const fetchUserData = useCallback(async (uid: string) => {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      setUser({
        ...userData,
        id: uid,
      });
    } else {
      // Handle case where user exists in Auth but not Firestore (should ideally not happen with current signup)
      console.warn(`User document not found for UID: ${uid}`);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentFirebaseUser) => {
        setFirebaseUser(currentFirebaseUser);

        if (currentFirebaseUser) {
          setLoading(true); // Set loading while fetching user data
          await fetchUserData(currentFirebaseUser.uid);
          setLoading(false);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [fetchUserData]); // Add fetchUserData dependency

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const { user: newFirebaseUser } = userCredential;

      // Update the user's display name in Firebase Auth
      await updateProfile(newFirebaseUser, { displayName });

      // Create a user document in Firestore 'users' collection
      const userDocRef = doc(db, "users", newFirebaseUser.uid);
      const userData: UserWriteData = {
        uid: newFirebaseUser.uid,
        email: newFirebaseUser.email || email, // Use email from auth or passed email
        displayName: newFirebaseUser.displayName || displayName, // Use displayName from auth or passed name
        role,
        createdAt: serverTimestamp(),
        // Add other default fields if necessary, e.g., photoURL: null
      };
      await setDoc(userDocRef, userData);

      // If the user signed up as a repairer, create their repairer profile
      if (role === "repairer") {
        await createRepairerProfile(newFirebaseUser.uid, {
          displayName: userData.displayName ?? "", // Provide default empty string if null
          email: userData.email ?? "", // Provide default empty string if null
          // Add any other initial repairer profile data here
        });
      }

      // Manually set the user state after signup to avoid delay from onAuthStateChanged
      // Ensure the object passed matches the User type
      setUser({
        id: newFirebaseUser.uid,
        email: userData.email ?? "", // Provide default empty string if null
        displayName: userData.displayName ?? "", // Provide default empty string if null
        photoURL: userData.photoURL ?? undefined, // Use undefined if null
        role: userData.role,
        createdAt: new Date(), // Use current date as placeholder
      });
    } catch (error) {
      console.error("Error during sign up:", error);
      throw error; // Re-throw the error to be caught in the component
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user state
    } catch (error) {
      console.error("Error during sign in:", error);
      throw error; // Re-throw the error
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will handle setting the user state to null
    } catch (error) {
      console.error("Error during logout:", error);
      throw error; // Re-throw the error
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signUp,
        signIn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
