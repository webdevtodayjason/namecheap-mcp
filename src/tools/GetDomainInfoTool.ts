import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios from "axios";
import * as xml2js from "xml2js";
import { detectPublicIp, resetIpCache } from "../utils/ipDetection.js";

interface GetDomainInfoInput {
  domain: string;
}

class GetDomainInfoTool extends MCPTool<GetDomainInfoInput> {
  name = "get_domain_info";
  description = "Get detailed information about a specific domain in your account";

  schema = {
    domain: {
      type: z.string(),
      description: "Domain name to get information for (e.g., example.com)",
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

  async execute(input: GetDomainInfoInput) {
    const { domain } = input;
    
    try {
      const apiResponse = await this.callNamecheapApi('namecheap.domains.getInfo', {
        DomainName: domain
      });
      
      if (!apiResponse.DomainGetInfoResult) {
        console.error('Missing DomainGetInfoResult in response');
        return this.formatTextResponse(`Unable to retrieve information for domain: ${domain}`);
      }
      
      const result = apiResponse.DomainGetInfoResult;
      const domainDetail = result.DomainDetails || {};
      const whoisGuard = result.Whoisguard || {};
      const dnsDetails = result.DnsDetails || {};
      const modificationRights = result.Modificationrights || {};
      
      let response = `Domain Information for ${domain}\\n\\n`;
      
      // Basic domain details
      response += `Status Details:\\n`;
      response += `  Created: ${domainDetail.CreatedDate || 'N/A'}\\n`;
      response += `  Expires: ${domainDetail.ExpiredDate || 'N/A'}\\n`;
      
      // Calculate days until expiry
      if (domainDetail.ExpiredDate) {
        const expiryDate = new Date(domainDetail.ExpiredDate);
        const today = new Date();
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        response += `  Days until expiry: ${daysUntilExpiry}\\n`;
      }
      
      // Domain status from main attributes
      if (result.$) {
        const isOwner = result.$.IsOwner === 'true';
        const isPremium = result.$.IsPremium === 'true';
        response += `  Owner: ${isOwner ? 'Yes' : 'No'} (${result.$.OwnerName || 'Unknown'})\\n`;
        if (isPremium) {
          response += `  Premium Domain: Yes\\n`;
        }
      }
      
      // Domain lock status
      if (result.LockDetails !== undefined) {
        const isLocked = result.LockDetails !== '';
        response += `  Domain Lock: ${isLocked ? 'Enabled' : 'Disabled'}\\n`;
      }
      
      // WhoisGuard information
      response += `\\nPrivacy Protection:\\n`;
      if (whoisGuard && whoisGuard.$) {
        response += `  WhoisGuard: ${whoisGuard.$.Enabled === 'True' ? 'Enabled' : 'Disabled'}\\n`;
        if (whoisGuard.ID) {
          response += `  WhoisGuard ID: ${whoisGuard.ID}\\n`;
        }
        if (whoisGuard.ExpiredDate) {
          response += `  WhoisGuard Expires: ${whoisGuard.ExpiredDate}\\n`;
        }
        if (whoisGuard.EmailDetails && whoisGuard.EmailDetails.$) {
          response += `  Protected Email: ${whoisGuard.EmailDetails.$.WhoisGuardEmail || 'N/A'}\\n`;
          response += `  Forwards To: ${whoisGuard.EmailDetails.$.ForwardedTo || 'N/A'}\\n`;
        }
      } else {
        response += `  WhoisGuard: Not available\\n`;
      }
      
      // DNS Provider
      response += `\\nDNS Configuration:\\n`;
      
      // Check DnsDetails structure with attributes
      if (dnsDetails.$) {
        response += `  DNS Provider: ${dnsDetails.$.ProviderType || 'Unknown'}\\n`;
        response += `  Using Namecheap DNS: ${dnsDetails.$.IsUsingOurDNS === 'true' ? 'Yes' : 'No'}\\n`;
        if (dnsDetails.$.HostCount) {
          response += `  DNS Host Records: ${dnsDetails.$.HostCount}\\n`;
        }
      }
      
      // Current nameservers
      if (dnsDetails.Nameserver) {
        const nameservers = Array.isArray(dnsDetails.Nameserver) 
          ? dnsDetails.Nameserver 
          : [dnsDetails.Nameserver];
        response += `  Nameservers:\\n`;
        nameservers.forEach((ns: string) => {
          response += `    - ${ns}\\n`;
        });
      }
      
      // Modification rights
      if (modificationRights && modificationRights.$) {
        const hasFullRights = modificationRights.$.All === 'true';
        response += `\\nModification Rights: ${hasFullRights ? 'Full access' : 'Limited'}\\n`;
      } else {
        response += `\\nModification Rights: Unknown\\n`;
      }
      
      return this.formatTextResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        return this.formatTextResponse(`Error fetching domain information: ${error.message}`);
      }
      return this.formatTextResponse(`Error fetching domain information: Unknown error`);
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
      
      // Check for IP rejection errors
      if (result.ApiResponse.$.Status === 'ERROR' && result.ApiResponse.Errors) {
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
      
      // For domain info, we need the CommandResponse
      if (command === 'namecheap.domains.getInfo' && result.ApiResponse.CommandResponse) {
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

export default GetDomainInfoTool;