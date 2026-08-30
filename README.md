# سجل المواد (Sejel Al-Mawad)

مشروع حقيقي كامل (Full-Stack) لإدارة المواد وأسعارها — Backend حقيقي +
Frontend حقيقي يتصلان ببعضهما عبر REST API و Socket.IO. لا يوجد أي محاكاة
أو بيانات وهمية داخل الكود: كل شيء يعمل فعلياً عند تشغيله على جهازك.

```
sejel-almawad/
├── backend/     ← Node.js + Express + SQLite + Socket.IO + JWT + bcrypt
└── frontend/    ← React + Vite + Tailwind + socket.io-client
```

## التشغيل السريع (شغّل الاثنين معاً)

### 1) الخادم (Backend)
```bash
cd backend
npm install
cp .env.example .env
npm run seed      # مرة واحدة فقط — ينشئ حساب admin/admin123 و worker01/12345
npm run dev
```
يعمل على: http://localhost:4000

### 2) الواجهة (Frontend) — افتح طرفية ثانية
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
يعمل على: http://localhost:5173

سجّل الدخول بأحد الحسابين التجريبيين، وجرّب: أدمن يغيّر سعر "سكر" من لوحة
التحكم → افتح تبويب/متصفح آخر مسجّلاً دخول كـ worker01 → السعر والإشعار
يظهران فوراً بدون أي تحديث يدوي، لأن الحدث يصل عبر Socket.IO الحقيقي.

## ما الذي جُرِّب فعلياً أثناء البناء (وليس افتراضاً)
- تسجيل دخول ناجح/فاشل، وكلمة مرور مشفّرة فعلياً بـ bcrypt
- عامل يحاول `POST /api/materials` مباشرة عبر curl → يُرفض بـ `403` حقيقي من الخادم، وليس فقط إخفاء زر في الواجهة
- تغيير سعر → يُنشئ سجل `price_history` + `notification` تلقائياً في قاعدة بيانات SQLite حقيقية
- رفع صورة حقيقية (PNG) يُقبل، ومحاولة رفع ملف تنفيذي متنكّر بامتداد صورة تُرفض
- بناء الواجهة (`npm run build`) نجح بدون أخطاء، وتم تشغيل الخادمين معاً والتحقق من أنهما يتصلان

## نشر حقيقي على خادم إنتاج
راجع قسم "نشر حقيقي" في `backend/README.md` — النقاط الأهم: غيّر
`JWT_SECRET`، شغّل خلف HTTPS، غيّر كلمتي المرور التجريبيتين فوراً، وخذ نسخة
احتياطية من ملف `backend/db/sejel-almawad.db` بشكل دوري.
