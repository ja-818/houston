---
name: screen-a-resume-stack-and-rank-against-the-rubric
description: "Parses resume PDFs from Google Drive or Dropbox, bands each as pass / borderline / fail against the role rubric, and ranks the stack. One record per applicant at candidates/{slug}.md."
version: 1
tags: ["people", "overview-action", "evaluate-candidate"]
category: "Hiring"
featured: yes
integrations: ["googlesheets", "googledrive", "linkedin", "firecrawl"]
image: "busts-in-silhouette"
inputs:
  - name: role
    label: "Role"
  - name: role_slug
    label: "Role Slug"
    required: false
  - name: candidate_slug
    label: "Candidate Slug"
    required: false
prompt_template: |
  Screen the resume stack for {{role}}. Use the evaluate-candidate skill with source=resume. Parse PDFs from my connected Google Drive or Dropbox, evaluate each against reqs/{{role_slug}}.md, band each as pass / borderline / fail, and build a ranked summary. One candidate record per applicant at candidates/{{candidate_slug}}.md.
---


# Screen a resume stack and rank against the rubric
**Use when:** Pass / borderline / fail band per applicant + top 3.
**What it does:** Parses resume PDFs from Google Drive or Dropbox, bands each as pass / borderline / fail against the role rubric, and ranks the stack. One record per applicant at candidates/{slug}.md.
**Outcome:** Per-applicant records at candidates/{slug}.md + a ranked summary on the dashboard.
## Instructions
Run this as a user-facing action. Use the underlying `evaluate-candidate` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Screen the resume stack for {role}. Use the evaluate-candidate skill with source=resume. Parse PDFs from my connected Google Drive or Dropbox, evaluate each against reqs/{role-slug}.md, band each as pass / borderline / fail, and build a ranked summary. One candidate record per applicant at candidates/{candidate-slug}.md.
```
