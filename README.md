# Indian Job Market Salary Predictor & Analytics Dashboard (v2.0 Interactive Suite)

An enterprise-grade, responsive AI platform for compensation benchmarking, real-time what-if simulations, dual offer comparisons, and verified dataset exploration across the Indian job market.

## Project Details & Attribution
- **Application Title:** Indian Job Market Salary Predictor & Analytics
- **Developer:** Suraksha, AIML Developer
- **Organization:** IPEC Solutions PVT LTD
- **Model Architecture:** Random Forest Regressor with log-transformed salary targets and TF-IDF feature pipelines
- **Dataset:** 33,118 Cleaned Indian Job Market Postings (2025-2026)

---

## Color Palette & Theme (Chocolate Truffle)
The web application is styled with a curated chocolate truffle and warm amber color palette:
- **Primary Dark Brown:** `#38240D` (Header, borders, high-contrast text, primary badges)
- **Deep Chocolate Accent:** `#713600` (Secondary accents, subheadings, chart bars)
- **Warm Amber:** `#C05800` (Interactive glow, CTA buttons, highlight cards, active states)
- **Soft Cream Background/Cards:** `#FDFBD4` / `#FFFEEA` (Warm card surfaces and page background)

---

## ⚡ Expanded Interactive Suite & Options

### 1. ⚡ AI Salary Predictor & What-If Studio
- **12 Categorized Industry Presets:**
  - *AI & Data:* GenAI / LLM Engineer, Data Scientist, Senior Data Engineer, BI / Data Analyst
  - *Engineering & Cloud:* Java Full Stack, React Frontend, DevOps & Kubernetes, Cybersecurity Analyst
  - *Product & Business:* B2B SaaS Product Manager, Enterprise Sales Manager, Business Development Lead, HR / Tech Recruiter
- **Interactive Domain Skill Selector:** Click-to-append tags categorized by Data & AI, Web & Cloud, and Business.
- **Interactive Range Sliders:** Real-time dual sliders for minimum and maximum experience years.
- **What-If Sandbox Toggles:** Instant simulations (+2 Years Seniority, Relocation to Bengaluru, Cloud Architecture Specialization).
- **In-Hand Monthly & New Tax Regime Breakdown:**
  - Basic Pay (50%)
  - HRA (20%)
  - Special Allowance (30%)
  - Employee PF (12%)
  - Standard Deduction (₹75,000)
  - Estimated Income Tax & 4% Cess
  - Net In-Hand Monthly Deposit!
- **Multi-City Benchmark Grid:** Real-time comparisons for Bengaluru, Hyderabad, Pune, Gurugram, Mumbai, Chennai, and Remote.

### 2. ⚖️ Dual Offer & Role Comparator
- Side-by-side comparison between Offer A and Offer B.
- Evaluates title, tech stack, location, and seniority.
- Calculates delta in annual CTC, monthly in-hand take-home, and identifies the winning package with variance percentage.

### 3. 🔍 33,000+ Verified Job Market Database Explorer
- Real-time search by job title, skill tags, or company name across the 33,118 verified job postings.
- Filter by city.
- Interactive table with disclosed salary ranges, required experience, and AmbitionBox ratings.
- **1-Click "Simulate in Predictor":** Automatically pre-fills the predictor form with any real listing and runs live inference!

### 4. 📊 Market Analytics & Plotly Visualizations
- Interactive filters for City and Experience bracket.
- 5 Plotly charts: Salary Distribution Histogram, Top 15 Roles by Median CTC, Tech Hubs Comparison, Experience Trajectory Curve, and High-Impact Tech Skills Matrix.

### 5. 🧠 Model Transparency & Benchmark
- Evaluation benchmark table comparing Random Forest Regressor vs. Ridge Regression.
- Feature pipeline architecture with TF-IDF, One-Hot Encoding, and StandardScaler details.

---

## How to Run the Application

### Option A: 1-Click Launch (Recommended)
Double-click `run_dashboard.bat` inside `D:\PythonProjects\Prediction Project\`. This will launch the Flask server and open your default browser to `http://localhost:5050`.

### Option B: Manual Command Line
```bash
cd "D:\PythonProjects\Prediction Project"
"D:\Users\Asus Laptop\anaconda3\envs\lux_env\python.exe" app.py
```
Then navigate to:
```
http://localhost:5050
```

---
*Built by Suraksha, AIML Developer, IPEC Solutions PVT LTD.*
