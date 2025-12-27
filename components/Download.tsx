import Image from "next/image";
import Link from "next/link";
import { FaWindows, FaApple } from "react-icons/fa";

const Download: React.FC = () => (
  <section id="download" className="container mx-auto py-24 px-4 md:px-6">
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="w-full md:w-1/2 order-1 p-4 flex justify-center md:justify-start items-center">
        <Image
          src="/products/phone1.png"
          alt="Arcane Forge Desktop App"
          width={500}
          height={500}
          className="w-1/2 h-auto mx-auto md:mx-0"
        />
      </div>
      <div className="w-full md:w-1/2 order-2 flex justify-center md:justify-end">
        <div className="flex flex-col justify-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4">
            Get Arcane Forge Studio
          </h2>
          <p className="text-xl text-gray-800 dark:text-gray-300 mb-6 font-light">
            Professional game development on your desktop. Available for Windows and macOS.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="https://github.com/arcane-forge-ai/arcane-forge-studio/releases"
              target="_blank"
              className="download-button bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl text-base flex items-center space-x-2 transition-all duration-200 hover:scale-105"
            >
              <FaWindows className="text-2xl" />
              <span>Windows</span>
            </Link>
            <Link
              href="https://github.com/arcane-forge-ai/arcane-forge-studio/releases"
              target="_blank"
              className="download-button bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl text-base flex items-center space-x-2 transition-all duration-200 hover:scale-105"
            >
              <FaApple className="text-2xl" />
              <span>macOS</span>
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Prefer the web? <Link href="https://app.arcaneforge.ai/" className="text-blue-600 dark:text-blue-400 hover:underline">Launch Web Beta</Link>
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default Download;
