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
    const isCentered = alignment === 'center';

    return (
        <div className={`flex flex-col gap-5 md:flex-row md:items-end md:justify-between ${className}`}>
            <div className={`${isCentered ? 'mx-auto text-center' : 'text-left'} max-w-3xl`}>
                {badge && <div className="mb-3">{badge}</div>}
                <h1 className="text-4xl text-slate-950 sm:text-5xl">
                    {title}
                </h1>
                {subtitle && (
                    <p className={`mt-4 text-base leading-8 text-slate-600 sm:text-lg ${isCentered ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}>
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className={`${isCentered ? 'mx-auto' : 'md:self-end'} flex-shrink-0`}>
                    {actions}
                </div>
            )}
        </div>
    );
};
