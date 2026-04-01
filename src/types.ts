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

export interface Results {
  whois?: ModuleResult;
  dns?: ModuleResult;
  mx?: ModuleResult;
  txt?: ModuleResult;
  subdomains?: ModuleResult;
  headers?: ModuleResult<HeadersResult>;
  security?: ModuleResult<SecurityResult>;
  tech?: ModuleResult;
  wplugins?: ModuleResult;
  ssl?: ModuleResult;
  geo?: ModuleResult<GeoResult>;
  os?: ModuleResult;
  metadata?: ModuleResult<MetadataResult>;
  emails?: ModuleResult<EmailResult>;
  phones?: ModuleResult<PhoneResult>;
  sitemap?: ModuleResult;
  robots?: ModuleResult;
  social?: ModuleResult<SocialResult>;
}

export interface ScanOutput {
  target: string;
  results: Results;
}
