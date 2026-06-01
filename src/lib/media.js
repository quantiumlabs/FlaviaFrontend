export function getMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // Ensure the path starts with /uploads/
  let path = url;
  if (!path.startsWith('/uploads/') && !path.startsWith('uploads/')) {
    path = `/uploads/${path.startsWith('/') ? path.slice(1) : path}`;
  } else if (path.startsWith('uploads/')) {
    path = `/${path}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ceusgame.com:5522';
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return `${cleanBaseUrl}${path}`;
}
