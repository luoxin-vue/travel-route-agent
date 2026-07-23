# ticket 4/5 — TopAppBar 主题按钮 + 快捷气泡菜单

**What to build:** Top bar has a new theme icon button next to the Settings gear. Clicking it opens a bubble menu (Sun/Moon/Monitor options with check mark on selected). Clicking an option immediately switches theme and closes the menu. The icon reflects the current resolved theme.

**Blocked by:** #10 ticket 1/5, #11 ticket 2/5 — can start immediately once those land.

**Status:** ready-for-agent

- [ ] TopAppBar.tsx imports useResolvedTheme; icon from resolved theme: Sun for light, Moon for dark, Monitor for system
- [ ] Theme button aria-label="切换主题外观", aria-haspopup="menu", aria-expanded={isThemeMenuOpen}
- [ ] ThemeMenu.tsx renders as absolutely-positioned bubble below button with z-30, rounded corners, border, shadow
- [ ] Menu options show icon + label + Check icon on the currently preferred option (not resolved)
- [ ] Clicking an option calls updatePreferences({ theme: opt.key }) then closes menu
- [ ] Click-outside detection (ref.contains on mousedown) closes menu
- [ ] Escape key closes menu
- [ ] Menu does not render in DOM when closed (if (!isOpen) return null)
- [ ] npm run build succeeds
