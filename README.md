# Edumeet Frontend

Edumeet is a modern, AI-powered learning platform designed to transform online education into an interactive, structured, and outcome-driven experience. Built with a focus on the African learning ecosystem, it provides students with a professional AI Tutor and tutors with powerful curriculum creation tools.

## 🚀 Core Features

### 🎓 For Students
- **Immersive Course Player**: Integrated YouTube resource player with a distraction-free environment.
- **AI-Grounded Assistant**: A professional AI tutor available 24/7 to explain complex concepts based strictly on lesson transcripts.
- **Multimodal Interaction**: Support for voice synthesis (TTS) and voice input (STT) within the chat interface.
- **Structured Progression**: A "Knowledge Tree" navigation system that gates advanced content behind assessments.
- **Curriculum Progress**: Visual tracking of course completion at the top of the workspace.
- **Seamless Payments**: Native integration with Paystack for course enrollment.

### 📝 For Tutors & Admins
- **AI-Assisted Creation**: One-click generation of course summaries, lecture transcripts, and quiz questions using Gemini.
- **Mastery Control**: Define flexible assessment paths including mid-term exams, final exams, and practical Capstone projects.
- **Tutor Dashboard**: Manage enrolled students, review Capstone submissions, and schedule live classroom sessions.
- **Admin Panel**: High-level system overview including revenue estimation, user provisioning, and system health checks.

## 🛠️ Tech Stack

- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Integration**: Google Gemini SDK (Flash 2.5)
- **Payments**: Paystack API
- **State Management**: React Hooks (useState, useEffect, useRef)

## ⚙️ Installation & Setup

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Create a `.env` file in the root directory and add:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_API_URL=your_microservice_url
   ```
4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

## 📱 Design Philosophy

- **Natural Navigation**: Floating, semi-transparent navigation arrows that are mobile-responsive.
- **Natural Language**: Conversational button naming (e.g., "Ask me", "Hand in my answers") to reduce cognitive load.
- **Clean UI**: Natural height expansion to avoid nested scrollbars and maintain an "aesthetic" set up.

---
© 2024 Edumeet Inc. Built with ❤️ for the future of African learning.