export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <p className="font-mono text-code-md uppercase text-on-surface-variant">// {title}</p>
      <p className="mt-2 max-w-xs text-body-md text-on-surface-variant">{hint}</p>
    </div>
  );
}
