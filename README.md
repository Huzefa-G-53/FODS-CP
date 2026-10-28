# PathForge: Visual Learning Roadmaps with C DSA Engine

> **Interactive developer roadmap and prerequisite graph platform, powered by a pure C backend HTTP server implementing foundational Data Structures and Algorithms from scratch.**

Inspired by [roadmap.sh](https://roadmap.sh), PathForge bridges modern web developer tooling with foundational computer science engineering. Every prerequisite path, topic recommendation, and graph traversal runs through real C data structures (`LinkedList`, `Stack`, `FIFO Queue`, `Separate-Chaining HashMap`, `Directed Graph`).

---

## Architectural Overview

PathForge is organized into a clean decoupled architecture:

```
pathforge/
├── data/                    # Plain text formatted content repository
│   ├── roadmaps.dat         # 32 roadmaps (Languages, Professions, Sub-roadmaps)
│   ├── topics.dat           # 237 curated topics with code & pitfalls
│   ├── concepts.dat         # Shared cross-discipline concepts (variables, control flow, etc.)
│   └── progress.dat         # Persistent user mastery state (key=status)
├── backend/                 # Pure Hand-Written C DSA & Native HTTP Server (0 Libraries)
│   ├── linked_list.h / .c   # Singly-linked list (chaining buckets, graph edges)
│   ├── queue.h / .c         # FIFO Queue (BFS traversal, recommendation engine)
│   ├── stack.h / .c         # LIFO Stack (DFS traversal, path backtracking)
│   ├── hashmap.h / .c       # Separate-chaining hash table with collision tracking
│   ├── graph.h / .c         # Directed graph, BFS pathfinding, concept propagation
│   ├── models.h / .c        # Data models, plain text .dat loader, state manager
│   ├── api.h / .c           # REST API router and native JSON serializers
│   └── server.c             # Custom lightweight Winsock HTTP server (no external dependencies)
├── frontend/                # Vanilla Dev-Tool Web Interface
│   ├── index.html           # Semantic HTML with accessibility & dialogs
│   ├── style.css            # Dark/Light theme, modern developer styling
│   └── app.js               # Client-side router, state store, graph visualizer
├── test/
│   └── test_dsa.c           # Comprehensive unit tests for all 5 core DSA components
├── Makefile                 # GNU Make automation
├── run.bat                  # 1-click Windows execution batch file
└── README.md                # Documentation and Big-O analysis
```

---

## 📊 Big-O Complexity Analysis

| Data Structure / Algorithm | Operation / Case | Time Complexity | Space Complexity | Real Role in PathForge |
| :--- | :--- | :--- | :--- | :--- |
| **Singly-Linked List** | `push_front`, `push_back` | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Edge adjacency list in Graph, bucket collision chain in Hash Table |
| **Singly-Linked List** | `find`, `remove` | $\mathcal{O}(N)$ | $\mathcal{O}(1)$ | Key matching within hash bucket chains |
| **FIFO Queue** | `enqueue`, `dequeue` | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Breadth-First Search (BFS), Next Topic Recommendation Engine |
| **LIFO Stack** | `push`, `pop`, `peek` | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Depth-First Search (DFS), Path Backtracking from target to source |
| **Separate-Chaining HashMap** | `put`, `get`, `remove` (Avg) | $\mathcal{O}(1)$ | $\mathcal{O}(N)$ | Fast vertex, topic, roadmap, and concept string lookups by ID |
| **Separate-Chaining HashMap** | `get` (Worst Case) | $\mathcal{O}(N)$ | $\mathcal{O}(N)$ | Occurs under pathological hash collision clustering |
| **Directed Graph BFS** | Shortest Prerequisite Path | $\mathcal{O}(V + E)$ | $\mathcal{O}(V)$ | Level-order discovery with parent tracking |
| **Directed Graph DFS** | Deep Tree Traversal | $\mathcal{O}(V + E)$ | $\mathcal{O}(V)$ | Depth-first dependency discovery |
| **1-Hop Concept Propagation** | Mark Completed -> Familiar | $\mathcal{O}(\text{deg}(v))$ | $\mathcal{O}(1)$ | Automatic status propagation across language tracks |

---

## ⚡ Quickstart & Native Execution

### Prerequisites
- GCC Compiler (MinGW / MSYS2 / GCC on Windows)

### Option A: Using Batch Script (Windows)
Double-click `run.bat` or execute in Command Prompt:
```cmd
run.bat
```

### Option B: Using Make
```bash
make
make test
make run
```

Open your browser to: **`http://localhost:8000`**

---

## 🧪 Running the Core DSA Test Suite

Execute the automated test runner to verify all 5 DSA components:
```cmd
.\test\test_dsa.exe
```

Output:
```
===========================================
  PathForge Core C DSA Unit Test Suite
===========================================
[*] Testing Linked List...
[+] Linked List tests passed!
[*] Testing Stack (LIFO)...
[+] Stack tests passed!
[*] Testing Queue (FIFO)...
[+] Queue tests passed!
[*] Testing Separate-Chaining Hashmap...
[+] Hashmap tests passed!
[*] Testing Graph, BFS/DFS & Shortest Path...
[+] Graph & Pathfinding tests passed!
===========================================
  ALL 5 DSA TEST SUITES PASSED CLEANLY!
===========================================
```

---

## 🌐 REST API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/stats` | Global topic, roadmap, graph vertex/edge counts, and mastery percentages |
| `GET` | `/api/roadmaps` | Returns all 32 curated roadmaps with sections and stages |
| `GET` | `/api/roadmaps/:id` | Returns single roadmap details with topic lists |
| `GET` | `/api/topics` | Returns summary list of all 237 topics |
| `GET` | `/api/topics/:id` | Returns complete topic detail (explanation, objectives, code, pitfalls, resources) |
| `GET` | `/api/topics/:id/prerequisites` | Returns topic's incoming prerequisite edges from graph |
| `GET` | `/api/topics/:id/dependents` | Returns topic's outgoing dependent edges |
| `GET` | `/api/path?from=X&to=Y` | BFS shortest prerequisite path with parent pointer backtracking |
| `GET` | `/api/recommendations` | Queue-based next topics whose prerequisites are satisfied |
| `GET` | `/api/progress` | Global user mastery map and statistics |
| `POST` | `/api/progress` | Update status (`Completed` triggers automatic 1-hop concept propagation) |
| `DELETE` | `/api/progress/:topicId` | Reset topic progress to `Not Started` |
| `GET` | `/api/graph` | Graph node and edge serialization for visualizer |
