import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ icon: Icon, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Icon className="size-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            {Icon && <Icon className="size-6 sm:hidden flex-shrink-0" />}
            <span className="break-words">{title}</span>
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
          {actions}
        </div>
      )}
    </div>
  );
}