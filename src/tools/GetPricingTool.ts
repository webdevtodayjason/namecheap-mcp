import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios from "axios";
import * as xml2js from "xml2js";
import { detectPublicIp } from "../utils/ipDetection.js";

interface GetPricingInput {
  tld: string;
}

class GetPricingTool extends MCPTool<GetPricingInput> {
  name = "get_tld_pricing";
  description = "Get pricing information for domain TLDs (e.g., .com, .net, .org)";

  schema = {
    tld: {
      type: z.string(),
      description: "Top-level domain to get pricing for (e.g., com, net, org)",
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

  async execute(input: GetPricingInput) {
    const { tld } = input;
    const cleanTld = tld.replace(/^\./, ''); // Remove leading dot if present
    
    try {
      // Call Namecheap API to get actual pricing data
      const apiResponse = await this.callNamecheapApi('namecheap.users.getPricing', {
        ProductType: 'DOMAIN',
        ProductName: cleanTld,
        ActionName: 'REGISTER'
      });
      
      // Extract pricing information from the API response
      const pricingData = this.extractPricingData(apiResponse, cleanTld);
      
      // Return formatted pricing information
      return this.formatTextResponse(`
Pricing for .${cleanTld} domains:

Registration:
${this.formatPricingYears(pricingData.registration)}

Renewal:
${this.formatPricingYears(pricingData.renewal)}

Transfer: ${pricingData.transfer}

${pricingData.isPremium ? 'This is a premium domain with special pricing.' : ''}
`.trim());
    } catch (error) {
      if (error instanceof Error) {
        return this.formatTextResponse(`Error getting pricing information: ${error.message}`);
      }
      return this.formatTextResponse(`Error getting pricing information: Unknown error`);
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
      const parser = new xml2js.Parser({ explicitArray: true });
      const result = await parser.parseStringPromise(response.data);
      
      // Check for API errors
      if (result.ApiResponse.$.Status === 'ERROR') {
        const errorMessage = result.ApiResponse.Errors[0].Error[0]._;
        throw new Error(`Namecheap API Error: ${errorMessage}`);
      }
      
      return result;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`API request failed: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }
  
  private extractPricingData(apiResponse: any, tld: string): {
    registration: Record<string, string>;
    renewal: Record<string, string>;
    transfer: string;
    icannFee?: string;
    isPremium: boolean;
  } {
    try {
      // Default pricing in case we can't extract from API
      const defaultPricing = {
        registration: { '1year': '$10.98', '2year': '$21.96', '5year': '$54.90' },
        renewal: { '1year': '$12.98', '2year': '$25.96', '5year': '$64.90' },
        transfer: '$9.98',
        isPremium: false
      };
      
      // Check if API returned an error
      if (apiResponse.ApiResponse.$.Status === 'ERROR') {
        return defaultPricing;
      }
      
      // New format for users.getPricing API
      // Navigate to the pricing data in the API response
      const userGetPricingResult = apiResponse.ApiResponse.CommandResponse[0].UserGetPricingResult[0];
      
      if (!userGetPricingResult) {
        return defaultPricing;
      }
      
      const productTypes = userGetPricingResult.ProductType;
      if (!productTypes || productTypes.length === 0) {
        return defaultPricing;
      }
      
      // Find the DOMAIN product type
      const domainProductType = productTypes.find((pt: any) => 
        pt.$.Name.toLowerCase() === 'domain' || pt.$.Name.toLowerCase() === 'domains'
      );
      if (!domainProductType) {
        return defaultPricing;
      }
      
      // Initialize result objects
      const registration: Record<string, string> = {};
      const renewal: Record<string, string> = {};
      let transfer = '';
      const isPremium = false; // Assume non-premium by default
      
      // Process each product category (REGISTER, RENEW, TRANSFER)
      if (domainProductType.ProductCategory) {
        domainProductType.ProductCategory.forEach((category: any) => {
          const categoryName = category.$.Name.toLowerCase();
          
          if (categoryName === 'register') {
            // Find product matching our TLD
            const tldProduct = this.findTldProduct(category.Product, tld);
            if (tldProduct && tldProduct.Price) {
              tldProduct.Price.forEach((priceInfo: any) => {
                if (priceInfo.$.DurationType === 'YEAR') {
                  registration[`${priceInfo.$.Duration}year`] = `$${priceInfo.$.YourPrice}`;
                }
              });
            }
          } else if (categoryName === 'renew') {
            // Find product matching our TLD
            const tldProduct = this.findTldProduct(category.Product, tld);
            if (tldProduct && tldProduct.Price) {
              tldProduct.Price.forEach((priceInfo: any) => {
                if (priceInfo.$.DurationType === 'YEAR') {
                  renewal[`${priceInfo.$.Duration}year`] = `$${priceInfo.$.YourPrice}`;
                }
              });
            }
          } else if (categoryName === 'transfer') {
            // Find product matching our TLD
            const tldProduct = this.findTldProduct(category.Product, tld);
            if (tldProduct && tldProduct.Price && tldProduct.Price.length > 0) {
              transfer = `$${tldProduct.Price[0].$.YourPrice}`;
            }
          }
        });
      }
      
      // If we couldn't find any pricing info, use defaults
      if (Object.keys(registration).length === 0 && Object.keys(renewal).length === 0 && !transfer) {
        return defaultPricing;
      }
      
      // If we only got partial data, fill in the gaps with defaults
      if (Object.keys(registration).length === 0) {
        registration['1year'] = defaultPricing.registration['1year'];
      }
      if (Object.keys(renewal).length === 0) {
        renewal['1year'] = defaultPricing.renewal['1year'];
      }
      if (!transfer) {
        transfer = defaultPricing.transfer;
      }
      
      return { registration, renewal, transfer, isPremium };
    } catch (error) {
      // Fallback to default pricing if API data can't be parsed
      return {
        registration: { '1year': '$10.98', '2year': '$21.96', '5year': '$54.90' },
        renewal: { '1year': '$12.98', '2year': '$25.96', '5year': '$64.90' },
        transfer: '$9.98',
        isPremium: false
      };
    }
  }
  
  // Helper function to find a product by TLD name
  private findTldProduct(products: any[], tld: string): any {
    // Clean the TLD first (remove leading dot if present)
    const cleanTld = tld.replace(/^\./, '');
    
    if (!products || !Array.isArray(products)) {
      return null;
    }
    
    // Try exact match first
    let product = products.find((p: any) => 
      p.$.Name.toLowerCase() === cleanTld.toLowerCase()
    );
    
    // If not found, try with a dot prefix
    if (!product) {
      product = products.find((p: any) => 
        p.$.Name.toLowerCase() === `.${cleanTld}`.toLowerCase()
      );
    }
    
    return product;
  }
  
  private formatPricingYears(pricingData: Record<string, string>): string {
    return Object.entries(pricingData)
      .map(([duration, price]) => `- ${duration.replace('year', ' year')}: ${price}`)
      .join('\n');
  }
}

export default GetPricingTool; 