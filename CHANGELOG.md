# Changelog

## v0.0.6 - April 2, 2026

### feat: enhance tech detection module with 80+ patterns and version extraction

- Expanded tech detection from 13 to 80+ technology patterns across 14 categories
- Added detection for: Analytics (GA4, Plausible, Hotjar, Mixpanel, Umami, Matomo, etc.), JavaScript Frameworks (React, Vue, Angular, Svelte, Solid, Next.js, Nuxt, Remix, Astro, SvelteKit, Gatsby, Alpine.js, Lit), JavaScript Libraries (jQuery, Lodash, Axios, RxJS, D3.js, Three.js, Chart.js, Recharts, GSAP, etc.), UI Frameworks (Tailwind CSS, Bootstrap, Material UI, shadcn/ui, Radix UI, Chakra UI, Ant Design, Vuetify, etc.), CMS (WordPress, Shopify, Ghost, Strapi, Sanity, Contentful, Webflow, Squarespace, Wix), Hosting/CDN (Vercel, Netlify, Cloudflare, AWS, Firebase, Hostinger, DigitalOcean, GitHub Pages, Render, Railway), Authentication (Google Sign-in, Auth0, Clerk, Supabase Auth), Font Scripts (Google Fonts, FontAwesome, Lucide, Typekit), and Miscellaneous (RSS, Open Graph, Twitter Cards, PWA, JSON-LD, reCAPTCHA, Cloudflare Turnstile)
- Added version extraction for technologies where available (CDN URLs, meta tags, query params)
- Improved CLI output formatting to filter out undefined/null fields from object arrays
- Replaced if-else chain with structured pattern system for better maintainability
