// ==========================================================
// auth.js - تسجيل الدخول / إنشاء حساب
// ==========================================================

function showError(message) {
  const el = document.getElementById('errorMsg');
  el.textContent = message;
  el.style.display = 'block';
}

function hideError() {
  const el = document.getElementById('errorMsg');
  el.style.display = 'none';
}

function translateError(code) {
  const map = {
    'auth/email-already-in-use': 'الإيميل ده مستخدم بالفعل',
    'auth/invalid-email': 'صيغة الإيميل غلط',
    'auth/weak-password': 'كلمة السر لازم تكون 6 حروف على الأقل',
    'auth/user-not-found': 'مفيش حساب بالإيميل ده',
    'auth/wrong-password': 'كلمة السر غلط',
    'auth/invalid-credential': 'بيانات الدخول غلط',
    'auth/too-many-requests': 'محاولات كتير غلط، حاول تاني بعد شوية'
  };
  return map[code] || 'حصل خطأ، حاول تاني';
}

// ----- إنشاء حساب جديد -----
async function handleSignup(e) {
  e.preventDefault();
  hideError();

  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const btn = document.getElementById('signupBtn');

  if (!name || !email || !password) {
    showError('من فضلك املا كل الخانات');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'جاري إنشاء الحساب...';

  let createdUid = null;

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    createdUid = cred.user.uid;

    // إنشاء بروفايل اليوزر في Firestore برصيد البداية
    try {
      await db.collection('users').doc(createdUid).set({
        name: name,
        email: email,
        points: APP_CONFIG.startingPoints,
        wins: 0,
        losses: 0,
        isAdmin: email.toLowerCase() === APP_CONFIG.adminEmail.toLowerCase(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (firestoreErr) {
      console.error('فشل حفظ بيانات اليوزر في Firestore:', firestoreErr);
      showError('اتعمل الحساب في نظام الدخول بس فشل حفظ بياناتك في قاعدة البيانات. السبب الأرجح: قواعد الأمان (Firestore Rules) لسه مش متظبطة صح. التفاصيل: ' + firestoreErr.message);
      btn.disabled = false;
      btn.textContent = 'إنشاء حساب';
      return;
    }

    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error('فشل إنشاء الحساب:', err);
    showError(translateError(err.code));
    btn.disabled = false;
    btn.textContent = 'إنشاء حساب';
  }
}

// ----- تسجيل الدخول -----
async function handleLogin(e) {
  e.preventDefault();
  hideError();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');

  if (!email || !password) {
    showError('من فضلك املا كل الخانات');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'جاري تسجيل الدخول...';

  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showError(translateError(err.code));
    btn.disabled = false;
    btn.textContent = 'دخول';
  }
}

// ----- تسجيل خروج -----
async function handleLogout() {
  await auth.signOut();
  window.location.href = 'index.html';
}

// ----- حماية الصفحات: لازم يكون مسجل دخول -----
function requireAuth(callback) {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      callback(user);
    }
  });
}

// ----- حماية صفحة الأدمن -----
function requireAdmin(callback) {
  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists) {
      console.warn('بيانات اليوزر مش موجودة في Firestore - هيتم تحويله للداشبورد');
      window.location.href = 'dashboard.html';
      return;
    }
    const userData = userDoc.data();
    if (!userData.isAdmin) {
      window.location.href = 'dashboard.html';
      return;
    }
    callback(user, userData);
  });
}
