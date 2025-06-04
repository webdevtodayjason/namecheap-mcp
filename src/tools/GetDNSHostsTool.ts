import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios from "axios";
import * as xml2js from "xml2js";
import { detectPublicIp, resetIpCache } from "../utils/ipDetection.js";

interface GetDNSHostsInput {
  domain: string;
}

class GetDNSHostsTool extends MCPTool<GetDNSHostsInput> {
  name = "get_dns_hosts";
  description = "Retrieve DNS host records for a domain using Namecheap DNS";

  schema = {
    domain: {
      type: z.string(),
      description: "Domain name to retrieve DNS records for (e.g., example.com)",
    },
  };

  // Format response according to MCP requirements
  private formatTextResponse(message: string): any {
    return {
      content: [
        {
          type: 'text',
          text: message,
          data: message,
          mimeType: 'text/plain',
          resource: null
        }
      ]
    };
  }

  private formatRecordType(type: string): string {
    const typeMap: Record<string, string> = {
      'A': 'A Record (IPv4)',
      'AAAA': 'AAAA Record (IPv6)',
      'CNAME': 'CNAME Record (Alias)',
      'MX': 'MX Record (Mail)',
      'TXT': 'TXT Record',
      'NS': 'NS Record (Nameserver)',
      'SRV': 'SRV Record (Service)',
      'CAA': 'CAA Record (Certificate Authority)',
      'URL': 'URL Redirect',
      'URL301': 'URL Permanent Redirect',
      'FRAME': 'URL Frame'
    };
    return typeMap[type] || type;
  }

  async execute(input: GetDNSHostsInput) {
    const { domain } = input;
    
    try {
      // Extract SLD and TLD from domain
      const domainParts = domain.split('.');
      if (domainParts.length < 2) {
        throw new Error('Invalid domain format. Please provide a complete domain name (e.g., example.com)');
      }
      
      const tld = domainParts.pop()!;
      const sld = domainParts.join('.');
      
      const apiResponse = await this.callNamecheapApi('namecheap.domains.dns.getHosts', {
        SLD: sld,
        TLD: tld
      });
      
      if (!apiResponse || !apiResponse.DomainDNSGetHostsResult) {
        return this.formatTextResponse(
          `Unable to retrieve DNS records for ${domain}. ` +
          `The domain may not exist or you may not have access to it.`
        );
      }
      
      const dnsResult = apiResponse.DomainDNSGetHostsResult;
      
      // Check if we have the attributes
      if (!dnsResult.$ || typeof dnsResult.$ !== 'object') {
        console.error('Missing DNS result attributes:', dnsResult);
        return this.formatTextResponse(`Unable to determine DNS status for ${domain}.`);
      }
      
      // Check if domain is using Namecheap DNS
      if (dnsResult.$.IsUsingOurDNS === 'false') {
        return this.formatTextResponse(
          `Domain ${domain} is not using Namecheap DNS.\\n\\n` +
          `This tool only works for domains using Namecheap's nameservers.\\n` +
          `Use 'get_domain_info' to see current nameservers.`
        );
      }
      
      let response = `DNS Records for ${domain}\\n\\n`;
      
      // Check for both Host and host (API returns lowercase)
      const hostData = dnsResult.Host || dnsResult.host;
      
      if (!hostData) {
        response += `No DNS records found. The domain is using Namecheap DNS but has no configured records.`;
        return this.formatTextResponse(response);
      }
      
      // Handle both single host and array of hosts
      const hosts = Array.isArray(hostData) ? hostData : [hostData];
      
      // Group records by type for better readability
      const recordsByType: Record<string, any[]> = {};
      hosts.forEach((host: any) => {
        // Handle both host.$ and direct host attributes
        const hostAttrs = host.$ || host;
        if (!hostAttrs.Type) {
          console.error('Host missing Type attribute:', host);
          return;
        }
        
        const type = hostAttrs.Type;
        if (!recordsByType[type]) {
          recordsByType[type] = [];
        }
        recordsByType[type].push(hostAttrs);
      });
      
      // Display records grouped by type
      Object.entries(recordsByType).forEach(([type, records]) => {
        response += `${this.formatRecordType(type)}:\\n`;
        
        records.forEach((record: any) => {
          const hostName = record.Name === '@' ? domain : 
                          record.Name ? `${record.Name}.${domain}` : domain;
          
          response += `  ${hostName}`;
          
          // Format based on record type
          if (type === 'MX') {
            response += ` → ${record.Address} (Priority: ${record.MXPref || '10'})`;
          } else if (type === 'SRV') {
            response += ` → ${record.Address}`;
            if (record.Weight || record.Port || record.Priority) {
              response += ` (Priority: ${record.Priority || '0'}, Weight: ${record.Weight || '0'}, Port: ${record.Port || '0'})`;
            }
          } else if (type === 'CAA') {
            response += ` → ${record.Address}`;
            if (record.Flag) {
              response += ` (Flag: ${record.Flag})`;
            }
          } else {
            response += ` → ${record.Address}`;
          }
          
          response += ` [TTL: ${record.TTL || '1800'}]\\n`;
        });
        
        response += `\\n`;
      });
      
      // Add email settings if MX records exist
      if (recordsByType['MX']) {
        response += `Email Configuration: Domain is configured to receive email\\n`;
      }
      
      return this.formatTextResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        return this.formatTextResponse(`Error fetching DNS records: ${error.message}`);
      }
      return this.formatTextResponse(`Error fetching DNS records: Unknown error`);
    }
  }

  private async callNamecheapApi(command: string, params: Record<string, string> = {}): Promise<any> {
    const apiKey = process.env.NC_API_KEY || process.env.NAMECHEAP_API_KEY;
    const username = process.env.NC_USERNAME || process.env.NAMECHEAP_USERNAME;
    
    if (!apiKey || !username) {
      throw new Error('Namecheap API credentials not configured. Please set NC_API_KEY and NC_USERNAME environment variables.');
    }
    
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.namecheap.com/xml.response'
      : 'https://api.sandbox.namecheap.com/xml.response';
    
    try {
      const requestParams = {
        ApiUser: username,
        ApiKey: apiKey,
        UserName: username,
        ClientIp: await detectPublicIp(),
        Command: command,
        ...params
      };
      
      const response = await axios.get(apiUrl, { params: requestParams });
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(response.data);
      
      
      // Check if we have a valid API response
      if (!result || !result.ApiResponse) {
        throw new Error('Invalid API response format');
      }
      
      // Check for IP rejection errors
      if (result.ApiResponse.$ && result.ApiResponse.$.Status === 'ERROR' && result.ApiResponse.Errors) {
        const errorMsg = typeof result.ApiResponse.Errors.Error === 'string' 
          ? result.ApiResponse.Errors.Error 
          : Array.isArray(result.ApiResponse.Errors.Error) 
            ? result.ApiResponse.Errors.Error[0] 
            : result.ApiResponse.Errors.Error._;
        
        if (errorMsg && (
            errorMsg.includes('IP not whitelisted') || 
            errorMsg.includes('Invalid IP'))) {
          resetIpCache();
          // Retry once with a fresh IP
          return this.callNamecheapApi(command, params);
        }
        throw new Error(`API Error: ${errorMsg}`);
      }
      
      // Check for successful response
      if (!result.ApiResponse.$ || result.ApiResponse.$.Status !== 'OK') {
        console.error('Non-OK API status:', result.ApiResponse);
        throw new Error('API request was not successful');
      }
      
      // For DNS operations, we need the CommandResponse
      if (command.includes('dns') && result.ApiResponse.CommandResponse) {
        return result.ApiResponse.CommandResponse;
      }
      
      return result.ApiResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API request failed: ${error.message}`);
      }
      throw error;
    }
  }
}

export default GetDNSHostsTool;