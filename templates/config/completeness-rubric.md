# Engineering Completeness Rubric

This reference file defines the engineering completeness evaluation criteria used by the Banneker Auditor agent. The rubric contains 10 weighted categories with specific, measurable criteria for assessing plan quality.

## Purpose

The auditor uses this rubric to:
- Evaluate planning artifacts against engineering best practices
- Score coverage across 10 critical categories
- Identify specific gaps and missing elements
- Generate actionable recommendations for plan improvement

Each category has a weight (importance multiplier) and 3-5 specific criteria with detection guidance (search terms and patterns the auditor uses to determine if criterion is met).

---

## Category 1: ROLES-ACTORS

**Weight:** 1.0

**Description:** User roles, system actors, and their capabilities are clearly identified and documented.

**Criteria:**

1. **All human user roles are identified and defined**
   - Detection guidance: Look for "user role", "actor", "persona", "user type", explicit role names like "administrator", "customer", "manager"
   - Met if: Plan explicitly lists user roles with descriptions

2. **System actors (external services, APIs, integrations) are documented**
   - Detection guidance: Look for "external service", "API", "integration", "third-party", service names like "Stripe", "Twilio", "AWS S3"
   - Met if: Plan identifies external systems that interact with the application

3. **Actor capabilities and permissions are specified**
   - Detection guidance: Look for "can", "allowed to", "permission", "capability", "access level", "authorization", "role-based"
   - Met if: Plan describes what each actor/role can and cannot do

4. **Actor interactions and relationships are defined**
   - Detection guidance: Look for "interacts with", "calls", "depends on", "communicates with", actor relationship diagrams
   - Met if: Plan shows how actors interact with each other and the system

---

## Category 2: DATA-MODEL

**Weight:** 1.5

**Description:** Data entities, attributes, relationships, and constraints are clearly defined.

**Criteria:**

1. **Entities and their attributes are defined**
   - Detection guidance: Look for "entity", "model", "table", "schema", "field", "attribute", "property", entity names like "User", "Order", "Product"
   - Met if: Plan lists data entities with their key attributes

2. **Relationships between entities are documented**
   - Detection guidance: Look for "has many", "belongs to", "one-to-many", "many-to-many", "foreign key", "relationship", "association"
   - Met if: Plan describes how entities relate to each other

3. **Constraints and validation rules are specified**
   - Detection guidance: Look for "unique", "required", "optional", "validation", "constraint", "must be", "cannot be", "min/max length"
   - Met if: Plan defines data validation and constraint rules

4. **Data types and formats are documented**
   - Detection guidance: Look for "string", "integer", "boolean", "date", "UUID", "JSON", "enum", type specifications
   - Met if: Plan specifies data types for key attributes

---

## Category 3: API-SURFACE

**Weight:** 1.5

**Description:** API endpoints, request/response formats, and authentication requirements are defined.

**Criteria:**

1. **API endpoints are defined with HTTP methods**
   - Detection guidance: Look for "GET", "POST", "PUT", "DELETE", "PATCH", "/api/", endpoint paths, "route", "endpoint"
   - Met if: Plan lists API endpoints with HTTP methods

2. **Request and response formats are documented**
   - Detection guidance: Look for "request body", "response", "payload", "JSON schema", "parameters", "query string", "headers"
   - Met if: Plan describes input/output formats for endpoints

3. **Authentication requirements are specified**
   - Detection guidance: Look for "authentication", "auth", "token", "API key", "bearer", "session", "cookie", "authenticated"
   - Met if: Plan indicates which endpoints require authentication

4. **Error responses are defined**
   - Detection guidance: Look for "error code", "status code", "400", "401", "403", "404", "500", "error response", "error message"
   - Met if: Plan documents error response formats and codes

---

## Category 4: AUTH-AUTHZ

**Weight:** 1.5

**Description:** Authentication mechanisms, authorization models, and credential security are addressed.

**Criteria:**

1. **Authentication mechanism is chosen and documented**
   - Detection guidance: Look for "JWT", "session", "OAuth", "SAML", "password", "authentication strategy", "login", "sign in"
   - Met if: Plan specifies how users authenticate

2. **Authorization model is defined**
   - Detection guidance: Look for "authorization", "role-based", "RBAC", "permission", "access control", "policy", "who can access"
   - Met if: Plan describes authorization approach

3. **Credential storage and security approach is specified**
   - Detection guidance: Look for "password hash", "bcrypt", "argon2", "salt", "secure storage", "encryption", "secrets management"
   - Met if: Plan addresses how credentials are stored securely

4. **Session management is addressed**
   - Detection guidance: Look for "session", "token expiry", "refresh token", "logout", "session timeout", "token rotation"
   - Met if: Plan describes session lifecycle and management

---

## Category 5: INFRASTRUCTURE

**Weight:** 1.5

**Description:** Hosting platform, deployment approach, and scalability strategy are defined.

**Criteria:**

1. **Hosting platform is chosen**
   - Detection guidance: Look for "Vercel", "AWS", "Azure", "GCP", "Heroku", "DigitalOcean", "hosting", "cloud provider", "deployment platform"
   - Met if: Plan specifies where application will be hosted

2. **Scalability approach is documented**
   - Detection guidance: Look for "scalability", "horizontal scaling", "vertical scaling", "load balancing", "auto-scaling", "replicas"
   - Met if: Plan addresses how system will scale under load

3. **Monitoring and observability strategy is defined**
   - Detection guidance: Look for "monitoring", "logging", "metrics", "tracing", "observability", "alerting", "dashboard", monitoring tool names
   - Met if: Plan describes how system health will be monitored

4. **Infrastructure as code or configuration is addressed**
   - Detection guidance: Look for "IaC", "Terraform", "CloudFormation", "configuration", "environment variables", "config management"
   - Met if: Plan mentions infrastructure configuration approach

---

## Category 6: ERROR-HANDLING

**Weight:** 1.0

**Description:** Error detection, handling, recovery, and user feedback strategies are defined.

**Criteria:**

1. **Error cases are identified for key operations**
   - Detection guidance: Look for "error case", "failure mode", "what if", "edge case", "exception", "error scenario"
   - Met if: Plan lists potential error conditions

2. **Error handling strategy is documented**
   - Detection guidance: Look for "try/catch", "error handler", "error boundary", "fallback", "retry logic", "circuit breaker"
   - Met if: Plan describes how errors will be caught and handled

3. **User-facing error messages and feedback are defined**
   - Detection guidance: Look for "error message", "user feedback", "error UI", "error toast", "error banner", "user-friendly error"
   - Met if: Plan addresses how errors are communicated to users

4. **Recovery and retry mechanisms are specified**
   - Detection guidance: Look for "recovery", "retry", "backoff", "resume", "rollback", "graceful degradation"
   - Met if: Plan describes error recovery strategies

---

## Category 7: TESTING

**Weight:** 1.5

**Description:** Testing frameworks, strategies, coverage targets, and CI integration are defined.

**Criteria:**

1. **Unit testing framework and approach are chosen**
   - Detection guidance: Look for "unit test", "Jest", "pytest", "JUnit", "Mocha", "test framework", "test runner"
   - Met if: Plan specifies unit testing tools and approach

2. **Integration testing strategy is defined**
   - Detection guidance: Look for "integration test", "API test", "database test", "service test", "integration testing"
   - Met if: Plan describes integration testing approach

3. **End-to-end testing approach is documented (if applicable)**
   - Detection guidance: Look for "E2E", "end-to-end", "Cypress", "Playwright", "Selenium", "browser test", "UI test"
   - Met if: Plan mentions E2E testing (if UI exists) or explicitly states not applicable

4. **Coverage targets and CI integration are specified**
   - Detection guidance: Look for "coverage", "80%", "90%", "100%", "threshold", "CI", "continuous integration", "GitHub Actions"
   - Met if: Plan defines coverage goals and CI testing integration

---

## Category 8: SECURITY

**Weight:** 2.0

**Description:** Security threats, mitigation strategies, and secure coding practices are addressed.

**Criteria:**

1. **Security threats are identified (XSS, CSRF, injection, etc.)**
   - Detection guidance: Look for "XSS", "CSRF", "SQL injection", "security threat", "vulnerability", "attack vector", "OWASP"
   - Met if: Plan lists relevant security threats

2. **Mitigation strategies are documented**
   - Detection guidance: Look for "mitigation", "sanitize", "escape", "validate input", "parameterized query", "CSP", "security header"
   - Met if: Plan describes how threats will be mitigated

3. **Secure coding practices are specified**
   - Detection guidance: Look for "secure coding", "input validation", "output encoding", "least privilege", "defense in depth"
   - Met if: Plan addresses secure coding guidelines

4. **Security testing and auditing are addressed**
   - Detection guidance: Look for "security test", "penetration test", "security audit", "vulnerability scan", "dependency scanning"
   - Met if: Plan mentions security testing or auditing approach

---

## Category 9: PERFORMANCE

**Weight:** 1.0

**Description:** Performance targets, optimization strategies, and bottleneck identification are defined.

**Criteria:**

1. **Performance targets are defined (response time, throughput)**
   - Detection guidance: Look for "response time", "latency", "throughput", "requests per second", "performance target", "SLA", "<100ms", "<1s"
   - Met if: Plan specifies measurable performance goals

2. **Optimization strategies are documented**
   - Detection guidance: Look for "optimization", "caching", "CDN", "database index", "query optimization", "lazy loading", "code splitting"
   - Met if: Plan describes performance optimization approaches

3. **Potential bottlenecks are identified**
   - Detection guidance: Look for "bottleneck", "performance concern", "slow query", "N+1", "hot path", "resource intensive"
   - Met if: Plan identifies areas that may impact performance

4. **Performance monitoring is addressed**
   - Detection guidance: Look for "performance monitoring", "APM", "profiling", "metrics", "performance dashboard", monitoring tool names
   - Met if: Plan mentions how performance will be measured

---

## Category 10: DEPLOYMENT

**Weight:** 1.5

**Description:** Deployment environments, CI/CD pipeline, rollback procedures, and release process are defined.

**Criteria:**

1. **Deployment environments are defined (dev, staging, prod)**
   - Detection guidance: Look for "development", "staging", "production", "environment", "dev/stage/prod", "deployment target"
   - Met if: Plan specifies deployment environments

2. **CI/CD pipeline is documented**
   - Detection guidance: Look for "CI/CD", "pipeline", "GitHub Actions", "GitLab CI", "Jenkins", "deployment automation", "continuous deployment"
   - Met if: Plan describes automated deployment pipeline

3. **Rollback and release process is specified**
   - Detection guidance: Look for "rollback", "revert", "release process", "blue-green", "canary", "deployment strategy", "rollback plan"
   - Met if: Plan addresses how to roll back failed deployments

4. **Database migration strategy is addressed (if applicable)**
   - Detection guidance: Look for "migration", "schema change", "database migration", "migration tool", "Flyway", "Liquibase", "Alembic"
   - Met if: Plan mentions database migration approach (if database exists) or explicitly not applicable

---

## Scoring Formula

The auditor uses the following scoring logic:

### Criterion Evaluation

A criterion is considered **met** if:
- At least 2 detection guidance terms/patterns are found in the plan content (fuzzy matching, not exact keyword matching)
- Evidence is present in the plan corpus (across all plan files combined)

### Per-Category Score

```
category_score = (met_criteria / total_criteria) * 100
```

### Weighted Score

```
weighted_score = category_score * weight
```

### Overall Score

```
overall_score = sum(weighted_scores) / sum(weights)
```

### Grade Mapping

| Grade | Score Range |
|-------|-------------|
| A     | 90-100      |
| B     | 80-89       |
| C     | 70-79       |
| D     | 60-69       |
| F     | 0-59        |

### Status Mapping

| Status           | Score Range |
|------------------|-------------|
| COMPLETE         | 90-100      |
| MOSTLY_COMPLETE  | 70-89       |
| PARTIAL          | 50-69       |
| INCOMPLETE       | 0-49        |

---

## Weight Rationale

- **Weight 2.0 (Critical):** SECURITY — Security flaws can compromise entire system
- **Weight 1.5 (Important):** DATA-MODEL, API-SURFACE, AUTH-AUTHZ, INFRASTRUCTURE, TESTING, DEPLOYMENT — Core engineering concerns that significantly impact system quality
- **Weight 1.0 (Standard):** ROLES-ACTORS, ERROR-HANDLING, PERFORMANCE — Important but lower impact if partially addressed

---

## Usage by Auditor

The auditor agent:
1. Loads this rubric to understand evaluation criteria
2. Reads all plan files into a combined corpus
3. For each category, evaluates each criterion using detection guidance
4. Computes scores using the formulas above
5. Identifies gaps (unmet criteria) and generates recommendations
6. Produces both JSON (audit-report.json) and Markdown (audit-report.md) outputs
