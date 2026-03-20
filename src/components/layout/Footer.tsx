export function Footer() {
  return (
    <footer className="border-t border-ht-gold/10 bg-ht-dark px-6 py-8 text-white/50">
      <div className="mx-auto max-w-7xl text-center text-sm">
        <p>
          &copy; {new Date().getFullYear()} Halman Thompson Ltd. All rights
          reserved.
        </p>
        <p className="mt-1 text-xs">
          Bespoke Metal Creations &middot; Newcastle upon Tyne &middot; 0191 250
          9853
        </p>
      </div>
    </footer>
  );
}
