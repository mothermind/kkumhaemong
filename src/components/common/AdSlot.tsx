type Props = {
  className?: string;
};

export function AdSlot({ className = "" }: Props) {
  return (
    <div
      className={`flex h-[90px] items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 dark:border-stone-800/50 dark:bg-stone-900/20 ${className}`}
    >
      <span className="text-xs text-stone-300 dark:text-stone-700">AD</span>
    </div>
  );
}
