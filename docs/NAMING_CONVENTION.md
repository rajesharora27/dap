# DAP Component Naming Convention

**Purpose:** Standard terminology for prompts and discussions to avoid confusion.

---

## Quick Reference Table

| Term | Definition | Example Usage |
|------|-----------|---------------|
| **Product** | A standalone product definition | "Cisco Secure Access" |
| **Solution** | A bundle of Products | "Cisco Security Suite" |
| **Task** | An implementation step within Product/Solution | "Configure SSO" |
| **Customer** | An organization using DAP | "Acme Corporation" |
| **Adoption Plan** | Customer's copy of Product tasks | "Acme's SSA adoption plan" |

---

## Core Entities (The "What")

### Product
A **standalone product** with its own tasks, licenses, outcomes, and releases.

**Contains:**
- Tasks (ProductTask)
- Licenses (Essential/Advantage/Signature)
- Outcomes (business goals)
- Releases (versions)
- Tags (for categorization)
- Custom Attributes

**Database:** `Product`, `Task`, `License`, `Outcome`, `Release`, `ProductTag`, `TaskTag`

---

### Solution
A **bundle of products** that can also have its own solution-level tasks.

**Contains:**
- Products (bundled)
- Solution-level Tasks
- Licenses, Outcomes, Releases (inherited + own)
- Tags

**Database:** `Solution`, `SolutionProduct`, `SolutionTag`, `SolutionTaskTag`

---

### Customer
An **organization** that adopts products/solutions.

**Can have:**
- Assigned Products → Creates AdoptionPlan
- Assigned Solutions → Creates SolutionAdoptionPlan

**Database:** `Customer`, `CustomerProduct`, `CustomerSolution`

---

## Adoption Plans (The "Tracking")

### AdoptionPlan (Product Adoption Plan)
Created when a **Product is assigned to a Customer** directly (not through a solution).

**Short forms:** "Product Adoption Plan", "Standalone Adoption Plan"

**Contains:**
- CustomerTasks (copies of Product tasks)
- Filter preferences (license, outcomes, releases)
- Progress tracking

**Database:** `AdoptionPlan`, `CustomerTask`, `CustomerTelemetryAttribute`

---

### SolutionAdoptionPlan
Created when a **Solution is assigned to a Customer**.

**Contains:**
- SolutionAdoptionProducts (the products in the solution)
- CustomerSolutionTasks (copies of all tasks)
- Aggregated progress

**Database:** `SolutionAdoptionPlan`, `SolutionAdoptionProduct`, `CustomerSolutionTask`

---

## Task Copies (The "Instances")

### Task (Template Task)
The **master definition** of a task in a Product or Solution.
- Lives in Product or Solution
- Acts as template for customer copies
- Changes here can be synced to customer copies

**Location:** Products page → Expand product → Tasks tab

---

### CustomerTask
A **customer-specific copy** of a Product task within an AdoptionPlan.
- Created when product is assigned to customer
- Has customer-specific status (NOT_STARTED, IN_PROGRESS, DONE, etc.)
- Can have customer-specific telemetry values

**Location:** Customers page → Expand customer → Adoption Plan → Tasks

---

### CustomerSolutionTask
A **customer-specific copy** of a task within a SolutionAdoptionPlan.
- Created when solution is assigned to customer
- Tracks status for solution-based adoption

**Location:** Customers page → Expand customer → Solution Adoption Plan → Tasks

---

## UI Pages / Views

| Page | URL Pattern | Shows |
|------|-------------|-------|
| **Dashboard** | `/` | Executive overview, metrics |
| **Products** | `/products` | Product list with expandable details |
| **Solutions** | `/solutions` | Solution list with expandable details |
| **Customers** | `/customers` | Customer list with adoption plans |
| **Product Detail** | `/products` (expanded) | Tasks, Licenses, Outcomes, Releases |
| **Adoption Plan** | `/customers` (expanded) | CustomerTasks with progress |

---

## Naming Patterns for Prompts

### When Discussing Templates (Source Data)
- "**Product tasks**" = Tasks defined in a Product
- "**Solution tasks**" = Tasks defined in a Solution
- "**Product tags**" = Tags on a Product
- "**Task tags**" = Tags on Tasks

### When Discussing Customer Data
- "**Customer's adoption plan**" = The AdoptionPlan for a customer
- "**Customer tasks**" = CustomerTask instances (copies)
- "**Solution adoption plan**" = SolutionAdoptionPlan
- "**Customer solution tasks**" = CustomerSolutionTask instances

### When Discussing UI Elements
- "**Products page**" = The main products listing
- "**Product dialog**" / "**Edit Product dialog**" = The edit dialog
- "**Task panel**" = The tasks section in expanded view
- "**Adoption Plan tab**" = Customer's task tracking view

---

## Full Entity List (Database Models)

### Core Entities
| Model | Description |
|-------|-------------|
| `Product` | Product definition |
| `Solution` | Solution (product bundle) |
| `Customer` | Customer organization |
| `Task` | Implementation step template |

### Associations
| Model | Description |
|-------|-------------|
| `SolutionProduct` | Product → Solution link |
| `CustomerProduct` | Customer → Product assignment |
| `CustomerSolution` | Customer → Solution assignment |

### Adoption Plans
| Model | Description |
|-------|-------------|
| `AdoptionPlan` | Product adoption tracking |
| `SolutionAdoptionPlan` | Solution adoption tracking |
| `SolutionAdoptionProduct` | Products within solution adoption |

### Task Copies
| Model | Description |
|-------|-------------|
| `CustomerTask` | Customer copy of product task |
| `CustomerSolutionTask` | Customer copy of solution task |

### Attributes
| Model | Description |
|-------|-------------|
| `License` | License level (Essential/Advantage/Signature) |
| `Outcome` | Business outcome/goal |
| `Release` | Product version |
| `CustomAttribute` | Flexible key-value attributes |

### Tags
| Model | Description |
|-------|-------------|
| `ProductTag` | Tag on Product |
| `TaskTag` | Tag on Task (template) |
| `CustomerTaskTag` | Tag on CustomerTask (copy) |
| `SolutionTag` | Tag on Solution |
| `SolutionTaskTag` | Tag on Solution task |
| `CustomerSolutionTaskTag` | Tag on CustomerSolutionTask |

### Telemetry
| Model | Description |
|-------|-------------|
| `TelemetryAttribute` | Telemetry definition on Task |
| `TelemetryValue` | Historical telemetry values |
| `CustomerTelemetryAttribute` | Customer telemetry tracking |
| `CustomerTelemetryValue` | Customer telemetry values |

### Auth & System
| Model | Description |
|-------|-------------|
| `User` | User account |
| `Role` | Role definition |
| `Permission` | Resource permission |
| `Session` | User session |
| `AuditLog` | Audit trail |

---

## Common Confusions to Avoid

| ❌ Confusing | ✅ Clear |
|-------------|---------|
| "the task" | "Product task" or "CustomerTask" |
| "adoption plan" | "AdoptionPlan" or "SolutionAdoptionPlan" |
| "tags" | "ProductTag", "TaskTag", or "CustomerTaskTag" |
| "the plan" | "AdoptionPlan" or "SolutionAdoptionPlan" |
| "solution task" | Task in a Solution (template) vs CustomerSolutionTask (copy) |

---

## Abbreviations

| Abbrev | Full Name |
|--------|-----------|
| AP | AdoptionPlan |
| SAP | SolutionAdoptionPlan |
| CT | CustomerTask |
| CST | CustomerSolutionTask |
| SME | Subject Matter Expert (role) |
| CSS | Customer Success Specialist (role) |
