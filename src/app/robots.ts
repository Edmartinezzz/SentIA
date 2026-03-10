import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://SentIA-xi-two.vercel.app" // Update with final custom domain later if added

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/_next/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}

