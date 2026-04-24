import { memo } from 'react';
import { Container } from './Container';

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    bgClass?: string;
    className?: string;
}

const GLOBAL_STYLES = `
  .animate-in{animation:slideDown 0.2s ease-out}
  @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
` as const;

const PAD_CLASSES = {
    none: '',
    xs: 'py-2 sm:py-3',
    sm: 'py-3 sm:py-4',
    md: 'py-4 sm:py-6 lg:py-8',
    lg: 'py-6 sm:py-8 lg:py-14',
} as const;

type PaddingKey = keyof typeof PAD_CLASSES;

const PageLayoutRoot = memo<PageLayoutProps>(function PageLayoutRoot({
    children,
    bgClass = 'bg-transparent',
    className = '',
    ...props
}) {
    return (
        <div className={`min-h-screen flex flex-col ${bgClass} ${className}`} {...props}>
            <style>{GLOBAL_STYLES}</style>
            {children}
        </div>
    );
});

const PageLayoutHeader = memo<{
    children: React.ReactNode;
    className?: string;
    border?: boolean;
    compact?: boolean;
}>(function PageLayoutHeader({
    children,
    className = '',
    border = true,
    compact = false,
}) {
    return (
        <header className={`app-surface ${border ? 'hairline' : ''} ${className}`}>
            <Container className={compact ? 'py-2 sm:py-3 md:py-4' : 'py-3 sm:py-4 md:py-5 lg:py-6'}>
                {children}
            </Container>
        </header>
    );
});

const PageLayoutContent = memo<{
    children: React.ReactNode;
    className?: string;
    padding?: PaddingKey;
    container?: boolean;
}>(function PageLayoutContent({
    children,
    className = '',
    padding = 'md',
    container = true,
}) {
    const padClass = PAD_CLASSES[padding];

    return (
        <main className={`flex-1 min-h-0 flex flex-col w-full ${className}`}>
            {container ? (
                <Container className={padClass}>{children}</Container>
            ) : (
                <div className={`w-full ${padClass}`}>{children}</div>
            )}
        </main>
    );
});

export const PageLayout = Object.assign(PageLayoutRoot, {
    Header: PageLayoutHeader,
    Content: PageLayoutContent,
});
