const fs = require('fs');
const file = 'e:\\web-dev\\pc-system\\md_client\\app\\(app)\\build-guides\\page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove approxPrice from everywhere
content = content.replace(/,\s*approxPrice:\s*\d+/g, '');
content = content.replace(/approxPrice:\s*number;/g, '');

// 2. Insert helpers before // ------------------------------------------------------------------- // Guide Card
const helpers = `
// -------------------------------------------------------------------
// Helper functions
// -------------------------------------------------------------------
function getMatchedProductsForGuide(guide: Guide, products: any[]) {
    return guide.components.map(comp => {
        const searchTerms = comp.name.toLowerCase().split(' ').filter(word => word.length > 2);
        let matched = products.find(p => searchTerms.some(term => p.name.toLowerCase().includes(term)) && p.category.toLowerCase() === comp.category.toLowerCase());

        if (!matched) {
            matched = products.find(p => p.name.toLowerCase().includes(comp.name.toLowerCase()) || comp.name.toLowerCase().includes(p.name.toLowerCase()));
        }
        
        if (!matched && process.env.NODE_ENV === 'development') {
            console.warn(\`[Build Guides] Could not find product match for component: \${comp.name} (\${comp.category})\`);
        }

        return {
            guideComponent: comp,
            matchedProduct: matched || null
        };
    });
}

// -------------------------------------------------------------------
// Guide Card
`;
content = content.replace('// -------------------------------------------------------------------\r\n// Guide Card', helpers);
content = content.replace('// -------------------------------------------------------------------\n// Guide Card', helpers);

// 3. Update GuideCard definition
content = content.replace(
    'const GuideCard: React.FC<{ guide: Guide; onStartBuild: () => void }> = ({ guide, onStartBuild }) => {',
    'const GuideCard: React.FC<{ guide: Guide; products: any[]; onStartBuild: () => void }> = ({ guide, products, onStartBuild }) => {'
);

// 4. Update Icon and total
content = content.replace(
    '    const Icon = guide.icon;\r\n    const total = guide.components.reduce((s, c) => s + c.approxPrice, 0);',
    '    const Icon = guide.icon;\r\n    const matchedProducts = useMemo(() => getMatchedProductsForGuide(guide, products), [guide, products]);\r\n    const total = useMemo(() => matchedProducts.reduce((sum, item) => sum + (item.matchedProduct?.price || 0), 0), [matchedProducts]);'
);
content = content.replace(
    '    const Icon = guide.icon;\n    const total = guide.components.reduce((s, c) => s + c.approxPrice, 0);',
    '    const Icon = guide.icon;\n    const matchedProducts = useMemo(() => getMatchedProductsForGuide(guide, products), [guide, products]);\n    const total = useMemo(() => matchedProducts.reduce((sum, item) => sum + (item.matchedProduct?.price || 0), 0), [matchedProducts]);'
);

// 5. Update expand component mapping
const oldMapping = `{guide.components.map((comp, i) => (
                            <div key={i} className="flex items-center justify-between text-xs px-3 py-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                                <div>
                                    <span className="font-semibold text-zinc-500 uppercase text-[10px] tracking-wide block">{comp.category}</span>
                                    <span className="text-zinc-800 font-medium">{comp.name}</span>
                                </div>
                                <span className="font-bold text-zinc-700 ml-4 flex-shrink-0">₹{comp.approxPrice.toLocaleString('en-IN')}</span>
                            </div>
                        ))}`;
const newMapping = `{matchedProducts.map(({ guideComponent: comp, matchedProduct }, i) => (
                            <div key={i} className="flex items-center justify-between text-xs px-3 py-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                                <div className="min-w-0 pr-4">
                                    <span className="font-semibold text-zinc-500 uppercase text-[10px] tracking-wide block">{comp.category}</span>
                                    <span className="text-zinc-800 font-medium truncate block">{matchedProduct ? matchedProduct.name : comp.name}</span>
                                </div>
                                <span className="font-bold text-zinc-700 ml-4 flex-shrink-0">
                                    {matchedProduct ? \`₹\${matchedProduct.price.toLocaleString('en-IN')}\` : <span className="text-red-500">Unavailable</span>}
                                </span>
                            </div>
                        ))}`;
content = content.replace(oldMapping, newMapping);
content = content.replace(oldMapping.replace(/\n/g, '\r\n'), newMapping.replace(/\n/g, '\r\n'));

// 6. modify handleStartBuild in BuildGuidesPage
const oldHandleStartBuild = `    const handleStartBuild = (guide: Guide) => {
        const newCart: any[] = [];
        guide.components.forEach(comp => {
            // Find a product whose name loosely matches the component name
            const searchTerms = comp.name.toLowerCase().split(' ').filter(word => word.length > 2);
            let matched = products.find(p => searchTerms.some(term => p.name.toLowerCase().includes(term)) && p.category.toLowerCase() === comp.category.toLowerCase());

            // Fallback: just match by name if category mismatched slightly
            if (!matched) {
                matched = products.find(p => p.name.toLowerCase().includes(comp.name.toLowerCase()) || comp.name.toLowerCase().includes(p.name.toLowerCase()));
            }

            if (matched) newCart.push({ ...matched, quantity: 1 });
        });
        loadCart(newCart);
        router.push('/products?mode=build');
        setTimeout(() => setCartOpen(true), 500);
    };`;
const newHandleStartBuild = `    const handleStartBuild = (guide: Guide) => {
        const matched = getMatchedProductsForGuide(guide, products);
        const newCart = matched
            .filter(item => item.matchedProduct)
            .map(item => ({ ...item.matchedProduct, quantity: 1 }));
            
        loadCart(newCart);
        router.push('/products?mode=build');
        setTimeout(() => setCartOpen(true), 500);
    };`;
content = content.replace(oldHandleStartBuild, newHandleStartBuild);
content = content.replace(oldHandleStartBuild.replace(/\n/g, '\r\n'), newHandleStartBuild.replace(/\n/g, '\r\n'));

// 7. fix import useMemo
content = content.replace("import React, { useState } from 'react';", "import React, { useState, useMemo } from 'react';");

// 8. modify <GuideCard ... />
content = content.replace(
    '<GuideCard key={guide.id} guide={guide} onStartBuild={() => handleStartBuild(guide)} />',
    '<GuideCard key={guide.id} guide={guide} products={products} onStartBuild={() => handleStartBuild(guide)} />'
);

fs.writeFileSync(file, content);
console.log('Modified page.tsx');
