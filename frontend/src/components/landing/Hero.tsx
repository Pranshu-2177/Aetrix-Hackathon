import { motion } from 'framer-motion';
import { ArrowRight, Stethoscope, Heart, Shield, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const floatingIcons = [
  { Icon: Stethoscope, className: 'top-[15%] left-[10%]', delay: 0 },
  { Icon: Heart, className: 'top-[20%] right-[15%]', delay: 0.5 },
  { Icon: Shield, className: 'bottom-[25%] left-[18%]', delay: 1 },
  { Icon: Pill, className: 'bottom-[20%] right-[12%]', delay: 1.5 },
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen gradient-hero flex items-center justify-center overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-teal/10 blur-3xl top-1/4 -left-32" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-teal/10 blur-3xl bottom-1/4 -right-24" />

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, className, delay }, i) => (
        <motion.div
          key={i}
          className={`absolute hidden md:block ${className}`}
          animate={{ y: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 3, delay, ease: 'easeInOut' }}
        >
          <Icon className="w-8 h-8 text-accent-foreground/30" />
        </motion.div>
      ))}

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.h1
          initial={{ y: 30, opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl font-heading font-bold text-accent-foreground leading-[0.95] tracking-tight text-balance"
        >
          Your AI Health Assistant
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-xl md:text-2xl text-accent-foreground/80 max-w-2xl mx-auto text-pretty"
        >
          Get instant medical guidance in your language — through text, voice, or image
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <Button
            variant="hero"
            size="lg"
            className="text-lg px-10 py-6"
            onClick={() => navigate('/chat')}
          >
            Start Chat <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
          <span className="text-accent-foreground/60 text-sm">Also available on WhatsApp 📱</span>
        </motion.div>
      </div>
    </section>
  );
}
