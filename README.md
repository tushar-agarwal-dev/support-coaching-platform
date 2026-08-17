# VantrixAI: AI-Powered Customer Support Coaching Assistant
### Infosys Internship Project - AI customer support coaching platform

VantrixAI is a premium, real-time agent training and in-session coaching platform. It hooks directly into active customer chat interactions to retrieve manual guidelines via Semantic RAG, calculate compliance levels, assess customer escalation threat indices, and generate tone-specific response suggestions dynamically.

---

## 🌟 Key Features

*   **Three Interaction Modes:**
    1.  **AI Simulator Mode:** Multi-agent roleplay with an emotional customer simulator representing dynamic frustration trends.
    2.  **Manual Feed Mode:** Paste raw customer dialogue feeds to trigger immediate audit critiques and coaching suggestions.
    3.  **Transcript Replay Mode:** Drag and drop historical transcript arrays (`.json` or `.txt`) to step through coaching recommendations turn-by-turn.
*   **Three-Panel Agent Console:** Live dialogue timeline, tone-specific suggestions (Empathetic, Professional, Concise), compliance verification indicators, and interactive RAG citation widgets.
*   **Operations Analytics tab:** Visualizes historical QA trends, customer satisfaction charts, recurring knowledge base gaps, and agent progression indicators over time.
*   **Post-Call Quality Auditing:** Generates detailed compliance score reviews, frustration delta journeys, and exportable summary timelines on session completion.

---

## 🛠️ Technology Stack

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons, HTML5.
*   **Backend:** FastAPI (Python), LangGraph, Pydantic, Uvicorn.
*   **Databases:** MongoDB (Session storage and telemetry) & ChromaDB (Vector database for policy RAG).
*   **AI Models:** Llama-3-70b (via Groq APIs) and standard text-embedding models.

---

## ⚙️ Project Structure

```text
support-coaching-platform/
├── backend/
│   ├── agents/          # Multi-agent orchestrators (critique, simulator, risk, RAG)
│   ├── api/             # FastAPI routers (chat console, sessions, analytics)
│   ├── config/          # Settings and environment bindings
│   ├── database/        # Mongo and Chroma connection drivers
│   ├── models/          # ODM Pydantic schemas
│   ├── rag/             # Knowledge base embed and ingest pipeline
│   └── schemas/         # FastAPI request/response validation schemas
├── frontend/
│   ├── src/
│   │   ├── pages/       # Login, Config, Console, Analytics, ReplayTimeline
│   │   ├── services/    # Client api wrappers
│   │   ├── types/       # TypeScript declarations
│   │   └── index.css    # Custom keyframes and visual theme sheets
│   └── index.html
└── README.md
```

---

## 🚀 Quick Setup & Installation

### Prerequisite Services
Ensure local instances of **MongoDB** and **ChromaDB** are running, or bind to external connection URIs.

### 1. Backend Ingestion & Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Configure environment variables in `backend/.env`:
    ```env
    MONGODB_URL=mongodb://localhost:27017
    DATABASE_NAME=support_coaching
    GROQ_API_KEY=your_groq_api_key_here
    JWT_SECRET=your_jwt_signature_secret
    ```
3.  Activate virtual environment and install dependencies:
    ```bash
    source .venv/bin/activate
    pip install -r requirements.txt
    ```
4.  Launch the FastAPI server:
    ```bash
    uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload
    ```

### 2. Frontend Configuration & Setup
1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Configure client variables in `frontend/.env`:
    ```env
    VITE_API_URL=http://localhost:8000
    ```
3.  Install node dependencies:
    ```bash
    npm install
    ```
4.  Run the Vite development server:
    ```bash
    npm run dev
    ```
    *Open [http://localhost:5173](http://localhost:5173) in your web browser.*

---

## 📁 Sample Transcript Schema (Replay Mode)
For testing **Transcript Replay Mode**, save the following schema as a `.json` file and select it in the configuration portal:
```json
[
  { "role": "customer", "content": "Hello, I am calling because my account got charged twice this morning!" },
  { "role": "agent", "content": "I apologize for the inconvenience. Let me review your transaction history." }
]
```
