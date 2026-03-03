import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const products = await prisma.product.findMany({
        select: {
            id: true,
            updatedAt: true,
        }
    })

    const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${product.id}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
    }))

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/builds`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/builds/new`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        }
    ]

    return [...staticPages, ...productEntries]
}
