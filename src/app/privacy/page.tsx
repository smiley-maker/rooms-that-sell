import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - RoomsThatSell',
  description: 'Privacy Policy for RoomsThatSell virtual staging platform',
};

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <p className="text-lg text-gray-600 mb-8">
            <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>

          <p className="text-gray-700 mb-8">
            At RoomsThatSell (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our virtual staging platform and services.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">1. Information We Collect</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">1.1 Personal Information</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li><strong>Account Information:</strong> Name, email address, phone number, and billing information when you create an account</li>
            <li><strong>Profile Information:</strong> Professional information such as real estate license details, brokerage affiliation, and preferences</li>
            <li><strong>Communication Data:</strong> Messages, support requests, and feedback you provide to us</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">1.2 Property Images and Data</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li><strong>Property Images:</strong> Photos of rooms and properties you upload for virtual staging</li>
            <li><strong>Staged Images:</strong> AI-generated staged versions of your property images</li>
            <li><strong>Project Data:</strong> Property details, room types, style preferences, and staging specifications</li>
            <li><strong>Usage Data:</strong> Information about how you use our platform, including features accessed and processing history</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">1.3 Technical Information</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
            <li><strong>Usage Analytics:</strong> Pages visited, time spent on platform, and interaction patterns</li>
            <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies to enhance your experience</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">2. How We Use Your Information</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">2.1 Service Provision</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>Process and stage your property images using AI technology</li>
            <li>Provide access to our virtual staging platform and tools</li>
            <li>Generate MLS-compliant staged images and exports</li>
            <li>Manage your account, billing, and subscription services</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">2.2 Communication and Support</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>Respond to your inquiries and provide customer support</li>
            <li>Send important updates about your account or our services</li>
            <li>Share product updates, new features, and educational content</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">2.3 Platform Improvement</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>Analyze usage patterns to improve our platform and services</li>
            <li>Develop new features and enhance existing functionality</li>
            <li>Ensure platform security and prevent fraud</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">3. Information Storage and Security</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">3.1 Secure Cloud Storage</h3>
          <p className="text-gray-700 mb-4">
            Your property images and staged outputs are stored securely using Cloudflare R2, a leading cloud storage platform. All data is encrypted both in transit and at rest using industry-standard encryption protocols.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">3.2 Data Retention</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li><strong>Property Images:</strong> Retained for the duration of your account plus 30 days for backup purposes</li>
            <li><strong>Account Data:</strong> Retained while your account is active and for up to 7 years for legal compliance</li>
            <li><strong>Usage Analytics:</strong> Aggregated data may be retained indefinitely for platform improvement</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">3.3 Security Measures</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>Multi-factor authentication for account access</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and employee training on data protection</li>
            <li>Incident response procedures for any security breaches</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">4. Information Sharing and Disclosure</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">4.1 Third-Party Service Providers</h3>
          <p className="text-gray-700 mb-4">
            We work with trusted third-party providers to deliver our services:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li><strong>Convex:</strong> Database and backend services for account management and platform functionality</li>
            <li><strong>Clerk:</strong> Authentication and user management services</li>
            <li><strong>Cloudflare R2:</strong> Secure cloud storage for your images and data</li>
            <li><strong>Google Gemini:</strong> AI processing for virtual staging generation</li>
            <li><strong>Stripe:</strong> Payment processing and billing management</li>
            <li><strong>Vercel:</strong> Hosting and content delivery services</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">4.2 Legal Requirements</h3>
          <p className="text-gray-700 mb-4">
            We may disclose your information when required by law, court order, or to:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>Comply with legal obligations or government requests</li>
            <li>Protect our rights, property, or safety</li>
            <li>Prevent fraud or illegal activities</li>
            <li>Respond to legal proceedings</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">4.3 Business Transfers</h3>
          <p className="text-gray-700 mb-6">
            In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction, with appropriate safeguards to maintain privacy protection.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">5. Your Rights and Choices</h2>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">5.1 Access and Control</h3>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li><strong>Account Access:</strong> View and update your account information at any time</li>
            <li><strong>Data Export:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Data Deletion:</strong> Request deletion of your account and associated data</li>
            <li><strong>Communication Preferences:</strong> Opt out of marketing communications while maintaining essential service communications</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">5.2 Image Rights</h3>
          <p className="text-gray-700 mb-4">
            You retain all rights to your original property images. Staged images generated by our AI are provided to you for your professional use in real estate marketing, subject to MLS compliance requirements.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">6. MLS Compliance and Professional Use</h2>

          <p className="text-gray-700 mb-4">
            Our platform is designed to help real estate professionals maintain MLS compliance:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li>Automatic watermarking options for staged images</li>
            <li>Compliance mode that restricts edits to furniture and décor only</li>
            <li>Dual export capabilities for both empty and staged images</li>
            <li>Clear labeling of virtually staged content</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">7. Children&apos;s Privacy</h2>

          <p className="text-gray-700 mb-6">
            Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected such information, we will take steps to delete it promptly.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">8. International Data Transfers</h2>

          <p className="text-gray-700 mb-6">
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable privacy laws and this policy.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">9. Changes to This Privacy Policy</h2>

          <p className="text-gray-700 mb-6">
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the updated policy on our website and updating the &ldquo;Last updated&rdquo; date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">10. Contact Us</h2>

          <p className="text-gray-700 mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <ul className="text-gray-700 space-y-2">
              <li><strong>Email:</strong> <a href="mailto:privacy@roomsthatsell.com" className="text-blue-600 hover:text-blue-800">privacy@roomsthatsell.com</a></li>
              <li><strong>Support:</strong> <a href="mailto:support@roomsthatsell.com" className="text-blue-600 hover:text-blue-800">support@roomsthatsell.com</a></li>
              <li><strong>Address:</strong> RoomsThatSell Privacy Team</li>
            </ul>
          </div>

          <p className="text-gray-700 mb-8">
            We are committed to addressing your privacy concerns promptly and transparently.
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
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
