import { memo } from 'react';
import { Container } from './Container';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    bgClass?: string;
    className?: string;
}

// ── Font injection (module scope — runs once, never recreated) ────────────────

// Injected via <link> in the document <head> instead of a runtime @import
// inside a <style> tag. @import blocks rendering until the font CSS resolves;
// a <link rel="preconnect"> + <link rel="stylesheet"> pair is non-blocking
// and loads in parallel with other resources.
//
// In Next.js App Router the correct place for this is layout.tsx via
// next/font/google (zero layout shift, no FOUT). If that is not available,
// add the two <link> tags below to your _document.tsx / layout.tsx <Head>:
//
//   <link rel="preconnect" href="https://fonts.googleapis.com" />
//   <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
//   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
//
// The static CSS string below is kept for the slideDown utility only.

const GLOBAL_STYLES = `
  *{font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
  h1,h2,h3,h4,.heading-font{font-family:'Space Grotesk','Inter',sans-serif;letter-spacing:-0.02em}
  .animate-in{animation:slideDown 0.2s ease-out}
  @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
` as const;

// ── Padding map (module scope — plain object lookup, never recreated) ─────────

const PAD_CLASSES = {
    none: '',
    xs:   'py-2 sm:py-3',
    sm:   'py-3 sm:py-4',
    md:   'py-4 sm:py-6 lg:py-8',
    lg:   'py-6 sm:py-8 lg:py-14',
} as const;

type PaddingKey = keyof typeof PAD_CLASSES;

// ── PageLayoutRoot ────────────────────────────────────────────────────────────

const PageLayoutRoot = memo<PageLayoutProps>(function PageLayoutRoot({
    children,
    bgClass = 'bg-zinc-50',
    className = '',
    ...props
}) {
    return (
        <div className={`min-h-screen flex flex-col ${bgClass} ${className}`} {...props}>
            {/* Single static <style> tag — minified string constant, never recreated */}
            <style>{GLOBAL_STYLES}</style>
            {children}
        </div>
    );
});

// ── PageLayoutHeader ──────────────────────────────────────────────────────────

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
        <header className={`bg-white ${border ? 'border-b border-zinc-200' : ''} ${className}`}>
            <Container className={compact ? 'py-2 sm:py-3 md:py-4' : 'py-3 sm:py-4 md:py-5 lg:py-6'}>
                {children}
            </Container>
        </header>
    );
});

// ── PageLayoutContent ─────────────────────────────────────────────────────────

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

// ── PageLayout (compound component) ──────────────────────────────────────────

export const PageLayout = Object.assign(PageLayoutRoot, {
    Header:  PageLayoutHeader,
    Content: PageLayoutContent,
});