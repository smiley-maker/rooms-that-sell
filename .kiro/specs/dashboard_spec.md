# RoomsThatSell – **/projects** Dashboard Update Brief (Final)

> **Goal:** Update the existing **/projects** page to the single-screen “Listing Workspace” shown in the attached wireframe. Keep the implementation lean, photo-first, and consistent with the current design system. This brief describes structure, behaviors, and minimal integration points. **Do not change database schema**.

---

## Scope

* Refactor **/projects** into a three-area workspace for a single listing:

  1. **Left rail:** Images by status (Uploaded, Staged, Approved)
  2. **Center canvas:** Large before/after viewer with a slim canvas toolbar
  3. **Right panel:** Edit controls (room type, style preset, décor toggle, advanced prompt)
* Add a **bottom task bar** for primary actions (Fullscreen, Approve, Download) and progress/credits.
* Add **Versions** UX (quick dropdown + modal gallery) using the existing `imageVersions` data.
* Ship a **Download modal** with MLS-safe defaults.

*Out of scope (for now):* team features, business style governance, flyer/social templates.

---

## Tech & UI

* **Stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + lucide-react
* **Style:** light, photo-first; rounded cards, subtle shadows; neutral background.
* **A11y:** 44px tap targets; visible focus rings; keyboard nav for toolbar, versions, and modals; `aria-live` to announce long ops.

---

## Page Skeleton & Layout

```txt
<AppShell>
  <TopNav />    // logo, title "listings", credits badge, +new listing, user menu
  <Main grid>   // max-w-[1400px] mx-auto p-4 gap-4
    <LeftRail />          // 300px fixed card
    <CenterColumn />      // canvas toolbar + image
    <UpdateImagePanel />  // 360px card (collapsible on small screens)
  </Main>
  <BottomBar /> // sticky under the canvas
</AppShell>
```

### LeftRail

* Collapsible sections with counts: **Staged**, **Approved**, **Uploaded**.
* 2-col thumbnail grid; selected thumb shows a purple ring.
* Tiny status chips on thumbs (optional): Uploaded / Staged / Approved.
* **Add images** button (file picker; multiple) + global drag-drop overlay for uploads.

### CenterCanvas

* **Canvas toolbar (row above image):**

  * Buttons: `Fullscreen`, `Zoom 100%`, `Fit`, `Before/After` toggle
  * **Versions button** shows current label (e.g., `Versions: Scandi • Décor ON • 10:48a ▾`)
* **Image viewer:** Before/after slider; `max-h-[70vh]`, `object-contain`, rounded corners. Slider handle centered.

### UpdateImagePanel (right)

* Title: **update image**
* Controls:

  * **Room type** `<Select>`
  * **Interior design style** `<Select>` (Modern, Scandinavian, Minimal, Bohemian, etc.)
  * **Staging detail** (segmented): **Furniture only** | **Furniture + Décor**
  * **Advanced options ▾** (collapsed by default):

    * **Custom Prompt** `<Textarea>`
    * Sub-CTA: `⭐ Save this setup as a style` → small modal (name, save)
  * **Regenerate** (primary) with subtext `1 credit per image`
* Busy state: disable inputs and show spinner text **“Regenerating…”**

### BottomBar (sticky)

* Actions: `Fullscreen` | `Regenerating` (spinner when in flight) | `Approve` | `Download`
* Progress bar for active jobs; credits text on right `credits left: X/Y`.
* **Multi-select:** actions switch to `Apply Style to N`, `Approve N`, `Download N`.

### Responsive

* At `<1200px`: allow **UpdateImagePanel** to collapse via chevron.
* At `<1024px`: move panel into a slide-over; toolbar collapses icons into a menu.
* **Fullscreen** hides rails/panel; overlay toolbar auto-hides; `Esc` exits.

---

## Versions UX (uses existing `imageVersions`)

* **Assumptions:** `imageVersions` table exists with fields like:
  `{ id, imageId, kind, stylePreset, decor, prompt, r2Key, thumbR2Key, createdAt, createdBy, pinned }`.
* **Quick dropdown** (from the toolbar):

  * Show last \~5 versions: thumbnail • label `Style • Décor ON/OFF` • time • badges (**Active** ✅, **Original** 🔒, **Pinned** ⭐)
  * Last item: **See all versions…** (opens modal gallery)
  * Hover preview on desktop (temporary swap); click sets active
  * Disable in multi-select
* **Modal gallery:** grid of all versions (original always first). Actions: `Set active`, `Download`, `Pin`. Active version gets a checkmark.

---

## Download Modal (MLS-safe defaults)

* Triggered by **Download** in the bottom bar.
* **What to export** (radio): `Current image` / `Selected images (ZIP)`
* **Format:** `MLS JPG (default)` / `High-res JPG`
* **Options** (toggles):

  * **Watermark "Virtually Staged"** → **ON by default**
  * **Include Original** → **OFF by default** (toggleable)
* Primary button label reflects scope: `Download 1 image` / `Download 6 images (ZIP)`
* Note (non-blocking): “Some MLSs require watermarked staged images.”

---

## Client ↔ Server (exact function names)

Use existing Convex actions; wire the UI to these signatures:

* `api.images.getProjectImages({ projectId })` → `Image[]`
* Uploads: `api.images.generateImageUploadUrl` + `api.images.createImageRecord`
* **Stage / Regenerate (single or batch):**

  ```ts
  api.stagingJobs.createStagingJob({
    projectId,
    imageIds,     // one or many
    roomType,     // required
    stylePreset,  // required
    decor,        // boolean (true = Furniture + Décor)
    customPrompt  // optional (append any extra guidance)
  }) → { jobId }
  ```
* Approve image: `api.images.approveImage({ imageId })`
* List versions: `api.images.listImageVersions({ imageId })` → `ImageVersion[]`
* Set active version: `api.images.setCurrentImageVersion({ imageId, versionId })`
* Pin version: `api.images.setImageVersionPinned({ versionId, pinned })`
* **Quick download (version-aware):** `api.images.getImageVersionDownloadUrl({ versionId })`
  *(or route singles through `MLSExportDialog` for consistency)*
* MLS export: `api.mlsCompliance.getExportResolutions()` + `api.mlsCompliance.createMLSExport(...)`
* Credits: `api.users.getCreditStatus()` → `{ credits, isLowBalance, ... }`
* **Progress (canonical source):** `api.stagingJobs.getStagingJobProgress({ projectId })` → `{ [imageId]: 0..1 }`

> **Important:** Do **not** persist room/style/décor changes until the user clicks **Regenerate**. On job completion, set the new version active, set status to **Staged** (if not already Approved), and refresh the left-rail thumbnail.

---

## Interaction Details

### Selection

* **Single select:** right panel shows controls; Versions enabled.
* **Multi-select:** the right panel switches into **Batch style** mode (**roomType, stylePreset, decor, customPrompt**). Regenerate applies settings to all selected images. Versions UI is hidden in multi-select.

### Versions

* Dropdown shows last \~5 by `createdAt` with badges: **Active** ✅, **Original** 🔒, **Pinned** ⭐.
* “See all” opens modal grid with **Set active / Download / Pin** actions.

### Regenerate

* Build params from panel:

  ```ts
  { roomType, stylePreset, decor, customPrompt }
  ```
* Call:

  ```ts
  api.stagingJobs.createStagingJob({ projectId, imageIds: [active or selected], roomType, stylePreset, decor, customPrompt })
  ```
* Disable inputs; show “Regenerating…” states; show per-item progress via `getStagingJobProgress({ projectId })`.

### Approve

* `api.images.approveImage({ imageId })`
* **Also pin the active version:**
  `api.images.setImageVersionPinned({ versionId: currentVersionId, pinned: true })`
* Move image from **Staged → Approved**. Any subsequent regenerate on that image sets status back to **Staged**.

### Download

* **Single current:** prefer version-aware download
  `api.images.getImageVersionDownloadUrl({ versionId: activeVersionId })`
  *(or open `MLSExportDialog` even for single to keep one path)*
* **Batch / MLS-safe:** open **MLSExportDialog** with defaults above.

### Progress Source

* Use **one** canonical source:
  `api.stagingJobs.getStagingJobProgress({ projectId })` → per-image map `{ [imageId]: 0..1 }`.
  Aggregate to the bottom-bar progress and render per-thumbnail indicators in the left rail.

---

## Feedback & Error Handling

* Toasts: upload complete, staging started/completed, approve success, download link ready.
* Inline errors with retry actions (e.g., regenerate failed).
* Show per-thumbnail progress for batch operations.

---

## Keyboard Shortcuts

* `F` Fullscreen, `A` Approve, `R` Regenerate, `V` Versions, `←/→` navigate images, `Esc` close modals/exit fullscreen.

---

## Component Breakdown

* `src/components/workspace/LeftRail.tsx`: grouped thumbnails, selectable, counts, “Add images” invoking existing uploader.
* `src/components/workspace/CanvasToolbar.tsx`: Fullscreen, Zoom 100%, Fit, Before/After, Versions button.
* `src/components/workspace/BeforeAfterCanvas.tsx`: thin wrapper around existing `ImageComparisonSlider` with max-h and handle styling.
* `src/components/workspace/VersionsDropdown.tsx` and `VersionsModal.tsx`: list + gallery using versions APIs.
* `src/components/workspace/UpdateImagePanel.tsx`: room type `<Select>`, style preset `<Select>`, décor control, Advanced prompt `<Textarea>`; primary **Regenerate**.
* `src/components/workspace/BottomBar.tsx`: actions, progress, credits; opens `MLSExportDialog`.
* `src/app/projects/[projectId]/page.tsx`: replace tabbed dashboard with this workspace assembly.
* Optional reuse: `ImageDisplay`, `ImageComparisonSlider`, `MLSExportDialog`, `CreditStatus`.

---

## Step-by-Step Implementation Plan (7 steps)

1. **Skeleton and routing**
   Replace content of `src/app/projects/[projectId]/page.tsx` with workspace layout using existing `AuthenticatedNavbar` and container widths.
   Add local state: selected image IDs, active image ID, panel collapsed, fullscreen.

2. **Data wiring**
   Query `api.images.getProjectImages({ projectId })`; derive three buckets client-side.
   Query credits via `api.users.getCreditStatus()`.
   Subscribe to progress via `api.stagingJobs.getStagingJobProgress({ projectId })`; map per-image progress.

3. **Left rail**
   Build `LeftRail` with grouped lists and 2-col thumbnails; purple ring for selection; “Add images” opens existing uploader or inline file input using `generateImageUploadUrl` + `createImageRecord`.

4. **Center canvas + toolbar**
   Implement `CanvasToolbar` with buttons; wire Versions button to dropdown; “Before/After” toggles passing `stagedUrl` presence into `ImageComparisonSlider`.
   Add fullscreen mode that hides rails/panel; overlay toolbar with auto-hide; `Esc` exits.

5. **Versions UX**
   Create `VersionsDropdown` calling `listImageVersions(imageId)`; preview on hover (swap canvas temporarily), “See all” opens `VersionsModal`.
   In both, support **Set active** via `setCurrentImageVersion`, **Pin** via `setImageVersionPinned`, and **Download** via version-aware path.

6. **UpdateImagePanel and regeneration**
   Controls are local-only until **Regenerate**.
   On Regenerate: call `api.stagingJobs.createStagingJob({ projectId, imageIds: [active or selected], roomType, stylePreset, decor, customPrompt })`.
   Disable inputs and show busy labels; when versions update or job completes, re-enable; set new active via `setCurrentImageVersion` if needed.

7. **Bottom bar and download**
   Implement actions: Fullscreen (toggle), Regenerate (busy state tied to jobs), Approve (approve + pin), Download (opens `MLSExportDialog` with MLS defaults).
   Show credits left from `getCreditStatus`, and a single progress bar based on project-level progress.

---

## Acceptance Criteria (MVP)

1. User can upload photos, stage them, switch versions, approve (pins active), and download MLS-ready images **without leaving /projects**.
2. Versions dropdown + modal are functional and reflect the active version instantly.
3. Download modal defaults: **watermark ON**, **include original OFF**; supports dual export and ZIP for multi.
4. **Multi-select** triggers **Batch style** in the right panel and hides Versions.
5. All controls keyboard accessible; responsive and fullscreen behaviors match the brief.
6. Progress uses the canonical project-level source.

---

## Nice-to-Have (post-MVP)

* Undo/quick revert (shortcut to the previous version)
* Status chips on thumbnails; pinned badge in dropdown; hover preview in dropdown
* Drag-drop between status sections (Uploaded ↔︎ Staged ↔︎ Approved)
* Keyboard shortcut help panel (`?`)

---

## Final QA Checklist

* Can I apply a style to **N** selected photos at once (room, style, décor, prompt)?
* Does **room type** update correctly on regenerate / version switch?
* Are **approved** versions pinned and safe from accidental overwrite?
* Does **Versions** disable on multi-select and show hover preview on desktop?
* Does the **Download** path default to watermark ON and allow including the original?
* Are keyboard shortcuts (`F/A/R/V/←/→/Esc`) wired?
* Does the canvas maintain correct **aspect ratio** (Fit vs 100%) and support fullscreen?

---

**Deliverable:** a refactored **/projects** page implementing the layout and behaviors above, wired to existing server actions and `imageVersions`. Keep components modular and leverage existing UI patterns from the codebase.
