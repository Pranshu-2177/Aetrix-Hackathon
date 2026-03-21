import { motion } from 'framer-motion';
import { LANGUAGES } from '@/lib/types';

export default function LanguagesSection() {
  return (
    <section className="py-24 md:py-32 bg-teal-lightest">
      <div className="container mx-auto px-4 text-center">
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-4xl font-heading font-bold text-foreground text-balance"
        >
          Speak in Your Language
        </motion.h2>
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 text-muted-foreground text-lg"
        >
          SwasthAI understands you, no matter which language you speak
        </motion.p>

        <div className="flex flex-wrap justify-center gap-4 mt-12">
          {LANGUAGES.map((lang, i) => (
            <motion.div
              key={lang.code}
              initial={{ x: i % 2 === 0 ? -20 : 20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="border-2 border-teal rounded-full px-6 py-3 bg-card hover:bg-teal-lightest transition-colors flex items-center gap-3 cursor-default"
            >
              <span className="text-xl">{lang.flag}</span>
              <div className="text-left">
                <div className="font-semibold text-foreground text-sm">{lang.label}</div>
                <div className="text-muted-foreground text-xs">{lang.script}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
