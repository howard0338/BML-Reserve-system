// Firebase 服務模組
import { db } from './firebase.js';
import { ref, set, get, child, push, remove, onValue, off } from 'firebase/database';

// 建立預約
export function addReservation(user, date, machine, timeSlot, contactInfo) {
    const reservationRef = ref(db, `reservations/${date}/${machine}/${timeSlot}`);
    return set(reservationRef, {
        user: user,
        contactInfo: contactInfo,
        time: new Date().toISOString(),
        machine: machine,
        date: date,
        timeSlot: timeSlot
    });
}

// 讀取特定日期的所有預約
export async function getReservations(date) {
    try {
        const snapshot = await get(child(ref(db), `reservations/${date}`));
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log("No data available for date:", date);
            return null;
        }
    } catch (error) {
        console.error("Error getting reservations:", error);
        return null;
    }
}

// 讀取所有預約資料
export async function getAllReservations() {
    try {
        const snapshot = await get(ref(db, 'reservations'));
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log("No reservations available");
            return null;
        }
    } catch (error) {
        console.error("Error getting all reservations:", error);
        return null;
    }
}

// 刪除預約
export function deleteReservation(date, machine, timeSlot) {
    const reservationRef = ref(db, `reservations/${date}/${machine}/${timeSlot}`);
    return remove(reservationRef);
}

// 更新預約
export function updateReservation(date, machine, timeSlot, newData) {
    const reservationRef = ref(db, `reservations/${date}/${machine}/${timeSlot}`);
    return set(reservationRef, newData);
}

// 監聽預約變化（即時同步）
export function listenToReservations(date, callback) {
    const reservationsRef = ref(db, `reservations/${date}`);
    onValue(reservationsRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback(null);
        }
    });
    
    // 返回取消監聽的函數
    return () => off(reservationsRef);
}

// 監聽所有預約變化
export function listenToAllReservations(callback) {
    const reservationsRef = ref(db, 'reservations');
    onValue(reservationsRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback(null);
        }
    });
    
    // 返回取消監聽的函數
    return () => off(reservationsRef);
}

// 儲存儀器資料
export function saveInstruments(instruments) {
    const instrumentsRef = ref(db, 'instruments');
    return set(instrumentsRef, instruments);
}

// 讀取儀器資料
export async function getInstruments() {
    try {
        const snapshot = await get(ref(db, 'instruments'));
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log("No instruments available");
            return null;
        }
    } catch (error) {
        console.error("Error getting instruments:", error);
        return null;
    }
}

// 監聽儀器變化
export function listenToInstruments(callback) {
    const instrumentsRef = ref(db, 'instruments');
    onValue(instrumentsRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback(null);
        }
    });
    
    return () => off(instrumentsRef);
}

// 檢查特定時間段是否已被預約
export async function isTimeSlotBooked(date, machine, timeSlot) {
    try {
        const snapshot = await get(ref(db, `reservations/${date}/${machine}/${timeSlot}`));
        return snapshot.exists();
    } catch (error) {
        console.error("Error checking time slot:", error);
        return false;
    }
}

// 取得特定機器的預約記錄
export async function getMachineReservations(machine) {
    try {
        const snapshot = await get(ref(db, 'reservations'));
        if (snapshot.exists()) {
            const allReservations = snapshot.val();
            const machineReservations = {};
            
            // 遍歷所有日期，找出該機器的預約
            Object.keys(allReservations).forEach(date => {
                if (allReservations[date][machine]) {
                    machineReservations[date] = allReservations[date][machine];
                }
            });
            
            return machineReservations;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting machine reservations:", error);
        return null;
    }
}
