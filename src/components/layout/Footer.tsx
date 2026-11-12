import Link from "next/link";

export function Footer() {
  return (
    <footer className="grain bg-ht-dark text-white/55">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-20 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-serif text-3xl leading-tight text-white sm:text-4xl">
              Made by hand in
              <br />
              <em className="text-ht-gold-light">Newcastle upon Tyne.</em>
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/45">
              Every sheet is cut, aged and finished in our workshop. No two
              patinas are ever the same, so the piece you receive is yours alone.
            </p>
          </div>
          <div className="text-sm">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/35">
              Configure
            </p>
            <ul className="space-y-2.5">
              <li><Link className="transition-colors hover:text-white" href="/configure/splashback">Splashbacks</Link></li>
              <li><Link className="transition-colors hover:text-white" href="/configure/worktop">Worktops</Link></li>
              <li><Link className="transition-colors hover:text-white" href="/#finishes">The finishes</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/35">
              Talk to us
            </p>
            <ul className="space-y-2.5">
              <li><a className="transition-colors hover:text-white" href="tel:01912509853">0191 250 9853</a></li>
              <li><a className="transition-colors hover:text-white" href="https://halmanthompson.com">halmanthompson.com</a></li>
            </ul>
          </div>
        </div>
        <div className="rule-brass mt-16" />
        <div className="mt-6 flex flex-col justify-between gap-2 text-xs text-white/30 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Halman Thompson Ltd. All rights reserved.</p>
          <p>Bespoke Metal Creations</p>
        </div>
      </div>
    </footer>
  );
}
