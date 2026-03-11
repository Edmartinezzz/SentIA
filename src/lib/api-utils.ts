/**
 * Utility to get the correct API base URL.
 * When running in Capacitor, we need to point to the production server.
 */
export const getApiUrl = (path: string) => {
  // Check if we are in a Capacitor environment
  const isCapacitor = typeof window !== 'undefined' && 
                     ((window as any).Capacitor?.isNative || 
                      (window as any).Capacitor?.platform !== 'web');
  
  // Base production URL
  const PROD_URL = "https://clarity-xi-two.vercel.app";
  
  if (isCapacitor) {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${PROD_URL}${cleanPath}`;
  }
  
  return path;
};
