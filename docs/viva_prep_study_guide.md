# VIVA AND TECHNICAL INTERVIEW STUDY GUIDE

This document serves as your complete study guide and viva preparation manual. It covers every technology, framework, database, and system architecture concept implemented in Milestone 1 and planned for the entire platform.

---

# PART I: MILESTONE 1 CORE TOPICS

---

## 1. FastAPI (Backend Framework)

### Topic Summary
FastAPI is a modern, fast (high-performance), web framework for building APIs with Python based on standard Python type hints. It runs on ASGI (Asynchronous Server Gateway Interface) web servers like Uvicorn, which allows it to handle thousands of concurrent requests asynchronously without blocking the execution thread.

### Detailed Working & Deep Dive
*   **Asynchronous Request Handling**: Unlike traditional WSGI frameworks (like Flask) which handle each request in a separate thread (meaning the server runs out of threads under heavy load), FastAPI uses Python’s `async` and `await` event loops. When the server waits for a database query or an external LLM request to return, it pauses the request and handles other incoming traffic in the meantime.
*   **Dependency Injection**: FastAPI has a built-in dependency injection system (`Depends`). This allows shared components—such as database connections or authentication checkers—to be declared as dependencies of your route functions. FastAPI automatically resolves these dependencies, handles setup and teardown, and injects the resulting objects.
*   **Pydantic Integration**: FastAPI uses Pydantic for data validation. Incoming JSON requests are automatically mapped to Pydantic classes. If the payload is missing fields or has incorrect data types, FastAPI returns an HTTP 422 validation error automatically before executing any route logic.

### Expected Cross-Questions (Q&A)
*   **Q1: Why did you choose FastAPI over Flask or Django?**  
    *Answer*: FastAPI was selected for three primary reasons: high performance due to native async support (critical for streaming chat tokens and LLM agent responses), automatic generation of interactive Swagger API documentation, and built-in type safety via Pydantic which drastically reduces data serialization code.
*   **Q2: What is the difference between WSGI and ASGI?**  
    *Answer*: WSGI (Web Server Gateway Interface) is a synchronous protocol that processes one request per worker thread. ASGI (Asynchronous Server Gateway Interface) supports asynchronous operations, enabling long-lived connections like WebSockets and Server-Sent Events (SSE) which are essential for real-time AI agents.
*   **Q3: How does FastAPI dependency injection work in your code?**  
    *Answer*: In our code, we inject the database client using `db = Depends(get_database)`. When a request is received, FastAPI executes `get_database()`, resolves the connection instance, and makes it available to the route, ensuring clean separation of concerns.

---

## 2. MongoDB & Async DB Drivers (Motor)

### Topic Summary
MongoDB is a document-oriented NoSQL database that stores data in flexible, JSON-like document formats (BSON). Motor is the official asynchronous Python driver for MongoDB, allowing our FastAPI routes to execute queries using `async`/`await` commands without blocking backend server tasks.

### Detailed Working & Deep Dive
*   **Document Model**: Unlike relational databases (SQL) that require strict tables, joins, and keys, MongoDB groups documents into collections. This model fits conversation objects perfectly because messages, analysis snapshots, and logs can be stored as nested lists directly within a single session document.
*   **Mock Database Fallback**: Since local development and testing environments may not always have a running MongoDB instance, we implemented a custom `MockDatabase` class in [mongodb.py](file:///Users/tusharagarwal/.gemini/antigravity/scratch/support-coaching-platform/backend/database/mongodb.py). It intercepts standard CRUD commands (like `insert_one`, `find_one`, and custom update modifiers like `$push` and `$inc`) and executes them over in-memory dictionaries, ensuring complete offline execution reliability.

### Expected Cross-Questions (Q&A)
*   **Q1: Why NoSQL (MongoDB) instead of PostgreSQL?**  
    *Answer*: Chat sessions are hierarchical and highly dynamic. A SQL database would require multiple joins across tables like `sessions`, `messages`, `analysis_logs`, and `agent_latencies`. MongoDB allows us to save the entire session and its nested lists in a single document, which speeds up read and write operations.
*   **Q2: What is Motor, and why is it used instead of PyMongo?**  
    *Answer*: PyMongo is synchronous and blocks the execution flow during database reads/writes. Motor provides an asynchronous wrapper for MongoDB commands, preventing our backend thread from blocking while waiting for database queries to complete.
*   **Q3: How does your database handle offline development?**  
    *Answer*: We built a custom mock collection wrapper in `mongodb.py` that checks for connection timeouts on startup. If local MongoDB is offline, it activates an in-memory dictionary store, simulating query execution without code changes.

---

## 3. ChromaDB & Vector Databases

### Topic Summary
ChromaDB is an open-source vector database designed to store, search, and manage high-dimensional vector representations of text. Unlike traditional databases that search for exact keywords, vector databases measure semantic similarity by calculating the geometric distance between vector coordinate points.

### Detailed Working & Deep Dive
*   **Semantic Search**: When text is vectorized, it is transformed into coordinates in a high-dimensional space (e.g., 384 dimensions). Coordinate proximity represents meaning proximity. If a user asks "How do I get my money back?", the database can match a policy document that says "Processing customer credits and refunds," even though there are no matching words.
*   **Distance Metrics**: ChromaDB uses mathematical calculations (such as Cosine Similarity or L2 distance) to find vectors closest to a query vector.

### Expected Cross-Questions (Q&A)
*   **Q1: How does a vector database differ from a relational database?**  
    *Answer*: A relational database indexes columns for exact string or numeric matches. A vector database indexes arrays of numbers (embeddings) and searches for items within a certain distance radius, retrieving matches based on semantic meaning rather than exact words.
*   **Q2: What vector database are you using, and why?**  
    *Answer*: We use ChromaDB because it is lightweight, open-source, runs locally as a process within Python, requires no cloud setup, and integrates with sentence-transformer models.
*   **Q3: What happens when vector similarity is low?**  
    *Answer*: Our system intercepts queries where the similarity score falls below `0.40`. It flags these queries as "knowledge gaps" and saves them to a collection so managers can review them.

---

## 4. Sentence Transformers & Embeddings

### Topic Summary
Sentence Transformers is a framework that maps sentences or paragraphs into dense vector spaces (embeddings). We use the `sentence-transformers/all-MiniLM-L6-v2` model, which converts any input string into a 384-dimensional numeric array.

### Detailed Working & Deep Dive
*   **Embeddings**: Text embeddings convert words into numbers so computers can process meaning. 
*   **all-MiniLM-L6-v2**: This is a mini-BERT transformer model optimized for speed, low memory footprints, and high retrieval accuracy, making it ideal for real-time operations on local systems.

### Expected Cross-Questions (Q&A)
*   **Q1: What is a text embedding?**  
    *Answer*: An embedding is a vector representation of text where words with similar meanings are mapped to close coordinates in a high-dimensional space.
*   **Q2: What is the dimension size of your embedding model, and why does it matter?**  
    *Answer*: The `all-MiniLM-L6-v2` model generates 384-dimensional vectors. A smaller vector size speeds up similarity search calculations and reduces memory usage while preserving accurate semantic relationships.
*   **Q3: How do you generate embeddings in your backend?**  
    *Answer*: We initialize the transformer pipeline in [pipeline.py](file:///Users/tusharagarwal/.gemini/antigravity/scratch/support-coaching-platform/backend/rag/pipeline.py) using the Hugging Face `sentence-transformers` library, which automatically vectorizes text blocks.

---

## 5. Chunking & Ingestion Pipelines

### Topic Summary
Text chunking is the process of breaking down a long document into smaller, readable sections before indexing. This ensures that the search query retrieves only the relevant paragraphs rather than the entire document.

### Detailed Working & Deep Dive
*   **Ingestion Process**: In [pipeline.py](file:///Users/tusharagarwal/.gemini/antigravity/scratch/support-coaching-platform/backend/rag/pipeline.py), uploaded PDF files are read using the `pypdf` library.
*   **Character Limits & Overlaps**: We split text into chunks of 500 characters with a 100-character overlap. The overlap ensures that sentences crossing a chunk boundary do not lose their semantic context.

```text
[Chunk 1: ...Refund policies dictate that double charges must be processed... (500 chars)]
                                            [Overlap: 100 chars]
                               [Chunk 2: ...be processed immediately back to the client... (500 chars)]
```

### Expected Cross-Questions (Q&A)
*   **Q1: What chunking strategy did you implement?**  
    *Answer*: We use a fixed-character chunking strategy. The text is split into segments of 500 characters with a 100-character overlap to preserve semantic context across segment boundaries.
*   **Q2: Why is overlapping necessary during chunking?**  
    *Answer*: Without an overlap, a critical sentence split in half across two chunks could lose its meaning, preventing the model from matching it during searches.
*   **Q3: How is document text extracted?**  
    *Answer*: We use the Python library `pypdf` to extract raw text page-by-page from uploaded PDF documents.

---

## 6. React & TypeScript

### Topic Summary
React is the component-based UI framework used to build our frontend dashboard. TypeScript provides compile-time type checking to prevent syntax and type mismatch bugs.

### Detailed Working & Deep Dive
*   **Context API**: We use React Context (`AuthContext.tsx`) to manage user states, auth tokens, and session states globally across components.
*   **Axios Interceptors**: Axios is configured in `api.ts` with request interceptors. If a JWT token exists in the user's `localStorage`, the interceptor automatically injects the `Authorization: Bearer <token>` header into all outgoing API calls.

### Expected Cross-Questions (Q&A)
*   **Q1: What is the benefit of using TypeScript on the frontend?**  
    *Answer*: TypeScript adds static typing, which catches syntax and type errors during compilation. This prevents runtime crashes in the browser.
*   **Q2: How does the client maintain user sessions on page refresh?**  
    *Answer*: On app startup, `AuthContext` checks if a token exists in `localStorage`. If found, it fetches the user profile using `/api/users/me` to restore the active session.
*   **Q3: How are auth headers appended to API requests?**  
    *Answer*: We use Axios request interceptors. They check for a token in `localStorage` and automatically add it to the HTTP headers before sending the request.

---

## 7. JWT Authentication & bcrypt

### Topic Summary
JSON Web Token (JWT) is a standard used to securely transmit information between a client and a server as a JSON object. Password hashing is handled using the `bcrypt` library to secure user credentials.

### Detailed Working & Deep Dive
*   **Hashing**: bcrypt hashes passwords with a work factor (salt), protecting them against dictionary and rainbow table attacks.
*   **Token Payload**: When a user logs in, the server generates a token containing a payload with their email, role, and expiration time. This token is signed using the server's private key.

### Expected Cross-Questions (Q&A)
*   **Q1: How does password hashing work?**  
    *Answer*: We hash passwords using `bcrypt.hashpw` with a random salt. When logging in, we compare the input password against the hashed value using `bcrypt.checkpw`.
*   **Q2: What information is stored in the JWT payload?**  
    *Answer*: The payload stores the user's email (`sub`), access role, and token expiration time (`exp`).
*   **Q3: Is your authentication stateful or stateless?**  
    *Answer*: It is stateless. The server does not store active tokens in a session table; it validates tokens using its signature secret key.

---

# PART II: FULL PROJECT TOPICS (Planned / Milestone 2, 3, 4)

---

## 1. LangGraph & Orchestration

### Topic Summary
LangGraph is a library for building stateful, multi-actor applications with LLMs. It coordinates agent communication and execution paths using structured graphs.

### Detailed Working & Deep Dive
*   **State Management**: LangGraph passes a state dictionary between nodes. In `orchestration.py`, we use a custom reducer (`merge_logs`) to combine execution logs from parallel agent nodes without conflicts.
*   **Graph Nodes**:
    *   `intent_detector`: Classifies the customer's goal.
    *   `sentiment_analyzer`: Analyzes customer frustration levels.
    *   `knowledge_retriever`: Fetches relevant policy segments.
    *   `policy_checker`: Verifies compliance.
    *   `coaching_agent`: Formulates response suggestions.

### Expected Cross-Questions (Q&A)
*   **Q1: What is LangGraph and why is it used?**  
    *Answer*: LangGraph manages conversational flows as state graphs. It allows us to define loops, conditional branches, and parallel executions while maintaining state history.
*   **Q2: How do you prevent execution conflicts when agents run in parallel?**  
    *Answer*: We use Pydantic type annotations with custom merge reducers to combine parallel agent outputs into the central state.
*   **Q3: What happens if an agent fails to respond?**  
    *Answer*: Each node is wrapped in try-catch blocks to catch exceptions and fall back to safe default values, ensuring the execution flow is not interrupted.

---

## 2. Multi-Agent Systems

### Topic Summary
A multi-agent system consists of independent, specialized agents configured with specific tools and instructions to accomplish tasks.

### Detailed Working & Deep Dive
Instead of using a single large prompt to handle all analysis—which can cause prompt confusion and high latency—we split tasks across specialized agents:
*   **Intent Agent**: Classifies user queries.
*   **Sentiment Agent**: Focuses on mood tracking.
*   **Policy Agent**: Checks compliance.
*   **Coaching Agent**: Writes the suggested responses.

### Expected Cross-Questions (Q&A)
*   **Q1: Why use multiple agents instead of one large prompt?**  
    *Answer*: Dividing tasks reduces prompt complexity, increases accuracy, and allows agents to run in parallel, minimizing execution latency.
*   **Q2: How do agents share information?**  
    *Answer*: Agents communicate through the shared LangGraph state, where each node reads data written by previous nodes.
*   **Q3: How are compliance checks verified?**  
    *Answer*: The policy agent compares the agent's proposed response against retrieved knowledge rules to check for compliance violations.

---

## 3. Customer Simulator Agent (Planned / Milestone 2)

### Topic Summary
The Customer Simulator Agent is an LLM-driven node that generates scenario-consistent customer replies turn by turn. It is configured with specific personas (e.g., impatient, cooperative, detail-oriented) and an emotional progression profile.

### Detailed Working & Deep Dive
*   **Configurable Mood & Emotion Progression**: When starting a session, the simulator reads the selected customer persona configuration. On each turn, the system checks the agent's latest response:
    *   If the agent is empathetic and addresses the customer's goal, the simulator's mood shifts toward "cooperative."
    *   If the agent delays or gives copy-paste answers, the mood shifts toward "frustrated/angry."
*   **Consistent Persona Enforcements**: System instructions enforce context constraints (e.g., "You are John, a merchant contesting a double fee. You do not accept explanations; you demand a supervisor escalation code").

### Expected Cross-Questions (Q&A)
*   **Q1: How does the Customer Simulator Agent simulate different emotions?**  
    *Answer*: The simulator reads a state-configured mood parameter. In the prompt instructions, we direct the LLM to output a reply that matches the current mood and adjust its intensity based on the agent's response patterns.
*   **Q2: Why is the Simulator built as an independent agent rather than a static script?**  
    *Answer*: Static scripts cannot adapt to custom, spontaneous responses from support agents. By using an LLM-driven agent, the training experience remains dynamic, realistic, and unpredictable, preparing trainees for real-world support interactions.

---

# PART III: COMPLETE CROSS-QUESTIONS BANK

---

### Q1: How do you calculate the Agent Performance Score?
**Answer**: The score is calculated based on customer frustration levels:
$$\text{Score} = \max(20.0, 100.0 - (\text{Frustration} \times 8))$$
If customer frustration reaches `10.0` (maximum), the performance score drops to `20%`.

### Q2: What happens when the RAG search confidence is low?
**Answer**: If the vector similarity score is below `0.40`, the system logs the query as a "knowledge gap" in MongoDB. Managers can review these gaps, draft FAQs with LLM suggestions, and index them in ChromaDB.

### Q3: What security measures protect JWTs in transit?
**Answer**: JWTs are transmitted over HTTPS and stored in client-side storage. In the backend, tokens are signature-verified using HS256 encryption.

### Q4: How is customer satisfaction calculated on session completion?
**Answer**: On session completion, the post-interaction summary agent audits the conversation history, updates the database status to `completed`, and saves a quality audit score.

### Q5: How do you handle database connections during testing if MongoDB is down?
**Answer**: The system automatically catches connection errors on startup and falls back to an in-memory database mock, enabling testing without local database instances.
