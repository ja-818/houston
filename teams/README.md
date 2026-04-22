# Houston Teams

Group of agents shared by a team. Hosted. Multi-tenant w/ permissions.

## What it is
Like Always On but for teams. Shared agent pool. Users have roles (admin/editor/viewer). Who can create agents. Who can approve "needs you" activities. Who sees which conversations.

## Status
**TBD — placeholder.** Directory exists to reserve the name. No code yet.

## Relation to other products
- Built on **Houston Engine** (same prerequisite as Always On: network-reachable API)
- Extends Engine w/ auth + RBAC + per-tenant data isolation
- Houston App + Mobile connect to Teams instance — same clients, different backend URL

## Unknowns to solve
- Auth provider (Clerk? WorkOS? self-hosted?)
- Permission model (RBAC per workspace? per agent? per conversation?)
- Tenant isolation — separate DB per team, or shared DB w/ tenant_id?
- Conversation privacy — user-private vs team-shared conversations
- Pricing per seat vs per agent
