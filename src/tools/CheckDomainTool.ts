import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios from "axios";
import * as xml2js from "xml2js";
import { detectPublicIp, resetIpCache } from "../utils/ipDetection.js";

interface CheckDomainInput {
  domain: string;
}

class CheckDomainTool extends MCPTool<CheckDomainInput> {
  name = "check_domain";
  description = "Check if a domain name is available for registration";

  schema = {
    domain: {
      type: z.string(),
      description: "Domain name to check (e.g., example.com)",
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

  async execute(input: CheckDomainInput) {
    const { domain } = input;
    
    try {
      const apiResponse = await this.callNamecheapApi('namecheap.domains.check', {
        DomainList: domain
      });
      
      const result = apiResponse.CommandResponse.DomainCheckResult;
      const available = result.$.Available === 'true';
      const isPremium = result.$.IsPremiumName === 'true';
      
      const status = available ? "available" : "unavailable";
      const premiumInfo = isPremium ? " (Premium Domain)" : "";
      
      return this.formatTextResponse(`Domain ${domain} is ${status} for registration${premiumInfo}.`);
    } catch (error) {
      if (error instanceof Error) {
        return this.formatTextResponse(`Error checking domain availability: ${error.message}`);
      }
      return this.formatTextResponse(`Error checking domain availability: Unknown error`);
    }
  }

  private async callNamecheapApi(command: string, params: Record<string, string> = {}): Promise<any> {
    const apiKey = process.env.NAMECHEAP_API_KEY;
    const username = process.env.NAMECHEAP_USERNAME;
    
    if (!apiKey || !username) {
      throw new Error('Namecheap API credentials not configured. Please set NAMECHEAP_API_KEY and NAMECHEAP_USERNAME environment variables.');
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

export default CheckDomainTool; 