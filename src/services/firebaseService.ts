import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    updatePassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from 'firebase/auth';
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    getDocs, 
    updateDoc, 
    deleteDoc,
    onSnapshot,
    query,
    Unsubscribe,
    writeBatch
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User, Booking, Table, TerrainBox } from '../types';
import { INITIAL_TABLES, INITIAL_TERRAIN_BOXES } from '../constants';

const googleProvider = new GoogleAuthProvider();

// Send a password reset email
export const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
};

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
            membershipPaidDate: data.membershipPaidDate,
        };
    }
    return null;
};

// Create a pending Firestore profile for a new user
export const createPendingProfile = async (uid: string, email: string, name: string): Promise<User> => {
    const profile: Omit<User, 'id'> = {
        email,
        name,
        isMember: false,
        isAdmin: false,
    };
    await setDoc(doc(db, 'users', uid), profile);
    return { id: uid, ...profile };
};

// Self-service registration (email/password)
export const register = async (email: string, password: string, name: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    return createPendingProfile(user.uid, email, name);
};

// Google sign-in (creates profile if first time)
export const signInWithGoogle = async (): Promise<{ user: User; isNewUser: boolean }> => {
    const result = await signInWithPopup(auth, googleProvider);
    const { user } = result;
    // Check if profile already exists
    const existing = await getUserProfile(user.uid);
    if (existing) return { user: existing, isNewUser: false };
    // First-time Google user — create pending profile
    const newUser = await createPendingProfile(
        user.uid,
        user.email || '',
        user.displayName || user.email || 'New User'
    );
    return { user: newUser, isNewUser: true };
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

// Update display name (user profile + all their bookings)
export const updateDisplayName = async (uid: string, newName: string): Promise<void> => {
    const batch = writeBatch(db);

    // Update user profile
    batch.update(doc(db, 'users', uid), { name: newName });

    // Update memberName on all bookings belonging to this user
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    bookingsSnap.docs.forEach(d => {
        if (d.data().memberId === uid) {
            batch.update(doc(db, 'bookings', d.id), { memberName: newName });
        }
    });

    await batch.commit();
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

// =====================================================
// BOOKINGS
// =====================================================

export const subscribeBookings = (callback: (bookings: Booking[]) => void): Unsubscribe => {
    const q = query(collection(db, 'bookings'));
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
        callback(bookings);
    }, (error) => {
        console.error('Error subscribing to bookings:', error);
        callback([]);
    });
};

export const saveBooking = async (booking: Booking): Promise<void> => {
    await setDoc(doc(db, 'bookings', booking.id), booking);
};

export const deleteBookingFromDb = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'bookings', id));
};

// =====================================================
// TABLES
// =====================================================

export const subscribeTables = (callback: (tables: Table[]) => void): Unsubscribe => {
    const q = query(collection(db, 'tables'));
    return onSnapshot(q, (snapshot) => {
        const tables = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Table));
        tables.sort((a, b) => {
            const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
            const prefixA = a.id.replace(/\d/g, '');
            const prefixB = b.id.replace(/\d/g, '');
            if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
            return numA - numB;
        });
        callback(tables);
    }, (error) => {
        console.error('Error subscribing to tables:', error);
    });
};

export const saveTablesToDb = async (tables: Table[]): Promise<void> => {
    // Delete any docs in Firestore that are no longer in the array
    const existingSnap = await getDocs(collection(db, 'tables'));
    const newIds = new Set(tables.map(t => t.id));
    const deletePromises = existingSnap.docs
        .filter(d => !newIds.has(d.id))
        .map(d => deleteDoc(doc(db, 'tables', d.id)));
    // Write each table as its own doc
    const writePromises = tables.map(t => setDoc(doc(db, 'tables', t.id), t));
    await Promise.all([...deletePromises, ...writePromises]);
};

export const initTablesIfEmpty = async (): Promise<void> => {
    try {
        const snapshot = await getDocs(collection(db, 'tables'));
        if (snapshot.empty) {
            await saveTablesToDb(INITIAL_TABLES);
        }
    } catch (error) {
        console.error('Error initializing tables in Firestore:', error);
    }
};

// =====================================================
// TERRAIN BOXES
// =====================================================

export const subscribeTerrainBoxes = (callback: (boxes: TerrainBox[]) => void): Unsubscribe => {
    const q = query(collection(db, 'terrainBoxes'));
    return onSnapshot(q, (snapshot) => {
        const boxes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TerrainBox));
        boxes.sort((a, b) => {
            const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
            const prefixA = a.id.replace(/\d/g, '');
            const prefixB = b.id.replace(/\d/g, '');
            if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
            return numA - numB;
        });
        callback(boxes);
    }, (error) => {
        console.error('Error subscribing to terrain boxes:', error);
    });
};

export const saveTerrainBoxesToDb = async (boxes: TerrainBox[]): Promise<void> => {
    // Delete any docs in Firestore that are no longer in the array
    const existingSnap = await getDocs(collection(db, 'terrainBoxes'));
    const newIds = new Set(boxes.map(b => b.id));
    const deletePromises = existingSnap.docs
        .filter(d => !newIds.has(d.id))
        .map(d => deleteDoc(doc(db, 'terrainBoxes', d.id)));
    // Write each terrain box as its own doc
    const writePromises = boxes.map(b => setDoc(doc(db, 'terrainBoxes', b.id), b));
    await Promise.all([...deletePromises, ...writePromises]);
};

export const initTerrainBoxesIfEmpty = async (): Promise<void> => {
    try {
        const snapshot = await getDocs(collection(db, 'terrainBoxes'));
        if (snapshot.empty) {
            await saveTerrainBoxesToDb(INITIAL_TERRAIN_BOXES);
        }
    } catch (error) {
        console.error('Error initializing terrain boxes in Firestore:', error);
    }
};

// =====================================================
// CANCELLED DATES & SPECIAL EVENT DATES
// These are stored as single docs in a 'config' collection
// =====================================================

const CONFIG_DOC_ID = 'schedule';

export const subscribeScheduleConfig = (callback: (cancelled: string[], specialEvents: string[]) => void): Unsubscribe => {
    const docRef = doc(db, 'config', CONFIG_DOC_ID);
    return onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            callback(data.cancelledDates || [], data.specialEventDates || []);
        } else {
            callback([], []);
        }
    }, (error) => {
        console.error('Error subscribing to schedule config:', error);
        callback([], []);
    });
};

export const saveCancelledDatesToDb = async (dates: string[]): Promise<void> => {
    const docRef = doc(db, 'config', CONFIG_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        await updateDoc(docRef, { cancelledDates: dates });
    } else {
        await setDoc(docRef, { cancelledDates: dates, specialEventDates: [] });
    }
};

export const saveSpecialEventDatesToDb = async (dates: string[]): Promise<void> => {
    const docRef = doc(db, 'config', CONFIG_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        await updateDoc(docRef, { specialEventDates: dates });
    } else {
        await setDoc(docRef, { cancelledDates: [], specialEventDates: dates });
    }
};

// =====================================================
// GAME SYSTEMS
// =====================================================

export const subscribeGameSystems = (callback: (gameSystems: string[]) => void): Unsubscribe => {
    const q = query(collection(db, 'gameSystems'));
    return onSnapshot(q, (snapshot) => {
        const names = snapshot.docs.map(d => d.data().name as string).filter(Boolean);
        names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        callback(names);
    }, (error) => {
        console.error('Error subscribing to game systems:', error);
        callback([]);
    });
};

export const addGameSystem = async (name: string): Promise<void> => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const docRef = doc(db, 'gameSystems', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
        await setDoc(docRef, { name });
    }
};

export const renameGameSystem = async (oldName: string, newName: string): Promise<void> => {
    const batch = writeBatch(db);

    // Find and delete the old game system doc, create the new one
    const oldId = oldName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newId = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    batch.delete(doc(db, 'gameSystems', oldId));
    batch.set(doc(db, 'gameSystems', newId), { name: newName });

    // Update all bookings that reference the old game system
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    bookingsSnap.docs.forEach(d => {
        if (d.data().gameSystem === oldName) {
            batch.update(doc(db, 'bookings', d.id), { gameSystem: newName });
        }
    });

    await batch.commit();
};

export const deleteGameSystem = async (name: string): Promise<void> => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await deleteDoc(doc(db, 'gameSystems', id));
};