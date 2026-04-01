import type { BrowserContext } from 'playwright';
import * as Cheerio from 'cheerio';

export interface PassiveModule {
  name: string;
  run(target?: string): Promise<ModuleResult>;
}

export interface ActiveModule {
  name: string;
  run(target?: string, sharedData?: SharedHtmlData): Promise<ModuleResult>;
}

export interface ModuleResult<U = unknown> {
  success: boolean;
  data?: U;
  error?: string;
}

export type OutputFormat = 'text' | 'json' | 'xml';

export interface SharedHtmlData {
  html: string;
  $: Cheerio.CheerioAPI;
  isDynamic: boolean;
  url: string;
  robotsContent?: string;
  sitemapUrls?: string[];
  browserContext?: BrowserContext;
}

export interface MetadataResult {
  title: string;
  description: string;
}

export type EmailResult = string[];

export type PhoneResult = string[];

export interface GeoResult {
  country: string;
  city: string;
  isp: string;
  ip: string;
}

export interface SocialResult {
  facebook?: string[];
  twitter?: string[];
  instagram?: string[];
  linkedin?: string[];
  youtube?: string[];
  tiktok?: string[];
  pinterest?: string[];
  reddit?: string[];
  github?: string[];
  mastodon?: string[];
}

export type HeadersResult = string[];

export type SecurityResult = string[];

export type SubdomainsResult = string[];

export interface SSLResult {
  commonName: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysLeft: number;
}

export interface RobotsResult {
  url: string;
  disallowed: string[];
  allowed: string[];
  sitemaps: string[];
}

export interface TechResult {
  name: string;
  category: string;
  evidence: string;
}

export type WpluginsResult = string[];

export interface OSResult {
  os: string;
  evidence: string;
}

export interface SitemapResult {
  url: string;
}

export interface WhoisResult {
  domain_name: string;
  edge_ip: string;
  nameservers: string[];
  registrar: string;
  creation_date: string;
  expiration_date: string;
  remaining_time_in_days: number | string;
  status: string;
}

export interface MxResult {
  preference: number;
  mail_server: string;
}

export interface StorageItem {
  key: string;
  value: string;
}

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export interface StorageResult {
  localStorage: StorageItem[];
  sessionStorage: StorageItem[];
  jwtTokens: {
    key: string;
    storage: 'localStorage' | 'sessionStorage';
    decoded: DecodedJwt | null;
  }[];
}

export interface CookieResult {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
  expires: number;
}

export type RoutesResult = string[];

export interface Results {
  whois?: ModuleResult<WhoisResult>;
  mx?: ModuleResult<MxResult[]>;
  txt?: ModuleResult<string[]>;
  subdomains?: ModuleResult<SubdomainsResult>;
  headers?: ModuleResult<HeadersResult>;
  security?: ModuleResult<SecurityResult>;
  tech?: ModuleResult<TechResult[]>;
  wplugins?: ModuleResult<WpluginsResult>;
  ssl?: ModuleResult<SSLResult>;
  geo?: ModuleResult<GeoResult>;
  os?: ModuleResult<OSResult>;
  metadata?: ModuleResult<MetadataResult>;
  emails?: ModuleResult<EmailResult>;
  phones?: ModuleResult<PhoneResult>;
  sitemap?: ModuleResult<SitemapResult>;
  robots?: ModuleResult<RobotsResult>;
  social?: ModuleResult<SocialResult>;
  routes?: ModuleResult<RoutesResult>;
  cookies?: ModuleResult<CookieResult[]>;
  storage?: ModuleResult<StorageResult>;
}

export interface ScanOutput {
  target: string;
  results: Results;
}
