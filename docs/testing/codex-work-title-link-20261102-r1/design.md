# Work title link correction

Actual Local Codex. Keep the existing Pane palette/type scale (reading face#FFFFFF, canvas#F1F4F8, ink#202124, secondary#677083, edge#D4D9E2, focus#315FA8; implementation uses inherited tokens). Be Vietnam Pro remains unchanged.

Left-aligned row: [ linked record name                         pencil ]. The name is the only details navigation; the pencil independently opens the existing inline editor. No nested button/link, duplicate Open details line, new icon or motion. Keep a16rem minimum title column, natural long-name wrapping, horizontal table scrolling and keyboard focus. Existing origin/from URL and CAS/error/UNKNOWN behavior remain unchanged.

Critique: the extra details line and wrapping edit button inflated every row and squeezed titles into single words. Reuse InlineEdit's read-mode slot and the current Link; preserve editing rather than introducing another row click handler or dialog.
