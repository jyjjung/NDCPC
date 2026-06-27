import { cn } from '@/lib/utils';

interface PageShellProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}

export function PageShell({ title, actions, children, className, wide }: PageShellProps) {
  return (
    <article className={cn('w-full', wide ? 'max-w-3xl' : 'max-w-2xl', className)}>
      <header className="mb-8 flex items-center justify-between gap-4 border-b border-border/40 pb-5">
        <h1 className="font-headline text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          {title}
        </h1>
        {actions}
      </header>
      {children}
    </article>
  );
}
