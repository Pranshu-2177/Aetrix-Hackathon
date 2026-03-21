import { motion } from 'framer-motion';
import { Globe, Mic, Camera, AlertTriangle, MapPin, FileText } from 'lucide-react';

const features = [
  { Icon: Globe, title: 'Multilingual Support', desc: 'Speak in Hindi, English, Gujarati, Marathi, or Tamil — SwasthAI understands all' },
  { Icon: Mic, title: 'Voice Input', desc: 'Just speak your symptoms naturally — no typing needed' },
  { Icon: Camera, title: 'Image Analysis', desc: 'Upload photos of wounds, rashes, or injuries for AI-powered visual analysis' },
  { Icon: AlertTriangle, title: 'Emergency Detection', desc: 'Instant detection of critical conditions with one-tap ambulance call (108)' },
  { Icon: MapPin, title: 'Hospital Finder', desc: 'GPS-based nearest hospital recommendations with directions' },
  { Icon: FileText, title: 'Patient Reports', desc: 'Get a downloadable health summary after each consultation' },
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
          What SwasthAI Can Do
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
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
