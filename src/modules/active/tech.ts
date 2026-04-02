import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';
import { getHtml } from '@/utils/get_html';

interface TechDetection {
  name: string;
  category: string;
  version?: string;
  evidence: string;
}

interface TechPattern {
  name: string;
  category: string;
  patterns: (string | RegExp)[];
  versionPattern?: RegExp;
}

const TECH_PATTERNS: TechPattern[] = [
  // ── Analytics ──
  {
    name: 'Google Analytics',
    category: 'Analytics',
    patterns: [/gtag\(['"]config['"],\s*['"]UA-/g, /google-analytics\.com\/ga\.js/g, /urchin\.js/g],
    versionPattern: /UA-\d+-\d+/g,
  },
  {
    name: 'Google Analytics 4',
    category: 'Analytics',
    patterns: [/gtag\(['"]config['"],\s*['"]G-/g, /googletagmanager\.com\/gtag\/js\?id=G-/g],
  },
  {
    name: 'Google Tag Manager',
    category: 'Analytics',
    patterns: [/googletagmanager\.com\/gtm\.js/g, /googletagmanager\.com\/ns\.html/g],
  },
  {
    name: 'Simple Analytics',
    category: 'Analytics',
    patterns: [/cdn\.simpleanalytics\.io/g, /queue\.simpleanalyticscdn\.com/g],
  },
  {
    name: 'Plausible',
    category: 'Analytics',
    patterns: [/plausible\.analytics/g, /plausible\.js/g, /plausible\.io\/js/g],
  },
  {
    name: 'Hotjar',
    category: 'Analytics',
    patterns: [/static\.hotjar\.com/g, /hotjar\.com\/t\/g\/c\.js/g],
  },
  {
    name: 'Mixpanel',
    category: 'Analytics',
    patterns: [/cdn\.mxpnl\.com/g, /api\.mixpanel\.com\/track/g],
  },
  {
    name: 'Vercel Analytics',
    category: 'Analytics',
    patterns: [/va\.vercel\.analytics/g, /\/_vercel\/insights/g],
  },
  {
    name: 'Umami',
    category: 'Analytics',
    patterns: [/umami\.is\/script\.js/g, /\/umami\.js/g],
  },
  {
    name: 'Matomo',
    category: 'Analytics',
    patterns: [/matomo\.js/g, /piwik\.js/g, /piwik\.php/g],
  },
  {
    name: 'Crazy Egg',
    category: 'Analytics',
    patterns: [/script\.crazyegg\.com/g],
  },
  {
    name: 'Yandex.Metrika',
    category: 'Analytics',
    patterns: [/mc\.yandex\.ru/g, /metrika\.yandex\.ru/g],
  },

  // ── JavaScript Frameworks ──
  {
    name: 'React',
    category: 'JavaScript Framework',
    patterns: [
      /react-dom/g,
      /__react/g,
      /data-reactroot/g,
      /react\.production/g,
      /react\.development/g,
      /createElement\(/g,
    ],
    versionPattern: /react(?:-dom)?[.@\/](\d+\.\d+\.\d+)/gi,
  },
  {
    name: 'Vue.js',
    category: 'JavaScript Framework',
    patterns: [
      /vue\.(?:runtime\.)?(?:production|development)/g,
      /__VUE_OPTIONS_API__/g,
      /vue-router/g,
    ],
    versionPattern: /vue[.@\/](\d+\.\d+\.\d+)/gi,
  },
  {
    name: 'Angular',
    category: 'JavaScript Framework',
    patterns: [/ng-version=/g, /ng-[a-z-]+/g, /@angular\/core/g, /angular\.min\.js/g],
    versionPattern: /ng-version="(\d+\.\d+\.\d+)"/g,
  },
  {
    name: 'Svelte',
    category: 'JavaScript Framework',
    patterns: [/svelte/g, /__svelte/g, /svelte\.internal/g, /svelte\/src/g],
  },
  {
    name: 'Solid.js',
    category: 'JavaScript Framework',
    patterns: [/solid-js/g, /solid\.production/g],
  },
  {
    name: 'Preact',
    category: 'JavaScript Framework',
    patterns: [/preact/g, /preact\.min\.js/g, /preact-compat/g],
  },
  {
    name: 'Next.js',
    category: 'JavaScript Framework',
    patterns: [/__next_f/g, /_next\/static/g, /next-hal-stack/g, /_next\/data/g, /next\.js/g],
  },
  {
    name: 'Nuxt',
    category: 'JavaScript Framework',
    patterns: [/__NUXT__/g, /_nuxt\//g, /nuxt\.js/g, /nuxt-link/g, /nuxt-app/g, /__NUXT_DATA__/g],
  },
  {
    name: 'Remix',
    category: 'JavaScript Framework',
    patterns: [/__remix_context/g, /remix/g, /@remix-run/g],
  },
  {
    name: 'Astro',
    category: 'JavaScript Framework',
    patterns: [/_astro\//g, /astro\.js/g],
  },
  {
    name: 'SvelteKit',
    category: 'JavaScript Framework',
    patterns: [/_app\/immutable/g, /__sveltekit/g, /svelte-kit/g],
  },
  {
    name: 'Gatsby',
    category: 'JavaScript Framework',
    patterns: [/gatsby\//g, /___loader/g, /gatsby-script/g, /page-data\.json/g],
  },
  {
    name: 'Ember.js',
    category: 'JavaScript Framework',
    patterns: [/ember\.js/g, /ember\.min\.js/g, /data-ember-action/g],
  },
  {
    name: 'Alpine.js',
    category: 'JavaScript Framework',
    patterns: [/alpine\.js/g, /x-data/g, /x-init/g, /alpinejs/g],
  },
  {
    name: 'Lit',
    category: 'JavaScript Framework',
    patterns: [/lit-element/g, /lit-html/g, /@lit\/reactive-element/g],
  },

  // ── JavaScript Libraries ──
  {
    name: 'jQuery',
    category: 'JavaScript Library',
    patterns: [/jquery/g, /jQuery\.fn\.jquery/g, /jquery\.min\.js/g],
    versionPattern: /jquery[.@\/](\d+\.\d+\.\d+)/gi,
  },
  {
    name: 'Lodash',
    category: 'JavaScript Library',
    patterns: [/lodash/g, /lodash\.min\.js/g, /lodash\.core/g],
    versionPattern: /lodash[.@\/](\d+\.\d+\.\d+)/gi,
  },
  {
    name: 'Axios',
    category: 'JavaScript Library',
    patterns: [/axios\.min\.js/g, /axios\.js/g],
  },
  {
    name: 'RxJS',
    category: 'JavaScript Library',
    patterns: [/rxjs/g, /rxjs\.umd\.js/g],
  },
  {
    name: 'D3.js',
    category: 'JavaScript Library',
    patterns: [/d3\.js/g, /d3\.min\.js/g, /d3-array/g, /d3-selection/g],
    versionPattern: /d3[.@\/](\d+\.\d+\.\d+)/gi,
  },
  {
    name: 'Three.js',
    category: 'JavaScript Library',
    patterns: [/three\.js/g, /three\.min\.js/g, /three\.module\.js/g],
    versionPattern: /three[.@\/](\d+)/gi,
  },
  {
    name: 'Chart.js',
    category: 'JavaScript Library',
    patterns: [/chart\.js/g, /chart\.min\.js/g],
    versionPattern: /chart[.@\/](\d+\.\d+\.\d+)/gi,
  },
  {
    name: 'Recharts',
    category: 'JavaScript Library',
    patterns: [/recharts/g, /recharts.min.js/g],
  },
  {
    name: 'Moment.js',
    category: 'JavaScript Library',
    patterns: [/moment\.js/g, /moment\.min\.js/g],
    versionPattern: /moment[.@\/](\d+\.\d+\.\d+)/gi,
  },
  {
    name: 'Date-fns',
    category: 'JavaScript Library',
    patterns: [/date-fns/g],
  },
  {
    name: 'GSAP',
    category: 'JavaScript Library',
    patterns: [/gsap/g, /TweenMax/g, /TweenLite/g, /ScrollTrigger/g],
  },

  // ── UI Frameworks ──
  {
    name: 'Tailwind CSS',
    category: 'UI Framework',
    patterns: [
      /class="[^"]*\b(?:text-|bg-|border-|flex-|grid-|space-|divide-|ring-|shadow-|rounded-|px-|py-|mx-|my-|w-|h-|max-|min-|overflow-|opacity-|transition-|duration-|ease-|delay-|transform|scale-|rotate-|translate-|skew-|origin-|animate-|cursor-|select-|resize-|appearance-|placeholder-|caret-|accent-|fill-|stroke-|scroll-|snap-|aspect-|object-|inset-|z-|order-|col-|row-|gap-|justify-|items-|content-|self-|place-|align-)(?:\w|-)*\b/g,
      /tailwindcss/g,
      /tailwind\.css/g,
    ],
  },
  {
    name: 'Bootstrap',
    category: 'UI Framework',
    patterns: [
      /bootstrap/g,
      /bootstrap\.min\.css/g,
      /bootstrap\.bundle/g,
      /btn-primary/g,
      /navbar-toggler/g,
    ],
    versionPattern: /bootstrap[.@\/](\d+\.\d+\.\d+)/gi,
  },
  {
    name: 'Material UI',
    category: 'UI Framework',
    patterns: [/@mui\/material/g, /@material-ui\/core/g, /Mui/g, /makeStyles/g],
  },
  {
    name: 'shadcn/ui',
    category: 'UI Framework',
    patterns: [/\/ui\/[a-z-]+/g, /cn\(/g, /tailwind-merge/g],
  },
  {
    name: 'Radix UI',
    category: 'UI Framework',
    patterns: [/@radix-ui/g, /radix-ui/g],
  },
  {
    name: 'Chakra UI',
    category: 'UI Framework',
    patterns: [/@chakra-ui/g, /chakra-ui/g],
  },
  {
    name: 'Ant Design',
    category: 'UI Framework',
    patterns: [/antd/g, /ant-design/g, /ant\.css/g],
  },
  {
    name: 'Semantic UI',
    category: 'UI Framework',
    patterns: [/semantic\.ui/g, /semantic\.min\.css/g],
  },
  {
    name: 'Bulma',
    category: 'UI Framework',
    patterns: [/bulma\.css/g, /bulma\.min\.css/g, /is-primary/g],
  },
  {
    name: 'Vuetify',
    category: 'UI Framework',
    patterns: [/vuetify/g, /v-app/g, /v-btn/g, /v-card/g],
  },
  {
    name: 'Quasar',
    category: 'UI Framework',
    patterns: [/quasar/g, /q-btn/g, /q-page/g],
  },

  // ── CSS ──
  {
    name: 'Styled Components',
    category: 'CSS',
    patterns: [/styled-components/g, /data-styled=/g, /data-styled-components/g],
  },
  {
    name: 'Emotion',
    category: 'CSS',
    patterns: [/@emotion\/react/g, /@emotion\/styled/g, /emotion\.css/g, /css-\w{5,}/g],
  },
  {
    name: 'Sass',
    category: 'CSS',
    patterns: [/\.scss/g, /sass\.js/g],
  },
  {
    name: 'Normalize.css',
    category: 'CSS',
    patterns: [/normalize\.css/g, /normalize\.min\.css/g],
  },
  {
    name: 'CSS Modules',
    category: 'CSS',
    patterns: [/_\w+__[a-zA-Z]/g, /\.module\.css/g],
  },

  // ── CMS ──
  {
    name: 'WordPress',
    category: 'CMS',
    patterns: [/wp-content/g, /wp-includes/g, /wp-json/g, /wp-emoji/g, /ver-wp/g],
    versionPattern: /ver=(\d+\.\d+(?:\.\d+)?)/g,
  },
  {
    name: 'Shopify',
    category: 'CMS',
    patterns: [/shopify\.com/g, /cdn\.shopify\.com/g, /Shopify\.theme/g, /shopify\.analytics/g],
  },
  {
    name: 'Ghost',
    category: 'CMS',
    patterns: [/ghost\.js/g, /ghost\/content/g, /ghost\/api/g],
    versionPattern: /generator.*Ghost\s*(\d+\.\d+\.\d+)/gi,
  },
  {
    name: 'Strapi',
    category: 'CMS',
    patterns: [/strapi/g, /strapi\.js/g, /api\/strapi/g],
  },
  {
    name: 'Sanity',
    category: 'CMS',
    patterns: [/sanity\.io/g, /cdn\.sanity\.io/g, /@sanity/g],
  },
  {
    name: 'Contentful',
    category: 'CMS',
    patterns: [/contentful\.com/g, /cdn\.contentful\.com/g, /contentful\.js/g],
  },
  {
    name: 'Webflow',
    category: 'CMS',
    patterns: [/webflow\.com/g, /cdn\.prod\.webflow\.com/g, /wf-section/g],
  },
  {
    name: 'Squarespace',
    category: 'CMS',
    patterns: [/squarespace\.com/g, /static\.squarespace\.com/g],
  },
  {
    name: 'Wix',
    category: 'CMS',
    patterns: [/wix\.com/g, /static\.parastorage\.com/g, /wix-public/g],
  },

  // ── E-Commerce ──
  {
    name: 'WooCommerce',
    category: 'E-Commerce',
    patterns: [/woocommerce/g, /wc-ajax/g, /woocommerce\.js/g],
  },
  {
    name: 'Stripe',
    category: 'E-Commerce',
    patterns: [/js\.stripe\.com/g, /stripe\.js/g, /Stripe\(/g],
  },
  {
    name: 'PayPal',
    category: 'E-Commerce',
    patterns: [/paypal\.com\/sdk/g, /paypal\.js/g, /checkout\.paypal/g],
  },

  // ── Hosting/CDN ──
  {
    name: 'Vercel',
    category: 'Hosting',
    patterns: [/_vercel/g, /vercel\.com/g, /vcap\.me/g],
  },
  {
    name: 'Netlify',
    category: 'Hosting',
    patterns: [/netlify\.com/g, /netlify\.app/g, /cdn\.netlify\.com/g],
  },
  {
    name: 'Cloudflare',
    category: 'CDN',
    patterns: [
      /cloudflare\.com/g,
      /cdn\.cloudflare\.com/g,
      /cf-cache-status/g,
      /cloudflareinsights/g,
    ],
  },
  {
    name: 'AWS',
    category: 'Hosting',
    patterns: [/cloudfront\.net/g, /s3\.amazonaws\.com/g, /aws\.cloudfront/g, /amazonaws\.com/g],
  },
  {
    name: 'Firebase',
    category: 'Hosting',
    patterns: [
      /firebase\.js/g,
      /firebase\.com/g,
      /firebaseio\.com/g,
      /firebaseapp\.com/g,
      /firebase\.app/g,
    ],
  },
  {
    name: 'Hostinger',
    category: 'Hosting',
    patterns: [/hostinger\.com/g, /cdn\.hostinger\.com/g],
  },
  {
    name: 'DigitalOcean',
    category: 'Hosting',
    patterns: [/digitaloceanspaces\.com/g, /cdn\.digitalocean\.com/g],
  },
  {
    name: 'GitHub Pages',
    category: 'Hosting',
    patterns: [/github\.io/g, /pages\.github\.com/g],
  },
  {
    name: 'Render',
    category: 'Hosting',
    patterns: [/onrender\.com/g, /render\.com/g],
  },
  {
    name: 'Railway',
    category: 'Hosting',
    patterns: [/railway\.app/g, /up\.railway\.app/g],
  },

  // ── Authentication ──
  {
    name: 'Google Sign-in',
    category: 'Authentication',
    patterns: [/accounts\.google\.com/g, /gsi\/client/g, /google-signin/g, /g_id_signin/g],
  },
  {
    name: 'Auth0',
    category: 'Authentication',
    patterns: [/auth0\.com/g, /cdn\.auth0\.com/g, /auth0\.js/g],
  },
  {
    name: 'Clerk',
    category: 'Authentication',
    patterns: [/@clerk\/clerk-react/g, /clerk\.js/g, /clerk\.com/g],
  },
  {
    name: 'Supabase Auth',
    category: 'Authentication',
    patterns: [/@supabase\/supabase-js/g, /supabase\.co/g],
  },

  // ── Font Scripts ──
  {
    name: 'Google Fonts',
    category: 'Font Script',
    patterns: [/fonts\.googleapis\.com/g, /fonts\.gstatic\.com/g],
  },
  {
    name: 'FontAwesome',
    category: 'Font Script',
    patterns: [
      /fontawesome\.com/g,
      /font-awesome/g,
      /fontawesome\.css/g,
      /fa-solid/g,
      /fa-regular/g,
    ],
    versionPattern: /fontawesome[.@\/](\d+\.\d+\.\d+)/gi,
  },
  {
    name: 'Lucide',
    category: 'Font Script',
    patterns: [/lucide/g, /lucide-static/g, /lucide-react/g],
  },
  {
    name: 'Typekit',
    category: 'Font Script',
    patterns: [/use\.typekit\.net/g, /typekit\.com/g],
  },

  // ── Miscellaneous ──
  {
    name: 'RSS',
    category: 'Miscellaneous',
    patterns: [/type=["']application\/rss\+xml["']/g, /\/feed\/?["']/g],
  },
  {
    name: 'Open Graph',
    category: 'Miscellaneous',
    patterns: [/property=["']og:/g],
  },
  {
    name: 'Twitter Cards',
    category: 'Miscellaneous',
    patterns: [/name=["']twitter:/g],
  },
  {
    name: 'PWA',
    category: 'Miscellaneous',
    patterns: [/manifest\.json/g, /service-worker\.js/g, /sw\.js/g, /workbox/g],
  },
  {
    name: 'JSON-LD',
    category: 'Miscellaneous',
    patterns: [/application\/ld\+json/g],
  },
  {
    name: 'reCAPTCHA',
    category: 'Miscellaneous',
    patterns: [/recaptcha/g, /google\.com\/recaptcha/g, /g-recaptcha/g],
  },
  {
    name: 'Cloudflare Turnstile',
    category: 'Miscellaneous',
    patterns: [/challenges\.cloudflare\.com/g, /turnstile/g],
  },
];

function extractVersion(html: string, versionPattern: RegExp): string | undefined {
  const match = html.match(versionPattern);
  if (!match) return undefined;

  for (const m of match) {
    const versionMatch = m.match(/(\d+\.\d+(?:\.\d+)?)/);
    if (versionMatch) {
      return versionMatch[1];
    }
  }
  return undefined;
}

function extractWordPressVersion(html: string): string | undefined {
  const metaMatch = html.match(
    /<meta\s+name=["']generator["']\s+content=["']WordPress\s+([\d.]+)["']/i
  );
  if (metaMatch) return metaMatch[1];

  const verMatch = html.match(/ver=(\d+\.\d+(?:\.\d+)?)/);
  if (verMatch) return verMatch[1];

  return undefined;
}

export const tech: ActiveModule = {
  name: 'tech',
  async run(target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<TechDetection[]>> {
    try {
      const fullUrl =
        target.startsWith('http://') || target.startsWith('https://')
          ? target
          : `https://${target}`;

      const data = sharedData ?? (await getHtml(fullUrl));
      const html = data.html;
      const htmlLower = html.toLowerCase();
      const detected: TechDetection[] = [];
      const seen = new Set<string>();

      for (const pattern of TECH_PATTERNS) {
        for (const p of pattern.patterns) {
          const matched = typeof p === 'string' ? htmlLower.includes(p) : p.test(html);
          if (matched) {
            if (seen.has(pattern.name)) break;
            seen.add(pattern.name);

            let version: string | undefined;

            if (pattern.name === 'WordPress') {
              version = extractWordPressVersion(html);
            } else if (pattern.versionPattern) {
              version = extractVersion(html, pattern.versionPattern);
            }

            detected.push({
              name: pattern.name,
              category: pattern.category,
              version,
              evidence: `Found ${pattern.name.toLowerCase()} indicators in HTML`,
            });
            break;
          }
        }
      }

      if (detected.length === 0) {
        detected.push({
          name: 'Unknown',
          category: 'Unknown',
          evidence: 'No technologies detected',
        });
      }

      return { success: true, data: detected };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
