
SkillUp2Dev – Product Requirements Document (PRD)
Version: 2.0
Document Type: Full PRD (Functional + Non-Functional Requirements)

1. PRODUCT OVERVISION

SkillUp2Dev is an AI-powered academic content and assessment platform designed for colleges and universities. It enables them to:

Generate full course curriculum using AI

Customize content through teacher-friendly editing tools

Deliver topic-level practice tests, module-wise exams, and final course exams

Track student progress and performance

Access a central library of ready-made courses

Generate printable study materials and important questions

SkillUp2Dev bridges the gap between AI content creation and academic assessment workflows required by higher education institutions.

2. PRIMARY USER ROLES
2.1 Organization Admin (College Admin)

Manages institution-level setup

Imports courses from Central Library

Assigns teachers

Publishes courses to students

Monitors high-level analytics

2.2 Teacher

Customizes course content

Regenerates or edits AI content

Approves and publishes topic versions

Creates module exams and final exams

Generates important question sets

Reviews student exam results

2.3 Student

Studies course content

Takes practice MCQs

Marks topics as complete

Unlocks module and final exams

Downloads PDF study materials

2.4 Platform Admin (Super Admin)

Manages the Central Library

Manages global course quality

Oversees shared important question repository

Can review org-submitted content

3. PRODUCT GOALS
3.1 Functional Goals

Provide fast AI-assisted course creation

Allow deep customization of content per college

Offer structured learning with topic → module → course flow

Enable both self-check practice and evaluative exams

Provide teacher dashboards for monitoring student performance

Provide Org Admin analytics

3.2 Non-Functional Goals

Multi-tenant architecture

Scalable, low-cost infrastructure

Data isolation per organization

Highly reliable exam storage

4. SYSTEM MODULES & REQUIREMENTS
4.1 CENTRAL COURSE LIBRARY

(Managed by Platform Admin)

Purpose

A master repository of AI-generated “gold standard” courses.

Features

AI syllabus generator

AI topic generator

Human review and approval

Publish to Library

Search and browse

Requirements

Courses are stored as master copies.

Colleges can import a course → deep clone.

Library-visible metadata includes category, tags, outcomes, difficulty.

4.2 ORG COURSE WORKSPACE

(Owned by each college)

Purpose

A customizable copy of the Library course.

Features

Editable modules and topics

Content regeneration using AI

Topic approval workflow

Publishing to students

Requirements

A cloned course contains copy of all modules, topics, content, questions.

Teachers edit the clone, not the master.

Only approved versions of topics become student-visible.

Publishing is module-based or course-based.

4.3 TOPIC VERSIONING SYSTEM

(Enhancement)

Purpose

To safely manage content edits and maintain history.

Requirements

Each topic has multiple versions

draft → editable

approved → ready

active → visible to students

Version includes: content, updated_by, change_notes

Flow

Teacher edits → Creates Draft → Approve → Publish → Becomes Active.

4.4 STUDENT LEARNING PATH

(Existing)

Flow

Topic → Practice Exam → Mark Complete
Module → Module Exam → Complete
Course → Final Exam → Certification (future scope)

Requirements

Practice test is NOT stored

Student progress saved per topic

Module completion auto-detected

Final exam unlocked only after all modules completed

4.5 PRACTICE EXAMS

(Not stored)

Requirements

MCQs generated from topic content

4 options + explanation

No storing of marks

Multiple retakes allowed

Students can self-assess

4.6 MODULE-WISE EXAMS

(Stored)

Purpose

Academic assessment for each module.

Requirements

Teacher creates exam manually or AI-assist

Teacher publishes exam → visible to students

Attempts stored

Only 1 attempt (default)

Teacher sees attempt details

Option to require module completion before exam unlock

4.7 FINAL COURSE EXAM

(Stored)

Purpose

Summative exam at course completion.

Requirements

Unlocks only when:

all modules completed


Teacher can:

Generate using AI

Edit

Publish

Attempt & scoring stored

Teacher views performance analytics

4.8 IMPORTANT QUESTIONS GENERATOR

(Enhancement)

Purpose

Provide high-value academic question banks.

Capabilities

Generate question sets for module or whole course

Question types:

Short answer (2 marks)

Long answer (5 marks, 10 marks)

Definitions

Differences

Optional answer key

Teacher editable

Saved as IQ Set

Teachers can share IQ sets to global repository

Other teachers can import IQ sets for same course

Requirements

Each IQ Set tied to organization + course

Shared sets require Super Admin approval

4.9 TEACHER DASHBOARD

(Enhancement)

Purpose

Give teachers insight into student performance.

Components
Module Exam Analytics:

Participation rate

Avg score

Weak students list

Weak topics recommended by AI

Final Exam Analytics:

Score distribution

Attempt details

Per-question performance

Student Progress:

% course completed

Module progress breakdown

Last active timestamp

4.10 ORG ADMIN ANALYTICS DASHBOARD

(Enhancement)

Purpose

Institution-level monitoring.

Metrics
Course Utilization:

Students enrolled

Completion %

Drop-off topics

Assessment Analytics:

Avg module exam scores

Avg final exam scores

Course-level performance trend

Engagement:

Daily/weekly active users

Time spent per module

Faculty Activity:

Number of topics edited

Pending approvals

Content freshness score

5. SYSTEM WORKFLOWS
5.1 Course Creation (Platform Admin)

Create Course

AI generates syllabus

Admin edits + approves

Publish to Central Library

5.2 Course Import (Org Admin)

Search Library

Import (deep clone)

Assign teachers

Teacher customizes

Publish

5.3 Teacher Content Editing

Edit topic → New version (draft)

Approve version

Publish module/course

Active version becomes visible

5.4 Student Study Flow

Study topic

Practice MCQs

Mark complete

Take module exam

Complete all modules

Take final exam

5.5 Important Question Flow

Teacher chooses module/course

Generate IQ set

Edit questions

Save IQ set

(Optional) Share to central IQ repository

5.6 Assessment Flow

Teacher schedules/publishes exam

Student attempts

Score stored

Teacher views dashboard

Admin views aggregated analytics

6. NON-FUNCTIONAL REQUIREMENTS
6.1 Security

JWT-based auth

Role-based access control

Org data isolation

Audit logging for content changes

6.2 Performance

Course load < 500ms

AI jobs async with status polling

Dashboards load < 1s

6.3 Scalability

Multi-tenant database design

Horizontal scaling on frontend/backend

Asynchronous AI workflows

6.4 Reliability

Exam data must be stored with ACID guarantees

No loss of student progress

7. TECHNICAL ARCHITECTURE (Recommended)
Frontend

Next.js 14 (App Router)

Tailwind CSS

Server Actions or tRPC

Backend

Postgres (Supabase/Neon/Railway)

Prisma ORM

FastAPI (optional for AI microservices)

AI

Gemini / OpenAI

Async background job queue for long-running tasks

Storage

Cloudflare R2 / Supabase Storage

8. SUCCESS METRICS
Product Success

Number of colleges onboarded

Courses imported from library

Customizations made by teachers

Module & final exam completions

IQ sets generated & reused

Learning Success

Topic completion rates

Module completion rates

Final exam pass rates

Business Success

Monthly active users (MAU)

Conversion from free → paid colleges