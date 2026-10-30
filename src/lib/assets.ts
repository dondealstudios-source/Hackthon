// Use small delivery assets while preserving custom organizer uploads.
const variants: Record<string, string> = {
  '/assets/vistacortex-buildfeast-transparent.png': '/assets/brand-wordmark.webp',
  '/assets/dondeal-logo-transparent.png': '/assets/dondeal-logo.webp',
  '/assets/company-express-logo.svg': '/assets/company-express-logo.webp',
  '/assets/company-express-logo.png': '/assets/company-express-logo.webp',
  '/assets/dharma-setu-logo-transparent.png': '/assets/dharma-setu-logo.webp',
  '/assets/vistacortex-organizer-transparent.png': '/assets/vistacortex-organizer.webp',
};
export const optimizedAsset = (source: string | undefined) => source ? variants[source] || source : undefined;
