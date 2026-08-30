# سجل المواد — الخادم (Backend API)

خادم حقيقي (Node.js + Express + SQLite + Socket.IO) — ليس محاكاة. تم اختباره فعلياً:
تسجيل دخول ببيانات مشفّرة (bcrypt)، صلاحيات RBAC مرفوضة بـ 403 حقيقي من الخادم،
رفع صور حقيقي بتحقق من النوع والحجم، وتحديث فوري عبر Socket.IO عند تغيير الأسعار.

## المتطلبات
- Node.js 18 أو أحدث

## التشغيل

```bash
npm install
cp .env.example .env        # عدّل JWT_SECRET قبل أي استخدام حقيقي
npm run seed                 # ينشئ أول حساب أدمن وعامل تجريبي (مرة واحدة فقط)
npm run dev                  # يشغّل الخادم مع إعادة تشغيل تلقائي عند التعديل
# أو للإنتاج: npm start
```

الخادم يعمل على: `http://localhost:4000`
قاعدة البيانات ملف واحد: `db/sejel-almawad.db` (SQLite — لا يحتاج تثبيت خادم قواعد بيانات منفصل).

### الحسابات الأولية (غيّرها فوراً في الإنتاج)
| الدور | Username | Password |
|---|---|---|
| Super Admin | admin | admin123 |
| Worker | worker01 | 12345 |

## نقاط الـ API

### Auth
- `POST /api/auth/login` `{ username, password }` → `{ token, user }`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Materials (المشاهدة لأي مستخدم مسجّل، التعديل/الحذف/الإضافة أدمن فقط)
- `GET /api/materials`
- `GET /api/materials/:id`
- `POST /api/materials` (multipart/form-data: name, price, image?) — **admin only**
- `PUT /api/materials/:id` (multipart/form-data) — **admin only** — يُنشئ تلقائياً سجل سعر + إشعار + بث Socket.IO عند تغيّر السعر
- `DELETE /api/materials/:id` — **admin only**

### Users (العمال + الأدمن)
- `GET /api/users?role=worker|admin` — **admin only**
- `POST /api/users` `{name, username, password, role}` — **admin only** (إضافة أدمن تتطلب super_admin)
- `PUT /api/users/:id`
- `PATCH /api/users/:id/status` (تفعيل/تعطيل)
- `DELETE /api/users/:id`

### Notifications
- `GET /api/notifications` (مع `is_read` خاص بالمستخدم الحالي)
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`

### Price History (admin only)
- `GET /api/price-history?material=&admin=&q=&from=&to=`

### Audit Logs (super_admin only)
- `GET /api/audit-logs`

## الأمان المطبَّق فعلياً
- كلمات المرور: **bcrypt** (12 rounds) — لا تُخزَّن كنص عادي أبداً
- الجلسات: **JWT** موقّع بمفتاح سري، صالح لمدة `JWT_EXPIRES_IN`
- **RBAC حقيقي على مستوى الخادم**: أي طلب من عامل لتعديل/حذف/إضافة يُرفض بـ `403 Forbidden` من الـ middleware، بغض النظر عمّا تُرسله الواجهة
- **Rate limiting** على تسجيل الدخول (10 محاولات/15 دقيقة لكل IP)
- **رفع الصور**: التحقق من الامتداد + الـ MIME type الفعلي + حجم أقصى 8MB، وتُولَّد أسماء ملفات عشوائية آمنة (لا يُعتمد على اسم الملف القادم من المستخدم)، ومجلد الصور يتطلب مصادقة للوصول إليه
- **Audit Logs**: كل عملية دخول/إضافة/تعديل/حذف تُسجَّل مع المستخدم والتوقيت
- رسائل الخطأ عامة ولا تكشف تفاصيل داخلية (لا تؤكد مثلاً وجود اسم مستخدم من عدمه)
- Helmet + CORS مُقيّد بـ `CLIENT_ORIGIN`

## التحديث الفوري (Real-Time)
عند تغيير السعر، يُنفَّذ هذا التسلسل داخل نفس الطلب:
تحديث `materials` → إدراج سجل في `price_history` → إدراج `notification` →
بث حدث `PRICE_UPDATED` عبر Socket.IO لكل العمال والأدمن المتصلين فوراً —
دون أي حاجة لتحديث الصفحة أو إعادة تسجيل الدخول.

## استكشاف الأخطاء (Troubleshooting)
- إذا ظهر خطأ متعلق بـ `node-gyp` أو `better-sqlite3` أثناء `npm install`:
  هذا يحدث نادراً إذا فشل تحميل الملف الثنائي الجاهز (prebuilt binary).
  جرّب `npm install` مرة أخرى (عادة مشكلة اتصال مؤقتة)، أو تأكد من استخدام
  Node.js 18+ رسمي. على ويندوز، إذا استمرت المشكلة، ثبّت "Visual Studio
  Build Tools" (لدعم البناء من المصدر كخيار احتياطي فقط).
- إذا رفض المتصفح الاتصال بالـ Socket.IO: تأكد أن `CLIENT_ORIGIN` في `.env`
  يطابق فعلياً عنوان الواجهة (مثل `http://localhost:5173`).

## نشر حقيقي (Production)
- استخدم `JWT_SECRET` عشوائي وطويل فعلاً (لا تستخدم القيمة الافتراضية)
- شغّل خلف HTTPS (عبر Nginx / Caddy) — لا تُشغّله بدون TLS في الإنتاج
- ضع `CLIENT_ORIGIN` على نطاق الواجهة الفعلي فقط
- خذ نسخة احتياطية دورية من ملف `db/sejel-almawad.db`
- فكّر بنقل قاعدة البيانات إلى PostgreSQL/MySQL إذا كبر عدد المستخدمين/الطلبات بشكل كبير (better-sqlite3 يخدم آلاف الطلبات/الثانية وهو كافٍ لمعظم الاستخدامات الصغيرة والمتوسطة)
