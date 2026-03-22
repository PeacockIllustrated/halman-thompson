"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitioning, setTransitioning] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) {
      setDisplayChildren(children);
      return;
    }

    // View Transitions API (Chrome/Edge)
    if ("startViewTransition" in document) {
      const vt = (document as unknown as { startViewTransition: (cb: () => void) => void })
        .startViewTransition(() => {
          setDisplayChildren(children);
          prevPath.current = pathname;
        });
      // vt is a ViewTransition object but typing isn't universal yet
      void vt;
      return;
    }

    // CSS fallback for Safari/Firefox
    setTransitioning(true);
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      prevPath.current = pathname;
      setTransitioning(false);
    }, 200);

    return () => clearTimeout(timeout);
  }, [pathname, children]);

  return (
    <div
      className="transition-opacity duration-200 ease-in-out"
      style={{ opacity: transitioning ? 0 : 1 }}
    >
      {displayChildren}
    </div>
  );
}
