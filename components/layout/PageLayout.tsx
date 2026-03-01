import React from 'react';
import { Container } from './Container';

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    bgClass?: string;
    className?: string;
}

const PageLayoutRoot: React.FC<PageLayoutProps> = ({
    children,
    bgClass = 'bg-zinc-50',
    className = '',
    ...props
}) => {
    return (
        <div className={`min-h-screen flex flex-col ${bgClass} ${className}`} {...props}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        h1,h2,h3,h4, .heading-font { font-family: 'Space Grotesk', 'Inter', sans-serif; letter-spacing: -0.025em; }
        .animate-in { animation: slideDown 0.2s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
            {children}
        </div>
    );
};

const PageLayoutHeader: React.FC<{
    children: React.ReactNode;
    className?: string;
    border?: boolean;
}> = ({ children, className = '', border = true }) => {
    return (
        <header className={`bg-white ${border ? 'border-b border-zinc-200' : ''} ${className}`}>
            <Container className="py-4 sm:py-5 lg:py-6">
                {children}
            </Container>
        </header>
    );
};

const PageLayoutContent: React.FC<{
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    container?: boolean;
}> = ({ children, className = '', padding = 'md', container = true }) => {
    const padClass = {
        none: '',
        sm: 'py-4',
        md: 'py-6 lg:py-8',
        lg: 'py-10 lg:py-14'
    }[padding];

    const content = container ? (
        <Container className={padClass}>{children}</Container>
    ) : (
        <div className={`w-full ${padClass}`}>{children}</div>
    );

    return (
        <main className={`flex-1 min-h-0 flex flex-col ${className}`}>
            {content}
        </main>
    );
};

export const PageLayout = Object.assign(PageLayoutRoot, {
    Header: PageLayoutHeader,
    Content: PageLayoutContent,
});
