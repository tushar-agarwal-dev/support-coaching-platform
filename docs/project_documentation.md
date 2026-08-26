# VantrixAI: AI-Powered Customer Support Coaching Platform
### Complete Project Documentation & Viva Preparation Guide

---

## 1. Project Overview

### Introduction
**VantrixAI** is an enterprise-grade, real-time agent training and in-session coaching platform. Unlike traditional customer-facing chatbots, VantrixAI operates as a back-end coach for human support agents. It analyzes conversations in real-time as they unfold, retrieves relevant manuals and guidelines via Retrieval-Augmented Generation (RAG), computes policy compliance, monitors customer frustration, and generates tone-specific response suggestions.

### Problem Statement
Traditional customer support training and quality assurance suffer from major latency and resource bottlenecks:
1.  **Post-Event Quality Audits:** QA reviews typically happen days after the interaction, preventing agents from resolving angry customer escalations in real-time.
2.  **Compliance Inconsistencies:** Frontline agents often struggle to adhere to strict corporate standard operating procedures (SOPs).
3.  **Knowledge Retrieval Bottlenecks:** Agents waste valuable call time searching static, disorganized PDF folders for policy guidelines.
4.  **High Onboarding Costs:** Training new agents requires extensive human simulation and supervised practice sessions.

### Key Objectives
*   **Live Suggestion Feed:** Deliver real-time response suggestions across three distinct modes (Empathetic, Professional, Concise) within a three-panel console.
*   **Semantic Policy RAG:** Ingest documents (PDF, DOCX, TXT) and retrieve matching guidelines with under 50ms database lookup latency.
*   **Customer Persona Simulation:** Provide a mock environment using an AI customer simulator to model dynamic frustration trends.
*   **Automatic Compliance & Critique Auditing:** Track policy violations, flag hallucinations, and generate post-call reports.

---

## 2. Tools & Technology Stack

VantrixAI is built on a split architecture consisting of a Python FastAPI backend and a TypeScript React frontend.

| Technology | Category | What it is | Why it is used |
| :--- | :--- | :--- | :--- |
| **React** | Frontend Framework | Component-based JS library | Builds a fast, responsive, state-driven UI dashboard. |
| **TypeScript** | Language Extension | Typed superset of JS | Guarantees code safety and compile-time interface checks. |
| **FastAPI** | Backend Framework | High-performance ASGI framework | Native async support, high concurrency, and automatic Swagger docs. |
| **LangGraph** | AI Orchestrator | Graph-based agent executor | Coordinates multi-agent flows with cycle and state tracking. |
| **MongoDB** | Document Database | NoSQL document-based database | Handles unstructured, nested lists of chat history and analysis logs. |
| **ChromaDB** | Vector Database | Numeric vector database | Stores and indexes text embeddings for semantic similarity search. |
| **Sentence-Transformers** | Embedding Model | Text-to-vector transformer | Converts manual text paragraphs into 384-dimensional coordinates. |
| **TailwindCSS** | UI Styling | Utility-first CSS library | Accelerates frontend styling with a responsive dark-theme design. |

---

## 3. System Architecture & Data Flows

### Architecture Topology
```text
  [ Client Browser (React Single Page App) ]
                     │
                     ▼ (HTTP REST APIs / Server-Sent Events)
       [ FastAPI Backend Gateway Server ]
         /           │            \
        /            │             \
       ▼             ▼              ▼
[ Auth Service ]  [ LangGraph ]  [ Ingestion Pipeline ]
     │               │                 │
     │               ▼ (RAG Query)     ▼ (Extract & Chunk)
     │         [ ChromaDB ]      [ Sentence Transformers ]
     │               │                 │ (384d Vectors)
     ▼               ▼                 ▼
[ MongoDB Document Store ] <─────── [ Knowledge Chunks ]
```

### Ingestion Data Flow
1.  **Upload:** The manager uploads a document via the **Knowledge Base Workspace**.
2.  **Chunking:** The backend parses the file and breaks it down using the `TextChunker` helper (500-character segments, 50-character overlap).
3.  **Vectorization:** Each chunk is converted into a 384-dimensional embedding coordinate using `sentence-transformers/all-MiniLM-L6-v2`.
4.  **Indexing:** Chunk IDs, vectors, and texts are saved in `ChromaDB` for vector retrieval, while raw chunk texts and document metadata are committed to the `document_chunks` collection in `MongoDB`.

---

## 4. LangGraph Multi-Agent Orchestration

The platform routes every conversation turn through an orchestrated workflow containing **7 graph-based agents** and **2 external helpers**:

```text
                                [ Conversation State Input ]
                                             │
                                             ▼
                                  [ 1. Update State Node ]
                                             │
                                   ┌─────────┼─────────┐
                                   ▼         ▼         ▼
                              [ 2. Intent ] [ 3. Mood ] [ 4. Risk ]
                                   └─────────┬─────────┘
                                             ▼
                                     [ 5. Join Barrier ]
                                             │
                                             ▼
                                 [ 6. Knowledge Retriever ]
                                             │
                                             ▼
                                 [ 7. Coaching Suggestions ]
                                             │
                                             ▼
                                  [ 8. Self-Critique Agent ]
                                             │
                                             ▼
                                 [ 9. Policy compliance check ]
                                             │
                                             ▼
                                  [ 10. Customer Simulator ]
```

### Agent Responsibilities:
1.  **Intent Classifier:** Classifies the primary/secondary customer goal (e.g. Refund, Billing Dispute) and estimates urgency.
2.  **Sentiment Analyst:** Measures the customer's active emotion and assigns a numeric frustration score (0.0 to 10.0).
3.  **Escalation Risk Monitor:** Evaluates the likelihood of a supervisor escalation based on conversation indicators.
4.  **Knowledge Retriever (RAG):** Looks up policy guidelines. Uses persistent ChromaDB vector coordinates locally, and falls back to a fast MongoDB keyword-matching query in resource-constrained environments (saving ~2.5s and avoiding OOM errors).
5.  **Coaching Suggestions Agent:** Formulates three response suggestions (Empathetic, Professional, Concise) grounded on retrieved policies.
6.  **Self-Critique Agent:** Audits the response suggestions, identifies tone flaws, and rewrites them to ensure high quality.
7.  **Policy Compliance Agent:** Performs checks against compliance standards (e.g. ensuring the agent did not promise unrealistic refund timelines).
8.  **Customer Simulator (External):** Simulates the next customer message, evolving the customer's mood based on the agent's input.
9.  **Post-Interaction Summary Agent (External):** Summarizes the chat, tracks the emotional journey, logs resolutions, and registers training stats.

---

## 5. REST API Specifications

The FastAPI backend exposes **30 REST API endpoints** categorized below:

### 1. Authentication (`/api/auth`)
*   `POST /api/auth/register`: Role-based account signup (`agent`, `manager`).
*   `POST /api/auth/login`: Verifies credentials and issues a JWT token.
*   `POST /api/auth/guest-login`: Creates a temporary guest session for sandbox testing.
*   `POST /api/auth/guest-cleanup`: Purges temporary guest accounts and their sessions.

### 2. User Profiles (`/api/users`)
*   `GET /api/users/me`: Retrieves profile details of the logged-in user.

### 3. Session Management (`/api/sessions`)
*   `POST /api/sessions/`: Spins up a new training scenario.
*   `GET /api/sessions/`: Lists active and completed sessions.
*   `PATCH /api/sessions/{session_id}`: Updates session configurations or status.

### 4. Interactive Chat Client (`/api/chat`)
*   `POST /api/chat/start`: Initializes a session and returns the customer's first message.
*   `POST /api/chat/message`: Receives the agent's message, executes the LangGraph pipeline, runs the customer simulator, and streams the results as Server-Sent Events (SSE).
*   `GET /api/chat/state/{session_id}`: Fetches active analysis and coaching logs.
*   `POST /api/chat/customer-message`: Receives manual customer messages (used in Manual Feed Mode).

### 5. Training Scenarios (`/api/scenarios`)
*   `POST /api/scenarios/`: Saves a new training scenario template (manager role).
*   `GET /api/scenarios/`: Lists reusable templates.

### 6. Knowledge Base Ingest (`/api/knowledge`)
*   `POST /api/knowledge/upload`: Uploads and indexes PDF/TXT documents.
*   `POST /api/knowledge/load-demo`: Seeds the platform instantly with standard customer service operating procedures.
*   `GET /api/knowledge/`: Lists catalog records of indexed files.
*   `DELETE /api/knowledge/{doc_id}`: Removes a document and purges its vector index.

### 7. Manager Analytics (`/api/manager`)
*   `GET /api/manager/analytics`: Fetches aggregate agent compliance and frustration statistics.
*   `GET /api/manager/gaps`: Lists recurring customer inquiries that failed to match policies.
*   `POST /api/manager/gaps/{gap_id}/faq`: Generates a draft FAQ document based on a detected knowledge gap.
*   `GET /api/manager/faqs`: Lists drafted FAQs awaiting review.
*   `POST /api/manager/faqs/{faq_id}/approve`: Approves a draft FAQ and writes it to the knowledge base.
*   `POST /api/manager/faqs/{faq_id}/reject`: Rejects a draft FAQ.
*   `GET /api/manager/monitoring`: Real-time session monitoring feed.
*   `GET /api/manager/alerts`: Lists active alerts (e.g. sessions with critical escalation risk).
*   `GET /api/manager/trends`: Fetches historical compliance and satisfaction trends.

---

## 6. Database & Pydantic Schemas

### User Schema (MongoDB `users` collection)
```json
{
  "_id": "agent-uuid-default",
  "email": "agent@vantrixai.io",
  "hashed_password": "$2b$12$Z156Y7...",
  "full_name": "Tushar Agarwal",
  "role": "agent",
  "created_at": "2026-08-21T05:30:00Z"
}
```

### Document Chunks Schema (MongoDB `document_chunks` collection)
```json
{
  "_id": "doc-uuid-123_chunk_0",
  "document_id": "doc-uuid-123",
  "document_name": "SOP_Telecom_eSIM.pdf",
  "text": "eSIM profiles are delivered via email as a QR code. Ensure the device is connected to a stable Wi-Fi network during activation.",
  "page_number": 1,
  "created_at": "2026-08-21T05:30:22Z"
}
```

### Session Schema (MongoDB `sessions` collection)
```json
{
  "_id": "session-uuid-5678",
  "user_id": "agent-uuid-default",
  "mode": "simulator",
  "industry": "Telecom",
  "product": "Mobile eSIM",
  "difficulty": "medium",
  "customer_persona": "VIP",
  "customer_mood": "frustrated",
  "status": "active",
  "history": [
    {
      "role": "customer",
      "content": "My eSIM QR code scan fails. Please help.",
      "timestamp": "2026-08-21T05:30:28Z"
    }
  ],
  "latest_analysis": {
    "intent": {
      "primary_intent": "eSIM Activation",
      "urgency": "high"
    },
    "sentiment": {
      "emotion": "frustrated",
      "frustration_score": 7.0
    },
    "risk": {
      "risk_level": "low",
      "risk_percent": 15.0
    }
  },
  "created_at": "2026-08-21T05:30:00Z"
}
```

---

## 7. Technical Concepts Explained

*   **Asynchronous ASGI Operations:**
    FastAPI operates on ASGI (Asynchronous Server Gateway Interface) servers like Uvicorn. While traditional frameworks (like Flask) use a thread-per-request blocking model, FastAPI leverages Python's `async`/`await` event loop. When the server is waiting for an external LLM request to complete, it pauses the execution of that specific task and handles other incoming traffic in the meantime.
*   **Vector Embeddings & Semantic Search:**
    Text embeddings translate sentences into multi-dimensional arrays of numbers (vectors). Similarity search calculates the distance between vectors (e.g. using Cosine Similarity). This enables semantic matching: finding text based on meaning rather than exact word matching.
*   **Dependency Injection (`Depends`):**
    FastAPI's dependency injection system resolves shared resources—such as database connections or security checks—before executing route functions. This ensures clean separation of concerns and decouples route code from database creation details.
*   **Server-Sent Events (SSE):**
    Unlike standard HTTP requests that close the connection once a response is sent, SSE establishes a long-lived HTTP channel. The server can push real-time updates (like LLM tokens or agent execution logs) to the React client as they happen.

---

## 8. Viva & Technical Interview Q&A

### Q1: Why NoSQL (MongoDB) instead of PostgreSQL?
**Answer:** Chat sessions are highly hierarchical and dynamic. A relational SQL database would require multiple table joins across `sessions`, `messages`, `analysis_logs`, and `agent_latencies`. MongoDB allows us to save the entire session and its nested lists in a single document, which speeds up read and write operations.

### Q2: What is the difference between WSGI and ASGI?
**Answer:** WSGI (Web Server Gateway Interface) is a synchronous protocol that processes one request per worker thread. ASGI (Asynchronous Server Gateway Interface) supports asynchronous operations, enabling long-lived connections like WebSockets and Server-Sent Events (SSE) which are essential for real-time AI agents.

### Q3: What is a vector database, and why are you using ChromaDB?
**Answer:** A vector database indexes numeric embeddings and searches for items within a certain distance radius, retrieving matches based on semantic meaning rather than exact words. We use ChromaDB because it is lightweight, open-source, runs locally as a process within Python, requires no cloud setup, and integrates with sentence-transformer models.

### Q4: How does your database handle offline development?
**Answer:** We built a custom mock collection wrapper in `mongodb.py` that checks for connection timeouts on startup. If local MongoDB is offline, it activates an in-memory dictionary store, simulating query execution without code changes.

### Q5: How did you resolve the Out-Of-Memory (OOM) errors in your cloud deployment?
**Answer:** In memory-constrained environments like Render's free tier (512MB RAM), importing large transformer models (like PyTorch and `sentence-transformers`) causes instant OOM container crashes. We resolved this by building environment-detection guards that bypass heavy vector model loads, falling back to a custom MongoDB keyword-matching query that takes under 20ms and runs entirely within the RAM limit.
