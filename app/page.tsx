'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Award } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion } from 'framer-motion';
import { useShop } from '@/context/ShopContext';
import { Category } from '../types';
import { PageLayout } from '@/components/layout/PageLayout';
import { Section } from '@/components/layout/Section';
import { Container } from '@/components/layout/Container';

const Home: React.FC = () => {
  const { products, cmsContent } = useShop();

  if (!cmsContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-slate-400 text-lg">Loading…</div>
      </div>
    );
  }

  const sections = cmsContent?.content?.sections;

  if (!sections) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-pulse text-slate-400 text-lg">Loading content…</div>
        </div>
      </>
    );
  }

  const { hero, categories, featuredProducts, trustIndicators, finalCTA } = sections;

  // Get featured products dynamically
  const featuredGPUs = products.filter(p => p.category === Category.GPU).slice(0, 2);
  const featuredCPUs = products.filter(p => p.category === Category.PROCESSOR).slice(0, 2);
  const selectedProducts = [...featuredGPUs, ...featuredCPUs];

  // Helper to get icon component from string name
  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Package;
    return Icon;
  };

  return (
    <PageLayout bgClass="bg-white">
      {/* HERO SECTION */}
      <section className="relative flex items-center overflow-hidden bg-white py-8 lg:py-10">
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')]" />

        {/* Minimal gradient accents */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-blue-50 via-transparent to-transparent opacity-40 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-slate-50 via-transparent to-transparent opacity-30 blur-3xl" />

        <Container className="relative z-10">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 lg:gap-20 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl"
            >
              {/* Premium badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2.5 mb-4 px-3 py-1.5 rounded-full bg-slate-900/5 border border-slate-200/60"
              >
                {hero.badge.icon && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                <span className="text-sm font-medium text-slate-700">{hero.badge.text}</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="text-[clamp(2rem,5vw,3rem)] font-bold leading-[1.08] tracking-[-0.02em] mb-4"
              >
                <span className="text-slate-900">{hero.headline.line1}</span>
                <br />
                {hero.headline.line2Gradient ? (
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {hero.headline.line2}
                  </span>
                ) : (
                  <span className="text-slate-900">{hero.headline.line2}</span>
                )}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="text-base lg:text-lg text-slate-600 mb-6 max-w-lg leading-relaxed"
              >
                {hero.subheadline}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href={hero.primaryCTA.link} className="inline-block">
                  <button className="group relative w-full sm:w-auto px-7 py-3.5 bg-slate-900 text-white rounded-lg font-medium overflow-hidden transition-all hover:shadow-lg hover:shadow-slate-900/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="relative flex items-center justify-center gap-2">
                      {hero.primaryCTA.text}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                </Link>
                <Link href={hero.secondaryCTA.link} className="inline-block">
                  <button className="w-full sm:w-auto px-7 py-3.5 bg-white text-slate-900 rounded-lg font-medium border border-slate-200 hover:bg-slate-50 transition-all">
                    {hero.secondaryCTA.text}
                  </button>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.7 }}
                className="mt-8 grid grid-cols-3 gap-6 pt-6 border-t border-slate-200"
              >
                {hero.stats.map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl lg:text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                    <div className="text-xs lg:text-sm text-slate-500 font-medium">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative lg:ml-auto"
            >
              {/* Main image container */}
              <div className="relative w-full max-w-lg mx-auto lg:mx-0">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 shadow-2xl shadow-slate-900/10">
                  <img
                    src={hero.heroImage.url}
                    alt={hero.heroImage.alt}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-slate-900/0 to-slate-900/5" />
                </div>

                {/* Floating badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="absolute -bottom-4 -left-4 sm:-left-6 bg-white rounded-xl shadow-lg p-4 sm:p-5 max-w-[240px]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm mb-0.5">{hero.floatingBadge.title}</div>
                      <div className="text-xs text-slate-600">{hero.floatingBadge.subtitle}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* CATEGORIES SECTION */}
      <Section className="bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{categories.sectionTitle}</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.categories
            .sort((a, b) => a.order - b.order)
            .map((category, i) => {
              const Icon = getIcon(category.icon);
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                >
                  <Link
                    href={`/catalog?category=${encodeURIComponent(category.categoryKey)}`}
                    className="group block bg-white rounded-xl p-6 hover:shadow-lg transition-all border border-slate-200 hover:border-blue-300"
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                      <Icon className="w-6 h-6 text-slate-700 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <h3 className="text-center font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                  </Link>
                </motion.div>
              );
            })}
        </div>
      </Section>

      {/* FEATURED PRODUCTS */}
      <Section className="bg-gradient-to-b from-white to-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{featuredProducts.sectionTitle}</h2>
          <p className="text-base text-slate-600">{featuredProducts.sectionSubtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {selectedProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
            >
              <Link href={`/product/${product.id}`}>
                <div className="group relative bg-white rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-slate-200 transition-all hover:shadow-xl">
                  {/* Image */}
                  <div className="aspect-square bg-slate-50 relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.stock < 5 && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        Low Stock
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wider">
                      {product.category}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 min-h-[3rem]">
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="text-2xl font-bold text-slate-900">
                        ₹{(product.price / 1000).toFixed(0)}k
                      </div>
                      <button className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Link href={featuredProducts.ctaLink}>
            <button className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all inline-flex items-center gap-2">
              {featuredProducts.ctaText}
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </motion.div>
      </Section>

      {/* TRUST INDICATORS */}
      <Section className="bg-white border-y border-slate-100">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustIndicators.features
            .sort((a, b) => a.order - b.order)
            .map((feature, i) => {
              const Icon = getIcon(feature.icon);
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="text-center"
                >
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
        </div>
      </Section>

      {/* FINAL CTA */}
      <Section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden" spacing="xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {finalCTA.headline}
          </h2>
          <p className="text-base text-slate-300 mb-6 max-w-2xl mx-auto">
            {finalCTA.subheadline}
          </p>
          <Link href={finalCTA.ctaLink}>
            <button className="px-8 py-3.5 bg-white text-slate-900 rounded-xl font-bold text-base hover:bg-slate-100 transition-all inline-flex items-center gap-2 shadow-2xl">
              {finalCTA.ctaText}
              <ArrowRight className="w-6 h-6" />
            </button>
          </Link>
        </motion.div>
      </Section>
    </PageLayout>
  );
};

export default Home;