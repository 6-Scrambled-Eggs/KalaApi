import { ReactNode, useEffect, useRef, useState } from "react";

/** Mounts children only once the placeholder nears the viewport (keeps heavy map code off the first paint). */
export default function OnVisible({ children, minHeight = 420 }: { children: ReactNode; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShow(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setShow(true); io.disconnect(); } }, { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} style={show ? undefined : { minHeight }}>{show ? children : null}</div>;
}
