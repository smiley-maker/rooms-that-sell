# Product Requirements Document (PRD) – RoomsThatSell.com

## 1. Problem Statement
Real estate agents need to market properties effectively, but empty rooms fail to capture buyers' imaginations. Physical staging is expensive ($500–$5,000+ per listing), time-consuming, and logistically complex. Existing digital staging tools are often clunky, slow, inconsistent, or non-compliant with MLS rules.

**Opportunity:** A tool that delivers MLS-compliant, fast, realistic, and cost-effective virtual staging with features that scale for both solo agents and brokerages.

---

## 2. Target Audience & User Personas
### 2.1. Primary Audience
- **Real Estate Agents** (individuals, top producers, small teams)

### 2.2. Secondary Audience
- **Brokerages** (office managers, marketing directors)

### 2.3. User Personas
- **Sarah – Individual Agent**
  - 1–4 listings/month, needs affordable staging, time-efficient, MLS-safe.
- **David – Top Producer**
  - 5–10+ listings/month, needs premium quality, brand consistency, team tools.
- **Brokerage Marketing Director**
  - Manages 30+ listings, prioritizes brand control, MLS compliance, usage reporting.

---

## 3. Features & Functionality

### 3.1. Core MVP Features (all tiers)
- **Project-Based Workflow**: Each listing has its own project space.
- **Batch Image Processing**: Upload an entire folder, process in bulk. Or after upload, select certain images (or all) and process together with consistent styling (based on preset, prompt, or saved brand interior design style).
- **Style Palettes**: Use presets (Minimal, Scandi, Bohemian, etc.) or custom prompts for consistency.
- **AI Staging**: Powered by Gemini 2.5 Flash (Nano Banana), optimized to preserve structure while adding realistic furniture and décor.
- **Review & Refine**: Before/after slider, approve or regenerate specific images. Listing kanban board for teams to indicate progress on staging. 
- **Export Options**: MLS-ready sizes, high-res downloads, optional dual export (empty + staged).
- **MLS Compliance Tools**:
  - Auto watermark toggle (“Virtually Staged”).
  - Compliance mode (furniture only, no structural edits).
  - Dual export of staged + empty photos.
Gr
### 3.2. Premium Features (Pro & Business)
- **Flyer & Social Media Generator**: Drag staged images into brandable templates (flyers, Instagram posts, FB banners).
- **Team Accounts**: Manage multiple user seats, centralized billing.
- **Shared Brand Assets (Business)**: Brokerage logo + colors applied to templates.
- **Usage Reporting**: Track credit usage per team member.

### 3.3. Future Roadmap (post-MVP)
- AI decluttering & object removal.
- Lighting/sky replacements.
- Video walkthrough generation.
- “What If” design tool (paint colors, flooring, etc.).

---

## 4. Technical Stack
- **Frontend**: Next.js (React), TypeScript, Tailwind + Shadcn/ui.
- **Backend**: Convex + Clerk (auth, database), Cloudflare R2 for image storage.
- **AI Model**: Gemini 2.5 Flash Image (Nano Banana).
- **Payments**: Stripe.
- **Hosting**: Vercel.

---

## 5. Pricing & Monetization
- **Agent Plan** – $29/month → 100 images (≈ $0.29/img).
- **Pro Plan** – $49/month → 300 images (≈ $0.16/img). Includes flyers + 3 seats.
- **Business Plan** – $129/month → 800 images (≈ $0.16/img). Includes 10 seats + brand assets.
- **Annual Billing**: 2 months free.
- **Pay-as-you-go**: 30 credits for $15 (non-expiring).
- **Free Trial**: 10 free credits, no card required.

**Margins**: Gemini API cost ≈ $0.039/image → 76–87% gross margin per plan.

---

## 6. Success Metrics
- **Activation Rate**: >40% of trial users use all 10 credits.
- **Trial-to-Paid Conversion**: >5%.
- **MRR Growth**.
- **Churn**: <5% monthly.
- **Feature Adoption**: Flyers/social templates usage.
- **Time-to-First-Value**: <10 minutes from signup → first staged image.

---

## 7. Launch & Go-to-Market Strategy

### 7.1. Pre-Launch
- **Landing Page + Waitlist**: Show before/after sliders, emphasize MLS compliance, cost savings, and speed. Collect emails.
- **Beta Outreach**: DM real estate agents on Instagram/LinkedIn with sample transformations. Offer free credits for feedback.
- **Case Studies**: Build 2–3 strong before/after sets to use in marketing.

### 7.2. Launch
- **Free Trial Onboarding**: 10 free images to showcase instant value.
- **Social Proof**: Share testimonials, run Facebook/Instagram ads targeting real estate agents.
- **Content Marketing**: “How to Stay MLS-Compliant with Virtual Staging,” “Empty vs Staged: Case Studies.”

### 7.3. Post-Launch Growth
- **Referral Program**: Give extra credits for inviting another agent.
- **Partnerships**: Collaborate with real estate coaches, YouTubers, and brokerages.
- **Enterprise Conversations**: Position Business plan for brokerages needing compliance + brand consistency.

---

## 8. Key Differentiators vs Competitors
- **MLS Compliance baked in** (watermarks, dual export, furniture-only edits).
- **Style Consistency** with palettes.
- **Batch Processing** for entire listings.
- **Team & Branding Tools** for brokerages.
- **Superior Economics** ($0.16–$0.29/image vs $0.22–$0.95 for Collov & VirtualStagingAI; $7–$24 for service-style tools).

