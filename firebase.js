// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, get, onValue, push, remove } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Your web app's Firebase configuration
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

// 預約資料管理函數
export async function writeReservation(reservationData) {
  try {
    const reservationRef = ref(db, 'reservations');
    const newReservationRef = push(reservationRef);
    await set(newReservationRef, {
      ...reservationData,
      id: newReservationRef.key,
      timestamp: new Date().toISOString()
    });
    console.log('預約資料已寫入:', newReservationRef.key);
    return newReservationRef.key;
  } catch (error) {
    console.error('寫入預約資料失敗:', error);
    throw error;
  }
}

export async function readAllReservations() {
  try {
    const reservationsRef = ref(db, 'reservations');
    const snapshot = await get(reservationsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log('沒有找到預約資料');
      return null;
    }
  } catch (error) {
    console.error('讀取預約資料失敗:', error);
    throw error;
  }
}

export function listenToReservations(callback) {
  const reservationsRef = ref(db, 'reservations');
  onValue(reservationsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
}

export async function writeInstruments(instrumentsData) {
  try {
    const instrumentsRef = ref(db, 'instruments');
    await set(instrumentsRef, instrumentsData);
    console.log('儀器資料已寫入');
  } catch (error) {
    console.error('寫入儀器資料失敗:', error);
    throw error;
  }
}

export async function readInstruments() {
  try {
    const instrumentsRef = ref(db, 'instruments');
    const snapshot = await get(instrumentsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log('沒有找到儀器資料');
      return null;
    }
  } catch (error) {
    console.error('讀取儀器資料失敗:', error);
    throw error;
  }
}

export function listenToInstruments(callback) {
  const instrumentsRef = ref(db, 'instruments');
  onValue(instrumentsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
}

export { db, auth, app, analytics, ref, set, get, onValue, push, remove, signInAnonymously, onAuthStateChanged };
