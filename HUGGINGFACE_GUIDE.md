# 🤗 Hugging Face Spaces Deployment Guide | دليل النشر على هجينج فيس

هذا الدليل يشرح لك كيفية تشغيل محرك المنارة أونلاين مجاناً وبدون كارت فيزا!

---

## 1. إنشاء الحساب
1. اذهب إلى [Hugging Face](https://huggingface.co/join).
2. أنشئ حساباً جديداً بإيميلك وقم بتفعيله.

## 2. إنشاء Space جديد
1. اضغط على **+ New** ثم اختر **Space**.
2. **Space Name**: اختر اسماً (مثل `almanara-ai-engine`).
3. **SDK**: اختر **Docker**.
4. **Template**: اختر **Blank**.
5. **Space Hardware**: اختر **CPU Basic (Free)**.
6. اجعل الـ Space **Public** أو **Private** كما تحب.
7. اضغط **Create Space**.

## 3. رفع الملفات
أسهل طريقة هي ربط حسابك بـ GitHub:
1. في صفحة الـ Space، اذهب إلى إعدادات الـ Space.
2. ابحث عن خيار **GitHub Repository** واربط المستودع الخاص بك.
3. بمجرد الربط، سيقوم Hugging Face بقراءة الـ `Dockerfile` وبدء بناء المحرك تلقائياً.

أو يمكنك رفع الملفات يدوياً (Files and versions -> Upload files):
- ارفع ملف `Dockerfile`
- ارفع مجلد `backend`
- ارفع ملف `download_model.py`

## 4. الحصول على الرابط
1. بعد اكتمال البناء (ستظهر كلمة **Running** باللون الأخضر).
2. اضغط على النقاط الثلاث بجانب كلمة "Embed this Space".
3. اختر **Direct URL**.
4. سيكون الرابط بهذا الشكل: `https://yourusername-spacename.hf.space`

---

## 🔗 ربط الواجهة (Vercel)
في إعدادات موقعك على Vercel، قم بتغيير رابط الـ API ليكون الرابط الذي حصلت عليه من Hugging Face:
`https://yourusername-spacename.hf.space/api`

مبروك! المحرك الآن يعمل أونلاين مجاناً 100% وبدون أي بيانات بنكية.
