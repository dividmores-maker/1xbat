# دوري التسلية 🏆 — تعليمات الإعداد

## فكرة المشروع
منصة دوري داخلي للألعاب (كورة، بينج بونج، شطرنج، بلايستيشن، دومينو):
- اليوزر يعمل حساب ويبدأ بـ **10 نقاط**
- الأدمن يضيف ماتشات يدويًا
- اليوزرز يراهنوا بنقاط على مين هيكسب (وممكن يتوقعوا النتيجة بالظبط)
- لما الماتش يخلص، الأدمن يدخل النتيجة والنقاط تتوزع تلقائيًا (الفايز ياخد ضعف اللي راهن بيه)
- في لوحة ترتيب (Leaderboard) لكل اللاعبين

---

## الخطوة 1: عمل مشروع Firebase

1. روح على https://console.firebase.google.com
2. دوس "Add Project" واديله اسم
3. من القائمة الجانبية: **Build > Authentication** → فعّل **Email/Password**
4. من القائمة الجانبية: **Build > Firestore Database** → دوس **Create database** → اختار **Production mode**

---

## الخطوة 2: هات بيانات الـ Config

1. من **Project Settings** (الترس بجانب Project Overview)
2. تحت **Your apps** دوس على أيقونة الويب `</>`
3. سجّل اسم للتطبيق، وهيديك object فيه `apiKey`, `authDomain`, إلخ

افتح ملف `js/firebase-config.js` واستبدل القيم دي:

```js
const firebaseConfig = {
  apiKey: "ضع_API_KEY_هنا",
  authDomain: "ضع_AUTH_DOMAIN_هنا",
  projectId: "ضع_PROJECT_ID_هنا",
  storageBucket: "ضع_STORAGE_BUCKET_هنا",
  messagingSenderId: "ضع_MESSAGING_SENDER_ID_هنا",
  appId: "ضع_APP_ID_هنا"
};
```

وكمان حدد إيميل الأدمن (لازم يكون نفس الإيميل اللي هتعمل بيه حساب):

```js
const APP_CONFIG = {
  startingPoints: 10,
  adminEmail: "ضع_ايميل_الادمن_هنا@example.com",
  ...
};
```

> ⚠️ **مهم:** لازم تعمل حساب بنفس الإيميل ده من صفحة `index.html` عشان النظام يديله صلاحية أدمن تلقائيًا وقت التسجيل.

---

## الخطوة 3: حط قواعد الأمان (Firestore Rules)

1. روح على **Firestore Database > Rules**
2. افتح ملف `firestore.rules` من المشروع، انسخ المحتوى بالكامل
3. الصقه مكان القواعد الموجودة في الـ Console، ودوس **Publish**

---

## الخطوة 4: ارفع الملفات

تقدر تستضيف المشروع على:
- **Firebase Hosting** (الأسهل، مجاني، وهيشتغل مع نفس مشروع Firebase)
- أو أي استضافة عادية (لأن المشروع HTML/CSS/JS بسيط بدون Backend منفصل)

### لو هتستخدم Firebase Hosting:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# اختار نفس الـ project اللي عملته
# public directory: اكتب . (يعني المجلد الحالي)
firebase deploy
```

---

## هيكل المشروع

```
sports-betting-league/
├── index.html          ← صفحة تسجيل الدخول / إنشاء حساب
├── dashboard.html       ← الصفحة الرئيسية لليوزر (ماتشات + ترتيب)
├── admin.html           ← لوحة تحكم الأدمن
├── firestore.rules      ← قواعد أمان قاعدة البيانات
├── css/
│   └── style.css
└── js/
    ├── firebase-config.js   ← هنا تحط بياناتك
    ├── auth.js               ← تسجيل دخول/حساب
    ├── matches.js             ← منطق الماتشات والرهان لليوزر
    └── admin.js                ← منطق لوحة الأدمن
```

---

## أول حساب (الأدمن)

1. افتح `index.html`
2. اعمل حساب بنفس الإيميل اللي حطيته في `adminEmail`
3. النظام هيديك صلاحية أدمن تلقائيًا، وهيظهرلك زرار "لوحة الأدمن" في الداشبورد

---

## ملاحظات مهمة

- النقاط دي **رمزية للتسلية بس**، مفيش فلوس حقيقية في النظام
- لما اليوزر يكسب رهان، ياخد **ضعف** النقاط اللي راهن بيها
- لو الأدمن حذف ماتش لسه الرهان فيه مفتوح/مقفول (مش متخلص)، النقاط بترجع تلقائيًا لليوزرز
- ممكن تغيّر عدد النقاط اللي اليوزر يبدأ بيها من `APP_CONFIG.startingPoints`
- ممكن تضيف/تشيل ألعاب من قايمة `APP_CONFIG.games`
