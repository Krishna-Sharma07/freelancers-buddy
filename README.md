# 🚀 Freelancer's Buddy - AI Deal Intelligence Platform

An AI-powered SaaS platform helping freelancers scan contracts for risks, score proposals, and generate professional documents.

## 📁 Project Structure

freelancers-buddy/
├── frontend/          # Next.js application (React)
├── backend/           # Node.js/Express API server
├── ai-service/        # Python FastAPI AI service
├── docs/              # Documentation
└── README.md

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), Tailwind CSS
- **Backend:** Node.js, Express, Socket.io
- **AI Service:** Python, FastAPI
- **Database:** PostgreSQL (Neon)
- **Cache:** Redis (Upstash)
- **Auth:** Supabase
- **Email:** Resend
- **Payments:** Razorpay

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- Git

### Environment Variables
Copy `.env.example` files and fill in your credentials:
```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
```

### Installation

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:3001
```

**Backend:**
```bash
cd backend
npm install
npm start  # Runs on http://localhost:3000
```

**AI Service:**
```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn main:app --reload  # Runs on http://localhost:5000
```

## 📋 Development Roadmap

- Week 1-2: Foundation & Infrastructure
- Week 3-4: Frontend Authentication
- Week 5-8: AI Service & PDF Processing
- Week 9-11: Scanner & Generator UI
- Week 12-13: Data Management & Payments
- Week 14-15: Testing & Deployment

## 📝 License

Private - Freelancer's Buddy

## 👤 Author

Solo Developer Building Product