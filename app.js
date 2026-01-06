import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// REPLACE with your Firebase configuration from the Firebase Console
const firebaseConfig = {};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// EXPORT DB: This fixes the "export named 'db' not found" error
export const db = getFirestore(app);

// 3.1 Authentication: Login Logic
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

// 3.1 Onboarding: Self-Service Signup
export async function registerUser(data) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password
  );
  // Saves to Firestore with 'pending' status for Admin Approval [cite: 14, 15]
  await setDoc(doc(db, "applicants", userCredential.user.uid), {
    fullName: data.fullName,
    role: data.role,
    region: data.region,
    league: data.league,
    phone: data.phone,
    email: data.email,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

// 3.2 Directory Logic: Fetch only Approved Referees [cite: 8, 26]
export function listenToApprovedReferees(callback) {
  const q = query(
    collection(db, "applicants"),
    where("status", "==", "approved")
  );
  onSnapshot(q, (snapshot) => {
    const referees = [];
    snapshot.forEach((docSnap) => {
      referees.push({ id: docSnap.id, ...docSnap.data() });
    });
    callback(referees);
  });
}

// 3.3 Match Coordination: Triggering Notifications [cite: 21, 24]
export async function sendMatchAlert(targetReferee, currentLoggedInUser) {
  const alertMessage = `My name is ${currentLoggedInUser.name}, we have been appointed by GFA for a match. I am your referee, contact me on ${currentLoggedInUser.phone}.`;

  // Logs the alert to be picked up by a notification service
  await addDoc(collection(db, "alerts"), {
    from: currentLoggedInUser.name,
    fromPhone: currentLoggedInUser.phone,
    toEmail: targetReferee.email,
    toName: targetReferee.fullName,
    timestamp: serverTimestamp(),
  });

  alert(`Match Alert successfully sent to ${targetReferee.fullName}!`);
}
