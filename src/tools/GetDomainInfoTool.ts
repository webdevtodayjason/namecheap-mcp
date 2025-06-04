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
      response += `  Days until expiry: ${domainDetail.NumYears || 'N/A'}\\n`;
      
      // Domain status flags
      const statusFlags = [];
      if (apiResponse.DomainGetInfoResult.StatusFlag) {
        const flags = apiResponse.DomainGetInfoResult.StatusFlag;
        if (flags.IsLocked === 'true') statusFlags.push('LOCKED');
        if (flags.IsExpired === 'true') statusFlags.push('EXPIRED');
        if (flags.IsPremium === 'true') statusFlags.push('PREMIUM');
      }
      if (statusFlags.length > 0) {
        response += `  Status Flags: ${statusFlags.join(', ')}\\n`;
      }
      
      // WhoisGuard information
      response += `\\nPrivacy Protection:\\n`;
      if (whoisGuard && whoisGuard.Enabled) {
        response += `  WhoisGuard: ${whoisGuard.Enabled.$ === 'True' ? 'Enabled' : 'Disabled'}\\n`;
        if (whoisGuard.ID) {
          response += `  WhoisGuard ID: ${whoisGuard.ID}\\n`;
        }
        if (whoisGuard.ExpiredDate) {
          response += `  WhoisGuard Expires: ${whoisGuard.ExpiredDate}\\n`;
        }
      } else {
        response += `  WhoisGuard: Not available\\n`;
      }
      
      // DNS Provider
      response += `\\nDNS Configuration:\\n`;
      response += `  DNS Provider: ${dnsDetails.ProviderType || 'Unknown'}\\n`;
      response += `  Using Namecheap DNS: ${dnsDetails.IsUsingOurDNS === 'true' ? 'Yes' : 'No'}\\n`;
      
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
      if (modificationRights && modificationRights.All === 'true') {
        response += `\\nModification Rights: Full access\\n`;
      } else {
        response += `\\nModification Rights: Limited\\n`;
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