# ☁️ Oracle Cloud Deployment Guide | دليل النشر على أوراكل كلاود

هذا الدليل يشرح لك كيفية تشغيل محرك المنارة أونلاين مجاناً تماماً باستخدام Oracle Cloud Free Tier.

---

## 1. إنشاء الحساب (Sign Up)
1. اذهب إلى [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. قم بإنشاء حساب جديد (يتطلب إدخال فيزا للتأكد من هويتك، لن يتم خصم أي مبالغ).
3. اختر منطقة (Region) قريبة منك (مثل Frankfurt أو Zurich).

## 2. إنشاء السيرفر (Create Instance)
1. من لوحة التحكم، اختر **Create a VM Instance**.
2. **Image and Shape**:
   - اختر **Canonical Ubuntu** (نسخة 22.04 أو أحدث).
   - في الـ **Shape**، اختر **Ampere (ARM)** وخصص له **4 OCPUs** و **24 GB RAM**. (هذا هو العرض المجاني الأقوى).
3. قم بتحميل الـ **SSH Keys** (مهم جداً للدخول للسيرفر).
4. اضغط **Create**.

## 3. فتح المنافذ (Firewall/Ingress Rules)
يجب فتح منفذ 8000 لكي يعمل المحرك:
1. اذهب إلى **Virtual Cloud Network** -> **Security Lists**.
2. أضف **Ingress Rule**:
   - Source: `0.0.0.0/0`
   - Protocol: `TCP`
   - Destination Port Range: `8000`

## 4. تشغيل السيرفر (Setup)
1. ادخل للسيرفر عبر الـ Terminal (باستخدام SSH).
2. قم برفع ملفات المشروع أو عمل `git clone` لمستودعك.
3. قم بتشغيل سكربت الإعداد التلقائي الذي جهزته لك:
   ```bash
   chmod +x deploy_linux.sh
   ./deploy_linux.sh
   ```

## 5. تشغيل المحرك في الخلفية (Always On)
لكي لا يتوقف المحرك عند إغلاق الجهاز، استخدم `screen`:
```bash
screen -S almanara_backend
source venv/bin/activate
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
(اضغط `Ctrl+A` ثم `D` للخروج من الشاشة وتركها تعمل في الخلفية).

---

## 🔗 ربط الواجهة (Vercel)
بمجرد تشغيل السيرفر، ستحصل على **Public IP Address** (مثل `152.67.x.x`).
قم بتغيير رابط الـ API في إعدادات موقعك على Vercel ليكون:
`http://152.67.x.x:8000`

مبروك! محركك الآن يعمل أونلاين مجاناً 24/7.
