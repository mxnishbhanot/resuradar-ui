export const environment = {
  production: isProduction(),
  apiUrl: getApiUrl()
};

function getApiUrl(): string {
  const href = window.location.href;

  if (href.includes('localhost')) {
    // Local development
    return 'http://localhost:5000/api';
  }

  if (href.includes('render.com')) {
    // Render deployment
    return 'https://resuradar-api.onrender.com/api';
  }

  if (href.includes('prod')) {
    // Production environment (based on URL containing "prod")
    return 'https://resuradar-api.onrender.com/api';
  }

  // Default fallback
  return 'https://resuradar-api.onrender.com/api';
}

function isProduction(): boolean {
  const href = window.location.href;
  return href.includes('prod') || href.includes('render.com');
}
