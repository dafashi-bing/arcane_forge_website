import Link from "next/link";

export default function AIServicesIntro() {
  return (
    <section className="py-16 border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30" aria-labelledby="ai-services-intro">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-sm font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400 mb-4">AI Services for Game Studios</p>
          <h2 id="ai-services-intro" className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">AI services built for your game.</h2>
        </div>
        <div>
          <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300 mb-6">NPC dialogue, dialogue-generated buffs, stories, and other scoped gameplay capabilities. We build and tune the solution with your studio, then deliver the agreed code, integration, or service.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/ai-services" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:underline underline-offset-4">Explore AI Services <span className="ml-2" aria-hidden="true">→</span></Link>
            <Link href="/contact" className="font-semibold text-gray-900 dark:text-white hover:underline underline-offset-4">Discuss your project</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
