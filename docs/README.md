# Documentation

Start with the document for the question you need to answer. This tree contains maintained
product material; historical task/evidence packets remain in the coordination archive.

| Question | Canonical home |
|---|---|
| What is the product? | [Product](../PRODUCT.md), [glossary](../GLOSSARY.md), [golden workflows](product/three-golden-workflows.md) |
| How is it structured? | [Architecture](architecture/README.md), [database](architecture/database.md), [security](architecture/security.md) |
| What is the API behavior? | [Application contract](api/contract.md), [backend route catalogue](../apps/backend/docs/api.md) |
| What rules apply? | [Business rules](requirements/business-rules.md), [permissions](requirements/permission-matrix.md), [state semantics](requirements/state-semantics.md) |
| How does the UI behave? | [Design direction](../DESIGN.md), [frontend architecture](../apps/frontend/docs/architecture.md), [component guidance](../apps/frontend/docs/component-guidelines.md) |
| How do I run it? | [Local development](operations/local-development.md), [backend configuration](../apps/backend/docs/operations.md) |
| How do I deploy/recover it? | [Deployment](deployment/README.md), [operations](operations/README.md), [recovery](operations/backup-restore.md) |
| What was imported? | [Integration provenance and limitations](release/integration.md) |

Historical source links are immutable references, not additional maintained copies. Old ADR
statements describe their decision date; current implementation facts are in the architecture
summary and source. Deployment readiness must be rechecked against the actual target.
