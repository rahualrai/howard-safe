import { ReactNode, useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";

interface DevicePreviewProps {
  children: ReactNode;
}

/**
 * Centers the app inside a stylized iPhone frame when there's enough screen real estate.
 * On small viewports it simply renders children to preserve the native mobile layout.
 */
export function DevicePreview({ children }: DevicePreviewProps) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showFrame = useMemo(() => {
    const isNative = Capacitor.isNativePlatform();
    return !isNative && isDesktop;
  }, [isDesktop]);

  if (!showFrame) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background md:bg-slate-950">
      <div className="md:min-h-screen md:flex md:items-center md:justify-center md:p-6">
        <div className="w-full md:w-[430px] md:max-w-full md:relative">
          <div
            className="hidden md:block absolute inset-0 rounded-[55px] bg-gradient-to-br from-white/10 via-cyan-300/5 to-transparent blur-3xl"
            aria-hidden="true"
          />
          <div className="relative md:rounded-[55px] md:border-[12px] md:border-neutral-900 md:bg-black md:shadow-[0_40px_120px_rgba(0,0,0,0.55)] overflow-hidden">
            <div
              className="hidden md:block absolute top-3 left-1/2 -translate-x-1/2 w-32 h-10 rounded-full bg-neutral-900 z-20"
              aria-hidden="true"
            />
            <div
              className="hidden md:block absolute left-3 top-32 w-[3px] h-16 rounded-full bg-neutral-800"
              aria-hidden="true"
            />
            <div
              className="hidden md:block absolute left-3 top-52 w-[3px] h-10 rounded-full bg-neutral-800"
              aria-hidden="true"
            />
            <div
              className="hidden md:block absolute right-3 top-44 w-[3px] h-24 rounded-full bg-neutral-800"
              aria-hidden="true"
            />
            <div className="relative z-10 md:rounded-[38px] md:overflow-hidden md:bg-background md:h-[844px]">
              <div className="hidden md:block absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-background/90 to-transparent z-20 pointer-events-none" />
              <div className="md:h-full md:overflow-y-auto md:pt-10">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
