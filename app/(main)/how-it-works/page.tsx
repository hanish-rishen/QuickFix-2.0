import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HowItWorks() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            How QuickFix Works
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Our platform connects you with skilled repairers and uses advanced technology to ensure quality repairs.
          </p>
        </div>

        {/* Process Steps */}
        <div className="space-y-20 md:space-y-32">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="md:w-1/2 relative">
              <div className="bg-blue-100 dark:bg-blue-900/20 absolute -top-4 -left-4 w-full h-full rounded-lg"></div>
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/4224305/pexels-photo-4224305.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Person taking a photo of a broken item"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white w-10 h-10 flex items-center justify-center rounded-full font-bold text-xl shadow-lg">
                1
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Submit Your Repair Request
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Take photos of the item that needs repair and describe the issue. The more detailed your description, the better our AI can analyze the problem.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Upload multiple photos from different angles</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Describe when and how the item was damaged</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Choose the appropriate category for accurate matching</span>
                </li>
              </ul>
              <Button asChild>
                <Link href="/repair-request">
                  Submit a Repair Request
                </Link>
              </Button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-16">
            <div className="md:w-1/2 relative">
              <div className="bg-yellow-100 dark:bg-yellow-900/20 absolute -top-4 -right-4 w-full h-full rounded-lg"></div>
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/8294628/pexels-photo-8294628.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="AI analyzing data"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-yellow-500 text-white w-10 h-10 flex items-center justify-center rounded-full font-bold text-xl shadow-lg">
                2
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Get AI Diagnostics
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Our advanced Gemini AI analyzes your photos and description to provide a detailed diagnostic report, estimating the complexity, cost, and time required for the repair.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Receive an accurate diagnosis of the issue</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Get estimated repair costs and timeframes</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>View a list of potentially needed parts or materials</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="md:w-1/2 relative">
              <div className="bg-green-100 dark:bg-green-900/20 absolute -top-4 -left-4 w-full h-full rounded-lg"></div>
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/8297415/pexels-photo-8297415.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Map showing location"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-green-500 text-white w-10 h-10 flex items-center justify-center rounded-full font-bold text-xl shadow-lg">
                3
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Connect with Skilled Repairers
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Based on your location and the diagnostic report, we match you with qualified repairers in your area who specialize in your specific issue.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>View profiles, skills, and ratings of nearby repairers</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Receive repair offers with exact pricing</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Choose the repairer who best meets your needs</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-16">
            <div className="md:w-1/2 relative">
              <div className="bg-purple-100 dark:bg-purple-900/20 absolute -top-4 -right-4 w-full h-full rounded-lg"></div>
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/3756678/pexels-photo-3756678.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Secure payment"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-purple-500 text-white w-10 h-10 flex items-center justify-center rounded-full font-bold text-xl shadow-lg">
                4
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Verified Repairs & Secure Payment
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                After your item is repaired, our AI verifies the quality of the repair. You only pay when you're completely satisfied with the results.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI verification ensures quality repairs</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Secure payments through Stripe</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Rate your experience and help others find good repairers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                How much does it cost to use QuickFix?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                The QuickFix platform is free to use. You only pay for the actual repair service after it's been completed and verified. We add a small service fee to the final repair cost.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                What types of items can I get repaired?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                QuickFix supports repairs for a wide range of items including electronics, appliances, furniture, clothing, jewelry, and more. If you're unsure, you can always submit a request and our system will let you know if we can find a suitable repairer.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                How do you ensure the quality of repairs?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We have a three-tier quality assurance system: 1) We verify the skills and experience of all repairers on our platform, 2) Our AI analyzes photos of the completed repair to verify quality, and 3) You have final approval before payment is released.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                How long does a typical repair take?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Repair times vary depending on the item and the complexity of the issue. After your diagnostic report is generated, you'll receive an estimated timeframe. Most small repairs can be completed within 1-3 days, while more complex repairs might take longer.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                What if I'm not satisfied with the repair?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                If you're not satisfied with the repair, you can request a revision from the repairer. If the issue can't be resolved, our customer support team will help mediate the situation. In some cases, you may be eligible for our satisfaction guarantee policy.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to get your items fixed?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have used QuickFix to find reliable repair services.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/repair-request">
                Submit a Repair Request
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/signup">
                Create an Account
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}