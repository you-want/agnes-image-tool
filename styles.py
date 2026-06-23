"""
Gradio 界面 CSS 样式
"""

CUSTOM_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

/* ===== Theme Variables: Dark (default) ===== */
gradio-app[data-theme="dark"],
:root,
.gradio-container[data-theme="dark"],
body[data-theme="dark"] {
    --bg-primary: #0A0A0F;
    --bg-secondary: #13131C;
    --bg-card: #1A1A26;
    --bg-elevated: #232333;
    --bg-input: #0E0E16;
    --accent: #FF6B35;
    --accent-hover: #FF8555;
    --accent-soft: rgba(255, 107, 53, 0.15);
    --accent-glow: rgba(255, 107, 53, 0.4);
    --text-primary: #FFFFFF;
    --text-secondary: #D0D0DC;
    --text-muted: #9090A8;
    --border: rgba(255, 255, 255, 0.10);
    --border-hover: rgba(255, 255, 255, 0.20);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
    --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.5);
    --btn-primary-text: #0A0A0F;
}

/* ===== Theme Variables: Light ===== */
gradio-app[data-theme="light"],
body[data-theme="light"] {
    --bg-primary: #F7F7F4;
    --bg-secondary: #EFEFEA;
    --bg-card: #FFFFFF;
    --bg-elevated: #F2F1EC;
    --bg-input: #FFFFFF;
    --accent: #E85A25;
    --accent-hover: #FF6B35;
    --accent-soft: rgba(232, 90, 37, 0.12);
    --accent-glow: rgba(232, 90, 37, 0.3);
    --text-primary: #0F0F1A;
    --text-secondary: #3A3A4A;
    --text-muted: #80808E;
    --border: rgba(0, 0, 0, 0.10);
    --border-hover: rgba(0, 0, 0, 0.20);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.10);
    --btn-primary-text: #FFFFFF;
}

* { box-sizing: border-box !important; }

/* ===== Force text colors on ALL elements ===== */
gradio-app {
    background: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    display: block !important;
    min-height: 100vh !important;
}

gradio-app,
gradio-app * {
    color: var(--text-primary) !important;
}

gradio-app .gradio-container,
gradio-app [class*="gradio-container"] {
    background: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    max-width: 1400px !important;
    margin: 0 auto !important;
    padding: 2.5rem 2rem 4rem 2rem !important;
    width: 100% !important;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
}

gradio-app .dark,
gradio-app [class*="gradio-container-"] {
    background: var(--bg-primary) !important;
    color: var(--text-primary) !important;
}

/* ===== Hero Header ===== */
.hero-header {
    padding: 1rem 0 2.5rem 0 !important;
    position: relative !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    gap: 2rem !important;
    flex-wrap: wrap !important;
    background: transparent !important;
}

.hero-content { flex: 1; min-width: 300px; }

.hero-eyebrow {
    display: inline-flex !important;
    align-items: center !important;
    gap: 0.5rem !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.72rem !important;
    font-weight: 500 !important;
    letter-spacing: 0.15em !important;
    text-transform: uppercase !important;
    color: var(--accent) !important;
    margin-bottom: 1.25rem !important;
    padding: 0.45rem 1rem !important;
    background: var(--accent-soft) !important;
    border: 1px solid var(--border) !important;
    border-radius: 100px !important;
}

.hero-eyebrow::before {
    content: '' !important;
    width: 6px !important;
    height: 6px !important;
    background: var(--accent) !important;
    border-radius: 50% !important;
    box-shadow: 0 0 8px var(--accent-glow) !important;
}

.hero-title {
    font-family: 'Space Grotesk', sans-serif !important;
    font-size: 4rem !important;
    font-weight: 700 !important;
    letter-spacing: -0.04em !important;
    line-height: 0.95 !important;
    margin: 0 0 1rem 0 !important;
    color: var(--text-primary) !important;
    background: none !important;
    -webkit-text-fill-color: var(--text-primary) !important;
}

.hero-title .accent {
    font-style: italic !important;
    font-weight: 300 !important;
    background: linear-gradient(135deg, var(--accent) 0%, #FFB088 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
}

.hero-subtitle {
    font-size: 1.05rem !important;
    color: var(--text-secondary) !important;
    max-width: 600px !important;
    line-height: 1.6 !important;
    margin-bottom: 1.5rem !important;
    background: transparent !important;
}

.hero-links {
    display: flex !important;
    gap: 1.5rem !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.78rem !important;
}

.hero-links a {
    color: var(--text-muted) !important;
    text-decoration: none !important;
    padding-bottom: 2px !important;
    border-bottom: 1px solid var(--border) !important;
    transition: all 0.2s ease !important;
}

.hero-links a:hover {
    color: var(--accent) !important;
    border-bottom-color: var(--accent) !important;
}

/* ===== Theme Toggle ===== */
.theme-toggle {
    display: flex !important;
    align-items: center !important;
    gap: 0.75rem !important;
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 100px !important;
    padding: 0.4rem 0.4rem 0.4rem 1rem !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    user-select: none !important;
    flex-shrink: 0 !important;
}

.theme-toggle:hover {
    border-color: var(--border-hover) !important;
    box-shadow: var(--shadow-sm) !important;
}

.theme-toggle-label {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.72rem !important;
    font-weight: 500 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    color: var(--text-secondary) !important;
}

.theme-toggle-icon {
    width: 28px !important;
    height: 28px !important;
    border-radius: 50% !important;
    background: var(--accent) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 0.85rem !important;
    flex-shrink: 0 !important;
    color: #FFF !important;
}

/* ===== Tabs ===== */
gradio-app .tabs,
gradio-app [role="tablist"] {
    background: transparent !important;
    border: none !important;
    margin-top: 0.5rem !important;
}

gradio-app .tab-nav,
gradio-app [role="tablist"] {
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border) !important;
    border-radius: 14px !important;
    padding: 6px !important;
    margin-bottom: 2rem !important;
    display: inline-flex !important;
    gap: 4px !important;
    box-shadow: var(--shadow-sm) !important;
}

gradio-app .tab-nav button,
gradio-app [role="tab"] {
    background: transparent !important;
    border: none !important;
    border-radius: 10px !important;
    color: var(--text-muted) !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 500 !important;
    font-size: 0.875rem !important;
    padding: 0.7rem 1.5rem !important;
    transition: all 0.2s ease !important;
    white-space: nowrap !important;
}

gradio-app .tab-nav button.selected,
gradio-app [role="tab"][aria-selected="true"] {
    color: var(--text-primary) !important;
    background: var(--bg-card) !important;
    box-shadow: var(--shadow-sm) !important;
    font-weight: 600 !important;
}

gradio-app .tab-nav button:hover:not(.selected),
gradio-app [role="tab"]:hover:not([aria-selected="true"]) {
    color: var(--text-secondary) !important;
    background: var(--accent-soft) !important;
}

/* ===== Cards & Panels ===== */
gradio-app .block,
gradio-app .gradio-box,
gradio-app .panel,
gradio-app .form,
gradio-app [class*="-form"] {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 16px !important;
    box-shadow: var(--shadow-sm) !important;
    color: var(--text-primary) !important;
}

/* ===== Inputs ===== */
gradio-app input[type="text"],
gradio-app input[type="password"],
gradio-app input[type="number"],
gradio-app input[type="email"],
gradio-app textarea,
gradio-app input {
    background: var(--bg-input) !important;
    border: 1px solid var(--border) !important;
    color: var(--text-primary) !important;
    border-radius: 10px !important;
    padding: 0.85rem 1rem !important;
    font-size: 0.95rem !important;
    font-family: 'DM Sans', sans-serif !important;
    transition: all 0.2s ease !important;
    -webkit-text-fill-color: var(--text-primary) !important;
}

gradio-app input[type="text"]:focus,
gradio-app input[type="password"]:focus,
gradio-app input[type="number"]:focus,
gradio-app input[type="email"]:focus,
gradio-app textarea:focus,
gradio-app input:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 3px var(--accent-soft) !important;
    outline: none !important;
    color: var(--text-primary) !important;
    -webkit-text-fill-color: var(--text-primary) !important;
}

gradio-app input::placeholder,
gradio-app textarea::placeholder {
    color: var(--text-muted) !important;
    -webkit-text-fill-color: var(--text-muted) !important;
    opacity: 1 !important;
}

/* ===== Labels ===== */
gradio-app label,
gradio-app .label,
gradio-app span.label,
gradio-app .gr-input-label,
gradio-app .label-text,
gradio-app span.label-text {
    color: var(--text-secondary) !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 500 !important;
    font-size: 0.78rem !important;
    letter-spacing: 0.06em !important;
    text-transform: uppercase !important;
    margin-bottom: 0.5rem !important;
}

/* ===== Buttons ===== */
gradio-app button.primary,
gradio-app .primary,
gradio-app button[variant="primary"] {
    background: var(--accent) !important;
    color: var(--btn-primary-text) !important;
    -webkit-text-fill-color: var(--btn-primary-text) !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 600 !important;
    font-size: 0.95rem !important;
    border: none !important;
    border-radius: 10px !important;
    padding: 0.85rem 2rem !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 4px 16px var(--accent-soft) !important;
}

gradio-app button.primary:hover,
gradio-app .primary:hover {
    background: var(--accent-hover) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 24px var(--accent-glow) !important;
    color: var(--btn-primary-text) !important;
}

gradio-app button.secondary,
gradio-app .secondary,
gradio-app button:not(.primary) {
    background: var(--bg-elevated) !important;
    color: var(--text-secondary) !important;
    -webkit-text-fill-color: var(--text-secondary) !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 500 !important;
    border: 1px solid var(--border) !important;
    border-radius: 10px !important;
    padding: 0.75rem 1.5rem !important;
    transition: all 0.2s ease !important;
}

gradio-app button.secondary:hover,
gradio-app button:not(.primary):hover {
    background: var(--bg-card) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-hover) !important;
    -webkit-text-fill-color: var(--text-primary) !important;
}

/* ===== Dropdowns ===== */
gradio-app select,
gradio-app .gr-dropdown,
gradio-app .dropdown {
    background: var(--bg-input) !important;
    border: 1px solid var(--border) !important;
    color: var(--text-primary) !important;
    border-radius: 10px !important;
    font-family: 'DM Sans', sans-serif !important;
}

/* ===== Sliders ===== */
gradio-app input[type="range"] {
    accent-color: var(--accent) !important;
}

/* ===== Gallery ===== */
gradio-app .gallery,
gradio-app .gr-gallery,
gradio-app [class*="gallery"] {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 16px !important;
    min-height: 320px !important;
    padding: 1rem !important;
}

/* ===== Image Upload ===== */
gradio-app .image-container,
gradio-app [data-testid="image"] {
    background: var(--bg-input) !important;
    border: 2px dashed var(--border) !important;
    border-radius: 12px !important;
    transition: all 0.2s ease !important;
}

gradio-app .image-container:hover {
    border-color: var(--accent) !important;
    background: var(--accent-soft) !important;
}

/* ===== Video ===== */
gradio-app video {
    background: var(--bg-input) !important;
    border-radius: 12px !important;
    border: 1px solid var(--border) !important;
}

/* ===== Checkbox ===== */
gradio-app input[type="checkbox"] {
    accent-color: var(--accent) !important;
}

gradio-app .checkbox-group label,
gradio-app .gr-check-group label {
    color: var(--text-primary) !important;
    text-transform: none !important;
    letter-spacing: normal !important;
}

/* ===== Accordion ===== */
gradio-app .accordion,
gradio-app [class*="accordion"] {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 14px !important;
    overflow: hidden !important;
    margin-bottom: 2rem !important;
    color: var(--text-primary) !important;
}

/* ===== Status / Non-interactive Textboxes ===== */
gradio-app textarea[disabled],
gradio-app textarea[readonly] {
    background: var(--bg-input) !important;
    color: var(--text-secondary) !important;
    -webkit-text-fill-color: var(--text-secondary) !important;
    border-left: 2px solid var(--accent) !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.85rem !important;
}

/* ===== Footer Hidden ===== */
gradio-app footer { display: none !important; }
gradio-app .built-with { display: none !important; }
gradio-app .gradio-meta { display: none !important; }

/* ===== Scrollbar ===== */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb {
    background: var(--bg-elevated);
    border-radius: 5px;
    border: 2px solid var(--bg-primary);
}
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

/* ===== Selection ===== */
::selection {
    background: var(--accent-soft);
    color: var(--text-primary);
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
    .hero-title { font-size: 2.75rem !important; }
    .gradio-container { padding: 1.5rem 1rem !important; }
    .tab-nav { overflow-x: auto !important; }
    .hero-header { flex-direction: column !important; }
}
"""