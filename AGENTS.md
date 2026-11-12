<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.

<!-- END:turborepo-agent-rules -->

## Cross-platform product design standard

For every web UI change:

1. Consult the repository's `modern-web-guidance` skill before implementing HTML, CSS, accessibility, responsive behavior, forms, interaction, or client-side JavaScript.
2. Use Apple HIG as design inspiration for clarity, hierarchy, feedback, accessibility, restraint, and consistency:
   https://developer.apple.com/design/human-interface-guidelines/
3. Apply these principles across all operating systems and input methods. Do not copy iOS-only conventions literally.
4. Prefer semantic HTML and native browser behavior before custom controls.
5. Support keyboard, mouse, touch, screen readers, zoom, high-contrast modes, reduced motion, and text scaling.
6. Use responsive layouts that adapt to viewport, container, orientation, and input method.
7. Keep touch targets at least 44px where practical, preserve visible focus states, and never rely on color alone.
8. Respect `prefers-reduced-motion`, safe-area insets, dynamic viewport units, and platform/browser defaults.
9. Every interactive state must have clear loading, empty, success, error, disabled, and focus feedback.
10. Before finishing UI work, verify:
    - keyboard navigation and focus order
    - screen-reader names and announcements
    - touch target sizes
    - responsive behavior
    - reduced-motion behavior
    - contrast and text scaling
    - graceful fallback for unsupported browser features
