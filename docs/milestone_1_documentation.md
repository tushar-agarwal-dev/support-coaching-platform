# COVER PAGE

**Project Name:** AI-Powered Real-Time Customer Support Coaching Platform  
**Prepared By:** Intern  
**Internship Name:** Infosys Internship Program  
**Document Title:** Milestone 1 Documentation  

---

# TABLE OF CONTENTS

1. Project Overview
2. Tools and Technology Stack
3. System Architecture Diagram
4. Project Phases
5. Schema Models
6. Technical Concepts Explained
7. Any Other Relevant Details
8. Appendix
   - A. Folder Structure
   - B. API List
   - C. Environment Variables Used
   - D. Dependencies
   - E. References

---

# 1. PROJECT OVERVIEW

## Project Introduction
The AI-Powered Real-Time Customer Support Coaching Platform is an enterprise-grade software application designed to assist customer support agents during live customer interactions. Rather than acting as a customer-facing chatbot, the platform operates as a back-end coach, evaluating conversations as they unfold, checking for policy compliance, and suggesting replies tailored to customer intents and sentiment.

## Problem Statement
Traditional customer support training relies on offline reviews, static scripts, and manual quality assurance audits conducted days after interactions occur. This delayed feedback loop leads to:
1. High escalation rates because agents cannot address angry customers in real-time.
2. Inconsistent compliance with company standard operating procedures.
3. Slow onboarding cycles for new support personnel.
4. Information gaps, where agents struggle to retrieve relevant support documentation quickly from static PDF repositories.

## Objectives
1. Provide real-time response suggestions based on live conversation context.
2. Automatically ingest company knowledge-base articles (PDFs, FAQs, manual text) and fetch matching sections instantly via a Retrieval-Augmented Generation pipeline.
3. Simulate realistic customer personas (impatient, cooperative, billing disputes) to allow safe, offline practice environments for training.
4. Generate QA summary logs at the end of each session.

## Target Users
1. **Support Agents**: Junior or trainee agents who practice with customer simulators or use live suggestions to handle queries.
2. **Support Managers**: Administrators who oversee compliance, design practice templates, monitor training performance, and resolve knowledge gaps.

## Scope
The project is divided into multiple sequential milestones. This document outlines the status at the completion of **Milestone 1**.
*   **Milestone 1 Scope (Completed)**: Ingestion pipeline for PDF support documentation, vector indexing using ChromaDB, session configuration controls (modes and templates), and database schemas.
*   **Future Scope (Planned)**: Live WebSocket chat console, customer simulator LLM nodes, multi-agent evaluation graphs (Intent, Sentiment, Compliance, Risk, Coach, Critique), and manager dashboard pages.

## Key Features Completed in Milestone 1
1. **Session Configuration Module**: Configures target training scenarios (Simulator, Manual, Replay modes) and maps client products.
2. **RAG Ingestion Pipeline**: Extracts text from PDF files, segments it into chunks, vectorizes it, and registers the records in ChromaDB.
3. **User Authentication API**: Provides role-based registration and secure login endpoints.

---

# 2. TOOLS AND TECHNOLOGY STACK

The application is built on a split architecture consisting of a Python FastAPI backend and a TypeScript React frontend.

| Technology | Category | What it is | Why it is used | Where it is used in this project |
| :--- | :--- | :--- | :--- | :--- |
| **React** | Frontend Framework | A JavaScript library for building component-based user interfaces. | Allows building a modular, fast, and responsive user interface. | Powering the entire client application, config forms, and user views. |
| **TypeScript** | Language Extension | A typed superset of JavaScript that adds compiler checks. | Prevents runtime type mismatch errors, ensuring code safety. | Used throughout the frontend codebase for components and API types. |
| **FastAPI** | Backend Framework | A high-performance Python framework for building APIs. | Offers asynchronous support, rapid routing, and auto-generated docs. | Serves all REST API requests, file uploads, and session setups. |
| **Python** | Language | A versatile programming language. | Supports robust data science, text parsing, and AI libraries. | Powers the entire backend server, LLM agents, and database operations. |
| **MongoDB** | Database | A NoSQL database that stores data in document formats. | Flexible schemas allow storing nested lists, chat histories, and logs. | Stores user credentials, active training sessions, and template libraries. |
| **ChromaDB** | Vector DB | A specialized database designed to store numeric vectors. | Enables fast mathematical calculations of text semantic similarity. | Serves as the repository for vectorized PDF manuals and FAQs. |
| **Sentence Transformers** | AI Model | A framework to convert text into fixed-length numeric vectors. | Generates accurate semantic models of support document sentences. | Computes embeddings during file uploads and RAG queries. |
| **TailwindCSS** | UI Styling | A utility-first CSS framework for interface styling. | Speeds up styling processes without writing custom CSS classes. | Provides the dark-theme layouts and forms of the frontend. |

---

# 3. SYSTEM ARCHITECTURE DIAGRAM

Below is the conceptual ASCII diagram showing components and the flow of data from the user client to the storage layers.

```text
[ Support Agent / Manager Client (React App) ]
                     │
                     ▼ (HTTP Requests / File Uploads)
         [ FastAPI Backend Gateway ]
          /          │           \
         /           │            \
        ▼            ▼             ▼
[ Auth Service ]  [ Session API ]  [ Ingestion Pipeline ]
     │               │                 │
     │               │                 ▼ (Extract & Chunk)
     │               │           [ Sentence Transformers ]
     │               │                 │ (Embeddings)
     │               │                 ▼
     ▼               ▼             [ ChromaDB Vector Store ]
[ MongoDB Document Store ] <─────── [ Knowledge Meta-Data ]
```

## Component Definitions
1. **React Client**: The visual dashboard where the user logs in, configures scenarios, uploads knowledge documents, and views training statistics.
2. **FastAPI Backend Gateway**: Receives incoming REST API requests, checks authentication tokens, and dispatches tasks to database drivers or the RAG pipeline.
3. **MongoDB Document Store**: Houses user documents, session states, and training scenario templates.
4. **Sentence Transformers**: Generates fixed-length vector representations (embeddings) from input strings.
5. **ChromaDB Vector Store**: Indexes vector representations of support documents to enable semantic similarity lookups.

## Ingestion Data Flow
1. The user uploads a PDF manual via the React interface.
2. The FastAPI server intercepts the file, reads its raw content, and divides it into smaller chunks of 500 characters.
3. Each chunk is passed to the `Sentence Transformers` model to convert the string into a numeric array (embedding).
4. The numeric arrays are written to `ChromaDB` along with their text content and document metadata (source name, page number).
5. File catalog records are written to `MongoDB` to track ingestion status.

---

# 4. PROJECT PHASES

## Milestone 1 (Completed)
The following targets have been completed in this milestone:
1. **Workflow & Pattern Study**: Study customer support workflows, coaching methodologies, RAG architecture, and multi-agent design patterns.
2. **System Architecture Design**: Design system architecture, agent responsibilities, orchestration flow, and data models.
3. **Session Configuration Module**: Build session configuration module—user selects interaction mode (Simulator, Manual, Replay), defines product context, and configures customer scenarios.
4. **Knowledge Base Ingestion**: Develop Support Knowledge Base ingestion—upload FAQs, support docs, and policy PDFs; implement chunking, embedding, and vector indexing via RAG pipeline.

## Milestone 2 (Planned)
The upcoming milestone covers the following objectives:
1. **Customer Simulator Agent**: Build Customer Simulator Agent—generates realistic, scenario-consistent customer messages turn by turn with configurable persona and emotional progression.
2. **State & Orchestration**: Compile initial LangGraph execution loops and websocket transport channels.

## Milestone 3 (Planned)
1. **Multi-Agent Evaluation Panel**: Integrate Intent Detection, Sentiment Analysis, Knowledge Retrieval, and Escalation Risk agents.
2. **Coaching Suggestion Node**: Implement Coaching and Self-Critique agents to recommend empathetic, professional, and concise replies.

## Milestone 4 (Planned)
1. **Manager Operations Portal**: Deploy compliance counters, custom scenario configuration panels, and knowledge gap closures.
2. **Interactive Replay Console**: Build chronological conversation replays with analysis snapshot views.

---

# 5. SCHEMA MODELS

The system utilizes structured schemas to map data structures inside MongoDB.

## User Schema

### Purpose
Represents credentials, roles, and profiles of registered users.

### Schema Fields
*   `_id` (str): Unique user identifier.
*   `email` (str): User's primary email address (must be unique).
*   `hashed_password` (str): Hashed representation of user password.
*   `full_name` (str): Full display name of the user.
*   `role` (str): Role designation (`admin`, `manager`, or `agent`).
*   `created_at` (datetime): Timestamp when the user registered.

### Example JSON
```json
{
  "_id": "user-uuid-1234",
  "email": "agent@company.com",
  "hashed_password": "$2b$12$EjX9w...",
  "full_name": "Jane Doe",
  "role": "agent",
  "created_at": "2026-07-13T20:00:00Z"
}
```

---

## Session Schema

### Purpose
Tracks configuration, context, and chat state of training sessions.

### Schema Fields
*   `_id` (str): Unique session identifier.
*   `user_id` (str): ID of user who created the session.
*   `mode` (str): Selection mode (`simulator`, `manual`, `replay`).
*   `industry` (str): Industry category of scenario (e.g. Telecom).
*   `product` (str): Name of target product under test.
*   `difficulty` (str): Session difficulty (`easy`, `medium`, `hard`).
*   `customer_persona` (str): Persona type (e.g. Angry Customer).
*   `customer_mood` (str): Active mood (e.g. impatient).
*   `status` (str): Status of training session (`active`, `completed`).
*   `history` (list): Array of chat message documents.
*   `created_at` (datetime): Timestamp when the session began.

### Example JSON
```json
{
  "_id": "session-uuid-5678",
  "user_id": "user-uuid-1234",
  "mode": "simulator",
  "industry": "FinTech",
  "product": "Credit Card API",
  "difficulty": "medium",
  "customer_persona": "VIP Client",
  "customer_mood": "frustrated",
  "status": "active",
  "history": [
    {"role": "customer", "content": "I was double charged on my invoice.", "timestamp": "2026-07-13T20:01:00Z"}
  ],
  "created_at": "2026-07-13T20:00:50Z"
}
```

---

## Knowledge Document Schema

### Purpose
Logs tracking files uploaded to the knowledge base.

### Schema Fields
*   `_id` (str): Unique document identifier.
*   `filename` (str): Original name of uploaded PDF file.
*   `status` (str): processing state (`pending`, `processed`, `failed`).
*   `chunk_count` (int): Total segments generated from document.
*   `uploaded_at` (datetime): Timestamp of document upload.

### Example JSON
```json
{
  "_id": "doc-uuid-9999",
  "filename": "Refund_Policy_2026.pdf",
  "status": "processed",
  "chunk_count": 12,
  "uploaded_at": "2026-07-13T20:02:00Z"
}
```

---

# 6. TECHNICAL CONCEPTS EXPLAINED

## Artificial Intelligence (AI)
AI is a branch of computer science dedicated to building software capable of performing tasks that normally require human intelligence. Think of it like a smart calculator that, instead of just solving math formulas, can understand language patterns, spot spelling errors, and learn over time. In our platform, AI is used to simulate different customer personalities and provide coaching suggestions.

## Large Language Model (LLM)
An LLM is an advanced computer program trained on massive amounts of text to predict and generate human-like sentences. It works similarly to the predictive text keyboard on a mobile phone, but it is capable of writing paragraphs, answering questions, and summarizing logs. The system uses LLMs to generate customer simulator replies and draft coaching responses.

## Retrieval-Augmented Generation (RAG)
RAG is an AI technique that combines a general text generator with a custom search library. For instance, if an LLM is like a student taking an exam from memory, RAG is like giving that student a textbook (your company manual) to look up the exact facts before writing down the answer. This ensures response accuracy and prevents the AI from fabricating incorrect policies.

## Word/Text Embedding
An embedding is a technique that translates human words or sentences into a list of numbers. This translation is similar to placing books in a library based on topic similarity rather than alphabetical order. It allows the computer to mathematically measure how close in meaning two different sentences are, even if they use different words.

## Text Chunking
Chunking is the process of breaking down a long document (like a 50-page manual) into smaller, readable sections of 300 to 500 characters. Imagine trying to find a specific recipe in an index-free cookbook: instead of reading the whole book, you divide it into individual pages. This makes it easier for the search engine to extract only the relevant paragraphs during a query.

## Vector Database
A vector database is a specialized database that stores embeddings (lists of numbers) rather than plain text strings. Think of it like a GPS mapping coordinates: instead of searching for a street name, it searches for coordinates nearby. It is used in our platform to fetch relevant support paragraphs from ChromaDB during chat sessions.

## LangGraph
LangGraph is a software orchestrator used to build workflows containing multiple specialized AI agents. It works like a corporate organizational chart, routing a customer message first to the intent reader, then to the compliance checker, and finally to the coach before compiling the output. This structures the execution logic and prevents chaotic agent collisions.

## AI Agent
An AI agent is a specialized computer program configured with a specific task, instructions, and tools. Imagine a pipeline with several workers: one classifies customer intent, another measures policy violations, and a third critizes drafts. In our project, multiple agents work together to analyze conversations.

## Orchestration
Orchestration is the process of coordinating and managing the workflow of different agents. It acts like a conductor in an orchestra, directing when each musician plays to ensure the overall output is harmonious. In this project, the orchestrator manages flow routes, latency tracking, and conversation histories.

---

# 7. ANY OTHER RELEVANT DETAILS

## Folder Structure Design
The repository separates concerns cleanly. The backend follows a standard API layout where schemas (Pydantic models), routes (FastAPI APIRouters), and agents (LangGraph nodes) are decoupled. The frontend uses a React layout organized by pages (SessionConfig, KnowledgeBase) and services (api connections).

## RAG Ingestion Pipeline Workflow
The RAG pipeline is built using the following technical workflow:
1. **Document Upload**: The client issues a `POST` request to `/api/knowledge/upload` with a multipart form PDF payload.
2. **Text Extraction**: The PDF bytes are read using `pypdf` which extracts raw unicode text page by page.
3. **Sentence Chunks**: A loop iterates through text segments, splitting blocks at 500 character limits with a 100 character overlap to preserve context at segment boundaries.
4. **Vector Generation**: Text blocks are vectorized using `sentence-transformers/all-MiniLM-L6-v2` generating 384-dimensional numeric arrays.
5. **Database Storage**: Chunk IDs, vectors, and texts are saved in ChromaDB, and document trackers are inserted in MongoDB.

## Current Project Status
At the end of Milestone 1, the knowledge base system and RAG pipeline are fully operational. Users can securely create accounts, log in, configure practice configurations, upload PDFs, and inspect processed knowledge databases. Chat simulation loop pipelines are represented as mocked APIs ready for full LangGraph logic integrations in Milestone 2.

---

# 8. APPENDIX

## A. Detailed Folder Structure
```text
support-coaching-platform/
├── backend/
│   ├── api/
│   │   ├── auth.py              # User signup and login routes
│   │   ├── chat.py              # Message exchange routes (Mocked in M1)
│   │   ├── knowledge.py         # Knowledge document uploader routes
│   │   ├── main.py              # Primary FastAPI entrypoint & configurations
│   │   ├── sessions.py          # Session configuration API routes
│   │   └── users.py             # User profile check routes
│   ├── config/
│   │   └── settings.py          # Environment settings configurations
│   ├── database/
│   │   ├── chromadb.py          # ChromaDB client initialization
│   │   └── mongodb.py           # MongoDB connection client & MockDatabase
│   ├── rag/
│   │   └── pipeline.py          # PDF chunking and vector mapping pipeline
│   └── schemas/
│       ├── auth.py              # Access token schemas
│       ├── session.py           # Session configuration validation schemas
│       └── user.py              # User credentials validation schemas
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.tsx  # Global authentication context hooks
    │   ├── layouts/
    │   │   └── DashboardLayout.tsx # Sidebar navigation layout
    │   ├── pages/
    │   │   ├── Dashboard.tsx    # Training session summary page
    │   │   ├── KnowledgeBase.tsx# Document upload drag-and-drop workspace
    │   │   ├── Login.tsx        # Authentication credentials forms
    │   │   ├── Register.tsx     # Authentication registration forms
    │   │   └── SessionConfig.tsx# Session configuration wizard page
    │   ├── services/
    │   │   ├── api.ts           # Shared Axios REST client instance
    │   │   └── authService.ts   # Authentication login/register endpoints
    │   └── App.tsx              # React client routing configurations
    └── package.json             # Frontend dependency configuration catalog
```

---

## B. Complete API Endpoint List

### 1. Authentication
*   `POST /api/auth/register`: Create user account. Matches `UserCreate` schema.
*   `POST /api/auth/login`: Login credentials check. Returns JWT `Token`.
*   `GET /api/users/me`: Fetch profile payload of currently authenticated user.

### 2. Session Configuration
*   `POST /api/sessions/`: Configure new training practice. Returns session data.
*   `GET /api/sessions/`: Retrieve list of training sessions.

### 3. Knowledge Base
*   `POST /api/knowledge/upload`: Upload PDF manual.
*   `GET /api/knowledge/`: Fetch catalog list of indexed documents.

---

## C. Environment Variables Used
The backend reads settings from local environments using `pydantic-settings`:
*   `PROJECT_NAME`: Display name of application (defaults to `Aegis AI`).
*   `MONGODB_URL`: Connection string for MongoDB (defaults to `mongodb://localhost:27017`).
*   `DATABASE_NAME`: Target database name (defaults to `coaching_platform`).
*   `JWT_SECRET_KEY`: Private cryptographic key for token signatures.
*   `ACCESS_TOKEN_EXPIRE_MINUTES`: Expiration time limit of session tokens.
*   `GROQ_API_KEY`: API key for Groq inference cloud (optional in Milestone 1).

---

## D. Dependencies

### Backend Dependencies (Python)
*   `fastapi`: Web framework.
*   `uvicorn`: ASGI server.
*   `pydantic` & `pydantic-settings`: Schema validations.
*   `motor`: Async MongoDB driver.
*   `chromadb`: Vector indexing database.
*   `sentence-transformers`: Local text embedding vector calculations.
*   `pypdf`: Text reader library for PDFs.
*   `bcrypt`: Password encryption and hashing helper.
*   `python-jose`: JWT creation and validation library.

### Frontend Dependencies (TypeScript / React)
*   `react` & `react-dom`: UI component libraries.
*   `react-router-dom`: Frontend navigation.
*   `axios`: HTTP request client.
*   `lucide-react`: SVG icon kit.
*   `tailwindcss`: CSS stylesheet framework.

---

## E. References
1. FastAPI Framework documentation: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
2. MongoDB Motor client manual: [https://motor.readthedocs.io/](https://motor.readthedocs.io/)
3. ChromaDB installation guidelines: [https://docs.trychroma.com/](https://docs.trychroma.com/)
4. Sentence Transformers models directory: [https://sbert.net/](https://sbert.net/)
5. React Routing rules: [https://reactrouter.com/](https://reactrouter.com/)
