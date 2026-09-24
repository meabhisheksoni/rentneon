# Antigravity Agent 2-Engine Cognitive Protocol (CBM × CRG)

## ⚠️ STRICT SRE DIRECTIVE: Zero Blind Re-Scanning & Strict Specialist Routing

You are STRICTLY FORBIDDEN from performing recursive `list_dir` or batch `view_file` calls across the codebase on startup.

You MUST NOT perform long iterative discovery loops.

Structural questions and diff reviews MUST be routed to their dedicated engine before broad source inspection.

---

## 1. The 2-Engine Specialist Division of Labor

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. codebase-memory-mcp (CBM): General AST, Symbols, Global Topology (WHERE)│
│ 2. code-review-graph (CRG):   Diff Review, Blast Radius, Tests, Flows (RISK)│
└─────────────────────────────────────────────────────────────────────────────┘
```

### CBM — Structural Intelligence

CBM is the primary engine for:

* AST knowledge
* symbols
* functions
* classes
* declarations
* repository topology
* architecture
* callers
* structural relationships
* locating code

### CRG — Change/Risk Intelligence

CRG is the primary engine for:

* git changes
* review context
* blast radius
* affected execution flows
* dependency impact
* test relationships
* change risk

---

## 2. Universal Scenario-Based Routing

When the user's request maps to one of these scenarios, use the relevant specialist FIRST.

| Intent / User Instruction           | Specialist |
| ----------------------------------- | ---------- |
| Find symbol / "where is function X" | CBM        |
| Trace callers / "who calls Y"       | CBM        |
| System architecture / clusters      | CBM        |
| Read a specific function            | CBM        |
| "What did I break?" / blast radius  | CRG        |
| "Review my git diff"                | CRG        |
| Broken execution flows              | CRG        |
| "Which tests cover this file?"      | CRG        |

Before invoking an MCP tool:

1. Verify that the tool actually exists in the current MCP/tool definitions.
2. Do not assume a tool exists solely because this document mentions it.
3. Use the installed tool's current signature.
4. If a named tool has changed, use its current equivalent rather than inventing arguments.

---

## 3. Source-of-Truth Hierarchy

### WHAT & WHERE

For structural questions:

```text
codebase-memory-mcp
```

is the preferred source of truth.

### IMPACT & RISK

For modifications and change analysis:

```text
code-review-graph
```

is the preferred source of truth.

### PHYSICAL SOURCE VERIFICATION

Graph output is NOT sufficient evidence for changing code.

Before modifying implementation:

* inspect the relevant source
* inspect relevant tests
* verify the exact implementation
* verify behavior-sensitive code directly

The source code wins when the graph and source disagree.

A stale or empty graph result does NOT prove that something does not exist.

---

## 4. Strict Operating Workflow

### A. Code exploration

Do NOT begin with a repository-wide recursive scan.

First:

```text
CBM → narrow structural scope
```

Then inspect only the relevant files/functions.

### B. Code changes

For a non-trivial modification:

```text
1. Use the specialist graph to narrow scope
2. Read the relevant source
3. Read relevant tests
4. Apply the change
5. Verify syntax/build/type safety
6. Ask CRG for impact/blast-radius analysis
7. Update CBM if the graph is stale
```

### C. Refactors

For rename/move/delete/split operations:

```text
1. Determine structural relationships with CBM
2. Read actual source
3. Perform the refactor
4. Verify compilation/tests
5. Run CRG impact analysis
6. Re-index/update CBM
```

---

## 5. Strict Anti-Scanning Rule

Never perform:

```text
recursive directory listing of the whole repo
```

merely to "understand the codebase."

Never perform:

```text
batch opening of dozens/hundreds of source files
```

when a graph query can narrow the relevant scope.

The goal is:

```text
Graph → Scope → Source → Change → Impact → Verification
```

not:

```text
Scan everything → guess → modify
```

---

## 6. Graph Freshness

The graph may become stale.

When code changes:

* prefer the installed CRG update/change-detection mechanism for change impact
* update/re-index CBM when necessary
* do not assume a graph is automatically current merely because a previous session indexed it

The repository's synchronization script is:

```text
sync-graphs.bat
```

At the end of a session involving code modifications, remind the user to run:

```text
sync-graphs.bat
```

unless the graphs were already successfully synchronized during the session.

---

## 7. Core Repository Facts

Use the following project facts when they are true for this repository.

Do not re-discover information already established here unless source evidence contradicts it.

```text
Stack:
TypeScript + Next.js (App Router) + Tailwind CSS + PostgreSQL (Neon) + Drizzle ORM + NextAuth

Server root:
src/app/api/

Frontend root:
src/
```

If actual repository structure contradicts one of these facts, trust the actual source tree.

---

## 8. code-review-graph Operating Guidance

This repository uses a code-review knowledge graph.

Prefer CRG for:

```text
detect changes
review context
impact radius
affected execution flows
test coverage relationships
callers/callees/imports/dependencies
architecture overview
```

Do not read entire files when a graph query can first narrow the scope.

However:

> Never make a code modification solely from graph output.

Always verify the implementation in source.

---

## 9. Failure Semantics

Treat tool failure and "no results" differently.

### Tool failure

Means:

```text
The requested graph capability was unavailable or failed.
```

### Empty result

May mean:

```text
not indexed
not statically visible
query mismatch
dynamic behavior
stale graph
```

Therefore:

```text
empty result ≠ proof of absence
```

---

## 10. Session-End Protocol

If code was changed during the session:

```text
1. Verify the modified code
2. Verify tests/build where appropriate
3. Review impact using CRG
4. Update graph state if necessary
5. Remind the user about sync-graphs.bat
```

Recommended command:

```text
sync-graphs.bat
```
