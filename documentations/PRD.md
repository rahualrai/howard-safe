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

### 10. Testing Strategy

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
