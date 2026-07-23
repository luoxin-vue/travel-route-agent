# ticket 5/5 — 地图页跟随主题

**What to build:** When the user switches theme from any entry point (Settings or TopAppBar), the AMap on the map page updates its base map style without destroying the map instance. Pan position, zoom level, markers, and polyline are preserved.

**Blocked by:** #10 ticket 1/5, #11 ticket 2/5 — can start immediately once those land.

**Status:** ready-for-agent

- [ ] MapView.tsx imports useResolvedTheme and passes resolvedTheme to mapStyle during initial AMap creation
- [ ] Separate useEffect watches only resolvedTheme; calls mapRef.current.setMapStyle(AMAP_STYLE_ID[resolvedTheme])
- [ ] AMAP_STYLE_ID maps light → "amap://styles/whitesmoke" and dark → "amap://styles/dark"
- [ ] Markers (numbered waypoints) and dashed polyline survive theme swaps without disappearing
- [ ] Map pan position and zoom level are preserved across theme changes
- [ ] First map render after app load uses the theme resolved from stored preference + system setting
- [ ] npm run build succeeds
