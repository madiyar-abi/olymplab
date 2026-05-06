# OlympLab — Technical Project Overview

OlympLab is a premium, high-performance web platform designed for competitive programming training. It serves as a unified workspace that integrates problem-solving, visual analysis tools, and AI-driven mentorship.

## 🚀 Core Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database & Auth**: Supabase (PostgreSQL with RLS)
- **Styling**: Tailwind CSS + Framer Motion (Premium dark-mode aesthetic)
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)
- **Rendering**: React Markdown + KaTeX (for mathematical formulas)
- **Visual Tools**: HTML5 Canvas (Whiteboard) + XYFlow/ReactFlow (Graph Editor)

## 📂 Project Structure & Architecture

### 1. Dashboard & Core Navigation (`/src/app/dashboard`)
- **`/problems`**: The main Problem Catalog. Handles filtering by tags, difficulty, and synchronization with user progress.
- **`/problems/[id]`**: The "Workhorse" of the site — a custom-built IDE.
    - **IDE Layout**: A complex 60/40 split workspace using `react-resizable-panels`.
    - **Left Panel**: Problem description with LaTeX support and Input/Output samples.
    - **Right Panel (Top)**: Monaco Editor with multi-language support (C++, Python, Java, Rust, Go).
    - **Right Panel (Bottom)**: Integrated console for test cases, results, and AI Mentor chat.
- **`/whiteboard`**: A specialized canvas for drawing algorithms and logic flows.
- **`/graph-editor`**: A node-based editor for visualizing graph theory problems (BFS, DFS, Dijkstra, etc.).
- **`/profile`**: User statistics, including a GitHub-style activity heatmap and level tracking.

### 2. Core Components (`/src/components` & IDE specific)
- **`IDEClient.tsx`**: Manages the complex state of the editor, submission polling, and UI layout.
- **`MarkdownRenderer.tsx`**: Custom processor for mathematical notation (specifically handling Codeforces-style math delimiters).
- **`Timer.tsx`**: Persistent session timer for mock contests.

### 3. Database Schema (`/supabase/migrations`)
- **`profiles`**: User data, global settings (sound, spoiler protection), and statistics.
- **`problems`**: Central repository of competitive programming tasks (ID, Title, Difficulty, Tags, Input/Output).
- **`submissions`**: History of code executions with verdicts (AC, WA, TLE, etc.).
- **`revealed_problems`**: Table for persistent storage of which "Spoilers" a user has explicitly unlocked.

## 🛠 Unique Features & Logic
- **Spoiler Protection**: A system-wide setting to hide problem tags and difficulty until solved or explicitly revealed. Reveal state is persisted in the `revealed_problems` table.
- **Codeforces Math Sanitization**: Specialized regex logic to handle non-standard math symbols like the "Mathematical Asterisk Operator" (U+2217) used in CP platforms.
- **Optimized Layout**: Uses `absolute inset-0` and strict flexbox constraints to ensure the IDE workspace feels like a desktop application with independent scrolling areas.

## 🧠 AI Integration
The platform includes an **AI Mentor** (using Google Gemini) that can analyze the user's code, provide hints without spoiling the solution, and recommend problems based on the user's weak topics identified from submission history.
