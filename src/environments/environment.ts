export const environment = {
  production: isProduction(),
  apiUrl: getApiUrl(),
  keyString: "resuradar32characsupersecretkey!"
};

function getApiUrl(): string {
  const href = window.location.href;

  if (href.includes('localhost')) {
    // Local development
    return 'http://localhost:5000/api';
  }

  if (href.includes('railway')) {
    // Render deployment
    return 'https://resuradar-api-production.up.railway.app/api';
  }

  if (href.includes('prod')) {
    // Production environment (based on URL containing "prod")
    return 'https://resuradar-api-production.up.railway.app/api';
  }

  // Default fallback
  return 'https://resuradar-api-production.up.railway.app/api';
}

function isProduction(): boolean {
  const href = window.location.href;
  return href.includes('prod') || href.includes('railway');
}
