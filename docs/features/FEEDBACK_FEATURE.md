# Product/Solution Feedback Feature

**Version:** 1.0.0  
**Status:** 🟡 Planning  
**Branch:** `feature/feedback-workflow`  
**Created:** January 8, 2026  
**Target Completion:** January 20, 2026

---

## Executive Summary

Enable users working on adoption plans (or personal products) to provide structured feedback on tasks. Feedback surfaces on the main Product/Solution pages for SME review and response, creating a closed-loop feedback workflow.

---

## User Stories

| ID | Role | Story | Priority |
|----|------|-------|----------|
| US-1 | User | As a user working on an adoption plan, I want to submit feedback on a task so the product team knows about issues/suggestions | P0 |
| US-2 | User | As a user in My Products, I want to submit feedback on tasks I'm practicing with | P0 |
| US-3 | SME | As an SME, I want to see all feedback for my products/solutions in one place | P0 |
| US-4 | SME | As an SME, I want to respond to feedback so users know their input was heard | P0 |
| US-5 | User | As a user, I want to see responses to my feedback and continue the conversation | P1 |
| US-6 | Admin | As an admin, I want to configure feedback templates for structured input | P2 |

---

## Technical Design

### Data Model

```prisma
// ============================================================================
// FEEDBACK SYSTEM
// ============================================================================

model Feedback {
  id              String          @id @default(cuid())
  
  // What the feedback is about
  productId       String?
  solutionId      String?
  taskId          String?
  
  // Source of feedback
  sourceType      FeedbackSource  // ADOPTION_PLAN | PERSONAL_PRODUCT | DIRECT
  adoptionPlanId  String?
  personalProductId String?
  customerId      String?
  
  // Feedback content
  title           String
  description     String          @db.Text
  category        FeedbackCategory
  priority        FeedbackPriority @default(MEDIUM)
  templateData    Json?
  
  // Status workflow
  status          FeedbackStatus  @default(OPEN)
  
  // Audit
  createdBy       String
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  closedAt        DateTime?
  closedBy        String?
  
  // Relationships
  product         Product?        @relation(fields: [productId], references: [id], onDelete: Cascade)
  solution        Solution?       @relation(fields: [solutionId], references: [id], onDelete: Cascade)
  task            Task?           @relation(fields: [taskId], references: [id], onDelete: SetNull)
  creator         User            @relation("FeedbackCreator", fields: [createdBy], references: [id])
  closer          User?           @relation("FeedbackCloser", fields: [closedBy], references: [id])
  responses       FeedbackResponse[]
  
  @@index([productId, status])
  @@index([solutionId, status])
  @@index([createdBy])
  @@index([status])
}

model FeedbackResponse {
  id          String    @id @default(cuid())
  feedbackId  String
  message     String    @db.Text
  isOfficial  Boolean   @default(false)
  createdBy   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  feedback    Feedback  @relation(fields: [feedbackId], references: [id], onDelete: Cascade)
  creator     User      @relation(fields: [createdBy], references: [id])
  
  @@index([feedbackId])
}

model FeedbackTemplate {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  schema      Json
  scope       FeedbackTemplateScope @default(ALL)
  productId   String?
  solutionId  String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([scope])
}

enum FeedbackSource {
  ADOPTION_PLAN
  PERSONAL_PRODUCT
  DIRECT
}

enum FeedbackCategory {
  BUG
  IMPROVEMENT
  DOCUMENTATION
  QUESTION
  OTHER
}

enum FeedbackPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum FeedbackStatus {
  OPEN
  IN_REVIEW
  IN_PROGRESS
  RESOLVED
  CLOSED
  WONT_FIX
}

enum FeedbackTemplateScope {
  ALL
  PRODUCT
  SOLUTION
}
```

### File Structure

```
backend/src/modules/feedback/
├── feedback.service.ts
├── feedback.resolver.ts
├── feedback.schema.graphql
├── feedback.types.ts
├── feedback.validation.ts
├── feedback-response.service.ts
├── feedback-template.service.ts
├── __tests__/
│   ├── feedback.service.test.ts
│   └── feedback.resolver.test.ts
└── index.ts

frontend/src/features/feedback/
├── components/
│   ├── FeedbackDialog.tsx
│   ├── FeedbackForm.tsx
│   ├── FeedbackTab.tsx
│   ├── FeedbackList.tsx
│   ├── FeedbackCard.tsx
│   ├── FeedbackDetailDialog.tsx
│   ├── FeedbackResponseForm.tsx
│   ├── FeedbackStatusBadge.tsx
│   └── FeedbackFilters.tsx
├── graphql/
│   ├── queries.ts
│   └── mutations.ts
├── hooks/
│   └── useFeedback.ts
├── types/
│   └── index.ts
└── index.ts
```

---

## Implementation Tracker

### Legend
- ⬜ Not Started
- 🟡 In Progress
- ✅ Completed
- ⏸️ Blocked
- ❌ Cancelled

---

### Phase 0: Setup
| # | Task | Status | Assignee | Notes |
|---|------|--------|----------|-------|
| 0.1 | Create feature branch `feature/feedback-workflow` | ✅ | - | Branch from main |
| 0.2 | Create this documentation | ✅ | - | This file |

---

### Phase 1: Backend - Database & Core Service (Days 1-2)
| # | Task | Status | Files | Est | Notes |
|---|------|--------|-------|-----|-------|
| 1.1 | Add Prisma models | ⬜ | `schema.prisma` | 2h | Feedback, FeedbackResponse, FeedbackTemplate |
| 1.2 | Run migration | ⬜ | `migrations/` | 0.5h | `npx prisma migrate dev` |
| 1.3 | Create feedback.service.ts | ⬜ | `feedback.service.ts` | 4h | CRUD operations |
| 1.4 | Create feedback-response.service.ts | ⬜ | `feedback-response.service.ts` | 2h | Response CRUD |
| 1.5 | Create feedback-template.service.ts | ⬜ | `feedback-template.service.ts` | 2h | Template management |
| 1.6 | Add DataLoaders | ⬜ | `dataloaders.ts` | 1h | Batch loading |

**Phase 1 Checkpoint:** Services can create/read/update feedback via direct calls.

---

### Phase 2: Backend - GraphQL API (Days 2-3)
| # | Task | Status | Files | Est | Notes |
|---|------|--------|-------|-----|-------|
| 2.1 | Create GraphQL schema | ⬜ | `feedback.schema.graphql` | 2h | Types, inputs, queries, mutations |
| 2.2 | Create resolvers | ⬜ | `feedback.resolver.ts` | 4h | Wire to services |
| 2.3 | Add RBAC checks | ⬜ | `feedback.resolver.ts` | 1h | Permission guards |
| 2.4 | Register module | ⬜ | `schema/index.ts` | 0.5h | Add to schema composition |
| 2.5 | Add audit logging | ⬜ | `feedback.service.ts` | 1h | Track changes |

**Phase 2 Checkpoint:** GraphQL Playground can create/query feedback.

---

### Phase 3: Backend - Testing (Day 3)
| # | Task | Status | Files | Est | Notes |
|---|------|--------|-------|-----|-------|
| 3.1 | Unit tests - service | ⬜ | `feedback.service.test.ts` | 3h | Mock Prisma |
| 3.2 | Integration tests | ⬜ | `graphql-feedback.test.ts` | 3h | Real GraphQL calls |
| 3.3 | RBAC tests | ⬜ | `graphql-feedback-rbac.test.ts` | 2h | Permission enforcement |

**Phase 3 Checkpoint:** All backend tests pass (aim for 80%+ coverage).

---

### Phase 4: Frontend - Feedback Creation (Days 4-5)
| # | Task | Status | Files | Est | Notes |
|---|------|--------|-------|-----|-------|
| 4.1 | Create GraphQL operations | ⬜ | `feedback/graphql/*.ts` | 2h | Queries + mutations |
| 4.2 | Create FeedbackDialog | ⬜ | `FeedbackDialog.tsx` | 4h | Modal for submitting feedback |
| 4.3 | Create FeedbackForm | ⬜ | `FeedbackForm.tsx` | 3h | Form with validation |
| 4.4 | Add button to AdoptionTaskTable | ⬜ | `AdoptionTaskTable.tsx` | 1h | 💬 icon button |
| 4.5 | Add button to SortableTaskItem | ⬜ | `SortableTaskItem.tsx` | 1h | For My Products |
| 4.6 | Add button to CustomerTaskRow | ⬜ | `CustomerTaskRow.tsx` | 1h | For adoption plans |
| 4.7 | Create useFeedback hook | ⬜ | `useFeedback.ts` | 2h | Encapsulate logic |

**Phase 4 Checkpoint:** Users can submit feedback from task rows.

---

### Phase 5: Frontend - SME View (Days 6-7)
| # | Task | Status | Files | Est | Notes |
|---|------|--------|-------|-----|-------|
| 5.1 | Create FeedbackTab | ⬜ | `FeedbackTab.tsx` | 4h | Main container |
| 5.2 | Create FeedbackList | ⬜ | `FeedbackList.tsx` | 3h | List with pagination |
| 5.3 | Create FeedbackCard | ⬜ | `FeedbackCard.tsx` | 2h | Summary card |
| 5.4 | Create FeedbackFilters | ⬜ | `FeedbackFilters.tsx` | 2h | Status/category/priority |
| 5.5 | Create FeedbackDetailDialog | ⬜ | `FeedbackDetailDialog.tsx` | 4h | Full feedback view |
| 5.6 | Create FeedbackResponseForm | ⬜ | `FeedbackResponseForm.tsx` | 2h | Reply input |
| 5.7 | Create FeedbackStatusBadge | ⬜ | `FeedbackStatusBadge.tsx` | 1h | Visual status |
| 5.8 | Add tab to ProductsPageContent | ⬜ | `ProductsPageContent.tsx` | 1h | "Feedback (n)" tab |
| 5.9 | Add tab to SolutionsPageContent | ⬜ | `SolutionsPageContent.tsx` | 1h | "Feedback (n)" tab |

**Phase 5 Checkpoint:** SMEs can view and respond to feedback on Product/Solution pages.

---

### Phase 6: Polish & Admin (Days 8-9)
| # | Task | Status | Files | Est | Notes |
|---|------|--------|-------|-----|-------|
| 6.1 | Status workflow UI | ⬜ | `FeedbackDetailDialog.tsx` | 2h | Status dropdown with transitions |
| 6.2 | My Feedback view | ⬜ | `MyFeedbackTab.tsx` | 3h | User's submitted feedback |
| 6.3 | Add to My Diary | ⬜ | `DiaryPage.tsx` | 1h | "My Feedback" tab |
| 6.4 | Feedback template admin | ⬜ | `FeedbackTemplateManager.tsx` | 4h | Admin UI (P2) |
| 6.5 | Empty states & loading | ⬜ | Various | 2h | UX polish |
| 6.6 | Error handling | ⬜ | Various | 1h | User-friendly errors |

**Phase 6 Checkpoint:** Feature is polished and admin can manage templates.

---

### Phase 7: Testing & Documentation (Day 10)
| # | Task | Status | Files | Est | Notes |
|---|------|--------|-------|-----|-------|
| 7.1 | Frontend component tests | ⬜ | `__tests__/*.test.tsx` | 3h | Key components |
| 7.2 | E2E tests | ⬜ | `e2e/feedback.spec.ts` | 2h | Happy path |
| 7.3 | Update CONTEXT.md | ⬜ | `docs/CONTEXT.md` | 0.5h | Document changes |
| 7.4 | Update APPLICATION_BLUEPRINT.md | ⬜ | `docs/APPLICATION_BLUEPRINT.md` | 0.5h | Add pattern |
| 7.5 | API documentation | ⬜ | `docs/API_REFERENCE.md` | 1h | GraphQL operations |

**Phase 7 Checkpoint:** All tests pass, documentation complete.

---

### Phase 8: Review & Deployment (Day 11)
| # | Task | Status | Files | Est | Notes |
|---|------|--------|-------|-----|-------|
| 8.1 | Create Pull Request | ⬜ | - | 0.5h | From feature branch |
| 8.2 | Code review | ⬜ | - | 2h | Address feedback |
| 8.3 | UAT testing | ⬜ | - | 2h | Stakeholder validation |
| 8.4 | Merge to main | ⬜ | - | 0.5h | After approval |
| 8.5 | Deploy to production | ⬜ | - | 1h | Using deploy script |
| 8.6 | Post-deploy verification | ⬜ | - | 0.5h | Smoke tests |

**Phase 8 Checkpoint:** Feature live in production! 🎉

---

## Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0: Setup | ✅ Complete | 2/2 |
| Phase 1: Backend Core | ⬜ Not Started | 0/6 |
| Phase 2: Backend API | ⬜ Not Started | 0/5 |
| Phase 3: Backend Tests | ⬜ Not Started | 0/3 |
| Phase 4: Frontend Create | ⬜ Not Started | 0/7 |
| Phase 5: Frontend SME | ⬜ Not Started | 0/9 |
| Phase 6: Polish | ⬜ Not Started | 0/6 |
| Phase 7: Testing/Docs | ⬜ Not Started | 0/5 |
| Phase 8: Deployment | ⬜ Not Started | 0/6 |
| **TOTAL** | **🟡 In Progress** | **2/49** |

---

## Architecture Diagrams

### Feedback Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FEEDBACK SOURCES                                  │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│  Customer Adoption  │   My Products       │   Direct (Product/Solution     │
│  Plan Tasks         │   (Personal)        │   Page)                        │
│  ┌───────────────┐  │  ┌───────────────┐  │  ┌───────────────┐             │
│  │ Task Row      │  │  │ Task Row      │  │  │ Feedback Tab  │             │
│  │ [💬 Feedback] │  │  │ [💬 Feedback] │  │  │ [+ New]       │             │
│  └───────────────┘  │  └───────────────┘  │  └───────────────┘             │
└─────────┬───────────┴─────────┬───────────┴─────────────┬───────────────────┘
          │                     │                         │
          ▼                     ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FEEDBACK DIALOG                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Category: [Bug ▼]  Priority: [Medium ▼]                                │ │
│  │ Title: [___________________________________]                           │ │
│  │ Description: [                            ]                           │ │
│  │ Task Context: "Configure SSO Integration" (auto-filled)               │ │
│  │                                           [Cancel] [Submit Feedback]  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRODUCT/SOLUTION PAGE - FEEDBACK TAB                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Filters: [Status: All ▼] [Category: All ▼] [Priority: All ▼]          │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │ 🔴 CRITICAL | Bug | "SSO fails with SAML 2.0"                         │ │
│  │    Task: Configure SSO | Customer: Acme Corp | 2 responses            │ │
│  │    Status: IN_PROGRESS | Created: Jan 5, 2026                         │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │ 🟡 MEDIUM | Improvement | "Add bulk task import"                      │ │
│  │    Task: (General) | Source: Personal | 0 responses                   │ │
│  │    Status: OPEN | Created: Jan 7, 2026                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Status Workflow
```
     ┌────────────────────────────────────────────────────────────┐
     │                                                            │
     ▼                                                            │
  ┌──────┐     ┌───────────┐     ┌─────────────┐     ┌──────────┐│
  │ OPEN │────▶│ IN_REVIEW │────▶│ IN_PROGRESS │────▶│ RESOLVED ││
  └──────┘     └───────────┘     └─────────────┘     └──────────┘│
     │              │                   │                  │      │
     │              │                   │                  │      │
     │              ▼                   ▼                  ▼      │
     │         ┌──────────┐        ┌────────┐         ┌────────┐ │
     └────────▶│ WONT_FIX │        │ CLOSED │◀────────│ CLOSED │◀┘
               └──────────┘        └────────┘         └────────┘
```

---

## Open Questions (To Decide Before Building)

| # | Question | Options | Decision |
|---|----------|---------|----------|
| 1 | Notifications | Email on new feedback? In-app badge? | TBD |
| 2 | Anonymous feedback | Allow hiding submitter identity? | TBD |
| 3 | Attachments | Allow screenshots/files? | TBD (Phase 2?) |
| 4 | Feedback voting | Upvote/downvote feedback? | TBD (Phase 2?) |
| 5 | SLA tracking | Track response time metrics? | TBD (Phase 2?) |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep (notifications, voting, etc.) | Medium | Defer to Phase 2, document in backlog |
| RBAC complexity | Medium | Reuse existing permission patterns |
| Performance with many feedback items | Low | Pagination, DataLoaders, indexes |

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| Jan 8, 2026 | Initial design document created | - |

