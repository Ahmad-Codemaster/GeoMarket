import { cn } from '../../lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Use 'narrow' for detail/form pages, 'wide' for dashboards */
  width?: 'default' | 'narrow' | 'wide';
}

/**
 * PageContainer — consistent horizontal page padding and max-width.
 * All page-level content should be wrapped in this component.
 */
export function PageContainer({ children, className, width = 'default' }: PageContainerProps) {
  return (
    <div
      className={cn(
        'container mx-auto px-4 py-8',
        width === 'narrow' && 'max-w-2xl',
        width === 'wide' && 'max-w-7xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Consistent page title + optional subtitle + optional action button */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8',
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
