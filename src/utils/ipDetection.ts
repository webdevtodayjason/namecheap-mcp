import axios from 'axios';

// Cache IP address
let cachedIp: string | null = null;

/**
 * Detect public IP address for Namecheap API
 */
export async function detectPublicIp(): Promise<string> {
  if (cachedIp) {
    return cachedIp;
  }

  const ipServices = [
    'https://api.ipify.org',
    'https://api.ip.sb/ip',
    'https://api.myip.com',
    'https://ifconfig.me/ip'
  ];

  for (const service of ipServices) {
    try {
      // Attempt to detect IP using this service
      const response = await axios.get(service, { timeout: 5000 });
      
      // Handle different response formats
      let ip: string;
      if (typeof response.data === 'object' && response.data.ip) {
        ip = response.data.ip;
      } else {
        ip = response.data.toString().trim();
      }
      
      // Validate IP format
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        cachedIp = ip;
        return ip;
      }
    } catch (error: any) {
      // Continue to next service
    }
  }

  throw new Error('Failed to detect public IP address from all services');
}

/**
 * Reset the cached IP address
 */
export function resetIpCache(): void {
  cachedIp = null;
} 