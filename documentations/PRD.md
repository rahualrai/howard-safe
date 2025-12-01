# Product Requirements Document (PRD) - Howard Safe

## Phase 1: The Essentials (The Core Structure)

### 1. Title & Metadata

*   **Project Name:** Howard Safe
*   **Date:** November 30, 2025
*   **Version:** 1.1

### 2. Executive Summary / Overview

*   **Elevator Pitch:** Howard Safe is a comprehensive mobile-first safety application designed specifically for the Howard University community, integrating real-time incident reporting, safe zone mapping, and friend location sharing into a single, intuitive platform.
*   **Problem Statement:** Students often feel unsafe navigating campus, especially at night, and lack a centralized, immediate way to report incidents or check on friends. Existing solutions are fragmented or outdated, leading to delayed responses and increased anxiety.
*   **Proposed Solution:** A unified mobile web application that empowers students with real-time tools: instant incident reporting with geolocation, a live map of safe zones and friend locations, and direct access to emergency resources.

### 3. Target Audience (User Personas)

*   **Primary Users:**
    *   **Students:** Need to feel safe walking on/off campus, report suspicious activity, and keep track of friends.
    *   **Faculty/Staff:** Need access to safety resources and emergency alerts.
*   **Secondary Users:**
    *   **Campus Police/Admin:** Need to receive reports, manage alerts, and monitor campus safety trends.
    *   **Parents:** Want peace of mind knowing their child has access to robust safety tools.

### 4. User Stories

1.  **As a Student**, I want to **report an incident with my current location**, so that campus police can respond quickly.
2.  **As a Student**, I want to **see "Safe Zones" on a map**, so that I can plan a safe route home at night.
3.  **As a Student**, I want to **share my real-time location with trusted friends**, so that they know I'm safe when walking alone.
4.  **As a Student**, I want to **access emergency contacts immediately**, so that I can get help without searching for numbers.
5.  **As an Admin**, I want to **view a dashboard of recent incidents**, so that I can deploy resources effectively.
6.  **As a User**, I want to **log in securely using my university credentials**, so that my personal information is protected.
7.  **As a Student**, I want to **read safety tips and resources**, so that I can be better prepared for emergencies.

### 5. Functional Requirements

**Authentication & User Management**
*   The system shall allow users to sign up and log in using email/password or Google OAuth.
*   The system shall automatically create a user profile upon registration.
*   The system shall allow users to manage their profile (avatar, username).

**Incident Reporting**
*   The system shall allow users to create incident reports with a description, type (e.g., Theft, Assault), and optional photo.
*   The system shall automatically capture the user's geolocation when reporting an incident.
*   The system shall allow users to view a history of their reported incidents.

**Map & Location Services**
*   The system shall display an interactive map using Google Maps API.
*   The system shall display "Safe Zones" (e.g., Blue Light locations, staffed buildings) on the map.
*   The system shall display reported incidents on the map (anonymized if necessary).
*   The system shall allow users to share their real-time location with accepted friends.
*   The system shall allow users to toggle location sharing on/off.

**Social (Friends)**
*   The system shall allow users to search for other users by username.
*   The system shall allow users to send, accept, and decline friend requests.
*   The system shall allow users to view a list of their friends.

**Resources & Tips**
*   The system shall provide a categorized list of safety tips and resources.
*   The system shall provide quick-dial buttons for emergency contacts (Campus Police, 911).

### 6. Non-Functional Requirements (NFRs)

*   **Performance:** The application must load the initial dashboard within 2 seconds on 4G networks.
*   **Security:** All user data, especially location and incident reports, must be encrypted in transit (HTTPS) and at rest (RLS policies).
*   **Reliability:** The service should aim for 99.9% uptime, especially during peak campus hours (6 PM - 6 AM).
*   **Compatibility:** The web app must be fully responsive and function correctly on iOS (Safari/Chrome) and Android (Chrome) devices.
*   **Scalability:** The backend should support concurrent connections from at least 10% of the student body during emergencies.

### 7. Technology Stack

For a detailed breakdown of the frameworks, libraries, and infrastructure used in this project, please refer to the [Technology Stack Documentation](./TECH_STACK.md).

*   **Frontend:** React 18, Vite, Tailwind CSS, Shadcn/UI.
*   **Mobile:** Capacitor.
*   **Backend:** Supabase (PostgreSQL, Auth, Realtime).
*   **Maps:** Google Maps API.

### 8. Database Schema / Data Model

*   **Profiles:** `id` (PK), `username`, `full_name`, `avatar_url`, `updated_at`.
*   **Incidents:** `id` (PK), `user_id` (FK), `type`, `description`, `latitude`, `longitude`, `image_url`, `created_at`.
*   **Friendships:** `id` (PK), `user_id_1` (FK), `user_id_2` (FK), `created_at`.
*   **Friend_Requests:** `id` (PK), `from_user_id` (FK), `to_user_id` (FK), `status` (pending/accepted), `created_at`.
*   **User_Locations:** `id` (PK), `user_id` (FK), `latitude`, `longitude`, `updated_at`.
*   **Location_Sharing_Preferences:** `id` (PK), `user_id` (FK), `is_sharing_enabled`.

### 9. User Interface (UI) Design

*   **Sitemap:**
    *   **Auth:** Login / Signup
    *   **Home:** Dashboard with quick actions
    *   **Map:** Full-screen map with layers (Safe Zones, Friends, Incidents)
    *   **Report:** Form to submit incidents
    *   **Tips:** Safety resources and guides
    *   **Profile:** User settings, Friend management
*   **Navigation:** Bottom tab bar for primary navigation (Home, Map, Report, Tips, Profile).


#### I. Frontend (Mobile Web Client)
This is the user-facing layer where students and faculty interact with the application on their mobile devices.
*   **Authentication Interface:** Secure login and registration screens supporting email and Google OAuth.
*   **Incident Reporting Portal:** A streamlined form for users to submit reports with real-time geolocation and photo evidence.
*   **Interactive Map Interface:** A dynamic map displaying safe zones, friend locations, and recent incidents with filtering capabilities.
*   **Safety Dashboard:** A central hub for quick access to emergency contacts, safety tips, and recent alerts.
*   **Friend Management UI:** Interfaces for searching users, sending requests, and managing location sharing preferences.

> **Image Description for Diagram 1 (Frontend Flow):**
> A user flow diagram showing a student logging in on a mobile screen, navigating to the "Report" tab, filling out a form, and seeing a "Success" modal. Another branch shows the user opening the "Map" tab and seeing pins for friends and safe zones.

#### II. Backend (Application Server & Services)
This layer manages the core logic, data routing, and real-time communication between the frontend and the database.
*   **Authentication Service (Supabase Auth):** Verifies user credentials, manages sessions, and handles OAuth callbacks.
*   **Incident Management Service:** Validates incoming reports, processes geolocation data, and triggers notifications.
*   **Real-time Location Engine:** Manages WebSocket connections to broadcast live location updates to authorized friends.
*   **Friendship Service:** Handles the logic for sending, accepting, and declining friend requests and enforcing privacy rules.
*   **RAG Service (Knowledge Base):** Processes natural language queries about safety policies and retrieves relevant answers using AI.

> **Image Description for Diagram 2 (Backend Architecture):**
> A block diagram showing the "Mobile App" connecting to "Supabase" via API. Inside Supabase, show blocks for "Auth", "Database", "Realtime", and "Storage". A separate arrow points from the Backend to the "RAG Server" (Python/Flask) for handling AI queries.

#### III. AI/NLP Models (RAG Server)
These components power the intelligent safety assistant and data processing.
*   **Query Understanding:** Parses user questions about campus safety (e.g., "Where is the nearest blue light?") using LLMs.
*   **Context Retrieval:** Searches the vector database for relevant safety documents and policies.
*   **Response Generation:** Crafts accurate, human-like answers based on the retrieved context using Google Gemini.
*   **Incident Classification (Planned):** Automatically categorizes incident reports based on text descriptions.

> **Image Description for Diagram 3 (AI/RAG Flow):**
> A sequence diagram. Step 1: User asks "What do I do in a fire?". Step 2: Query sent to RAG Server. Step 3: Server converts text to vector. Step 4: Server searches Vector DB. Step 5: Retrieved context + Query sent to Gemini LLM. Step 6: Answer returned to User.
### 10. System Design & Architecture

#### IV. Database and Storage
Responsible for persistent data storage and content management.
*   **User Profiles:** Stores identity information, avatars, and preferences.
*   **Incident Logs:** Securely stores details of reported incidents, including timestamps, types, and locations.
*   **Geospatial Data:** Stores coordinates for safe zones, buildings, and real-time user locations.
*   **Social Graph:** Manages relationships (friendships) and sharing permissions between users.
*   **Evidence Storage:** Encrypted object storage for photos uploaded with incident reports.

> **Image Description for Diagram 4 (Data Model):**
> An Entity-Relationship Diagram (ERD). Central node is "User". "User" connects to "Incidents" (One-to-Many), "Friendships" (Many-to-Many), and "Location" (One-to-One). "Incidents" has fields like lat/long, type, description.

#### V. Cloud Infrastructure and Security
This layer ensures the application is secure, scalable, and available.
*   **Secure API Gateway:** Manages all incoming traffic and enforces rate limiting.
*   **Row Level Security (RLS):** Database-level policies ensuring users can only access data they are authorized to see (e.g., their own friends' locations).
*   **Encrypted Storage:** All sensitive data (passwords, locations) is encrypted at rest and in transit (HTTPS/TLS).
*   **Containerized Deployment:** Docker containers ensure consistent environments across development and production.

> **Image Description for Diagram 5 (Infrastructure):**
> A cloud infrastructure diagram. A "Cloud/Server" box contains a "Docker Compose" group. Inside are containers for "Nginx" (Frontend), "Supabase" (Backend/DB), and "RAG Server". An "Internet" cloud connects to the Nginx container via HTTPS.

### 11. Testing Strategy

*   **Unit Testing:** Test utility functions and hooks (e.g., location formatting).
*   **Integration Testing:** Verify Supabase interactions (Auth, DB queries).
*   **Manual Testing:**
    *   **Cross-Device:** Test on iPhone, Android, and Desktop.
    *   **Field Test:** Verify geolocation accuracy on campus.
    *   **User Acceptance Testing (UAT):** Have a small group of students use the app for a week.

---

## Phase 2: The "Nice-to-Haves" (To Impress)

### 11. Traceability Matrix

| User Story ID | Requirement ID | Test Case ID |
| :--- | :--- | :--- |
| US-1 (Report Incident) | FR-Incident-01, FR-Incident-02 | TC-Report-01: Submit report with location |
| US-2 (Safe Zones) | FR-Map-02 | TC-Map-01: Verify Safe Zones appear on map |
| US-3 (Share Location) | FR-Map-04, FR-Map-05 | TC-Social-01: Toggle location sharing & verify visibility |
| US-6 (Secure Login) | FR-Auth-01 | TC-Auth-01: Login with valid credentials |

### 12. Success Metrics (KPIs)

*   **Adoption:** 500+ Active Users within the first month.
*   **Engagement:** 20% of users checking the map daily.
*   **Response Time:** Average incident reporting time under 1 minute.
*   **Reliability:** < 1% crash rate on mobile devices.

### 13. Risks & Mitigation Strategies

*   **Risk:** Google Maps API costs exceeding budget.
    *   **Mitigation:** Implement aggressive caching and limit map loads/refreshes; consider switching to Mapbox or OpenStreetMap if needed.
*   **Risk:** False reports or spam.
    *   **Mitigation:** Require authentication for all reports; implement a "verify" feature for admins; rate-limit reporting.
*   **Risk:** Battery drain from continuous location sharing.
    *   **Mitigation:** Only update location when the app is active or use significant change monitoring; allow users to pause sharing.

### 14. Future Roadmap (Out of Scope)

*   **Push Notifications:** Real-time alerts for nearby incidents.
*   **Offline Mode:** Ability to view cached maps and safety tips without internet.
*   **Ride Share Integration:** Direct link to Uber/Lyft or Campus Shuttle tracker.
*   **Video Reporting:** Streaming live video to campus police.

### 15. Deployment & DevOps

*   **Source Control:** GitHub.
*   **CI/CD:** GitHub Actions for automated linting and building.
*   **Hosting:**
    *   **Frontend:** Vercel or Netlify (for web access).
    *   **Backend:** Supabase (managed service).
*   **Containerization:** Docker support for local development and potential self-hosting.

### 16. Accessibility (a11y)

*   **Color Contrast:** Ensure all text meets WCAG AA standards.
*   **Screen Readers:** All interactive elements (buttons, inputs) will have proper ARIA labels.
*   **Touch Targets:** All buttons will be at least 44x44px for easy tapping.

### 17. Budget / Cost Analysis

*   **Hosting (Vercel):** Free tier (initially).
*   **Database (Supabase):** Free tier (up to 500MB).
*   **Maps (Google):** $200/month free credit (sufficient for ~28,000 map loads).
*   **Total Estimated Monthly Cost:** $0 (for MVP).

### 18. References

*   Howard University Campus Safety Website.
*   Google Maps Platform Documentation.
*   Supabase Documentation.
