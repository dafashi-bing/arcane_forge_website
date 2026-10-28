import type { Metadata } from "next";
import Header from "components/Header";
import Footer from "components/Footer";
import ServicesGallery from "components/ai-services/ServicesGallery";
import "./services.css";

export const metadata: Metadata = {
  title: "AI Services for Game Studios | Arcane Forge",
  description: "Custom AI services for games: NPC dialogue, dialogue-generated buffs, stories, and progression. Built with your studio and delivered as the agreed code, integration, or service.",
  alternates: { canonical: "https://arcaneforge.ai/ai-services" },
};

export default function AIServicesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <Header />
      <main id="main" className="ai-services flex-grow pt-24">
        <a className="skip-link" href="#hero-title">Skip to content</a>

    <section className="hero section-shell" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">CUSTOM AI SERVICES FOR GAME STUDIOS</p>
        <h1 id="hero-title">AI services<br />built for<br /><em>your game.</em></h1>
        <p className="hero-description">We build custom AI for NPC conversations, dialogue-generated buffs, storylines, and other gameplay features. Bring your game, a rough idea, or a detailed design. We learn what you need, build and tune the solution with your team, and deliver it in the form that fits your game.</p>
        <div className="hero-actions"><a className="button button-primary" href="#work">Explore the possibilities <span aria-hidden="true">↓</span></a><a className="text-link" href="#contact">Tell us about your game <span aria-hidden="true">↗</span></a></div>
      </div>
      <div className="hero-proof">
        <video className="hero-video" id="hero-video" controls autoPlay muted loop playsInline preload="metadata" poster="/ai-services/assets/npc-buff-sandbox-poster.webp" width="2134" height="1440" aria-label="NPC dialogue and AI Buff sandbox demonstration"><source src="/ai-services/assets/npc-buff-sandbox-demo.mp4" type="video/mp4" /><a href="/ai-services/assets/npc-buff-sandbox-demo.mp4">Watch the NPC dialogue and AI Buff sandbox.</a></video>
        <div className="proof-caption"><div><strong>NPC dialogue &amp; AI Buff sandbox.</strong><p>From conversations to generated gameplay effects.</p></div></div>
      </div>
    </section>

    <section className="principle-band service-flow" id="approach" aria-labelledby="approach-title"><div className="section-shell">
      <div className="service-flow-heading"><p className="eyebrow">WORKING WITH ARCANE FORGE</p><h2 id="approach-title">Your game.<br />The right AI solution.</h2></div>
      <div className="proof-workflow-steps service-flow-steps">
        <article><span className="tiny-label">01 / INTRODUCE</span><h3>Introduce<br />your game.</h3><p>Share your game or demo, a rough idea, or a detailed design. We play or review it, learn what you need, and propose the AI scope and delivery.</p></article>
        <article><span className="tiny-label">02 / BUILD &amp; SHAPE</span><h3>Build and shape<br />it together.</h3><p>We build the agreed solution and interfaces alongside a private sandbox that mirrors the relevant game logic. Your team reviews the experience and shapes it through the chosen prompt and configuration controls.</p></article>
        <article><span className="tiny-label">03 / SHIP</span><h3>Ship it<br />your way.</h3><p>After your approval, we deliver what your team needs: embedded code, an in-game component or development handoff, an online service in your cloud, or an Arcane Forge-managed service.</p></article>
      </div>
    </div></section>

    <section className="proof-workflow section-shell native-method" aria-labelledby="proof-workflow-title"><div className="proof-workflow-heading"><p className="eyebrow">THE ARCANE FORGE ADVANTAGE</p><h2 id="proof-workflow-title">More than<br /><em>the AI capability.</em></h2></div><div className="proof-workflow-steps"><article><span className="tiny-label">01 / TRY AI</span><h3>Try it before<br />you integrate it.</h3><p>A private sandbox mirrors the relevant game logic, so your team can review the look, feel, and behavior before it goes into the game.</p></article><article><span className="tiny-label">02 / TUNE BEHAVIOR</span><h3>Give designers<br />real control.</h3><p>We agree the prompt and configuration controls for your feature. Designers and writers can refine the behavior during review and keep tuning after handoff.</p></article><article><span className="tiny-label">03 / SIMULATE &amp; REVIEW</span><h3>Review behavior<br />across runs.</h3><p>Headless simulations and reports help your team review choices, generated content, outcomes, and rule checks across many scenarios.</p></article></div></section>

    <section className="work-section section-shell" id="work" aria-labelledby="work-title">
      <div className="section-heading"><div><p className="eyebrow">EXAMPLES OF WHAT WE BUILD</p><h2 id="work-title">Custom capabilities.<br />Built around the game.</h2></div><p className="section-intro">Examples of AI-backed dialogue, storylines, and progression, shown through screenshots of the solutions and their evaluation tools.</p></div>
      <ServicesGallery />
    </section>

    <section className="trace-section section-shell" id="insight" aria-labelledby="trace-title">
      <div className="section-heading"><div><p className="eyebrow">TRACING &amp; ANALYTICS</p><h2 id="trace-title">Understand what<br /><em>the AI is doing.</em></h2></div><p className="section-intro">We can build tracing and analytics around your game, so your team can follow AI behavior and decide what to tune. Events, metrics, review rules, and dashboard views are tailored to your game and your team.</p></div>
      <ServicesGallery analytics />
    </section>

    <section className="delivery-section section-shell" id="delivery" aria-labelledby="delivery-title">
      <div className="delivery-lead"><p className="eyebrow">BUILT AROUND YOUR TEAM</p><h2 id="delivery-title">The AI you need.<br />Delivered your way.</h2><p>We agree the solution and delivery around your game and your team. Code, an in-game component, or an online service can all be part of the plan.</p><a className="text-link" href="#contact">Talk through your first feature <span aria-hidden="true">↗</span></a></div>
      <div className="delivery-details"><div className="detail-row"><span className="detail-number">A</span><div><h3>A game-ready AI solution</h3><p>The agreed capability and game interfaces, delivered as embedded code, an in-game component, a development handoff, or an online API or service.</p></div></div><div className="detail-row"><span className="detail-number">B</span><div><h3>A sandbox and editable prompts</h3><p>A private review environment that mirrors the relevant game logic, with the agreed prompt and configuration controls for your designers and writers.</p></div></div><div className="detail-row"><span className="detail-number">C</span><div><h3>Simulation reports and a usable handoff</h3><p>Scenario results, interface and development documentation, and a handoff covering prompts, settings, and operation. Integration support is agreed as part of the scope.</p></div></div><div className="detail-row"><span className="detail-number">D</span><div><h3>A deployment choice that fits</h3><p>For online services, run in your cloud or rent an Arcane Forge-managed service. Hosting, model usage, maintenance, and support are scoped explicitly.</p></div></div></div>
    </section>

    <section className="closing-section" id="contact" aria-labelledby="contact-title"><div className="section-shell closing-inner"><div><p className="eyebrow">LET’S BUILD YOUR AI CAPABILITY</p><h2 id="contact-title">What should AI do<br />in <em>your game?</em></h2><a className="contact-email" href="mailto:contact@arcaneforge.ai">contact@arcaneforge.ai</a></div><a className="button button-light" href="/contact">Discuss your project <span aria-hidden="true">↗</span></a></div></section>
  
      </main>
      <Footer />
    </div>
  );
}
