export const size = { width: 64, height: 64 };
export const contentType = 'image/svg+xml';

export default function Icon() {
  const svg = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="12" y1="3" x2="52" y2="61" gradientUnits="userSpaceOnUse">
      <stop stop-color="#e8c87a"/>
      <stop offset="0.5" stop-color="#c9a962"/>
      <stop offset="1" stop-color="#8f7236"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="#3a2447"/>
  <path d="M32 1.3 L35.8 6.4 L32 11.5 L28.2 6.4 Z" fill="url(#g)"/>
  <path d="M32 11.5 L30.1 24.3 L32 22.4 L33.9 24.3 Z" fill="url(#g)"/>
  <path d="M30.1 24.3 C22.4 24.3 11.5 17.9 7.7 9 C6.4 5.8 9 3.2 11.5 5.1 C15.4 8.3 23 16.6 30.1 24.3" fill="url(#g)"/>
  <path d="M33.9 24.3 C41.6 24.3 52.5 17.9 56.3 9 C57.6 5.8 55 3.2 52.5 5.1 C48.6 8.3 41 16.6 33.9 24.3" fill="url(#g)"/>
  <path d="M32 26.9 C24.3 26.9 11.5 32.1 6.4 39.7 L32 39.7 Z" fill="url(#g)"/>
  <path d="M32 26.9 C39.7 26.9 52.5 32.1 57.6 39.7 L32 39.7 Z" fill="url(#g)"/>
  <line x1="32" y1="26.9" x2="32" y2="39.7" stroke="url(#g)" stroke-width="1"/>
</svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
}
