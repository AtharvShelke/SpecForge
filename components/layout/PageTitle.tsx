import React from 'react';

interface PageTitleProps {
    title: string | React.ReactNode;
    subtitle?: string | React.ReactNode;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
    alignment?: 'left' | 'center';
}

export const PageTitle: React.FC<PageTitleProps> = ({
    title,
    subtitle,
    badge,
    actions,
    className = '',
    alignment = 'left',
}) => {
    const alignClass = alignment === 'center' ? 'text-center mx-auto' : 'text-left';

    return (
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-5 ${className}`}>
            <div className={`max-w-2xl ${alignClass}`}>
                {badge && <div className="mb-4">{badge}</div>}
                <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-2.5 tracking-tight heading-font">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-zinc-500 text-sm sm:text-base leading-relaxed max-w-xl">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className={`flex-shrink-0 ${alignment === 'center' ? 'mx-auto mt-4' : ''}`}>
                    {actions}
                </div>
            )}
        </div>
    );
};
