import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import LanguagesSection from '@/components/landing/LanguagesSection';
import Footer from '@/components/landing/Footer';
import FloatingChatButton from '@/components/landing/FloatingChatButton';

export default function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <LanguagesSection />
      <Footer />
      <FloatingChatButton />
    </div>
  );
}
