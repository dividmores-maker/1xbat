// ==========================================================
// إعدادات Firebase - حط بياناتك هنا
// ==========================================================
// هتلاقي البيانات دي في: Firebase Console > Project Settings > General > Your apps > SDK setup and configuration

const firebaseConfig = {
  apiKey: "AIzaSyBvnRi54dRrfV3FW5HFrKXI1RDobSVCq1g",
  authDomain: "xbat-dabcd.firebaseapp.com",
  projectId: "xbat-dabcd",
  storageBucket: "xbat-dabcd.firebasestorage.app",
  messagingSenderId: "108773532038",
  appId: "1:108773532038:web:d9a5c115bb246a1d6c0c07"
};

// ==========================================================
// إعدادات عامة للمنصة
// ==========================================================
const APP_CONFIG = {
  startingPoints: 10,           // عدد النقاط اللي كل يوزر يبدأ بيها
  adminEmail: "dividmoresomp@gmail.com", // إيميل الأدمن الوحيد المسموح له بدخول لوحة التحكم
  appName: "دوري التسلية",
  games: ["كورة قدم", "بينج بونج", "شطرنج", "بلايستيشن", "دومينو"]
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
