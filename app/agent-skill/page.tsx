import type { Metadata } from "next";
import Link from "next/link";
import Header from "components/Header";
import Footer from "components/Footer";

export const metadata: Metadata = {
  title: "Agent Skill Setup | Arcane Forge",
  description: "Set up the Arcane Forge game-agent skill in Codex, or use its portable instructions and helpers with your coding-agent workflow.",
  alternates: { canonical: "https://arcaneforge.ai/agent-skill" },
};

export default function AgentSkillPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <Header />
      <main className="flex-grow pt-36 pb-24 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400 mb-5">Arcane Forge · External Agents</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-7">Bring your coding agent.</h1>
          <p className="text-xl leading-relaxed text-gray-600 dark:text-gray-300 mb-8">The Arcane Forge game-agent skill connects an external agent’s planning and local code work with Arcane Forge projects and asset generation. Keep working in your game’s workspace, with the agent using the skill’s instructions and helpers.</p>
          <div className="flex flex-wrap gap-5 mb-14">
            <a className="font-semibold text-blue-600 dark:text-blue-400 hover:underline" href="https://github.com/arcane-forge-ai/arcane-forge-agent-kit" target="_blank" rel="noopener noreferrer">View the public agent kit ↗</a>
            <a className="font-semibold text-blue-600 dark:text-blue-400 hover:underline" href="https://github.com/arcane-forge-ai/arcane-forge-agent-kit/blob/main/skills/arcane-forge-game-agent/SKILL.md" target="_blank" rel="noopener noreferrer">Read the skill instructions ↗</a>
          </div>

          <section aria-labelledby="codex-setup" className="rounded-3xl border border-gray-200 dark:border-gray-800 p-7 md:p-10 bg-gray-50 dark:bg-gray-900/40">
            <h2 id="codex-setup" className="text-3xl font-bold text-gray-900 dark:text-white mb-5">Set up in Codex</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">You’ll need Git, Python 3, Make, and Codex. Clone the public kit, then run its supplied installer:</p>
            <pre className="p-5 rounded-xl bg-gray-950 text-gray-100 overflow-x-auto text-sm leading-7 border border-gray-800"><code>{`git clone https://github.com/arcane-forge-ai/arcane-forge-agent-kit.git
cd arcane-forge-agent-kit
make install-skill`}</code></pre>
            <ol className="list-decimal pl-6 mt-7 space-y-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              <li>Reload or restart Codex so it can discover the installed skill.</li>
              <li>Open your game workspace and ask Codex to use <code className="text-base text-blue-600 dark:text-blue-300">arcane-forge-game-agent</code>.</li>
              <li>Follow the skill’s configuration and sign-in flow, then describe what you want to build.</li>
            </ol>
            <p className="mt-7 text-sm leading-relaxed text-gray-500 dark:text-gray-400">The installer copies the skill into your Codex skills directory. If you use a custom CODEX_HOME, the installer respects it. The public kit’s instructions describe its available capabilities and prerequisites.</p>
          </section>

          <section aria-labelledby="other-agents" className="py-12 border-b border-gray-200 dark:border-gray-800">
            <h2 id="other-agents" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Claude Code and OpenCode workflows</h2>
            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300 mb-5">The kit includes portable instructions and Python helpers that can also be used in Claude Code and OpenCode workflows. The installer above targets Codex; use the public kit’s instructions to adapt the setup for your agent.</p>
            <Link href="/contact" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Discuss your workflow and get setup help →</Link>
          </section>

          <section aria-labelledby="studio-path" className="pt-12">
            <h2 id="studio-path" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Prefer a guided workspace?</h2>
            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300 mb-6">Arcane Forge Studio remains available for teams who prefer its workspace and guided workflows, including the embedded agent. Choose the workflow that fits your team.</p>
            <a href="https://app.arcaneforge.ai/" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full px-7 py-3 font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-80">Try Web Version (Beta)</a>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
