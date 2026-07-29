import { BOOKING_CONFIG } from '../config/bookingConfig';

let resourcesPromise: Promise<void> | null = null;

/**
 * Loads a single JS script tag into document.head safely and returns a Promise.
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return resolve();
    }

    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      if (existingScript.getAttribute('data-loaded') === 'true') {
        return resolve();
      }
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.async = false;
    script.addEventListener('load', () => {
      script.setAttribute('data-loaded', 'true');
      resolve();
    });
    script.addEventListener('error', (err) => reject(err));
    document.head.appendChild(script);
  });
}

/**
 * Injects CSS stylesheet into document.head if not already present.
 */
function loadStylesheet(href: string): void {
  if (typeof window === 'undefined') return;

  const existingLink = document.querySelector(`link[href="${href}"]`);
  if (!existingLink) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    document.head.appendChild(link);
  }
}

/**
 * Singleton loader function for all EZEE booking engine external CSS and JS resources.
 * Ensures scripts and styles are loaded only once across the entire application lifecycle.
 */
export function loadEzeeBookingResources(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (resourcesPromise) {
    return resourcesPromise;
  }

  resourcesPromise = (async () => {
    // 1. Inject CSS stylesheets
    BOOKING_CONFIG.externalResources.css.forEach((cssUrl) => {
      loadStylesheet(cssUrl);
    });

    // 2. Load jQuery first if not already loaded
    if (!(window as any).jQuery) {
      await loadScript(BOOKING_CONFIG.externalResources.jquery);
    }

    // 3. Sequentially load dependent jQuery scripts
    for (const jsUrl of BOOKING_CONFIG.externalResources.js) {
      await loadScript(jsUrl);
    }
  })().catch((err) => {
    resourcesPromise = null; // Reset on failure so it can retry
    console.error('Failed to load EZEE Booking Engine resources:', err);
    throw err;
  });

  return resourcesPromise;
}
