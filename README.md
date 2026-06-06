# Parle — French Language Learning Companion

A full-stack MERN application for learning French through image scanning, AI-powered conversation practice, and speech recognition.

## Tech Stack

- **MongoDB** — Session storage
- **Express** — API server (Gemini proxy, session CRUD)
- **React** (Vite) — Frontend SPA
- **Node.js** — Runtime

## Features

- **Scan & Learn** — Upload images with French text; Tesseract.js OCR extracts vocabulary
- **Conversation Mode** — AI generates contextual sentences; practice pronunciation via speech or text
- **Session Summary** — Animated fluency scores, round-by-round breakdown, saved to database

## Setup

### 1. Configure environment

Edit `.env` in the project root:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
MONGODB_URI=mongodb://localhost:27017/parle
PORT=5000
```

### 2. Install dependencies

```bash
npm run install-all
```

### 3. Start development

```bash
npm run dev
```

This starts both the Express server (port 5000) and Vite dev server (port 5173) concurrently.

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
├── client/              ← React (Vite)
│   └── src/
│       ├── components/  ← Reusable UI components
│       ├── hooks/       ← Custom React hooks
│       ├── screens/     ← App screens (Scan, Convo, Summary)
│       └── styles/      ← Parisian Ink design system
├── server/              ← Express + MongoDB
│   ├── config/          ← Database config
│   ├── models/          ← Mongoose schemas
│   └── routes/          ← API routes
├── .env                 ← API keys (git-ignored)
└── package.json         ← Root scripts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gemini/generate` | Generate a French sentence from words |
| POST | `/api/gemini/evaluate` | Evaluate user's pronunciation attempt |
| POST | `/api/sessions` | Save a completed session |
| GET | `/api/sessions` | List past sessions |
| GET | `/api/health` | Health check |
