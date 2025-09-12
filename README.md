# RoomsThatSell

**MLS-compliant virtual staging for real estate agents and brokerages**

Transform empty rooms into beautifully staged spaces with AI-powered virtual staging that's fast, realistic, and built specifically for real estate professionals.

## 🏠 What is RoomsThatSell?

RoomsThatSell is a professional virtual staging platform that helps real estate agents market properties more effectively. Instead of expensive physical staging ($500–$5,000+ per listing), our AI-powered tool creates realistic staged photos in minutes.

### The Problem We Solve

- **Empty rooms fail to capture buyers' imaginations** - Buyers struggle to visualize potential
- **Physical staging is expensive** - $500–$5,000+ per listing, often not cost-effective
- **Existing tools are inadequate** - Clunky, slow, inconsistent, or non-MLS compliant
- **Time-consuming process** - Traditional staging takes weeks to coordinate

### Our Solution

**MLS-compliant, fast, realistic, and cost-effective virtual staging** with features that scale for both solo agents and brokerages.

## ✨ Key Features

### 🛡️ MLS Compliance by Design
- **100% MLS compliant** - Never alters walls, windows, floors, or structural elements
- **Furniture-only edits** - AI only adds furniture and decor, never structural changes
- **Automatic watermarking** - "Virtually Staged" watermarks on all images
- **Dual export** - Get both staged and original empty photos for MLS requirements

### 🚀 Batch Processing
- **Upload entire listings** - Process multiple rooms at once with consistent styling
- **Style palettes** - Use presets (Minimal, Scandi, Bohemian) or custom prompts
- **Consistent results** - Apply the same style across all images in a project
- **Time-efficient** - Stage an entire listing in minutes, not weeks

### 🎨 AI-Powered Staging
- **Powered by Gemini 2.5 Flash** - Advanced AI for realistic, high-quality results
- **Multiple room types** - Living rooms, bedrooms, kitchens, home offices, and more
- **Style consistency** - Maintain brand consistency across all staged images
- **Before/after comparison** - Interactive sliders to showcase transformations

### 📊 Professional Tools
- **Project-based workflow** - Each listing gets its own organized project space
- **Review & refine** - Approve or regenerate specific images before export
- **High-resolution exports** - MLS-ready sizes and formats
- **Team collaboration** - Built for individual agents and brokerages

## 💰 Pricing

### Agent Plan
- **$29/month** → 100 images (≈ $0.29/image)
- Perfect for individual agents with 1-4 listings per month

### Pro Plan  
- **$49/month** → 300 images (≈ $0.16/image)
- Includes flyers, social media templates, and 3 team seats

### Business Plan
- **$129/month** → 800 images (≈ $0.16/image)
- Includes 10 team seats, shared brand assets, and usage reporting

### Additional Options
- **Annual billing**: 2 months free
- **Pay-as-you-go**: 30 credits for $15 (non-expiring)
- **Free trial**: 10 free credits, no card required

## 🎯 Target Audience

### Primary Users
- **Individual Real Estate Agents** - 1-4 listings/month, need affordable staging
- **Top Producers** - 5-10+ listings/month, need premium quality and brand consistency
- **Brokerage Marketing Directors** - Manage 30+ listings, prioritize brand control and compliance

### Use Cases
- **New listings** - Stage empty properties before going to market
- **Price improvements** - Re-stage properties that aren't selling
- **Virtual showings** - Create compelling virtual tour content
- **Marketing materials** - Generate flyers and social media content

## 🛠️ Technical Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript (strict mode)
- **TailwindCSS** + shadcn/ui components
- **Framer Motion** for animations

### Backend & Infrastructure
- **Convex** - Real-time database and backend functions
- **Clerk** - Authentication and user management
- **Cloudflare R2** - Image storage with signed URLs
- **Vercel** - Hosting and deployment

### AI & Processing
- **Gemini 2.5 Flash Image** - AI model for virtual staging
- **Server-side processing** - All AI calls handled securely on the backend

### Payments & Analytics
- **Stripe** - Payment processing for subscriptions and credits
- **Vercel Analytics** - Performance and usage tracking

## 🚀 Getting Started

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/rooms-that-sell.git
   cd rooms-that-sell
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your API keys and configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler
- `npm run test` - Run tests with Vitest
- `npm run test:ci` - Run tests with coverage for CI

## 🧪 Testing

The project uses comprehensive testing strategies:

- **Unit tests** - Vitest + jsdom for pure logic
- **Integration tests** - API and database interactions
- **E2E tests** - Playwright for critical user flows
- **Visual regression** - Playwright snapshots for UI components

## 📈 Success Metrics

- **Time-to-first-value**: <10 minutes from signup to first staged image
- **Activation rate**: >40% of trial users use all 10 credits
- **Trial-to-paid conversion**: >5%
- **Monthly churn**: <5%
- **Feature adoption**: Flyers/social templates usage

## 🏆 Key Differentiators

- **MLS Compliance baked in** - Watermarks, dual export, furniture-only edits
- **Style Consistency** - Palettes ensure brand consistency across listings
- **Batch Processing** - Handle entire listings efficiently
- **Team & Branding Tools** - Built for brokerages and teams
- **Superior Economics** - $0.16–$0.29/image vs $0.22–$0.95 for competitors

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on how to submit pull requests, report issues, and suggest features.

## 📞 Support

For support, email us at support@roomsthatsell.com or join our community Discord.

---

**Built for real estate professionals, by real estate professionals.** 🏡✨