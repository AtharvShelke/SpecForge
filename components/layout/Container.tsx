import React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    className?: string;
}

const maxWidthMap = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1400px]',
    '2xl': 'max-w-[1600px]',
    full: 'max-w-full',
};

export const Container: React.FC<ContainerProps> = ({
    children,
    maxWidth = 'xl',
    className = '',
    ...props
}) => {
    return (
        <div
            className={`mx-auto w-full px-5 sm:px-7 lg:px-10 ${maxWidthMap[maxWidth]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
