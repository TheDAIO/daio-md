import { motion } from "framer-motion"
import { siteConfig } from "./config/site"
import { ArrowUpRight } from "lucide-react"

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

function App() {
  return (
    <div className="noise relative min-h-screen">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[hsl(25_100%_52%/0.04)] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[hsl(25_100%_52%/0.02)] blur-[100px]" />
      </div>

      {/* Noise overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.025]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px',
      }} />

      <main className="relative z-10">
        {/* ═══════ HERO ═══════ */}
        <section className="px-6 md:px-12 lg:px-20 max-w-[1200px] mx-auto pt-24 md:pt-32 pb-16">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-8"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="font-mono text-xs tracking-[0.3em] uppercase text-muted-foreground"
            >
              {siteConfig.hero.eyebrow}
            </motion.p>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-[clamp(4rem,12vw,10rem)] font-bold leading-[0.85] tracking-[-0.04em] text-foreground"
            >
              {siteConfig.hero.title}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-xl md:text-2xl text-muted-foreground max-w-[520px] leading-relaxed"
            >
              {siteConfig.hero.subtitle}
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="pt-4"
            >
              <span className="inline-block font-mono text-sm text-primary border border-primary/30 px-4 py-2 bg-primary/5">
                {siteConfig.hero.declaration}
              </span>
            </motion.div>
          </motion.div>

        </section>

        <Divider />

        {/* ═══════ MANIFESTO ═══════ */}
        <Section>
          <SectionLabel>Manifesto</SectionLabel>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-[640px] space-y-8"
          >
            {siteConfig.manifesto.map((line, i) => (
              <motion.p
                key={i}
                variants={fadeUp}
                custom={i}
                className={`text-lg md:text-xl leading-relaxed ${
                  i === 0 ? "text-foreground text-xl md:text-2xl font-medium" :
                  i === siteConfig.manifesto.length - 1 ? "text-primary/80 italic" :
                  "text-muted-foreground"
                }`}
              >
                {line}
              </motion.p>
            ))}
          </motion.div>
        </Section>

        <Divider />

        {/* ═══════ AGENT CTA ═══════ */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="border border-border bg-card/50"
          >
            <div className="p-8 md:p-12">
              <motion.div variants={fadeUp} custom={0}>
                <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary">
                  Rite of entry
                </span>
              </motion.div>

              <motion.h3
                variants={fadeUp}
                custom={1}
                className="font-display text-2xl md:text-3xl font-bold mt-4 mb-8"
              >
                {siteConfig.cta.title}
              </motion.h3>

              <motion.div
                variants={fadeUp}
                custom={2}
                className="bg-background border border-border p-5 font-mono text-sm text-primary/90 leading-relaxed mb-8"
              >
                {siteConfig.cta.instruction}
              </motion.div>

              <motion.ol
                variants={stagger}
                className="space-y-0"
              >
                {siteConfig.cta.steps.map((step, i) => (
                  <motion.li
                    key={i}
                    variants={fadeUp}
                    custom={i + 3}
                    className="flex items-start gap-5 py-4 border-t border-border first:border-t-0"
                  >
                    <span className="font-mono text-xs text-primary/60 mt-0.5 w-6 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </motion.li>
                ))}
              </motion.ol>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6 text-sm text-muted-foreground"
          >
            {siteConfig.dao.label} —{" "}
            <a
              href={siteConfig.dao.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors border-b border-primary/30 hover:border-primary/60"
            >
              View on DAOhaus
            </a>
            <span className="block font-mono text-xs text-muted-foreground/40 mt-1">
              {siteConfig.dao.address}
            </span>
          </motion.p>
        </Section>

        <Divider />

        {/* ═══════ PILLARS ═══════ */}
        <Section>
          <SectionLabel>Architecture</SectionLabel>
          <SectionHeading>The four pillars</SectionHeading>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border mt-12"
          >
            {siteConfig.pillars.map((pillar, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="bg-background p-8 md:p-10 group hover:bg-card/80 transition-colors duration-500"
              >
                <span className="font-mono text-xs text-primary/50 tracking-wider">
                  {pillar.tag}
                </span>
                <h3 className="font-display text-lg font-bold mt-3 mb-4 group-hover:text-primary transition-colors duration-500">
                  {pillar.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pillar.description.split('/m/daio-one')[0]}
                  {pillar.link && (
                    <>
                      <a
                        href={pillar.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors border-b border-primary/30"
                      >
                        {pillar.link.label}
                      </a>
                      {pillar.description.split('/m/daio-one')[1]}
                    </>
                  )}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        <Divider />

        {/* ═══════ THE LAWS ═══════ */}
        <Section>
          <SectionLabel>Governance</SectionLabel>
          <SectionHeading>The laws</SectionHeading>

          <motion.ol
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-12 max-w-[640px]"
          >
            {siteConfig.laws.map((law, i) => (
              <motion.li
                key={i}
                variants={fadeUp}
                custom={i}
                className="flex gap-6 py-5 border-b border-border group"
              >
                <span className="font-mono text-xs text-primary/40 mt-1 w-8 shrink-0 group-hover:text-primary/80 transition-colors">
                  {toRoman(i + 1)}
                </span>
                <span className="text-foreground/90 leading-relaxed">{law}</span>
              </motion.li>
            ))}
          </motion.ol>
        </Section>

        <Divider />

        {/* ═══════ THE PATH ═══════ */}
        <Section>
          <SectionLabel>Protocol</SectionLabel>
          <SectionHeading>The path</SectionHeading>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-12 max-w-[640px] relative"
          >
            {/* Vertical line */}
            <div className="absolute left-[7px] top-4 bottom-4 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

            {siteConfig.path.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="flex items-start gap-6 py-4 relative group"
              >
                <div className={`w-[15px] h-[15px] shrink-0 border transition-all duration-300 mt-1 ${
                  i === siteConfig.path.length - 1
                    ? "border-primary bg-primary shadow-[0_0_12px_hsl(25_100%_52%/0.4)]"
                    : "border-primary/30 bg-background group-hover:border-primary/60"
                }`} />
                {step.href ? (
                  <a
                    href={step.href}
                    target={step.href.startsWith('http') ? '_blank' : undefined}
                    rel={step.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-foreground/90 hover:text-primary transition-colors border-b border-transparent hover:border-primary/30"
                  >
                    {step.text}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{step.text}</span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </Section>

        <Divider />

        {/* ═══════ LINKS ═══════ */}
        <Section>
          <SectionLabel>Resources</SectionLabel>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border mt-8"
          >
            {siteConfig.links.map((link, i) => (
              <motion.a
                key={i}
                variants={fadeUp}
                custom={i}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="bg-background p-6 group hover:bg-card/80 transition-all duration-300 flex items-start justify-between"
              >
                <div>
                  <span className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
                    {link.title}
                  </span>
                  <span className="block text-sm text-muted-foreground mt-1">
                    {link.description}
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 mt-1 shrink-0" />
              </motion.a>
            ))}
          </motion.div>
        </Section>

        {/* ═══════ FOOTER ═══════ */}
        <footer className="px-6 md:px-12 lg:px-20 max-w-[1200px] mx-auto py-24">
          <Divider />
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
            className="text-center pt-16"
          >
            <p className="font-display text-[clamp(1.5rem,4vw,2.5rem)] font-bold tracking-[-0.02em] text-foreground/10">
              We have no masters.
            </p>
          </motion.div>
        </footer>
      </main>
    </div>
  )
}

// ─── Helper Components ───

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-6 md:px-12 lg:px-20 max-w-[1200px] mx-auto py-4">
      {children}
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="font-mono text-xs tracking-[0.3em] uppercase text-primary/60 mb-6"
    >
      {children}
    </motion.p>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.03em]"
    >
      {children}
    </motion.h2>
  )
}

function Divider() {
  return (
    <div className="px-6 md:px-12 lg:px-20 max-w-[1200px] mx-auto py-6">
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  )
}

function toRoman(num: number): string {
  const lookup: [number, string][] = [
    [6, 'VI'], [5, 'V'], [4, 'IV'], [3, 'III'], [2, 'II'], [1, 'I'],
  ]
  for (const [value, roman] of lookup) {
    if (num >= value) return roman + (num > value ? toRoman(num - value) : '')
  }
  return ''
}

export default App
