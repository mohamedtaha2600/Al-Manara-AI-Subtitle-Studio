# Al-Manara AI Subtitle Studio | استوديو المنارة للترجمة الذكية

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)

Professional AI-powered subtitle/transcription application built with Next.js, FastAPI, and Faster-Whisper.
استوديو احترافي لإنشاء وتعديل الترجمات (Subtitles) باستخدام الذكاء الاصطناعي، مبني بأحدث التقنيات.

---

## ✨ Features | المميزات

- **AI Transcription**: Automatic speech-to-text using OpenAI's Whisper (via Faster-Whisper).
  - **النسخ التلقائي**: تحويل الكلام إلى نصوص تلقائياً باستخدام تقنيات OpenAI Whisper.
- **Multi-Language Support**: Supports 100+ languages including Arabic, English, French, etc.
  - **دعم لغات متعددة**: يدعم أكثر من 100 لغة بما في ذلك العربية والإنجليزية والفرنسية.
- **Smart Translation**: Built-in translation engine for subtitles.
  - **ترجمة ذكية**: محرك مدمج لترجمة الترجمات إلى لغات أخرى.
- **Interactive Timeline**: Professional timeline editor for fine-tuning subtitle timing.
  - **تايم لاين تفاعلي**: محرر احترافي لضبط توقيت الترجمات بدقة.
- **Advanced Export**: Export to SRT, VTT, TXT, and XML for Adobe Premiere.
  - **تصدير متقدم**: تصدير بصيغ SRT و VTT و TXT و XML لبرامج المونتاج.
- **GPU Acceleration**: NVIDIA CUDA support for ultra-fast processing.
  - **تسريع الرسوميات**: دعم NVIDIA CUDA للمعالجة فائقة السرعة.

---

## 🛠 Tech Stack | التقنيات المستخدمة

- **Frontend**: Next.js 14, TypeScript, Zustand, CSS Modules.
- **Backend**: FastAPI (Python), Faster-Whisper, FFmpeg.
- **AI Models**: Whisper (Tiny, Base, Small, Medium, Large).

---

## 🚀 Getting Started | كيف تبدأ

## 🚀 Quick Start | كيف تبدأ بسرعة

To use the studio, follow these **3 simple steps**:
لاستخدام الاستوديو، اتبع هذه **الخطوات الثلاث البسيطة**:

### 1️⃣ Step 1: Install Dependencies | الخطوة الأولى: التثبيت
Double-click `install.bat`. This will install all necessary libraries for the Frontend and Backend.
قم بتشغيل ملف `install.bat` لتثبيت كافة المكتبات المطلوبة للواجهة والخلفية.

### 2️⃣ Step 2: Download AI Model | الخطوة الثانية: تحميل النموذج
Double-click `download_model.bat`. 
- Select option **[4]** to download the `medium` model (Recommended for Arabic).
- Select option **[9]** if you have an NVIDIA GPU to enable super-fast transcription.
قم بتشغيل `download_model.bat` واختر رقم **[4]** لتحميل النموذج المتوسط (الأفضل للعربية)، ورقم **[9]** إذا كان لديك كارت شاشة NVIDIA.

### 3️⃣ Step 3: Run the Studio | الخطوة الثالثة: التشغيل
Double-click `start_smart.bat`.
- The studio will open automatically in your browser at `http://localhost:3000`.
قم بتشغيل `start_smart.bat` وسيفتح الاستوديو تلقائياً في المتصفح.

---

## 🛠 Prerequisites | المتطلبات الأساسية

- **Windows 10/11**
- **Python 3.9+** (Make sure it's in PATH)
- **Node.js 18+**
- **FFmpeg** (Included or installed in system)

---

## 📁 Project Structure | هيكل المشروع

- `/frontend`: Next.js application (The Studio UI).
- `/backend`: FastAPI server (The AI Processing Engine).
- `/models`: Storage for downloaded AI models.
- `/shared`: Shared assets, uploads, and exports.

---

## 📜 License | الحقوق

This project is licensed under the MIT License.
هذا المشروع مرخص بموجب رخصة MIT - جميع الحقوق محفوظة للمطور.

Developed with ❤️ by **Al-Manara Team**.
تم التطوير بواسطة فريق **المنارة**.
