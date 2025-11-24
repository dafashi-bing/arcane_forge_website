import Header from "components/Header";
import Hero from "components/Hero";
import GameShowcase from "components/GameShowcase";
import Features from "components/Features";
import Workflow from "components/Workflow";
import Differentiation from "components/Differentiation";
import DemoVideo from "components/DemoVideo";
import EarlyAccessCTA from "components/EarlyAccessCTA";
import Resources from "components/Resources";
import Footer from "components/Footer";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="flex-grow">
        <Hero />
        <GameShowcase />
        <Features />
        <Workflow />
        <Differentiation />
        <DemoVideo />
        <EarlyAccessCTA />
        <Resources />
      </main>
      <Footer />
    </div>
  );
}
