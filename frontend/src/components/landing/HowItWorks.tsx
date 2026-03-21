import { motion } from 'framer-motion';
import { Edit3, Brain, CheckCircle } from 'lucide-react';

const steps = [
  { Icon: Edit3, title: 'Describe Symptoms', desc: 'Type, speak, or upload an image of your symptoms', num: 1 },
  { Icon: Brain, title: 'AI Analyzes', desc: 'Our AI triages urgency + generates personalized guidance', num: 2 },
  { Icon: CheckCircle, title: 'Get Guidance', desc: 'Receive self-care advice, clinic recommendations, or emergency alerts', num: 3 },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-4xl font-heading font-bold text-foreground text-center text-balance"
        >
          How It Works
        </motion.h2>

        <div className="mt-16 flex flex-col md:flex-row items-start md:items-center justify-center gap-8 md:gap-4">
          {steps.map(({ Icon, title, desc, num }, i) => (
            <div key={num} className="flex flex-col md:flex-row items-center gap-4 md:gap-0 flex-1">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center max-w-[240px]"
              >
                <div className="w-16 h-16 rounded-full gradient-cta flex items-center justify-center text-accent-foreground font-heading font-bold text-xl mb-4 shadow-teal">
                  {num}
                </div>
                <Icon className="w-7 h-7 text-teal mb-3" />
                <h3 className="text-lg font-heading font-bold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-pretty text-sm">{desc}</p>
              </motion.div>

              {i < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: (i + 1) * 0.15 }}
                  className="hidden md:block w-full max-w-[80px] h-[2px] border-t-2 border-dashed border-teal mx-4 origin-left"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
