import { motion } from 'framer-motion';

const team = [
  { name: 'Aarav Patel', role: 'Frontend Engineer', initials: 'AP' },
  { name: 'Meera Shah', role: 'Backend Engineer', initials: 'MS' },
  { name: 'Rohan Desai', role: 'AI Engineer', initials: 'RD' },
  { name: 'Priya Nair', role: 'Voice & WhatsApp Engineer', initials: 'PN' },
  { name: 'Karan Mehta', role: 'Maps, DB & DevOps', initials: 'KM' },
];

const colors = ['bg-teal', 'bg-navy', 'bg-teal-dark', 'bg-navy-light', 'bg-navy-lighter'];

export default function TeamSection() {
  return (
    <section id="team" className="py-24 md:py-32">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-4xl font-heading font-bold text-foreground text-center text-balance"
        >
          Meet the Team
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-16">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center group"
            >
              <div className={`w-24 h-24 rounded-full ${colors[i]} flex items-center justify-center text-accent-foreground font-heading font-bold text-xl ring-0 group-hover:ring-2 ring-teal ring-offset-2 transition-all duration-300`}>
                {member.initials}
              </div>
              <h3 className="mt-4 font-heading font-bold text-foreground text-sm">{member.name}</h3>
              <p className="text-muted-foreground text-xs mt-1">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
