# @houston-ai/skills

Actions management UI backed by Houston skill files. Browse installed actions, view details, search and install from the community marketplace.

## Install

```bash
pnpm add @houston-ai/skills
```

## Usage

```tsx
import { SkillsGrid } from "@houston-ai/skills"

<SkillsGrid
  skills={installedSkills}
  loading={false}
  onSkillClick={(skill) => navigate(`/skills/${skill.id}`)}
  onSearch={(q) => searchCommunitySkills(q)}
  onInstallCommunity={(skill) => installSkill(skill)}
/>
```

## Exports

- `SkillsGrid` -- main view with installed action list + optional community section
- `SkillRow` -- single action row with name, description, icon
- `SkillDetailPage` -- full detail view for a selected action
- `CommunitySkillsSection` -- search and browse community actions
- `CommunitySkillRow` -- single community action with install button
- `LearningRow` -- skill learning/memory display
- Types: `Skill`, `CommunitySkill`, `LearningCategory`, `SkillLearning`

## Peer Dependencies

- React 19+
- @houston-ai/core

---

Part of [Houston](../../README.md).
