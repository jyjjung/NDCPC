'use client';

type ChatDateSeparatorProps = {
  label: string;
};

export function ChatDateSeparator({ label }: ChatDateSeparatorProps) {
  return (
    <div className="my-4 flex justify-center">
      <span className="rounded-full bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
