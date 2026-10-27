# Skill sources

All upstream code and text is MIT-licensed; each skill folder keeps its upstream `LICENSE`.
Fetched on 2026-10-27.

| Skill folder | Upstream | Commit | Changes made here |
|--------------|----------|--------|-------------------|
| `frontend-design` | File supplied by the repository owner | — | None (verbatim). |
| `interface-polish` | [jakubkrehel/make-interfaces-feel-better](https://github.com/jakubkrehel/make-interfaces-feel-better) `skills/make-interfaces-feel-better/` | `35545ea` | `name:` changed to `interface-polish`. `agents/openai.yaml` not copied. |
| `gsap-animation` | [greensock/gsap-skills](https://github.com/greensock/gsap-skills) `skills/gsap-*/SKILL.md` | `aed9cfd` | The 8 official skills are kept verbatim as `references/<topic>.md`. `SKILL.md` is a new index written for this repo. |
| `motion-principles` | [kylezantos/design-motion-principles](https://github.com/kylezantos/design-motion-principles) `skills/design-motion-principles/` | `4a9ca87` | `name:` changed to `motion-principles`. |
| `vercel-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) `skills/web-design-guidelines/SKILL.md` (commit `6ec2693`) and [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) `command.md` | `434b7f9` | `name:` changed to `vercel-guidelines`. Added `guidelines.md` (copy of `command.md`) as an offline fallback and a short "when building" note. `LICENSE` is from web-interface-guidelines; agent-skills ships no license file. |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) `.claude/skills/ui-ux-pro-max/` | `28b3b8d` | Script path changed from `${CLAUDE_PLUGIN_ROOT}/...` to `${CLAUDE_PROJECT_DIR:-.}/...` so it works as a project skill. `scripts/tests/` not copied. |

To update a skill, re-copy the upstream folder and re-apply the changes listed above.
