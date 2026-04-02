# @deck-ui/skills

Skills management UI. Browse installed skills, view details, search and install from the community marketplace.

## Install

```bash
pnpm add @deck-ui/skills
```

## Usage

```tsx
import { SkillsGrid } from "@deck-ui/skills"

<SkillsGrid
  skills={installedSkills}
  loading={false}
  onSkillClick={(skill) => navigate(`/skills/${skill.id}`)}
  community={{
    onSearch: (q) => searchCommunitySkills(q),
    onInstall: (skill) => installSkill(skill),
  }}
/>
```

## Exports

- `SkillsGrid` -- main view with installed list + optional community section
- `SkillRow` -- single skill row with name, description, icon
- `SkillDetailPage` -- full detail view for a selected skill
- `CommunitySkillsSection` -- search and browse community skills
- `CommunitySkillRow` -- single community skill with install button
- `LearningRow` -- skill learning/memory display
- Types: `Skill`, `CommunitySkill`, `LearningCategory`, `SkillLearning`

## Peer Dependencies

- React 19+
- @deck-ui/core

---

Part of [Keel & Deck](../../README.md).
