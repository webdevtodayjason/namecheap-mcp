import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios from "axios";
import * as xml2js from "xml2js";
import { detectPublicIp, resetIpCache } from "../utils/ipDetection.js";

interface GetDomainContactsInput {
  domain: string;
}

class GetDomainContactsTool extends MCPTool<GetDomainContactsInput> {
  name = "get_domain_contacts";
  description = "Retrieve contact information (registrant, admin, tech, billing) for a domain";

  schema = {
    domain: {
      type: z.string(),
      description: "Domain name to retrieve contacts for (e.g., example.com)",
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

  private formatContactInfo(contact: any, contactType: string): string {
    if (!contact) return `${contactType}: Not available\\n`;
    
    let info = `${contactType}:\\n`;
    
    // Name information
    if (contact.FirstName || contact.LastName) {
      info += `  Name: ${contact.FirstName || ''} ${contact.LastName || ''}\\n`;
    }
    if (contact.OrganizationName) {
      info += `  Organization: ${contact.OrganizationName}\\n`;
    }
    
    // Address information
    if (contact.Address1) {
      info += `  Address: ${contact.Address1}\\n`;
      if (contact.Address2) {
        info += `           ${contact.Address2}\\n`;
      }
    }
    if (contact.City || contact.StateProvince || contact.PostalCode) {
      info += `  Location: ${contact.City || ''}, ${contact.StateProvince || ''} ${contact.PostalCode || ''}\\n`;
    }
    if (contact.Country) {
      info += `  Country: ${contact.Country}\\n`;
    }
    
    // Contact details
    if (contact.Phone) {
      info += `  Phone: ${contact.Phone}`;
      if (contact.PhoneExt) {
        info += ` ext. ${contact.PhoneExt}`;
      }
      info += `\\n`;
    }
    if (contact.Fax) {
      info += `  Fax: ${contact.Fax}`;
      if (contact.FaxExt) {
        info += ` ext. ${contact.FaxExt}`;
      }
      info += `\\n`;
    }
    if (contact.EmailAddress) {
      info += `  Email: ${contact.EmailAddress}\\n`;
    }
    
    return info;
  }

  async execute(input: GetDomainContactsInput) {
    const { domain } = input;
    
    try {
      const apiResponse = await this.callNamecheapApi('namecheap.domains.getContacts', {
        DomainName: domain
      });
      
      const contacts = apiResponse.DomainContactsResult;
      
      let response = `Contact Information for ${domain}\\n\\n`;
      
      // Registrant contact (domain owner)
      if (contacts.Registrant) {
        response += this.formatContactInfo(contacts.Registrant, 'Registrant (Owner)');
        response += `\\n`;
      }
      
      // Administrative contact
      if (contacts.Admin) {
        response += this.formatContactInfo(contacts.Admin, 'Administrative Contact');
        response += `\\n`;
      }
      
      // Technical contact
      if (contacts.Tech) {
        response += this.formatContactInfo(contacts.Tech, 'Technical Contact');
        response += `\\n`;
      }
      
      // Billing contact
      if (contacts.AuxBilling) {
        response += this.formatContactInfo(contacts.AuxBilling, 'Billing Contact');
        response += `\\n`;
      }
      
      // WhoisGuard status if applicable
      if (contacts.WhoisGuardContact) {
        response += `\\nWhoisGuard Protection: Active\\n`;
        response += `Note: Contact details are protected by WhoisGuard privacy service.\\n`;
      }
      
      return this.formatTextResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        return this.formatTextResponse(`Error fetching domain contacts: ${error.message}`);
      }
      return this.formatTextResponse(`Error fetching domain contacts: Unknown error`);
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

export default GetDomainContactsTool;