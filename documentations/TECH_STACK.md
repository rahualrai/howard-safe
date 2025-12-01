# Technology Stack - Howard Safe

This document provides a deep dive into the technology stack used to build **Howard Safe**, detailing the frameworks, libraries, and infrastructure components chosen for performance, scalability, and developer experience.

## Frontend (Client-Side)

The frontend is built as a Single Page Application (SPA) optimized for mobile devices.

### Core Framework
*   **[React 18](https://react.dev/)**: The library for web and native user interfaces. We use functional components and hooks exclusively.
*   **[TypeScript 5](https://www.typescriptlang.org/)**: Adds static typing to JavaScript, ensuring type safety and better IDE support.
*   **[Vite 5](https://vitejs.dev/)**: A modern build tool that provides a lightning-fast development server and optimized production builds using Rollup.

### Styling & UI
*   **[Tailwind CSS 3.4](https://tailwindcss.com/)**: A utility-first CSS framework that allows for rapid UI development directly in the markup.
*   **[Shadcn/UI](https://ui.shadcn.com/)**: A collection of re-usable components built using **Radix UI** primitives and styled with Tailwind CSS. This provides accessible, unstyled components that we have customized for our design system.
*   **[Lucide React](https://lucide.dev/)**: A clean, consistent icon library used throughout the application.
*   **[Framer Motion 12](https://www.framer.com/motion/)**: A production-ready motion library for React, used for page transitions, modal animations, and interactive elements.

### State Management & Data Fetching
*   **[TanStack Query (React Query) v5](https://tanstack.com/query/latest)**: Handles server state management. It provides caching, background updates, and stale data handling out of the box, significantly reducing the need for global state management like Redux.
*   **[React Hook Form 7](https://react-hook-form.com/)**: Used for managing complex forms (e.g., Incident Reporting, Profile). It minimizes re-renders and improves performance.
*   **[Zod 3](https://zod.dev/)**: A TypeScript-first schema declaration and validation library. We use it to validate form inputs and API responses.

### Routing
*   **[React Router DOM 6](https://reactrouter.com/)**: Handles client-side routing, enabling navigation between views without full page reloads.

---

## Mobile & Native Integration

While built with web technologies, the app is designed to feel native on mobile devices.

### Wrapper
*   **[Capacitor 7](https://capacitorjs.com/)**: A cross-platform native runtime that wraps the web application in a native container, allowing it to run on iOS and Android and access native device features.

### Native Plugins
*   **`@capacitor/geolocation`**: Accesses the device's GPS to get precise location data for incident reporting and safe zone navigation.
*   **`@capacitor/camera`**: Allows users to take photos directly within the app to attach to incident reports.
*   **`@capacitor/haptics`**: Provides tactile feedback (vibration) for user interactions.
*   **`@capacitor/status-bar` & `@capacitor/navigation-bar`**: Controls the appearance of system bars to provide an immersive experience.

---

## Backend & Database (BaaS)

We utilize a "Backend-as-a-Service" architecture to speed up development and reduce maintenance overhead.

### Platform
*   **[Supabase](https://supabase.com/)**: An open-source Firebase alternative that provides a suite of backend services built on top of PostgreSQL.

### Components
*   **PostgreSQL 15+**: The core database. We use it for storing user profiles, incidents, friendships, and location data.
*   **Supabase Auth (GoTrue)**: Handles user authentication. We support:
    *   Email/Password login.
    *   OAuth providers (Google) for university credential integration.
*   **Supabase Realtime**: Leverages PostgreSQL's replication log to broadcast database changes to connected clients via WebSockets. This powers the **Live Location Sharing** feature.
*   **Supabase Storage**: Object storage compatible with AWS S3. Used for storing:
    *   User avatars.
    *   Incident evidence photos.
*   **Row Level Security (RLS)**: Security policies defined directly in the database to restrict data access based on the user's authentication state (e.g., "Users can only see their own friends' locations").

---

## Maps & Location Services

*   **[Google Maps Platform](https://developers.google.com/maps)**: The industry standard for mapping data.
*   **Maps JavaScript API**: Renders the interactive map.
*   **`@googlemaps/react-wrapper`**: A React component that simplifies loading and managing the Google Maps API state.

---

## DevOps & Infrastructure

### Containerization
*   **[Docker](https://www.docker.com/)**: The application is containerized using a multi-stage `Dockerfile`.
    *   **Stage 1 (Builder)**: Uses a Node.js image to install dependencies and build the static assets.
    *   **Stage 2 (Runner)**: Uses a lightweight Nginx (Alpine) image to serve the built static files.

### Deployment
*   **Web Server**: Nginx is configured to serve the React app and handle client-side routing (SPA fallback to `index.html`).
*   **Orchestration**: `docker-compose` is used to manage the application service alongside other campus services.

### Quality Assurance
*   **ESLint 9**: Static code analysis to catch errors and enforce code quality.
*   **Prettier**: Opinionated code formatter to ensure consistent style.

---

## AI Tools & Development Workflow

We leverage cutting-edge AI tools to accelerate development, ensure code quality, and modernize our deployment strategy.

### Rapid Prototyping
*   **[Lovable](https://lovable.dev/)**: Used for rapid application prototyping and initial codebase generation, allowing us to visualize features quickly.

### AI-Assisted Coding
*   **AntiGravity & Claude Code**: Advanced agentic coding assistants used for "vibe coding"—iterative, conversational development that handles complex refactoring, feature implementation, and architectural decisions.
*   **GitHub Copilot**: Integrated into the IDE for real-time code completion, error detection, and generating unit tests.

### Collaboration & CI/CD
*   **GitHub**: The central hub for version control and collaboration.
*   **GitHub Actions**: Automated CI/CD pipelines for deployment.

### Self-Hosted Infrastructure
*   **Docker**: The core of our deployment strategy. By containerizing the application and its dependencies (database, vector store, etc.), we deploy to our own self-hosted servers, ensuring data sovereignty, reducing cloud costs, and simplifying environment management.

---

## RAG Server (Knowledge Base)

The **Retrieval-Augmented Generation (RAG)** server powers the intelligent chatbot features, allowing users to query university policies and safety procedures using natural language.

### Core Stack
*   **Language**: [Python 3.11](https://www.python.org/) - Chosen for its rich ecosystem of AI and data science libraries.
*   **Framework**: [Flask](https://flask.palletsprojects.com/) - A lightweight WSGI web application framework used to expose the RAG endpoints.

### AI & NLP
*   **LLM Provider**: [Google Gemini](https://deepmind.google/technologies/gemini/) (via `google-generativeai`) - State-of-the-art multimodal model used for generating human-like responses based on retrieved context.
*   **Embeddings**: [Sentence Transformers](https://www.sbert.net/) - Used to convert text documents into vector embeddings for semantic search.
*   **Vector Search**: [NumPy](https://numpy.org/) - Currently used for efficient in-memory vector similarity calculations (cosine similarity) for the knowledge base.

### Infrastructure
*   **Container**: Dockerized using a slim Python image to minimize footprint.
*   **API**: Exposes RESTful endpoints consumed by the main application's backend or directly by the frontend.

