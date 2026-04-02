# Changelog

## v0.0.8 - April 2, 2026

### feat: enhance sitemap module to discover all URLs recursively from sitemap indexes

- Complete rewrite of sitemap module to discover all sitemap URLs
- Now receives sitemap URLs from robots.txt via sharedData
- Parses XML to extract URLs from both regular sitemaps and sitemap indexes
- Recursive discovery of nested sitemaps (up to depth 3)
- Returns sitemapIndexes, sitemaps, and urls (max 1000)
- Supports fallback to common sitemap paths (/sitemap.xml, /sitemap_index.xml, /sitemap-index.xml)

## v0.0.7 - April 2, 2026

### fix: improve tech detection specificity to reduce false positives

- Removed overly generic patterns that caused false positives: React (createElement), Angular (ng-\* attributes), Bootstrap (btn-primary classes), Tailwind (utility classes)
- Made detection more strict to only match explicit CDN URLs and library-specific indicators
- Fixed false detection of React, Angular, Bootstrap, Tailwind CSS on Astro sites and other frameworks

## v0.0.6 - April 2, 2026

### feat: enhance tech detection module with 80+ patterns and version extraction

- Expanded tech detection from 13 to 80+ technology patterns across 14 categories
- Added detection for: Analytics (GA4, Plausible, Hotjar, Mixpanel, Umami, Matomo, etc.), JavaScript Frameworks (React, Vue, Angular, Svelte, Solid, Next.js, Nuxt, Remix, Astro, SvelteKit, Gatsby, Alpine.js, Lit), JavaScript Libraries (jQuery, Lodash, Axios, RxJS, D3.js, Three.js, Chart.js, Recharts, GSAP, etc.), UI Frameworks (Tailwind CSS, Bootstrap, Material UI, shadcn/ui, Radix UI, Chakra UI, Ant Design, Vuetify, etc.), CMS (WordPress, Shopify, Ghost, Strapi, Sanity, Contentful, Webflow, Squarespace, Wix), Hosting/CDN (Vercel, Netlify, Cloudflare, AWS, Firebase, Hostinger, DigitalOcean, GitHub Pages, Render, Railway), Authentication (Google Sign-in, Auth0, Clerk, Supabase Auth), Font Scripts (Google Fonts, FontAwesome, Lucide, Typekit), and Miscellaneous (RSS, Open Graph, Twitter Cards, PWA, JSON-LD, reCAPTCHA, Cloudflare Turnstile)
- Added version extraction for technologies where available (CDN URLs, meta tags, query params)
- Improved CLI output formatting to filter out undefined/null fields from object arrays
- Replaced if-else chain with structured pattern system for better maintainability
