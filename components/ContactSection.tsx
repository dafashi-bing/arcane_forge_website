import ContactForm from "./ContactForm";

interface ContactSectionProps {
  title?: string;
  description?: string;
  formspreeId: string;
  className?: string;
}

export default function ContactSection({
  title = "Contact Us",
  description = "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
  formspreeId,
  className = "",
}: ContactSectionProps) {
  return (
    <section className={`container mx-auto py-24 px-4 md:px-6 ${className}`}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-8 text-center">
          {title}
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 text-center font-light">
          {description}
        </p>
        
        <ContactForm formspreeId={formspreeId} />
      </div>
    </section>
  );
} 