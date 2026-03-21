import Link from "next/link";

function HTLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 178.85 218.83"
      className={className}
      aria-label="Halman Thompson logo"
    >
      {/* H letterform — white for dark backgrounds */}
      <path
        fill="white"
        d="M154.92,182.91c1.72,10.01,12.46,6.49,18.73,8.87-1.52,2.59-4.63,2.05-7.36,1.97-14.2-.43-27.75-.84-41.93.17-.72.05-1.8-.36-2.33-.42-.57-.07-.9-1.42-.31-1.95,2.07-1.9,10.87,1.93,12.7-8.97,1.55-8.51,1.36-17.06,1.7-25.89l-.09-45.83-90.13-.07c-.04,23.02-.61,45.27.89,67.92.32,4.8,1.92,9.84,6.67,11.02,4.09,2.2,9.08-.94,12.99,3.29-10.23,1.75-19.47.04-29.15.14-4.3.05-21.74,1.38-22.93-.17-2.69-3.49,8.72-.23,11.16-6.01,2.27-5.37,2.81-11.18,2.81-17.38l-.08-118.53c0-13.65-17.83-8.53-18.01-12.73,9.16-1.53,17.36.14,26.06-.07l22.01-.54c.89-.02,1.56.32,1.89.73,3.5,4.28-13.17-2.2-13.86,12.35-.83,17.41-.58,34.24-.46,52.33,20.9.91,35.29-.9,55.41-.04,11.74.5,22.97.24,34.8-.05l-.46-51.28c-.14-15.03-16.91-8.8-18.14-13.4,9.41-1.65,17.86.12,26.79-.11l21.03-.56c.74-.02,1.57.3,2.11.48.49.17.53,1.07.22,1.5-1.31,1.8-7.11.03-10.6,3.28-1.85,1.72-3.45,5.01-3.46,8.45l-.23,112.18c-.01,6.82.46,12.94,1.56,19.34Z"
      />
      {/* T top bar — brand gold */}
      <path
        fill="currentColor"
        d="M102.24,14.27l-.16,86.07-25.23.04-.16-86.05-42.74.74c-6.46.11-12.77,1.35-18.62,3.51-7.41,2.57-8.4,9.58-10.55,16.58l-.85,2.77c-.18.6-1.27.96-2,.54-.63-.37-1.19-1.71-1.21-2.92L0,0c10.11,1.92,19.13,3.01,29.42,3l123.76-.06c8.99,0,16.79-1.45,25.67-2.92l-.74,36.55c-.03,1.25-1.67,2.32-2.34,2.06-3.97-1.54,2.6-14.68-12.55-20.14-5.76-2.14-12.02-3.31-18.36-3.43l-42.62-.8Z"
      />
      {/* T base — brand gold */}
      <path
        fill="currentColor"
        d="M127.68,218.83l-37.39-.44-38.96.43c-1.37.02-2.14-1.03-2.19-1.68-.07-.91.79-1.65,2.04-1.77l12.55-1.15c5.9-.54,9.72-4.73,10.78-10.57,1.86-10.23,1.99-20.37,2.04-30.99l.24-58.92,25.29-.08.2,58.98c.04,10.58.24,20.71,2.04,30.96,1.02,5.77,4.76,10.02,10.53,10.58l12.58,1.21c.97.09,1.67.29,2.04.82.52.75.1,2.65-1.8,2.63Z"
      />
    </svg>
  );
}

export function Header() {
  return (
    <header className="flex-shrink-0 border-b border-white/[0.06] bg-ht-dark px-4 py-2 sm:px-6 sm:py-3 lg:py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <HTLogo className="h-7 w-auto text-ht-gold sm:h-8 lg:h-9" />
          <div className="flex flex-col">
            <span className="font-serif text-sm tracking-[0.15em] text-white sm:text-base lg:text-lg">
              Halman Thompson
            </span>
            <span className="hidden text-[9px] tracking-[0.25em] text-ht-gold/60 sm:inline lg:text-[10px]">
              BESPOKE METAL CREATIONS
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-white/70 sm:gap-6">
          <Link
            href="/"
            className="hidden transition-colors hover:text-ht-gold sm:inline"
          >
            Products
          </Link>
          <Link
            href="/configure/splashback"
            className="rounded-lg bg-ht-gold px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-ht-gold/90 hover:shadow-md sm:px-4 sm:py-2 sm:text-sm"
          >
            Configure
          </Link>
        </nav>
      </div>
    </header>
  );
}
