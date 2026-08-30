# سجل المواد — الواجهة الأمامية (Frontend)

واجهة React حقيقية (Vite) تتصل بالـ Backend عبر REST API و Socket.IO.

## التشغيل

```bash
npm install
cp .env.example .env   # عدّل VITE_API_URL إذا كان الـ backend على عنوان مختلف
npm run dev
```

يفتح على: http://localhost:5173

## البناء للإنتاج

```bash
npm run build
npm run preview   # لتجربة نسخة الإنتاج محلياً
```

ملف `dist/` الناتج هو ما يُرفع لأي استضافة (Nginx, Vercel, Netlify, ...).
