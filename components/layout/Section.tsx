import React from 'react';
import { Container } from './Container';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
    container?: boolean; // If true, wraps children in <Container>
    containerMaxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const spacingMap = {
    none: 'py-0',
    sm: 'py-4 md:py-6',
    md: 'py-8 md:py-10',
    lg: 'py-10 md:py-14',
    xl: 'py-14 md:py-20',
};

export const Section: React.FC<SectionProps> = ({
    children,
    container = true,
    containerMaxWidth = 'xl',
    spacing = 'lg',
    className = '',
    ...props
}) => {
    const content = container ? (
        <Container maxWidth={containerMaxWidth}>{children}</Container>
    ) : (
        children
    );

    return (
        <section className={`${spacingMap[spacing]} ${className}`} {...props}>
            {content}
        </section>
    );
};
