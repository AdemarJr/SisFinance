import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Carregando...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <Loader2 className="size-12 text-primary animate-spin mb-4" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
