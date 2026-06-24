"""
Gradio 界面 CSS 样式 - 浅色主题
"""

CUSTOM_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

/* ===== Theme Variables ===== */
:root {
    --bg-primary: #FAFAFA;
    --bg-secondary: #F3F4F6;
    --bg-card: #FFFFFF;
    --bg-elevated: #F9FAFB;
    --bg-input: #FFFFFF;
    --accent: #E85A25;
    --accent-hover: #FF6B35;
    --accent-soft: rgba(232, 90, 37, 0.1);
    --accent-glow: rgba(232, 90, 37, 0.25);
    --text-primary: #111827;
    --text-secondary: #4B5563;
    --text-muted: #9CA3AF;
    --border: rgba(0, 0, 0, 0.08);
    --border-hover: rgba(0, 0, 0, 0.15);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
    --btn-primary-text: #FFFFFF;
}

* { box-sizing: border-box !important; }

/* ===== Base Styles ===== */
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
    border: 1px solid rgba(232, 90, 37, 0.2) !important;
    border-radius: 100px !important;
}

.hero-eyebrow::before {
    content: '' !important;
    width: 6px !important;
    height: 6px !important;
    background: var(--accent) !important;
    border-radius: 50% !important;
}

.hero-title {
    font-family: 'Space Grotesk', sans-serif !important;
    font-size: 3.5rem !important;
    font-weight: 700 !important;
    letter-spacing: -0.03em !important;
    line-height: 1 !important;
    margin: 0 0 1rem 0 !important;
    color: var(--text-primary) !important;
}

.hero-title .accent {
    font-style: italic !important;
    font-weight: 300 !important;
    background: linear-gradient(135deg, var(--accent) 0%, #FF8855 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
}

.hero-subtitle {
    font-size: 1rem !important;
    color: var(--text-secondary) !important;
    max-width: 550px !important;
    line-height: 1.6 !important;
    margin-bottom: 1.5rem !important;
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

/* ===== Tabs ===== */
gradio-app .tabs,
gradio-app [role="tablist"] {
    background: transparent !important;
    border: none !important;
    margin-top: 0.5rem !important;
}

gradio-app .tab-nav,
gradio-app [role="tablist"] {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 12px !important;
    padding: 5px !important;
    margin-bottom: 2rem !important;
    display: inline-flex !important;
    gap: 3px !important;
    box-shadow: var(--shadow-sm) !important;
}

gradio-app .tab-nav button,
gradio-app [role="tab"] {
    background: transparent !important;
    border: none !important;
    border-radius: 8px !important;
    color: var(--text-muted) !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 500 !important;
    font-size: 0.875rem !important;
    padding: 0.6rem 1.25rem !important;
    transition: all 0.2s ease !important;
    white-space: nowrap !important;
}

gradio-app .tab-nav button.selected,
gradio-app [role="tab"][aria-selected="true"] {
    color: var(--text-primary) !important;
    background: var(--bg-secondary) !important;
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
    border-radius: 12px !important;
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
    border-radius: 8px !important;
    padding: 0.75rem 1rem !important;
    font-size: 0.95rem !important;
    font-family: 'DM Sans', sans-serif !important;
    transition: all 0.2s ease !important;
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
}

gradio-app input::placeholder,
gradio-app textarea::placeholder {
    color: var(--text-muted) !important;
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
    letter-spacing: 0.04em !important;
    text-transform: uppercase !important;
    margin-bottom: 0.4rem !important;
}

/* ===== Buttons ===== */
gradio-app button.primary,
gradio-app .primary,
gradio-app button[variant="primary"] {
    background: var(--accent) !important;
    color: var(--btn-primary-text) !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 600 !important;
    font-size: 0.95rem !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 0.75rem 1.5rem !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 2px 8px var(--accent-soft) !important;
}

gradio-app button.primary:hover,
gradio-app .primary:hover {
    background: var(--accent-hover) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px var(--accent-glow) !important;
}

gradio-app button.secondary,
gradio-app .secondary,
gradio-app button:not(.primary) {
    background: var(--bg-card) !important;
    color: var(--text-secondary) !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 500 !important;
    border: 1px solid var(--border) !important;
    border-radius: 8px !important;
    padding: 0.65rem 1.25rem !important;
    transition: all 0.2s ease !important;
}

gradio-app button.secondary:hover,
gradio-app button:not(.primary):hover {
    background: var(--bg-secondary) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-hover) !important;
}

/* ===== Dropdowns ===== */
gradio-app select,
gradio-app .gr-dropdown,
gradio-app .dropdown {
    background: var(--bg-input) !important;
    border: 1px solid var(--border) !important;
    color: var(--text-primary) !important;
    border-radius: 8px !important;
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
    border-radius: 12px !important;
    min-height: 300px !important;
    padding: 1rem !important;
}

/* ===== Image Upload ===== */
gradio-app .image-container,
gradio-app [data-testid="image"] {
    background: var(--bg-secondary) !important;
    border: 2px dashed var(--border) !important;
    border-radius: 10px !important;
    transition: all 0.2s ease !important;
}

gradio-app .image-container:hover {
    border-color: var(--accent) !important;
    background: var(--accent-soft) !important;
}

/* ===== Video ===== */
gradio-app video {
    background: var(--bg-secondary) !important;
    border-radius: 10px !important;
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
    border-radius: 12px !important;
    overflow: hidden !important;
    margin-bottom: 1.5rem !important;
    color: var(--text-primary) !important;
}

/* ===== Status Textboxes ===== */
gradio-app textarea[disabled],
gradio-app textarea[readonly] {
    background: var(--bg-secondary) !important;
    color: var(--text-secondary) !important;
    border-left: 3px solid var(--accent) !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.85rem !important;
}

/* ===== Footer Hidden ===== */
gradio-app footer { display: none !important; }
gradio-app .built-with { display: none !important; }
gradio-app .gradio-meta { display: none !important; }

/* ===== Scrollbar ===== */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-secondary); }
::-webkit-scrollbar-thumb {
    background: #D1D5DB;
    border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }

/* ===== Selection ===== */
::selection {
    background: var(--accent-soft);
    color: var(--text-primary);
}

/* ===== Section Labels ===== */
.section-label {
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
    letter-spacing: 0.05em !important;
    text-transform: uppercase !important;
    color: var(--accent) !important;
    margin: 1.5rem 0 0.75rem 0 !important;
    padding-bottom: 0.5rem !important;
    border-bottom: 2px solid var(--accent-soft) !important;
}

/* ===== Warning Box ===== */
.warning-box {
    background: rgba(255, 193, 7, 0.15) !important;
    border: 1px solid rgba(255, 193, 7, 0.3) !important;
    border-radius: 8px !important;
    padding: 1rem !important;
    margin-bottom: 1rem !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 0.9rem !important;
    color: #856404 !important;
    line-height: 1.5 !important;
}

/* ===== Success Box ===== */
.success-box {
    background: rgba(40, 167, 69, 0.15) !important;
    border: 1px solid rgba(40, 167, 69, 0.3) !important;
    border-radius: 8px !important;
    padding: 1rem !important;
    margin-bottom: 1rem !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 0.9rem !important;
    color: #155724 !important;
    line-height: 1.5 !important;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
    .hero-title { font-size: 2.5rem !important; }
    .gradio-container { padding: 1.5rem 1rem !important; }
    .tab-nav { overflow-x: auto !important; }
}
"""