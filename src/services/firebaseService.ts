import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    updatePassword
} from 'firebase/auth';
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    getDocs, 
    updateDoc, 
    deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User } from '../types';

// Fetch a user's profile from Firestore
export const getUserProfile = async (uid: string): Promise<User | null> => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: uid,
            email: data.email,
            name: data.name,
            isMember: data.isMember,
            isAdmin: data.isAdmin,
        };
    }
    return null;
};

// Login
export const login = async (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
};

// Logout
export const logout = async () => {
    return signOut(auth);
};

// Change Password
export const changePassword = async (newPassword: string) => {
    const user = auth.currentUser;
    if (user) {
        return updatePassword(user, newPassword);
    }
    throw new Error("No authenticated user found.");
};

// --- ADMIN FUNCTIONS ---

export const getAllUsers = async (): Promise<User[]> => {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as User));
    return userList;
};

export const createUser = async (email: string, pass: string, name: string, isMember: boolean, isAdmin: boolean) => {
    alert("SECURITY WARNING: User creation is happening on the client. For this to work, you must manually create the user in the Firebase Authentication console first, then add their profile here.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const { user } = userCredential;
    await setDoc(doc(db, 'users', user.uid), {
        email,
        name,
        isMember,
        isAdmin,
    });
    return { id: user.uid, email, name, isMember, isAdmin };
};

export const updateUserProfile = async (uid: string, data: Partial<User>) => {
    const userDoc = doc(db, 'users', uid);
    return updateDoc(userDoc, data);
};

export const deleteUser = async (uid: string) => {
    alert("SECURITY WARNING: Deleting users from the client is insecure and often disabled. Please delete this user from the Firebase Authentication and Firestore consoles manually.");
    // First, delete the Firestore document.
    const userDoc = doc(db, 'users', uid);
    await deleteDoc(userDoc);
};