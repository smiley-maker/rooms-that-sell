import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service - RoomsThatSell',
  description: 'Terms of Service for RoomsThatSell virtual staging platform',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              RoomsThatSell
            </Link>
            <Link 
              href="/" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <p className="text-lg text-gray-600 mb-8">
            <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>

          <p className="text-gray-700 mb-8">
            Welcome to RoomsThatSell (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). These Terms of Service (&ldquo;Terms&rdquo;) govern your use of our virtual staging platform and services. By accessing or using our services, you agree to be bound by these Terms.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">1. Acceptance of Terms</h2>

          <p className="text-gray-700 mb-6">
            By creating an account, accessing our platform, or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use our services.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">2. Description of Service</h2>

          <p className="text-gray-700 mb-4">
            RoomsThatSell provides AI-powered virtual staging services for real estate professionals, including:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>AI-generated virtual staging of property images</li>
            <li>Batch processing capabilities for multiple images</li>
            <li>Style palette options and customization tools</li>
            <li>MLS-compliant export options and watermarks</li>
            <li>Project management and collaboration features</li>
            <li>Marketing material generation (flyers, social media content)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">3. User Accounts and Registration</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">3.1 Account Creation</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>You must provide accurate, complete, and current information when creating an account</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            <li>You must be at least 18 years old to create an account</li>
            <li>One person or entity may not maintain multiple accounts</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">3.2 Account Responsibilities</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>You are responsible for all activities that occur under your account</li>
            <li>You must notify us immediately of any unauthorized use of your account</li>
            <li>You may not share your account credentials with others</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">4. Acceptable Use Policy</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">4.1 Permitted Uses</h3>
          <p className="text-gray-700 mb-4">
            You may use our services for legitimate real estate marketing purposes, including:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>Creating virtual staging for property listings</li>
            <li>Generating marketing materials for real estate transactions</li>
            <li>Professional real estate business activities</li>
            <li>Educational and training purposes related to real estate</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">4.2 Prohibited Uses</h3>
          <p className="text-gray-700 mb-4">
            You may not use our services for:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>Illegal activities or violation of any laws or regulations</li>
            <li>Uploading content that infringes on intellectual property rights</li>
            <li>Attempting to reverse engineer or compromise our platform security</li>
            <li>Spam, harassment, or abusive behavior</li>
            <li>Commercial use outside of real estate marketing without permission</li>
            <li>Uploading malicious software or harmful content</li>
            <li>Violating MLS rules or real estate regulations</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">5. Content and Intellectual Property</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">5.1 Your Content</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>You retain ownership of your original property images and content</li>
            <li>You grant us a license to process your content for service delivery</li>
            <li>You are responsible for ensuring you have rights to upload and process your content</li>
            <li>You must not upload content that violates third-party rights</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">5.2 Generated Content</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>AI-generated staged images are provided to you for professional use</li>
            <li>You may use staged images for real estate marketing purposes</li>
            <li>Generated content must comply with MLS and local real estate regulations</li>
            <li>We retain rights to our AI models, algorithms, and platform technology</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">5.3 Platform Content</h3>
          <p className="text-gray-700 mb-6">
            All platform features, designs, trademarks, and technology are owned by RoomsThatSell and protected by intellectual property laws. You may not copy, modify, or distribute our platform content without permission.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">6. MLS Compliance and Professional Standards</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">6.1 MLS Requirements</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>You are responsible for ensuring compliance with local MLS rules and regulations</li>
            <li>Use our compliance features (watermarks, dual exports) as required by your MLS</li>
            <li>Disclose virtual staging when required by MLS or local regulations</li>
            <li>Follow all applicable real estate advertising laws and guidelines</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">6.2 Professional Responsibility</h3>
          <p className="text-gray-700 mb-6">
            As a real estate professional, you are responsible for ensuring that all staged images and marketing materials comply with applicable laws, regulations, and professional standards in your jurisdiction.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">7. Billing and Payment Terms</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">7.1 Subscription Plans</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li><strong>Agent Plan:</strong> $29/month for 100 images</li>
            <li><strong>Pro Plan:</strong> $49/month for 300 images + flyers + 3 seats</li>
            <li><strong>Business Plan:</strong> $129/month for 800 images + 10 seats + brand assets</li>
            <li><strong>Pay-as-you-go:</strong> 30 credits for $15 (non-expiring)</li>
            <li><strong>Annual billing:</strong> 2 months free</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">7.2 Payment Terms</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>Subscriptions are billed in advance on a monthly or annual basis</li>
            <li>Payments are processed through Stripe and are non-refundable</li>
            <li>Unused credits do not roll over to the next billing period</li>
            <li>We may change pricing with 30 days&apos; notice to existing subscribers</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">7.3 Free Trial</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>New users receive 10 free credits to try our service</li>
            <li>No credit card required for free trial</li>
            <li>Free credits expire after 30 days if unused</li>
            <li>One free trial per user/email address</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">8. Service Availability and Limitations</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">8.1 Service Availability</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>We strive to maintain high service availability but cannot guarantee 100% uptime</li>
            <li>We may perform maintenance that temporarily affects service availability</li>
            <li>We reserve the right to modify or discontinue features with reasonable notice</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">8.2 Processing Limitations</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>Image processing times may vary based on complexity and system load</li>
            <li>Large batch uploads may take longer to process</li>
            <li>We may implement usage limits to ensure fair access for all users</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">9. Termination</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">9.1 Termination by You</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>You may cancel your subscription at any time through your account settings</li>
            <li>Cancellation takes effect at the end of your current billing period</li>
            <li>You retain access to your account and data until the end of your billing period</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">9.2 Termination by Us</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>We may suspend or terminate your account for violation of these Terms</li>
            <li>We may terminate service with 30 days&apos; notice for business reasons</li>
            <li>We reserve the right to immediately suspend accounts for serious violations</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">9.3 Effect of Termination</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>Upon termination, your right to use the service ceases immediately</li>
            <li>We will retain your data for 30 days after termination for backup purposes</li>
            <li>You may request data export before termination</li>
            <li>No refunds are provided for unused credits or subscription time</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">10. Disclaimers and Limitations of Liability</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">10.1 Service Disclaimers</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>Our services are provided &ldquo;as is&rdquo; without warranties of any kind</li>
            <li>We do not guarantee specific results from virtual staging</li>
            <li>AI-generated content may not always meet your expectations</li>
            <li>You are responsible for reviewing and approving all staged images</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">10.2 Limitation of Liability</h3>
          <p className="text-gray-700 mb-6">
            To the maximum extent permitted by law, RoomsThatSell shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising from your use of our services.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">11. Indemnification</h2>

          <p className="text-gray-700 mb-6">
            You agree to indemnify and hold harmless RoomsThatSell, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorney fees) arising from your use of our services, violation of these Terms, or infringement of any third-party rights.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">12. Governing Law and Disputes</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">12.1 Governing Law</h3>
          <p className="text-gray-700 mb-4">
            These Terms are governed by the laws of [State/Country], without regard to conflict of law principles.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">12.2 Dispute Resolution</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>We encourage resolving disputes through direct communication first</li>
            <li>Any legal disputes will be resolved through binding arbitration</li>
            <li>You waive the right to participate in class action lawsuits</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">13. Changes to Terms</h2>

          <p className="text-gray-700 mb-6">
            We may update these Terms from time to time. We will notify you of material changes by email or through our platform. Your continued use of our services after such changes constitutes acceptance of the updated Terms. If you do not agree to the changes, you must stop using our services.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">14. Contact Information</h2>

          <p className="text-gray-700 mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <ul className="text-gray-700 space-y-2">
              <li><strong>Email:</strong> <a href="mailto:legal@roomsthatsell.com" className="text-blue-600 hover:text-blue-800">legal@roomsthatsell.com</a></li>
              <li><strong>Support:</strong> <a href="mailto:support@roomsthatsell.com" className="text-blue-600 hover:text-blue-800">support@roomsthatsell.com</a></li>
              <li><strong>Address:</strong> RoomsThatSell Legal Team</li>
            </ul>
          </div>

          <p className="text-gray-700 mb-8">
            These Terms of Service constitute the entire agreement between you and RoomsThatSell regarding your use of our services.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} RoomsThatSell. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <a href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
