# Week 2 QA Report - Core Markdown Editor & Assets Integration

## 1. Environment & Branch Details
* **Git Branch**: `feature/W2-markdown-editor`
* **Repository**: CuongVo24/ReportSupporter
* **Date**: 2026-06-23

## 2. Quality Gates Status
All four production readiness verification gates have passed successfully:

* **Gate 1: Unit Tests**: **49/49 tests passed** (100% green, including Markdown pipeline parsing, KaTeX math rendering, CodeMirror insert commands, local asset replacements, Mermaid diagram extractor, template skeleton mappings, and local image file validator).
* **Gate 2: ESLint Linter**: Passed with 0 errors and 0 warnings.
* **Gate 3: TypeScript Typecheck**: Passed with 0 compilation errors.
* **Gate 4: Production Build**: Succeeded (`npm run build` compiled Next.js routes and assets without warnings, output saved in [build_output.txt](file:///e:/ReportSupporter/Design/Reports/Month1/W2/build_output.txt)).

---

## 3. Core Feature Audits (Manual & Automated)

### A. Markdown Parser & Renderer Pipeline (Day 1)
- **KaTeX Equations**: Fully supports inline equations `$...$` and display equations `$$...$$` with correct LaTeX styles parsed and styled via `rehype-katex`.
- **GFM Tables & Formatting**: Strikethrough, lists, and markdown tables are parsed into standard semantic HTML.
- **XSS Sanitization**: Securely strips unsafe HTML attributes and tags (e.g., `<script>`, `onload`, arbitrary `style` parameters) via a strict sanitization schema, while retaining appropriate KaTeX styling classes and highlight block hooks.
- **Syntax Highlighting**: Highlight code blocks with language annotations via `rehype-highlight`.

### B. CodeMirror 6 Editor & Toolbar (Day 2)
- **Configuration**: Loaded CodeMirror 6 markdown plugins, showing active line highlights, selection brackets, and line gutters.
- **Snippet Toolbar**: Quick-insert buttons (`Bảng`, `Code`, `Công thức`, `Mermaid`, `Chú thích`, `Ảnh`) dynamically inject template Markdown tags into the document with intelligent cursor offset positioning.

### C. Live Preview & Mermaid (Day 3)
- **Debounced Rendering**: Editor change updates the live preview with a 250ms debounce to prevent input lag.
- **Mermaid Block Extraction**: RegEx splitting isolates Mermaid diagrams from standard markdown text. Client-side `<MermaidRenderer />` dynamically imports `mermaid` and renders diagrams without server-side hydration errors.
- **Katex Math Styles**: Imports KaTeX styling resources cleanly.

### D. Template Selection & Metadata Form (Day 4)
- **Bootstrap / Initialization**: Fresh workspaces display a beautiful configuration card (`ProjectInitializer`) combining a template picker (currently supporting the `software-project` template) and metadata fields (Title, School, Course, Lecturer, and Group Members).
- **Zod Validation**: Validates fields against schema specs dynamically. Fills errors on screen if required fields are blank or if group members (comma-separated `textList`) are empty.
- **Skeleton Mappings**: Generating skeleton populates the project structure with standard sections matching the template's starter markdown templates sorted by `order`.

### E. Hook-based Autosave & Local Image Insertion (Day 5)
- **Autosave Hook**: `useDraftAutosave` wraps the IndexedDB throttling logic. Serializes and stringifies the project bundle (excluding `updatedAt`) to ensure it only saves to disk when content actually changes. Hooks onto window `beforeunload` and document `visibilitychange` to flush pending queue items instantly.
- **Image Insertion Hook**: Intercepts `paste` and `drop` events in `EditorPanel` and wraps them in `useImageInsert` hook.
- **Local Mime & Size Guard**: Enforces size limitations (max 5MB by default) and rejects PDF/text files with human-friendly errors. Parses valid images to base64 `ReportAsset` objects and appends them to the bundle assets.
- **Drag-drop Precision**: Resolves drag hover coordinates to a character index position in CodeMirror via `view.posAtCoords` so that reference tags are inserted exactly where dropped.

---

## 4. Known Limitations & W3/W4 Handoff

* **Offline Assets Size**: Since images are saved in IndexedDB as Base64 strings, dropping massive image files can hit browser quota limits. Standard 5MB restrictions successfully mitigate this, but an option to compress or crop images locally should be explored in W3.
* **Preview Isolation**: Preview stylesheet rules currently inherit from the global page CSS. If templates require strict print layout simulation, preview sandboxing (e.g. using `iframe` containers) may be required.
* **Multi-file Asset References**: Asset URLs use `asset:<id>` syntax resolved on the fly. When exporting (W4), these references must be converted to local absolute paths or embedded Base64 strings depending on the target format (HTML, PDF, or Word).
