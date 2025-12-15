# Current App Analysis: SkillUp2Dev (v1)

This document details the features, logical flows, and architecture of the current "SkillUp2Dev" application based on codebase analysis.

## 1. Core Feature Set

### A. AI Curriculum Design
-   **Hierarchical Generation**: The system doesn't just list topics; it structures them into **Modules** (Parents) and **Sub-topics** (Children).
-   **Logic**:
    1.  Admin provides `Title` + `Description`.
    2.  Gemini AI generates a JSON structure.
    3.  System parses JSON to create `Topic` records, maintaining parent/child relationships.

### B. Content Factory
-   **Generation**: Admin generates markdown content (500-800 words) for each sub-topic.
-   **Feedback Loop**: Admins can provide specific feedback (e.g., "Add more code examples") to regenerate content.
-   **Approval Workflow**: Content is `DRAFT` by default. Must be explicitly `APPROVED` by Admin to be publishable.

### C. Assessment Engine
-   **Practice Exams**: AI generates multiple-choice questions based on the specific topic content.
-   **Logic**: 
    -   Extracts ~3000 chars of context from the topic.
    -   Generates 4-option MCQs with explanations.
    -   Stores results in `ExamAttempt`.e

### D. Publishing Logic
-   **Safety Checks**: Course/Module cannot be published unless:
    1.  All topics are `APPROVED`.
    2.  All topics have content.
-   **Granularity**: Supports publishing individual Modules or the entire Course.

### E. Learning Experience (The Consumer Loop)
-   **Structured Path**: Learners see a clear progress path (Course -> Module -> Topic).
-   **Study & Verify**: The core loop is *Read Content* -> *Take Exam*.
-   **Progress Tracking**: Users can explicitly "Mark as Complete" for topics. The system tracks % completion per course based on these actions.
-   **PDF Export**: Built-in "Print to PDF" functionality allows learners to save topic content as clean, styled PDF documents for offline study.
-   **Instant Feedback**: Exam results are immediate, with explanations for every answer (correct or wrong), reinforcing learning.

## 2. User Roles & Flows

### Admin Flow
1.  **Dashboard**: Sees stats (Total Courses, Topics).
2.  **Create Course**: "Python Masterclass".
3.  **Generate Topics**: AI builds the syllabus -> "Module 1: Basics", "Topic 1.1: Syntax".
4.  **Review & Content**: Admin clicks a topic, generates content, reviews, approves.
5.  **Publish**: Publishes "Module 1" so students can start while Module 2 is being built.

### Consumer (Learner) Flow
1.  **Login**: Redirected specifically to `/learn` (cannot access Admin dashboard).
2.  **Browse**: Sees "Partially Published" or "Completed" courses.
3.  **Study**: Reads markdown content for a topic.
4.  **Test**: Takes a practice exam for that topic immediately after reading.

## 3. Tech Stack Review
-   **Backend**: FastAPI + SQLAlchemy (Postgres/SQLite) + Gemini AI (via `google-generativeai`).
-   **Frontend**: Next.js (App Router) + Tailwind CSS + Lucide Icons.
-   **Auth**: JWT-based (Admin/Consumer roles).

## 4. Key Strengths to Retain
1.  **Strict Hierarchy**: The Module/Topic structure is excellent for organized learning.
2.  **Quality Control**: The "Approve before Publish" workflow ensures AI errors don't reach students.
3.  **Granular Publishing**: Being able to release Module 1 while working on Module 2 is a great SaaS feature.

## 5. Future Scope (Roadmap)

### A. Advanced User Hierarchy
-   **Implementation**: Scale from simple Admin/Consumer to a multi-tier Org structure:
    -   **L1 Org Admin**: Manage billing/subscriptions.
    -   **L2 Dept Head**: Manage staff and assign courses to departments.
    -   **L3 Teacher/Facilitator**: Track student progress, grade exams.
    -   **L4 Student**: Consume content and take tests.

### B. Enhanced Tracking & Monetization
-   **Teacher Dashboard**: Real-time view of student completion % and exam scores.
-   **Monetization**: Infrastructure to support paid course subscriptions or organization licensing.

### C. Advanced Assessment
-   **Important Questions Generator**: AI feature to scan all topics in a module and extract "Must Know" key questions for revision.
-   **Teacher-Led Final Exams**:
    -   Teachers can design a comprehensive Final Exam.
    -   **Conditional Unlocking**: Exam remains locked until the student marks all module topics as "Complete".
