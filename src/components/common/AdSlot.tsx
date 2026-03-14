type Props = {
  className?: string;
};

export function AdSlot({ className = "" }: Props) {
  return (
    <div
      className={`w-full h-32 bg-white/5 border border-dashed border-white/10 flex items-center justify-center ${className}`}
    >
      <span className="text-xs text-white/30 tracking-widest uppercase">Sponsored Content</span>
    </div>
  );
}
