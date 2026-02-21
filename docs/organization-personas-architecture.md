# Organization ↔ AI Personas Architecture

> **Project:** Open Agent Platform — GOEIC Implementation  
> **Last updated:** 2026-02-21

---

## 1. Overview

The platform connects an **organization's human structure** directly to **AI agents**. Every employee gets an AI assistant that understands their role, their department's context, and has access to the right knowledge bases — all automatically, based on their job title.

```
Organization (who you are)  →  Persona (how your agent behaves)  →  Agent (the actual AI)
```

---

## 2. Core Concept: Job Title as the Key

The **`job_title`** field is the linking pin between the entire system:

```
User logs in
   │
   ▼
User Profile (from backend API)
   ├── department:  "إدارة الشؤون القانونية"
   └── job_title:   "مستشار قانوني"
              │
              ▼ (lookup by job_title)
       OrgPersona
          ├── persona_text      → System Prompt base
          ├── agent_type        → org_manager / dept_manager / workgroup...
          ├── hierarchy_level   → 1 / 2 / 3
          ├── rag_collections   → ["goeic-laws", "dept-legal", "role-counselor"]
          ├── capabilities      → ["legal analysis", "document review"]
          └── assigned_agent_id → LangGraph agent UUID
                    │
                    ▼
             AI Agent starts with full org context injected
```

---

## 3. Data Model

### 3.1 Organization Layer (the "who")

#### `OrganizationData` — org_core table
The top-level identity of the organization.

| Field | Type | Purpose |
|---|---|---|
| `name_ar / name_en` | string | Organization name |
| `vision_ar` | string | Strategic vision |
| `mission_ar` | string | Mission statement |
| `goals` | string[] | Strategic goals |
| `values` | string[] | Core values |
| `annual_plan_summary` | string | Current year plan |
| `general_policies` | string[] | Org-wide policies injected into all agents |

#### `OrgDepartment` — org_departments table
Each department within the organization.

| Field | Type | Purpose |
|---|---|---|
| `id` | string | Unique department ID |
| `name_ar / name_en` | string | Department name |
| `manager_title_ar` | string | Head/director title |
| `job_titles` | OrgJobTitle[] | All roles within this department |
| `rag_collection` | string | Department-level RAG collection ID |
| `kpis` | string[] | Department KPIs (injected into dept-level agents) |
| `delegation_level` | 1 \| 2 \| 3 | Authority level (1=executive, 3=operational) |

#### `OrgJobTitle` — embedded in department
Each individual role within a department.

| Field | Type | Purpose |
|---|---|---|
| `title_ar / title_en` | string | Job title (Arabic/English) |
| `description_ar` | string | Role description |
| `hierarchy_level` | 1 \| 2 \| 3 | Position level in org chart |
| `requirements` | string[] | Qualifications |
| `kpis` | string[] | Role-specific KPIs |

---

### 3.2 Persona Layer (the "how")

#### `OrgPersona` — org_personas table
The AI personality configuration for each job title.

| Field | Type | Purpose |
|---|---|---|
| `job_title` | string | **Primary key** — matches OrgJobTitle.title_ar |
| `persona_text` | string | Core personality description → injected as system prompt |
| `agent_type` | AgentArchetype | One of 5 archetypes (see below) |
| `hierarchy_level` | 1 \| 2 \| 3 | Mirrors OrgJobTitle hierarchy level |
| `department` | string | Department ID this persona belongs to |
| `goals` | string[] | Agent-specific objectives |
| `capabilities` | string[] | What the agent can do |
| `rag_collections` | string[] | All RAG collections (org + dept + role) |
| `rag_context` | string | Primary RAG collection ID |
| `assigned_agent_id` | string | The actual LangGraph agent UUID |
| `assigned_deployment_id` | string | The deployment endpoint |

---

### 3.3 Knowledge Layer (the "what")

#### `KnowledgeAsset` — org_knowledge_assets table
RAG collections that feed the agents with organizational knowledge.

| Field | Type | Purpose |
|---|---|---|
| `collection_id` | string | Unique ID used in RAG queries |
| `name_ar / name_en` | string | Human-readable name |
| `type` | enum | `official_docs`, `laws`, `internal_regulations`, `meeting_records`, `digital_registry` |
| `scope` | `org` \| `dept` \| `role` | Who has access to this collection |
| `department_id` | string? | If dept-scoped, which department |

RAG collections are **multi-level** — an agent gets collections at all three levels:

```
Agent's RAG collections = [org-level] + [dept-level] + [role-level]

Example for "مستشار قانوني" in "الشؤون القانونية":
  ├── goeic-laws         (org scope)
  ├── goeic-official     (org scope)
  ├── dept-legal         (dept scope → إدارة الشؤون القانونية)
  └── role-counselor     (role scope → مستشار قانوني)
```

---

## 4. The 5 Agent Archetypes

Every persona has an `agent_type` that determines how it behaves:

| Archetype | Arabic | Level | Description |
|---|---|---|---|
| `org_manager` | وكيل مدير المؤسسة | 1 | Full org visibility, strategic decisions, top-level reports |
| `dept_manager` | وكيل لكل إدارة | 2 | Department-specialized, knows tasks, KPIs, and team |
| `decision_support` | وكيل مساعد اتخاذ القرار | 1-2 | Analyzes data, provides evidence-based recommendations |
| `compliance` | وكيل أمان وامتثال | 1-2 | Monitors regulations, policy compliance, standards |
| `workgroup` | وكيل مجموعة عمل مخصص | 3 | Specialized for a specific task/project/role |

---

## 5. System Prompt Construction

When a user opens a chat, the system automatically builds a rich system prompt by combining all layers:

```
buildSystemPrompt({
  department: "إدارة الشؤون القانونية",
  jobTitle:   "مستشار قانوني",
  personaText: "أنت مستشار قانوني متخصص في..."
})
```

The resulting prompt includes:
1. **Org identity** — name, vision, mission, values, goals
2. **Department context** — department name, KPIs, manager title
3. **Role-specific persona** — persona_text, capabilities, goals
4. **General policies** — org-wide rules always present

**Implemented in:** `src/lib/mock-org-data.ts` → `buildOrgAwareSystemPrompt()`  
**Called by:** `src/lib/onboarding.ts` → `injectPersona()`

---

## 6. Data Flow — End to End

```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN sets up                                                  │
│  ┌──────────┐   ┌─────────────┐   ┌──────────────────────────┐ │
│  │ OrgCore  │   │ Departments │   │ Personas + Agent mapping  │ │
│  │ (vision, │   │ (structure, │   │ (prompt, RAG, archetype)  │ │
│  │  mission)│   │  job titles)│   │                          │ │
│  └──────────┘   └─────────────┘   └──────────────────────────┘ │
│       stored in Supabase via org-api.ts                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  USER logs in                                                   │
│                                                                 │
│  1. fetchMyProfile(token) → { department, job_title }           │
│  2. OrganizationProvider loads all org data from Supabase       │
│  3. getPersona(job_title) → matching OrgPersona                 │
│  4. injectPersona(agentId, profile)                             │
│     ├── buildSystemPrompt() → rich org-aware system prompt      │
│     └── getUserRagCollections() → org + dept + role collections │
│  5. Chat starts with the assigned agent, fully contextualized   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. User Assignment Logic

### Standard Users (non-admin)
- **Cannot** select their own agent
- Are **automatically assigned** the agent linked to their `job_title`
- If no persona/agent exists for their job title → they see a notification and cannot chat

### Admin Users
- Can configure all personas, departments, and knowledge assets
- Can manually assign agents to personas via `PersonaManagement`
- Can view the full org hierarchy in `HierarchyView`

---

## 8. Key Files Reference

| File | Role |
|---|---|
| `src/types/organization.ts` | All TypeScript interfaces: `OrgPersona`, `OrgDepartment`, `OrgJobTitle`, `KnowledgeAsset`, archetypes |
| `src/lib/org-api.ts` | Supabase CRUD layer — fetch/upsert/delete for all org tables |
| `src/lib/mock-org-data.ts` | GOEIC seed data + `buildOrgAwareSystemPrompt()` + `getUserRagCollections()` |
| `src/providers/Organization.tsx` | React context — loads org data, exposes mutations and helpers |
| `src/lib/onboarding.ts` | `injectPersona()` — wires persona + RAG into agent config at login |
| `src/features/organization/OrgDashboard.tsx` | Full inline-editable org management UI |
| `src/features/organization/HierarchyView.tsx` | Live org hierarchy viewer (real users from backend) |
| `src/features/admin/components/PersonaManagement.tsx` | Admin UI for mapping agents to job titles |

---

## 9. Database Tables (Supabase)

| Table | Primary Key | Description |
|---|---|---|
| `org_core` | `id` | One row per organization (`goeic-001`) |
| `org_departments` | `id` | One row per department, contains `job_titles` as JSONB |
| `org_personas` | `(org_id, job_title)` | One persona per job title |
| `org_knowledge_assets` | `collection_id` | One row per RAG collection |

All tables have Row Level Security (RLS) enabled:
- **Authenticated users** → read access
- **Service role / application logic** → full CRUD

---

## 10. Summary

| Concept | Arabic | Maps to |
|---|---|---|
| Organization | المؤسسة | Strategic context, policies, vision |
| Department | الإدارة | Functional unit, KPIs, team structure |
| Job Title | المسمى الوظيفي | The **link** between human and AI |
| Persona | الشخصية | AI behavior, prompt, RAG collections |
| Agent | الوكيل | The actual running LangGraph AI |
| Knowledge Asset | الأصل المعرفي | RAG collection feeding the agent |

> **The key insight:** The organization is not just metadata — it is the **configuration layer** for the AI agents. Changing the org structure directly changes how agents behave for every person in that role.
