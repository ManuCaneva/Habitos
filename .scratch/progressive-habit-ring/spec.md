# Anillo segmentado para hábitos progresivos

Status: ready-for-agent
Label: ready-for-agent

## Problem Statement

Los hábitos diarios con un target de más de una repetición por período se muestran actualmente con puntos dentro del círculo de check-in. Ese diseño no comunica con suficiente claridad que el progreso pertenece al perímetro del control ni conserva la lectura visual del hábito diario cuando todavía está incompleto.

La persona usuaria necesita poder distinguir de un vistazo cuántas repeticiones de un hábito progresivo ya registró, cuántas faltan y cuándo el hábito quedó cumplido, sin cambiar el comportamiento de los check-ins ni la apariencia de los hábitos binarios.

## Solution

Para los hábitos con `target > 1`, reemplazar la cuadrícula de puntos interiores por un anillo segmentado que sea el propio borde del círculo. El anillo tendrá tantos segmentos como repeticiones objetivo, comenzará a las 12 en punto y se encenderá en sentido horario a medida que la persona presione el control central.

El centro conservará el `Plus` mientras el hábito esté incompleto, incluso cuando tenga progreso parcial. Los segmentos completados usarán el color del hábito y los pendientes una versión atenuada del mismo color. Cuando todas las repeticiones estén registradas, el anillo desaparecerá como estado independiente y el control se convertirá en el mismo círculo sólido con `Check` blanco que ya usan los hábitos con target 1.

## User Stories

1. As a person tracking a progressive habit, I want to see one visible segment for each required repetition, so that I understand the size of the daily target immediately.
2. As a person tracking a progressive habit, I want the segments to surround the circle, so that progress is visually associated with the completion control rather than with unrelated dots inside it.
3. As a person tracking a progressive habit with no check-ins, I want every ring segment to appear unfilled, so that the empty state is unambiguous.
4. As a person tracking a progressive habit with partial progress, I want exactly one segment to light for each registered check-in, so that the ring reflects my current progress precisely.
5. As a person tracking a progressive habit, I want completed segments to use the habit color, so that progress remains associated with the habit's existing visual identity.
6. As a person tracking a progressive habit, I want incomplete segments to remain visible but subdued, so that I can see both the target size and the remaining work.
7. As a person tracking a progressive habit, I want the first segment to start at 12 o'clock, so that the ring has a predictable visual starting point.
8. As a person tracking a progressive habit, I want progress to advance clockwise, so that it follows the familiar convention of a progress ring or clock.
9. As a person tracking a progressive habit, I want the ring to have gaps between segments, so that individual repetitions remain distinguishable.
10. As a person tracking a progressive habit with a low target, I want the gaps to remain visually balanced, so that two, three, or four repetitions do not look like a single broken border.
11. As a person tracking a progressive habit with a high target, I want the gaps to scale proportionally with the segment size, so that the ring remains usable up to the supported target of 20.
12. As a person tracking an incomplete progressive habit, I want to see a `Plus` in the center, so that I know the primary action is to add one check-in.
13. As a person tracking a partially completed progressive habit, I want the `Plus` to remain visible, so that I can continue adding repetitions without interpreting partial progress as completion.
14. As a person tracking a progressive habit, I want to add progress by pressing only the central control, so that the ring itself remains a clear status display and does not introduce ambiguous click targets.
15. As a person tracking a progressive habit, I want each central press before completion to add one check-in, so that progress advances one repetition at a time.
16. As a person tracking a progressive habit, I want the newly completed segment to transition briefly, so that the interface confirms the action without distracting movement.
17. As a person tracking a progressive habit, I want the control to keep its existing compact size and placement, so that habit cards and rows do not shift when this visual treatment is introduced.
18. As a person tracking a progressive habit, I want the ring stroke to stay readable at the compact control size, so that segments are visible without making the control larger.
19. As a person tracking a progressive habit, I want a decrement action to remain available when progress is above zero, so that I can correct an accidental check-in.
20. As a person tracking a progressive habit, I want the existing decrement affordance to subtract one repetition, so that corrections preserve the same check-in semantics.
21. As a person tracking a progressive habit, I want the existing full-state click to reset the day's progress, so that I can undo all repetitions when needed.
22. As a person tracking a progressive habit, I want the full state to show a solid circle and white `Check`, so that completion is immediately recognizable.
23. As a person tracking a progressive habit, I want the full state to match the daily binary habit control, so that completed habits share one consistent visual language.
24. As a person tracking a binary habit with `target === 1`, I want the current border, `Plus`, solid fill, and `Check` behavior to remain unchanged, so that this feature does not alter non-progressive habits.
25. As a person viewing habits in the dashboard, I want the same progressive ring behavior as in the habit list, so that the same check-in has the same meaning in both contexts.
26. As a person viewing archived habits, I want the existing check-in control behavior to remain unchanged apart from the new progressive visualization, so that historical habit management is not unexpectedly redesigned.
27. As a person using the application with a stale or over-target count, I want the visual state to treat the habit as complete and cap visible progress at the target, so that invalid or legacy data cannot render extra segments.
28. As a person using the application, I want the ring to remain decorative rather than independently clickable, so that all check-in behavior continues through the established component events.
29. As a person using keyboard or assistive technology, I want the central control to retain its existing button semantics and labels, so that the visual change does not reduce accessibility.
30. As a maintainer, I want the progressive ring to use the existing habit-color and surface-color conventions, so that the feature remains consistent with the current design system.

## Implementation Decisions

- The existing `SegmentedCheckCircle` remains the single UI seam for this behavior. Its public inputs remain the repetition target, current count, and habit color; its existing increment, decrement, and reset events remain unchanged.
- The progressive visual applies only when `target > 1`. Habits with `target === 1` retain their current binary presentation and state transitions.
- For an incomplete progressive habit, the center displays the existing `Plus`, regardless of whether the count is zero or partial. The `Check` is not shown until the target is reached.
- The circle's existing 28 by 28 pixel footprint is preserved. For progressive habits, the border is replaced by an SVG-based ring of individual arc segments rather than adding a larger outer ring or retaining an additional border.
- The ring contains exactly `target` segments, supports the existing target range through 20, starts at 12 o'clock, and fills clockwise.
- Segment gaps are proportional to each segment's angular span rather than a fixed pixel or fixed-degree gap. This keeps low and high targets visually balanced.
- The ring stroke is approximately 2 pixels and is rendered inside the existing control footprint. The center remains available for the button action.
- Filled segments use the habit color. Unfilled segments use the existing attenuated habit color convention used by the current progressive indicator. The inner surface remains the existing subdued surface treatment.
- Segment color changes use a short approximately 150 millisecond transition. No rotation, layout animation, or size animation is introduced.
- The SVG ring is presentational and must not create an additional interaction surface. Pointer events remain routed to the existing central button.
- When `count >= target`, the progressive ring and `Plus` are not rendered. The control uses the existing solid habit-color fill and white `Check` presentation.
- The existing progressive interaction contract remains: central click emits `increment` until full, central click emits `reset` when full, and the existing decrement affordance emits `decrement` when count is above zero.
- The existing store, persistence schema, habit cards, habit rows, heatmap, and check-in domain behavior do not change. This is a frontend presentation change over the existing check-in contract.
- Any geometry calculation that is not naturally expressed inside the component may be extracted into a small pure TypeScript helper. That helper must describe ring geometry only and must not own business rules or persistence logic.
- No Rust, Tauri command, SQLite schema, or domain validation changes are required.

## Testing Decisions

- The primary test seam is the existing `SegmentedCheckCircle` component test using Vue Test Utils. Tests should assert observable rendering and emitted events, not SVG implementation details such as a particular path construction algorithm.
- For `target > 1`, component tests must cover zero progress, partial progress, the exact target, and a count at or above the target. They must verify the number of visible segments, the number of lit segments, the presence of `Plus` while incomplete, and the presence of `Check` only when complete.
- Component tests must verify that filled and unfilled segments expose the expected habit color and attenuated color through observable rendered styles or equivalent public output.
- Component tests must verify central clicks emit `increment` while incomplete and `reset` when full. They must preserve coverage of the existing decrement event and the absence of the decrement affordance at zero.
- Component tests must verify the binary `target === 1` behavior remains unchanged, including `Plus`, `Check`, increment, and decrement behavior.
- Component tests should verify that the progressive ring is not an independently interactive control and that the central button remains the accessible action surface.
- If a pure ring-geometry helper is introduced, its tests should cover target values at the low end, representative middle values, and the maximum supported target. They should verify the segment count, 12 o'clock origin, clockwise ordering, proportional gaps, and stable output for clamped counts where relevant.
- Tests should avoid asserting incidental class names, internal computed-property names, exact SVG path strings, or the implementation choice between SVG primitives when equivalent external behavior is preserved.
- Existing component-test conventions in the UI layer should be followed, with tests colocated next to the component or helper they exercise.
- Verification for this feature includes the complete unit test suite and the production build. Because the dashboard control is touched, the dashboard performance budget should also be checked if the implementation changes dashboard rendering beyond the isolated control.

## Out of Scope

- Changing the habit domain model, the meaning of a check-in, streak calculation, frequency rules, or target validation.
- Changing the maximum or minimum supported repetition target.
- Changing how check-ins are persisted or loaded.
- Adding click behavior to individual ring segments.
- Adding a new icon or replacing the existing `Plus` with a different cross or X symbol.
- Changing the existing decrement affordance, reset semantics, aria labels, or store actions beyond what is necessary to preserve them with the new rendering.
- Redesigning binary habits with `target === 1`.
- Redesigning the dashboard, habit cards, habit rows, heatmap, archived view, or responsive layout outside the footprint needed to render the existing control.
- Adding a new UI dependency or moving business logic into Rust.
- Adding an outer ring that increases the control's size.
- Showing numbers, labels, or textual repetition counts inside the circle.
- Adding a new animation system or changing global motion tokens.

## Further Notes

- The domain glossary calls the per-period quantity a repetition target and the individual registered unit a check-in. This feature changes only how those check-ins are visualized.
- The current implementation uses inner CSS dots for progressive progress. The new design intentionally changes that encoding to circumferential segments while retaining the existing completion state and event contract.
- A count of one or more still counts as a check-in for streak behavior even when the ring is only partially filled; the ring must not imply a change to that domain rule.
- The full state should remain visually identical to the binary full state, including the disappearance of the progressive segments, to avoid introducing a second meaning for completion.
