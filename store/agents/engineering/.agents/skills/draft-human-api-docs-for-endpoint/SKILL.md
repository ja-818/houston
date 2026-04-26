---
name: draft-human-api-docs-for-endpoint
description: "I read your OpenAPI spec from GitHub or GitLab (or accept a paste) and write Stripe-grade per-endpoint docs: purpose, params table, request body, response body, error codes, curl example, SDK snippet. Never invents behavior."
version: 1
tags: ["engineering", "overview-action", "write-docs"]
category: "Docs"
featured: yes
integrations: ["stripe", "notion", "github", "gitlab", "perplexityai"]
image: "laptop"
inputs:
  - name: endpoint
    label: "Endpoint"
  - name: endpoint_slug
    label: "Endpoint Slug"
    required: false
prompt_template: |
  Draft human API docs for {{endpoint}}. Use the write-docs skill with type=api. Read my OpenAPI spec (openapi.yaml / swagger.json) from the connected GitHub / GitLab, or accept a paste of a representative request/response. Per-endpoint doc with purpose, params table, request body, response body, error codes, curl example, SDK snippet. Save to api-docs/{{endpoint_slug}}.md. Never invents behavior the spec doesn't describe.
---


# Draft human API docs for {endpoint}
**Use when:** Stripe-grade per-endpoint doc from your OpenAPI spec.
**What it does:** I read your OpenAPI spec from GitHub or GitLab (or accept a paste) and write Stripe-grade per-endpoint docs: purpose, params table, request body, response body, error codes, curl example, SDK snippet. Never invents behavior.
**Outcome:** A per-endpoint doc at api-docs/{endpoint-slug}.md ready for your docs site.
## Instructions
Run this as a user-facing action. Use the underlying `write-docs` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft human API docs for {endpoint}. Use the write-docs skill with type=api. Read my OpenAPI spec (openapi.yaml / swagger.json) from the connected GitHub / GitLab, or accept a paste of a representative request/response. Per-endpoint doc with purpose, params table, request body, response body, error codes, curl example, SDK snippet. Save to api-docs/{endpoint-slug}.md. Never invents behavior the spec doesn't describe.
```
