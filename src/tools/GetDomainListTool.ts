import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios from "axios";
import * as xml2js from "xml2js";
import { detectPublicIp, resetIpCache } from "../utils/ipDetection.js";

interface GetDomainListInput {
  listType?: string;
  searchTerm?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
}

class GetDomainListTool extends MCPTool<GetDomainListInput> {
  name = "get_domain_list";
  description = "List all domains in your Namecheap account with optional filtering";

  schema = {
    listType: {
      type: z.string().optional(),
      description: "Filter by domain status: ALL (default), EXPIRING, EXPIRED",
    },
    searchTerm: {
      type: z.string().optional(),
      description: "Search for domains containing this term",
    },
    page: {
      type: z.string().optional(),
      description: "Page number (default: 1)",
    },
    pageSize: {
      type: z.string().optional(),
      description: "Number of domains per page (10-100, default: 20)",
    },
    sortBy: {
      type: z.string().optional(),
      description: "Sort results by: NAME (default), EXPIREDATE, CREATEDATE",
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

  async execute(input: GetDomainListInput) {
    const {
      listType = "ALL",
      searchTerm = "",
      page = "1",
      pageSize = "20",
      sortBy = "NAME"
    } = input;

    try {
      const params: Record<string, string> = {
        ListType: listType.toUpperCase(),
        Page: page,
        PageSize: pageSize,
        SortBy: sortBy.toUpperCase()
      };

      if (searchTerm) {
        params.SearchTerm = searchTerm;
      }

      const apiResponse = await this.callNamecheapApi('namecheap.domains.getList', params);
      
      // Check if response has expected structure
      if (!apiResponse.Paging || !apiResponse.Paging.$) {
        console.error('Unexpected API response structure:', JSON.stringify(apiResponse, null, 2));
        return this.formatTextResponse("No domains found in your account.");
      }
      
      const paging = apiResponse.Paging.$;
      
      // Check if there are any domains
      if (!apiResponse.DomainGetListResult || !apiResponse.DomainGetListResult.Domain) {
        const totalItems = paging.TotalItems || '0';
        return this.formatTextResponse(`You have ${totalItems} domains in your account.`);
      }
      
      const domains = apiResponse.DomainGetListResult.Domain;

      // Handle both single domain and array of domains
      const domainList = Array.isArray(domains) ? domains : [domains];
      
      let response = `Found ${paging.TotalItems} domain(s) (Page ${paging.CurrentPage}/${paging.TotalPages})\\n\\n`;
      
      domainList.forEach((domain: any) => {
        const attrs = domain.$ || domain;
        
        // Skip if no attributes
        if (!attrs.Name) {
          console.error('Domain entry missing Name:', domain);
          return;
        }
        
        const status = attrs.IsExpired === 'true' ? 'EXPIRED' : 
                      attrs.IsLocked === 'true' ? 'LOCKED' : 'ACTIVE';
        const autoRenew = attrs.AutoRenew === 'true' ? 'Yes' : 'No';
        
        response += `Domain: ${attrs.Name}\\n`;
        response += `  Status: ${status}\\n`;
        response += `  Created: ${attrs.Created || 'N/A'}\\n`;
        response += `  Expires: ${attrs.Expires || 'N/A'}\\n`;
        response += `  Auto-Renew: ${autoRenew}\\n`;
        
        if (attrs.WhoisGuard && attrs.WhoisGuard !== 'NOTPRESENT') {
          response += `  WhoisGuard: ${attrs.WhoisGuard}\\n`;
        }
        
        response += `\\n`;
      });

      if (parseInt(paging.TotalPages) > 1) {
        response += `\\nTo see more domains, use page parameter (1-${paging.TotalPages})`;
      }

      return this.formatTextResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        return this.formatTextResponse(`Error fetching domain list: ${error.message}`);
      }
      return this.formatTextResponse(`Error fetching domain list: Unknown error`);
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

export default GetDomainListTool;