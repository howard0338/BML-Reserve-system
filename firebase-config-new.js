// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBdztuV26T9LDcr4zdesm367jAzCJkYiLE",
  authDomain: "reserve-system-52f1f.firebaseapp.com",
  databaseURL: "https://reserve-system-52f1f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "reserve-system-52f1f",
  storageBucket: "reserve-system-52f1f.appspot.com",
  messagingSenderId: "859902265661",
  appId: "1:859902265661:web:6073a1538f55a792e6dd54",
  measurementId: "G-Y90GLL60F8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const auth = getAuth(app);

// Export the necessary Firebase services
export { app, analytics, db, auth };
