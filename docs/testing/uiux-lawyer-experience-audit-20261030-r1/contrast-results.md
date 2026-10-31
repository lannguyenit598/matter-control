# Measured contrast (WCAG 2.x) — MatterControl tokens

- Colors resolved by the browser itself (getComputedStyle probes on the live 127.0.0.1:3100 app, both themes).
- Alpha colors composited over --background (or --card where stated). Glass panels approximated over --background; the real backdrop is a fixed pastel gradient — see limitations.
- Text threshold 4.5:1; non-text (borders, focus ring, axis cues) 3:1.

## Light

| Pair | Use | Ratio | Threshold | Result |
|---|---|---|---|---|
| foreground on background | body text | 16.673 | 4.5 | PASS |
| muted-foreground on background | secondary text on page | 5.588 | 4.5 | PASS |
| muted-foreground on card | secondary text on card | 5.938 | 4.5 | PASS |
| primary-foreground on primary | primary button label | 16.099 | 4.5 | PASS |
| secondary-foreground on secondary | secondary control label | 15.816 | 4.5 | PASS |
| accent-foreground on accent | accent control label | 15.242 | 4.5 | PASS |
| destructive-foreground on destructive | destructive control label | 7.458 | 4.5 | PASS |
| success-foreground on success | success control label (if used) | 7.161 | 4.5 | PASS |
| warning-foreground on warning | warning control label (if used) | 6.921 | 4.5 | PASS |
| header-foreground on header | header text | 16.673 | 4.5 | PASS |
| foreground on panel | text on glass panel (composite) | 16.482 | 4.5 | PASS |
| muted-foreground on panel | secondary text on glass panel (composite) | 5.524 | 4.5 | PASS |
| ring on background | focus ring vs page (non-text 3:1) | 7.383 | 3 | PASS |
| border on background | control border vs page (non-text 3:1) | 1.167 | 3 | FAIL |
| execution on card | execution axis cue vs card (3:1 UI/text-large) | 10.32 | 3 | PASS |
| verification on card | verification axis cue vs card | 7.161 | 3 | PASS |
| dependency-ready on card | dependency-ready cue vs card | 7.845 | 3 | PASS |
| dependency-blocked on card | dependency-blocked cue vs card | 8.661 | 3 | PASS |
| timing on card | timing cue vs card | 6.921 | 3 | PASS |
| attention on card | attention cue vs card | 8.408 | 3 | PASS |
| execution (direct) vs card |  | 10.32 | 3 | PASS |
| verification (direct) vs card |  | 7.161 | 3 | PASS |
| dependency-ready (direct) vs card |  | 7.845 | 3 | PASS |
| dependency-blocked (direct) vs card |  | 8.661 | 3 | PASS |
| timing (direct) vs card |  | 6.921 | 3 | PASS |
| attention (direct) vs card |  | 8.408 | 3 | PASS |

## Dark

| Pair | Use | Ratio | Threshold | Result |
|---|---|---|---|---|
| foreground on background | body text | 17.281 | 4.5 | PASS |
| muted-foreground on background | secondary text on page | 7.525 | 4.5 | PASS |
| muted-foreground on card | secondary text on card | 7.021 | 4.5 | PASS |
| primary-foreground on primary | primary button label | 16.279 | 4.5 | PASS |
| secondary-foreground on secondary | secondary control label | 13.423 | 4.5 | PASS |
| accent-foreground on accent | accent control label | 13.423 | 4.5 | PASS |
| destructive-foreground on destructive | destructive control label | 9.38 | 4.5 | PASS |
| success-foreground on success | success control label (if used) | 10.535 | 4.5 | PASS |
| warning-foreground on warning | warning control label (if used) | 9.497 | 4.5 | PASS |
| header-foreground on header | header text | 17.281 | 4.5 | PASS |
| foreground on panel | text on glass panel (composite) | 15.76 | 4.5 | PASS |
| muted-foreground on panel | secondary text on glass panel (composite) | 6.863 | 4.5 | PASS |
| ring on background | focus ring vs page (non-text 3:1) | 7.701 | 3 | PASS |
| border on background | control border vs page (non-text 3:1) | 1.422 | 3 | FAIL |
| execution on card | execution axis cue vs card (3:1 UI/text-large) | 10.358 | 3 | PASS |
| verification on card | verification axis cue vs card | 9.829 | 3 | PASS |
| dependency-ready on card | dependency-ready cue vs card | 8.666 | 3 | PASS |
| dependency-blocked on card | dependency-blocked cue vs card | 8.751 | 3 | PASS |
| timing on card | timing cue vs card | 8.86 | 3 | PASS |
| attention on card | attention cue vs card | 9.437 | 3 | PASS |
| execution (direct) vs card |  | 10.358 | 3 | PASS |
| verification (direct) vs card |  | 9.829 | 3 | PASS |
| dependency-ready (direct) vs card |  | 8.666 | 3 | PASS |
| dependency-blocked (direct) vs card |  | 8.751 | 3 | PASS |
| timing (direct) vs card |  | 8.86 | 3 | PASS |
| attention (direct) vs card |  | 9.437 | 3 | PASS |
