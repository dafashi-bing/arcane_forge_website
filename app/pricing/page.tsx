import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Pricing from "@/components/Pricing";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Simple, <span className="text-blue-600 dark:text-blue-400">Transparent</span> Pricing
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-light">
              Choose the plan that fits your studio's needs. All plans include access to our AI tools and game intelligence hub.
            </p>
          </div>
          
          <Suspense fallback={
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          }>
            <Pricing />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

