

const quickLinks = ['Features', 'How It Works', 'Start Chat'];

export default function Footer() {
  const scrollTo = (label: string) => {
    if (label === 'Start Chat') {
      window.location.href = '/chat';
      return;
    }
    const id = label.toLowerCase().replace(/ /g, '-');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-navy text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/swasthai-logo-light.svg" alt="SwasthAI" className="h-8 w-auto" />
            </div>
            <p className="text-primary-foreground/60 text-sm leading-relaxed">
              AI-powered healthcare for everyone
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/40">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {quickLinks.map(link => (
                <button
                  key={link}
                  onClick={() => scrollTo(link)}
                  className="text-primary-foreground/70 hover:text-teal-light transition-colors text-left text-sm"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/40">Connect</h4>
            <p className="text-primary-foreground/70 text-sm">📱 Chat on WhatsApp</p>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-primary-foreground/40 text-sm">
          © 2026 SwasthAI. Built with ❤️ for Aetrix Hackathon
        </div>
      </div>
    </footer>
  );
}
