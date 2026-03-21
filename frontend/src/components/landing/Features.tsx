import { motion } from 'framer-motion';
import { Globe, Mic, HeartPulse, MapPin } from 'lucide-react';

const features = [
  { Icon: Globe, title: 'Use your language', desc: 'Hindi, Gujarati, Marathi, Tamil, or English' },
  { Icon: Mic, title: 'Type or speak', desc: 'You can write your problem or say it aloud' },
  { Icon: HeartPulse, title: 'Get simple guidance', desc: 'We tell you if you can rest at home, visit a health centre, or go for urgent help' },
  { Icon: MapPin, title: 'Find nearby care', desc: 'Share your location to see a nearby PHC, health centre, or hospital' },
];

export default function Features() {
  return (
    <section id="features" className="py-24 md:py-32 bg-teal-lightest">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-4xl font-heading font-bold text-foreground text-center text-balance"
        >
          How SwasthAI Helps
        </motion.h2>

        <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground text-pretty">
          This tool is made to give quick help in simple words, especially when getting a doctor quickly is difficult.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          {features.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ y: 30, opacity: 0, filter: 'blur(4px)' }}
              whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card rounded-xl border border-border p-6 hover:-translate-y-1 hover:shadow-teal transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-lightest flex items-center justify-center mb-4 group-hover:bg-teal/10 transition-colors">
                <Icon className="w-6 h-6 text-teal" />
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground mb-2">{title}</h3>
              <p className="text-muted-foreground text-pretty leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
