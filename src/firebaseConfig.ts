import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAw2giJZYmLM8vG3BsD4EBFOiFhn2H3jVg",
  authDomain: "axes-and-ales-booking-site.firebaseapp.com",
  projectId: "axes-and-ales-booking-site",
  storageBucket: "axes-and-ales-booking-site.firebasestorage.app",
  messagingSenderId: "782018808364",
  appId: "1:782018808364:web:14dd94577fee6647531f89",
  measurementId: "G-TJ97F573Q5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);