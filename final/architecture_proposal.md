# SkillUp2Dev V2: Architecture Proposal (Firestore Edition)

This document outlines the architecture for the "Final Version" of SkillUp2Dev, transitioning from a single-tenant SQL application to a multi-tenant, hierarchical Firestore-based platform.

## 1. Core Vision

- **Central Library**: A global repository of courses (Python, Java, etc.) created by the Platform Admin.
- **Tenancy**: Organizations (Colleges, Companies) subscribe to content.
- **Hierarchy**: Generic user roles that adapt to different Organization types.

## 2. Firestore Data Model

We will migrate from relational tables to document collections.

### A. The Central Library (`/central_library`)
This collection replaces the current `courses` table but acts as the "Master Copy".

- `central_library/courses/{courseId}`
  - `title`: "Python Masterclass"
  - `category`: "Computer Science"
  - `description`: "..."
  - `topics` (Sub-collection)
    - `topicId`: "..."
    - `content`: "markdown..."
    - `exam`: { ... }

### B. Organizations (`/organizations`)
The new root for tenancy.

- `organizations/{orgId}`
  - `name`: "TechCorp Inc"
  - `type`: "CORPORATE" (or EDUCATION)
  - `subscribed_categories`: ["IT", "Management"]
  
  **Sub-collections:**
  - `departments/{deptId}`
    - `name`: "Engineering"
    - `head_user_id`: "ref_to_user"

### C. Users (`/users`)
Users are global but linked to an Organization.

- `users/{userId}`
  - `email`: "employee@techcorp.com"
  - `role`: "LEARNER"
  - `org_id`: "{orgId}"
  - `dept_id`: "{deptId}" (e.g., Engineering)
  - `hierarchical_path`: ["org_admin_id", "dept_head_id"] (For easy permission checks)

### D. Course Instances (`/course_instances`)
When an Org "assigns" a course, we create an instance to track their specific progress/customization.

- `course_instances/{instanceId}`
  - `source_course_id`: "{centralCourseId}"
  - `org_id`: "{orgId}"
  - `dept_id`: "{deptId}"
  - `assigned_to`: ["userId1", "userId2"]

## 3. Generic User Hierarchy

We will define 4 fixed levels that map to any organization type.

| Level | Role Code | Responsibilities | Education Mapping | Corporate Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **L1** | `ORG_ADMIN` | Tenant Owner. manages billing, adds Departments. | Dean / Principal | CEO / CTO |
| **L2** | `DEPT_HEAD` | Manages a group of staff and learners. | HOD | VP / Manager |
| **L3** | `FACILITATOR` | Assigned to Courses, grades assignments, creates supplemental content. | Professor | Team Lead / Trainer |
| **L4** | `LEARNER` | Consumes content. | Student | Employee |

## 4. Implementation Steps

1.  **Init Firestore**: Set up Firebase project and rules.
2.  **Migration Script**: Convert SQL `Course`/`Topic` data to Firestore `central_library`.
3.  **Org Management**: Create "Super Admin" UI to create Organizations.
4.  **User Migration**: Move existing users to `users` collection, assigning them to a default "Demo Org".

---
### Questions
1.  **Categories**: Should the "Central Library" be strictly categorized (e.g., hierarchy like `Category -> Subcategory -> Course`)?
2.  **Customization**: If a Department Head wants to *add* a topic to a Central Course for their team, should that be allowed? (This affects the data model significantly).
