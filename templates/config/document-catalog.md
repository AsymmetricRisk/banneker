# Document Catalog

This reference file defines the documents that Banneker's architect agent generates, including conditional selection rules, dependency ordering, document structures, and quality standards.

## Always-Generated Documents (REQ-DOCS-001)

These three documents are generated for every project, regardless of type, signals, or scope.

### TECHNICAL-SUMMARY.md

**Purpose:** High-level project overview for stakeholders and new team members.

**Section Structure:**

- **Project Overview** - Project name, one-liner, problem statement, core value proposition
- **Actors** - All human and system actors with their roles and capabilities
- **Technology Stack** - Primary technologies, frameworks, and platforms (high-level overview)
- **Core Flows** - Key user journeys and system behaviors (narrative summary of walkthroughs)
- **Architecture Decisions** - Major architectural choices with DEC-XXX citations

**Survey Mapping:**
- Project Overview: `survey.project.name`, `survey.project.one_liner`, `survey.project.problem_statement`
- Actors: `survey.actors[]` (all entries)
- Technology Stack: `survey.backend.stack[]` + key decisions from architecture-decisions.json
- Core Flows: `survey.walkthroughs[]` (summarized narratively)
- Architecture Decisions: References to architecture-decisions.json entries

---

### STACK.md

**Purpose:** Detailed technology stack documentation with rationale for every choice.

**Section Structure:**

- **Stack Overview** - Complete list of languages, frameworks, libraries, tools
- **Technology Rationale** - For each major technology: why it was chosen, what alternatives were considered, what it provides
- **Hosting & Infrastructure** - Deployment platform, cloud services, infrastructure components
- **Integrations** - External services and APIs with their purposes
- **Dependencies** - Key packages and their roles
- **Constraints** - Technology limitations, compatibility requirements, version constraints

**Survey Mapping:**
- Stack Overview: `survey.backend.stack[]` (if backend exists) + implied frontend stack from project type
- Technology Rationale: architecture-decisions.json entries where choice is a technology
- Hosting & Infrastructure: `survey.backend.hosting` (if exists)
- Integrations: `survey.backend.integrations[]` (if exists)
- Dependencies: Inferred from stack and integration choices
- Constraints: Mentioned in rationale fields of decisions

---

### INFRASTRUCTURE-ARCHITECTURE.md

**Purpose:** System topology, data flows, deployment architecture, and security boundaries.

**Section Structure:**

- **System Topology** - Components and their relationships (frontend, backend, data stores, external services)
- **Data Flows** - How data moves through the system for key operations
- **Deployment Architecture** - Environments, deployment pipeline, infrastructure-as-code approach
- **Security Boundaries** - Trust zones, authentication points, authorization layers
- **Scalability Considerations** - Load handling, caching strategy, performance design
- **Monitoring & Observability** - Logging, metrics, alerting approach

**Survey Mapping:**
- System Topology: Derived from actors, backend.data_stores, backend.integrations, backend.hosting
- Data Flows: Extracted from walkthroughs (data_changes fields)
- Deployment Architecture: `survey.backend.hosting` + deployment-related decisions
- Security Boundaries: Authentication/authorization decisions + integration security patterns
- Scalability Considerations: Hosting choices, caching decisions, performance-related decisions
- Monitoring & Observability: Observability-related decisions or inferred from hosting platform

---

## Conditional Documents (REQ-DOCS-002)

These documents are generated based on signals detected in survey.json.

### TECHNICAL-DRAFT.md

**Trigger Signal:** `survey.backend` exists AND `survey.backend.data_stores` is an array with length > 0

**Detection Logic:**
```
if survey.backend exists AND survey.backend.data_stores is array AND survey.backend.data_stores.length > 0:
    generate TECHNICAL-DRAFT.md
```

**Purpose:** Detailed technical specification including data model, API surface, and implementation details.

**Section Structure:**

- **Data Model** - Entities, attributes, relationships, constraints
- **API Surface** - Endpoints, request/response formats, authentication requirements
- **Business Logic** - Core algorithms, validation rules, state transitions
- **Error Handling** - Error cases, validation patterns, failure modes
- **Testing Strategy** - Unit test coverage, integration test approach, test data requirements

**Survey Mapping:**
- Data Model: `survey.backend.data_stores[].entities` (all entities with their attributes)
- API Surface: Inferred from walkthroughs (actor actions become API operations)
- Business Logic: Extracted from walkthrough system_responses and data_changes
- Error Handling: `survey.walkthroughs[].error_cases`
- Testing Strategy: Testing-related decisions or standard practices for stack

---

### DEVELOPER-HANDBOOK.md

**Trigger Signal:** At least one actor with type "developer" OR actor role contains "developer", AND `survey.backend` exists

**Detection Logic:**
```
has_developer_actor = any actor where type == "developer" OR role contains "developer"
if has_developer_actor AND survey.backend exists:
    generate DEVELOPER-HANDBOOK.md
```

**Purpose:** Developer onboarding and contribution guide.

**Section Structure:**

- **Getting Started** - Repository setup, local development environment, initial run
- **Development Workflow** - Branch strategy, commit conventions, PR process
- **Architecture Overview** - System structure, key patterns, code organization
- **Common Tasks** - Adding endpoints, database migrations, testing, debugging
- **Code Standards** - Style guide, linting rules, best practices
- **Deployment Process** - How to deploy, rollback procedures, environment promotion

**Survey Mapping:**
- Getting Started: Technology stack + hosting platform requirements
- Development Workflow: Development-related decisions + stack tooling conventions
- Architecture Overview: Derived from INFRASTRUCTURE-ARCHITECTURE.md + backend structure
- Common Tasks: Based on stack patterns (Rails migrations, Django management commands, etc.)
- Code Standards: Stack conventions + any code quality decisions
- Deployment Process: `survey.backend.hosting` + deployment decisions

---

### DESIGN-SYSTEM.md

**Trigger Signal:** `survey.project.type` includes "web", "portal", "frontend", OR any walkthrough includes UI-related steps (click, view, navigate, form, button)

**Detection Logic:**
```
project_type_match = survey.project.type contains any of ["web", "portal", "frontend", "spa", "app"]
ui_walkthrough_exists = any walkthrough.steps[] contains UI keywords ["click", "view", "navigate", "form", "button", "page", "screen"]

if project_type_match OR ui_walkthrough_exists:
    generate DESIGN-SYSTEM.md
```

**Purpose:** UI/UX design standards, component library, and visual design system.

**Section Structure:**

- **Design Principles** - Core design philosophy, user experience goals
- **Visual Language** - Colors, typography, spacing, layout grids
- **Component Library** - Reusable UI components, usage guidelines, variants
- **Interaction Patterns** - Navigation, forms, feedback, loading states
- **Accessibility** - WCAG compliance, keyboard navigation, screen reader support
- **Responsive Design** - Breakpoints, mobile-first approach, device support

**Survey Mapping:**
- Design Principles: Project problem statement + actor needs
- Visual Language: Design-related decisions or standard practices for frontend stack
- Component Library: Inferred from walkthroughs (UI elements mentioned)
- Interaction Patterns: Extracted from walkthrough steps (user actions)
- Accessibility: Accessibility-related decisions or standard requirements
- Responsive Design: Device support decisions or frontend stack defaults

---

### PORTAL-INTEGRATION.md

**Trigger Signal:** `survey.backend.integrations` is an array with length > 0

**Detection Logic:**
```
if survey.backend exists AND survey.backend.integrations is array AND survey.backend.integrations.length > 0:
    generate PORTAL-INTEGRATION.md
```

**Purpose:** External service integration documentation and API contracts.

**Section Structure:**

- **Integration Overview** - All external services, their purposes, data exchanged
- **Authentication & Authorization** - API keys, OAuth flows, credential management
- **API Contracts** - Request/response formats, rate limits, error handling
- **Data Synchronization** - How data stays consistent with external systems
- **Webhook Handling** - Inbound webhooks, signature verification, retry logic
- **Error & Retry Strategies** - Circuit breakers, fallback behavior, monitoring

**Survey Mapping:**
- Integration Overview: `survey.backend.integrations[]` (all entries)
- Authentication & Authorization: Integration-specific auth decisions + credential storage patterns
- API Contracts: Integration documentation + walkthrough references to external calls
- Data Synchronization: Data flow patterns involving integrations
- Webhook Handling: If any integration is bidirectional or event-driven
- Error & Retry Strategies: Integration error handling decisions + stack patterns

---

### OPERATIONS-RUNBOOK.md

**Trigger Signal:** `survey.backend.hosting` exists with a `platform` field

**Detection Logic:**
```
if survey.backend exists AND survey.backend.hosting exists AND survey.backend.hosting.platform exists:
    generate OPERATIONS-RUNBOOK.md
```

**Purpose:** Operational procedures for running and maintaining the system in production.

**Section Structure:**

- **System Health Checks** - Health endpoints, monitoring dashboards, alerting thresholds
- **Deployment Procedures** - Deploy steps, rollback process, zero-downtime deployment
- **Incident Response** - Common issues, troubleshooting steps, escalation paths
- **Backup & Recovery** - Backup schedules, restoration procedures, disaster recovery
- **Scaling Operations** - Horizontal/vertical scaling, load testing, capacity planning
- **Security Operations** - Certificate renewal, secret rotation, access audits

**Survey Mapping:**
- System Health Checks: Hosting platform monitoring + observability decisions
- Deployment Procedures: `survey.backend.hosting` + deployment decisions
- Incident Response: Error handling patterns + walkthroughs error_cases
- Backup & Recovery: Data store choices + backup decisions
- Scaling Operations: Hosting platform capabilities + scalability decisions
- Security Operations: Authentication decisions + hosting security features

---

### LEGAL-PLAN.md

**Trigger Signal:** `survey.rubric_coverage.covered` includes any items starting with "LEGAL-"

**Detection Logic:**
```
if survey.rubric_coverage exists AND survey.rubric_coverage.covered is array:
    for item in survey.rubric_coverage.covered:
        if item starts with "LEGAL-":
            generate LEGAL-PLAN.md
            break
```

**Purpose:** Legal, compliance, and privacy considerations.

**Section Structure:**

- **Privacy Considerations** - Data collection, storage, user rights (GDPR, CCPA)
- **Terms of Service** - User agreement requirements, acceptable use policy
- **Data Retention** - How long data is kept, deletion procedures, archiving
- **Third-Party Licenses** - Open source dependencies, license compatibility
- **Compliance Requirements** - Industry regulations (HIPAA, PCI-DSS, SOC 2)
- **Liability & Disclaimers** - Warranty disclaimers, limitation of liability

**Survey Mapping:**
- Privacy Considerations: User data in data_stores + jurisdictional decisions
- Terms of Service: User-facing actor capabilities + acceptable use constraints
- Data Retention: Data store decisions + retention policy decisions
- Third-Party Licenses: Stack dependencies + integration licenses
- Compliance Requirements: Explicit compliance decisions from Phase 6
- Liability & Disclaimers: Risk-related decisions + industry standards

---

### CONTENT-ARCHITECTURE.md

**Trigger Signal:** Any walkthrough includes content-focused flow patterns: "create", "edit", "publish", "draft", "review", "approve"

**Detection Logic:**
```
content_keywords = ["create", "edit", "publish", "draft", "review", "approve", "moderate", "author"]
for walkthrough in survey.walkthroughs:
    for step in walkthrough.steps:
        if any keyword in step.lower():
            generate CONTENT-ARCHITECTURE.md
            break
```

**Purpose:** Content management strategy, editorial workflows, and content modeling.

**Section Structure:**

- **Content Model** - Content types, attributes, taxonomies, metadata
- **Editorial Workflow** - Content lifecycle (draft → review → publish), approval chains
- **Content Creation Tools** - Editing interfaces, rich text handling, media upload
- **Content Delivery** - Publishing process, CDN strategy, caching
- **Content Governance** - Ownership, moderation policies, audit trails
- **Search & Discovery** - Content indexing, search implementation, filtering

**Survey Mapping:**
- Content Model: Entities in data_stores that represent content
- Editorial Workflow: Walkthrough steps involving content state transitions
- Content Creation Tools: UI patterns from walkthroughs + frontend stack capabilities
- Content Delivery: Hosting decisions + CDN decisions
- Content Governance: Actor capabilities related to content management
- Search & Discovery: Search-related decisions + data store query capabilities

---

## Dependency Graph (REQ-DOCS-006)

Documents must be generated in dependency order. Some documents reference content from earlier documents.

### Wave 1 (No Dependencies)
- TECHNICAL-SUMMARY.md
- STACK.md

### Wave 2 (Depends on STACK.md)
- TECHNICAL-DRAFT.md (requires stack details for API patterns)
- INFRASTRUCTURE-ARCHITECTURE.md (requires stack + hosting details)

### Wave 3 (Depends on INFRASTRUCTURE-ARCHITECTURE.md)
- DEVELOPER-HANDBOOK.md (requires architecture overview)

### Wave 4 (No Inter-Document Dependencies)
- DESIGN-SYSTEM.md
- PORTAL-INTEGRATION.md
- OPERATIONS-RUNBOOK.md
- LEGAL-PLAN.md
- CONTENT-ARCHITECTURE.md

**Note:** Wave 4 documents are independent of each other but may reference Wave 1-2 documents for context.

---

## Quality Standards

### Placeholder Detection (REQ-DOCS-003)

Generated documents must NOT contain any of these placeholder patterns:

- `[TODO`
- `[PLACEHOLDER`
- `TBD`
- `FIXME`
- `XXX`
- `<variable_name>` (angle brackets suggesting template variables)
- `<!-- BANNEKER:` (comment directives)
- `{{` (template syntax)
- `{%` (template syntax)

**Validation:** Full-text scan of generated document. If any pattern found, reject document and report specific line numbers.

### Term Consistency (REQ-DOCS-004)

All generated documents must use consistent terminology matching the survey.json term registry.

**Consistency Requirements:**

| Term Type | Source | Consistency Rule |
|-----------|--------|------------------|
| Project name | `survey.project.name` | Exact match, including capitalization |
| Actor names | `survey.actors[].name` | Exact match for all actor references |
| Technology names | Stack entries + decisions | Use official names (e.g., "PostgreSQL" not "postgres") |
| Entity names | `survey.backend.data_stores[].entities` | Exact match, including singular/plural |
| Integration names | `survey.backend.integrations[].name` | Exact match for service references |

**Validation:** Extract all term references from document, compare against term registry. Report mismatches with line numbers.

**Common violations to catch:**
- Synonyms: "user" vs "customer" vs "account" (must pick one from survey)
- Abbreviations: "DB" instead of "database", "auth" instead of "authentication"
- Capitalization: "react" instead of "React", "postgres" instead of "PostgreSQL"

### Decision Citation Format (REQ-DOCS-005)

When documents reference architectural decisions, they must cite the decision ID from architecture-decisions.json.

**Citation Format:** `(DEC-XXX)` where XXX is the zero-padded decision ID.

**Examples:**
- "Authentication is handled via OAuth 2.0 (DEC-003)."
- "PostgreSQL was chosen for its JSON support and full-text search capabilities (DEC-012)."

**Validation:**
- Extract all DEC-XXX references from document
- Verify each ID exists in architecture-decisions.json
- Warn (not reject) if non-existent references found
- Suggest to user that they may need to add missing decision records

---

## Usage Notes

This catalog is a reference for the banneker-architect agent. It is NOT a user-facing document.

**Architect agent responsibilities:**
1. Load this catalog during initialization
2. Apply signal detection rules to survey.json to determine which documents to generate
3. Use section structures as instructions to banneker-writer agents
4. Validate writer outputs against quality standards before accepting
5. Enforce dependency ordering during generation

**Writer agent responsibilities:**
1. Receive document structure from architect
2. Generate narrative content using survey data and decision records
3. Apply term registry for consistent naming
4. Cite decisions using (DEC-XXX) format where architectural choices are discussed
5. Return document to architect for validation
