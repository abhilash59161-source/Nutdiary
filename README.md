# 🥗 NutDiary — AI Food Diary, Nutrition Tracker & Clinical Diet Suite

An intelligent nutrition tracking and dietary planning platform powered by Gemini AI. Scan meal photos to identify ingredients and breakdown nutrients, monitor daily caloric intake with dynamic dashboards, track 7-day caloric trends with interactive Recharts visualizations, generate personalized therapeutic diets for health conditions (diabetes, hypertension, PCOS, etc.), and calculate family weekly ration estimates.

Built with **React 19**, **TypeScript**, **Tailwind CSS**, **Recharts**, **Express**, and **Google Gemini API**.

---

## 🌟 Key Features

- 📸 **AI Photo Food Recognition**: Snap or upload any meal photo to identify ingredients and estimate calories, protein, carbs, and fats automatically.
- 🔍 **Global Food & Nutrition Search**: Search over thousands of everyday foods, branded items, and regional recipes with detailed macro and micronutrient breakdowns.
- 🔔 **Intelligent Meal Reminders & Push Notifications**: Automated in-app toast prompts and Web Push Notifications for breakfast, lunch, and dinner times. Detects unlogged meals, plays a gentle synthesizer chime, and provides one-click direct meal logging.
- 💧 **Water Intake Tracker & Nutritional Badges**: Customizable daily hydration goal (default 8 glasses / 2000 ml) with live performance achievement badges.
- 📈 **Weekly Progress Analytics (Recharts)**: Interactive 7-day caloric intake trend line compared against your daily caloric goal, complete with custom tooltips, goal consistency badges, and peak intake tracking.
- 🎯 **Personalized Diet Planner**: Customized meal schedules tailored to individual targets (weight loss, muscle gain, keto, athletic performance).
- 🏥 **Clinical Condition Diet Support**: Medical nutrition therapy protocols for managing specific conditions such as Diabetes (Type 1 & 2), Hypertension, Fatty Liver, PCOS, GERD, and customizable illness queries.
- 👨‍👩‍👧‍👦 **Family Plan & Weekly Ration Calculator**: Calculate required pantry staples, grains, pulses, dairy, and produce for household members based on adult and child ratios.
- 📄 **Clinical Nutrition Report Export (PDF & CSV)**: Export comprehensive dietary adherence records formatted for medical consultations (endocrinologists, physicians, and dietitians). Includes patient demographics, observed macronutrient averages, target adherence rate, itemized meal tables, and clinical signature lines.
- 🛒 **Smart Grocery Shopping List**: Intelligent categorized shopping planner (Produce, Proteins, Dairy, Grains, Healthy Fats, Hydration). Generate shopping items directly tailored to your diet goal (Muscle Gain, Keto/Low-Carb, Weight Loss, Clean Eating), track purchased items, and copy/print formatted lists.
- 📱 **Share Daily Progress**: Generates high-resolution 1080×1080 social media summary cards displaying calories, macros, hydration, and unlocked badges. Includes instant PNG export, clipboard image copy, native Web Share API, and 1-click posting to X (Twitter) and WhatsApp.
- 📱 **Progressive Web App (PWA) Ready**: Works in browser and can be installed directly to home screens on Android, iOS, or Desktop without using app stores.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Motion
- **Backend / Proxy**: Express.js with Node.js / Vite Middleware
- **AI Engine**: Google Gemini API (`@google/genai`) for image analysis and personalized clinical meal planning
- **Build Tool**: Vite

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm
- A Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   cd YOUR_REPOSITORY_NAME
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   PORT=3000
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 📦 Production Build

```bash
npm run build
npm start
```

---

## 📱 Installing on Mobile (Without App Store)

NutDiary runs as an installable Progressive Web App (PWA):
1. **Android (Chrome)**: Tap the `⋮` menu button at top right → Select **"Add to Home Screen"** or **"Install app"**.
2. **iOS (Safari)**: Tap the **Share** button (box with upward arrow) at bottom → Scroll down and tap **"Add to Home Screen"**.

---

## 📄 License

This project is licensed under the Apache-2.0 License.
