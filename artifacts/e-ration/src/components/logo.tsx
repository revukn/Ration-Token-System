import { ShieldCheck } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-sm">
        <ShieldCheck className="w-6 h-6" />
      </div>
      {!compact && (
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-wider text-primary leading-tight">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</span>
          <span className="text-sm font-semibold text-foreground leading-tight">Government of Karnataka</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">E-Ration Token System</span>
        </div>
      )}
    </div>
  );
}
