# CERTORA — Create. Certify. Celebrate.
> Enterprise Bulk Certificate Automation & Universal Template Studio with Multiple Transparent Signature Placement
> Developed by **Athrav Pathak**

**CERTORA** is a client-side, browser-based universal certificate generator and template customization studio. Personalize and compile hundreds of high-resolution vector certificates for any event, internship, course, or workshop using customizable templates (or custom uploaded PDFs/images), multiple authorized signatures, and dynamic participant rosters.

---

## 🌟 Key Features

- **100% Client-Side Privacy**: No backend, no database, no registration, no API keys, and no cloud uploads. All documents, names, and signatures remain strictly inside the user's browser.
- **Universal Certificate Template Catalog**:
  - **Certificate of Participation**: Dynamic placeholders for `{{participant_name}}`, `{{event_name}}`, `{{location}}`, `{{date}}`, and multiple signatures.
  - **Certificate of Achievement**: Dynamic placeholders for `{{participant_name}}`, `{{achievement}}`, `{{event_name}}`, `{{rank}}`, `{{date}}`, and multiple signatures.
  - **Certificate of Completion**: Dynamic placeholders for `{{participant_name}}`, `{{course_name}}`, `{{grade}}`, `{{certificate_id}}`, `{{date}}`, and multiple signatures.
  - **Internship Certificate**: Dynamic placeholders for `{{participant_name}}`, `{{role}}`, `{{department}}`, `{{duration}}`, `{{date}}`, and multiple signatures.
  - **Certificate of Appreciation**: Dynamic placeholders for `{{participant_name}}`, `{{contribution}}`, `{{organization}}`, `{{date}}`, and multiple signatures.
  - **Workshop Certificate**: Dynamic placeholders for `{{participant_name}}`, `{{workshop_topic}}`, `{{institution}}`, `{{date}}`, and multiple signatures.
  - **Custom Uploaded Designs**: Full support for uploaded PDF, PNG, JPG, or JPEG certificates with preserved vector layers and custom dimensions.
- **Universal Editable Content System**:
  - Add, edit, rename, and delete static text and dynamic participant fields.
  - **Unrestricted Font Sizing**: Zero arbitrary caps—allows any font size (80px, 150px, 300px, 500px+) with direct numeric entry, unrestricted `+`/`-` step buttons, dynamic adaptive slider, and instant preset buttons.
  - **Live Proportional Preview**: Dynamic container-based font scaling matches PDF output in real time.
  - **Visual Overflow Warnings**: Non-blocking amber bounding box and badge indicators when text exceeds its area without silent shrinking.
  - Configurable typography: Google Sans Bold, Montserrat, Playfair Display, Cinzel, Inter, Merriweather, Great Vibes.
  - Full control over font size, font weight, color, alignment, letter spacing, and bounding boxes.
  - Direct canvas drag-and-drop repositioning with normalized coordinates (0–100%) invariant to screen zoom and paper sizes.
  - **Template Field Isolation**: Each template maintains its own independent `fieldConfig` configuration.
- **Universal Bulk Generation & Dynamic Field Mapping**:
  - Upload CSV, Excel (`.xlsx`, `.xls`), or paste multi-column tab-delimited text.
  - Automatic column header detection and semantic matching to template fields (e.g., `role`, `department`, `duration`, `course`, `grade`, `rank`).
  - Dynamic token interpolation supporting both single tokens and sentence interpolation (e.g., `For completing {{course_name}} with grade {{grade}}`).
  - Generate single participant PDFs, combined multi-page PDFs, or a ZIP package with all certificates.
- **Multiple Signature Placement Engine**:
  - Insert 2–3 or more independent signatures on the same certificate (e.g. Director, Principal, Instructor).
  - Each signature is independently repositionable, resizable, and configurable with its own authority title.
  - Pure solid black ink (`#000000`) preservation with complete background removal (100% transparency).
  - Normal blend mode (`mixBlendMode: normal`) and 100% opacity preventing accidental transparency or fading.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Running Locally

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Start development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

Open `http://localhost:5173/` in your browser.

---

## 🧪 Comprehensive Automated QA Test Suites

The codebase includes comprehensive automated Node.js test suites with 100% passing rates:

1. **Universal Templates & Bulk Generation Suite (`test-universal-templates.cjs`)** — **39/39 Passed (100%)**:
   - Source code architecture validation (types, catalog, resolver, excel, editor, portal, canvas).
   - Dynamic placeholder & fuzzy field resolution engine.
   - Complete verification of 3 distinct certificate designs: Participation, Internship, and Completion.
   - Template `fieldConfig` state isolation across designs.
   - Real PDF generation and multi-page bulk compilation with `pdf-lib`.
2. **Multiple Signature Placement Suite (`test-multiple-signatures.cjs`)** — **15/15 Passed (100%)**:
   - Independent placement of 3 distinct authority signatures on one certificate.
   - Non-overlapping X/Y coordinates, distinct authority labels, and aspect-ratio-locked resizing.
   - Multi-signature PDF embedding and caching.
3. **Signature Rendering Fidelity Suite (`test-signature-rendering-fidelity.cjs`)** — **19/19 Passed (100%)**:
   - Pure black `#000000` ink preservation across white, cream, and grey paper scans.
   - Background transparency removal with 100% stroke opacity (alpha = 255).
   - CSS blend mode, opacity, and filter inspections across all UI canvas elements.
4. **End-to-End Signature & Live Preview Suite (`test-e2e-signature-preview.cjs`)** — **14/14 Passed (100%)**:
   - Embedded Google Sans Bold typography.
   - Exact bottom-right signature quadrant positioning.
   - Clean default filenames without unwanted certificate IDs.
   - Official CERTORA logo asset validation.
5. **Signature Background Remover Suite (`test-signature-remover.cjs`)** — **7/7 Passed (100%)**:
   - Automatic edge smoothing, hairline preservation, and de-haloing.
6. **Font Size Controls & Unrestricted Sizing Suite (`test-font-size-live-preview.cjs`)** — **38/38 Passed (100%)**:
   - Dynamic adaptive slider scaling beyond 80px/100px.
   - Numeric input allowing any size (80px, 150px, 300px, 500px, 1000px).
   - Uncapped `+`/`-` buttons, live proportional preview rendering, and PDF compilation with 80px, 150px, 300px, and 500px.

---

## 📄 License & Attribution
Developed by **Athrav Pathak**  
LinkedIn: [https://www.linkedin.com/in/athrav-pathak-ai](https://www.linkedin.com/in/athrav-pathak-ai)  
GitHub: [https://github.com/Athravpathak-git](https://github.com/Athravpathak-git)
