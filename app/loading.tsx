import Image from "next/image";
import logosmall from "@/public/logo-small.png";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-3.5 rounded-2xl border bg-card/95 p-6 shadow-2xl backdrop-blur-md max-w-xs text-center">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping opacity-60" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-card border shadow-sm">
            <Image src={logosmall} alt="ExamCraft Logo" width={32} height={32} className="animate-pulse" priority />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-bold text-foreground">পৃষ্ঠা লোড হচ্ছে...</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Please wait while the page loads</p>
        </div>
      </div>
    </div>
  );
}
