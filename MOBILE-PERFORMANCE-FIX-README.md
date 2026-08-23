# Divine Increase — Mobile Performance Fix

This package contains a conservative mobile-performance pass over the supplied project.

Changes:
- Mobile/constrained-device detection.
- Pauses animations when the tab is hidden.
- Pauses decorative animation during scrolling.
- Respects prefers-reduced-motion.
- Removes live backdrop-filter blur on constrained/mobile devices.
- Reduces expensive mobile shadows.
- Defers/lazifies non-hero images.
- Leaves Firebase, authentication, dashboard, business logic and content intact.

This is intentionally a safe performance layer rather than a blind rewrite of application logic.
