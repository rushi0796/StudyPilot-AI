# StudyPilot AI – AI-Powered Personalized Study Assistant

> **Academic Capstone Project**  
> **Institution:** Sanjay Ghodawat University, Kolhapur  
> **Department:** Department of Artificial Intelligence  
> **Program:** B.Tech in Artificial Intelligence & Machine Learning (2nd Year, Semester III)  
> **Team:** Team Codex  

---

## 👥 Team Codex Members

| Member Name | Role in Project | Core Responsibilities |
| :--- | :--- | :--- |
| **Aken Rushikesh Gopal** | **Team Leader & Lead Architect** | System Architecture, Full-Stack Design, Answer Evaluation Engine |
| **Shaik Imam Hussain** | **AI & Speech Systems Lead** | Web Speech API Integration, Hindi & Telugu Multilingual Translation Mapping |
| **Dasari Aswan Kumar** | **Curriculum & Question Bank Engineer** | Marks-Wise Rubric Design (2, 3, 4, 5, 7, 10M), Syllabus Parsing & Mapping |
| **Lajaree Ashish Deorkar** | **UI/UX Designer & Learning Experience Lead** | Design System, Spaced-Repetition Revision Planner, Progress Analytics |

---

## 🎯 Product Vision & Overview

**StudyPilot AI** is an AI-powered personalized study assistant tailored for engineering and college students. It helps students navigate their university syllabus, break down challenging theoretical and mathematical concepts into progressive intuitive explanations, practise marks-wise university examination questions, write and receive rubric-based feedback on subjective answers, and learn through multilingual explanations (English, Hindi, Telugu) with native voice narration.

---

## 🌟 Key Functional Modules

1. **Academic Onboarding Flow:** 6-step interactive onboarding capturing University, Degree Course, Department/Branch, Year, Semester, active subjects, preferred language, and learning preferences.
2. **Personalized Dashboard:** Student profile greeting, current semester pills, "Continue Studying" action, continue learning topic card, recent study history, recommended revisions, weekly activity graph, and quick hub.
3. **AI Study Assistant (Tutor):** Conversational AI tutor with subject/topic selectors, language toggles, difficulty modes (Simple, Standard, Detailed), progressive **"Explain More Simply"** (recursive simplification loops), **"Give Me an Example"**, and **"Test My Understanding"** with in-chat mini-quizzes.
4. **Voice & Multilingual Learning:** English, Hindi (हिंदी), and Telugu (తెలుగు) cross-lingual support with native Web Speech API audio synthesis, play/pause/resume/stop controls, and waveform animations.
5. **My Subjects & Syllabus Explorer:** Units and chapters breakdown, learning objectives, important exam concepts, topic status toggles (*Not Started* → *In Progress* → *Completed* with live progress recalculation), and syllabus file upload simulation.
6. **Marks-Wise Question Bank:** Comprehensive question repository indexed by university marks (2, 3, 4, 5, 7, and 10 Marks), search and difficulty filters, official marking rubrics, model answers, and "Practise Now" bridges.
7. **Practice Tests & Quizzes:** Timed examination runner with live countdown timer, question navigator palette, MCQs, short answers, mark-for-review, submit modal, score breakdown, and auto-recommendation of missed questions to the Revision Planner.
8. **AI Answer Evaluator (Flagship):** Interactive answer grading workstation where students select marks (2-10M), write subjective answers, and receive estimated marks, correct concepts identified, important missing points, and model answers.
9. **Revision Planner:** Spaced-repetition revision manager with priority flags (High, Medium, Low), automated capture of quiz and evaluator weaknesses, task completion checkboxes, and custom task creation.
10. **Learning Progress & Analytics:** Academic diagnostics, subject syllabus completion bars, strong vs. weak concept analysis, study session history, and exportable faculty report.
11. **Settings & Customization:** Student profile editing, appearance palette toggle (Deep Navy `#0B1020` vs Light Surface), voice preferences, and demo data reset.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Design System:** Deep Navy (`#0B1020`), Electric Blue (`#2F6BFF`), White/Surface (`#F5F7FA`), Subtle Violet (`#8B5CF6`)
- **Backend Architecture:** Python FastAPI (`server/main.py`) with SQLite (`studypilot.db`)
- **Voice Engine:** Web Speech API (`SpeechSynthesisUtterance`) with multi-accent support (`en-IN`, `hi-IN`, `te-IN`)
- **Build Tool:** Vite 6 with production bundling

---

## 🚀 Running the Project

### 1. Frontend (Vite + React)
```bash
# In the project root directory
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Backend (FastAPI - Optional)
```bash
# In a second terminal window
cd server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API Documentation will be live at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 🎓 Academic Demonstration Guide for Faculty

1. **Step 1:** Launch the application; observe the **6-Step Academic Onboarding** configuring Sanjay Ghodawat University 2nd-Year AI details.
2. **Step 2:** Inspect the **Dashboard**; test the active subject switcher and view the weekly study activity chart.
3. **Step 3:** Click **"Ask AI"** in the sidebar; ask *"Explain database normalization in simple language"*. Test **"Explain More Simply"** for progressive ELI5 breakdown, switch language to **Hindi** or **Telugu**, and click the **Speaker icon** to hear voice narration.
4. **Step 4:** Open **Syllabus Explorer**; expand Unit 3, toggle a topic status from *In Progress* to *Completed*, and note the live progress update.
5. **Step 5:** Navigate to **Marks-Wise Question Bank**; filter by **5 Marks**, expand the model answer and SGU marking rubric, and click **"Practise in Answer Evaluator"**.
6. **Step 6:** In **AI Answer Evaluator**, click **"Evaluate My Answer"**; observe the estimated marks, identified correct concepts, missing points, and click **"Add Missing Concepts to Revision"**.
7. **Step 7:** Open **Revision Planner** to verify that the missing concept was automatically scheduled with High Priority.
8. **Step 8:** View **Learning Progress** and click **"Export Faculty Progress Report"** to download the student diagnostic summary.
