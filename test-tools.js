#!/usr/bin/env node

// Test script for MCP tools
import dotenv from 'dotenv';
dotenv.config();

// Import tools
import CheckDomainTool from './dist/tools/CheckDomainTool.js';
import GetDomainListTool from './dist/tools/GetDomainListTool.js';
import GetDomainInfoTool from './dist/tools/GetDomainInfoTool.js';
import GetDNSHostsTool from './dist/tools/GetDNSHostsTool.js';
import GetPricingTool from './dist/tools/GetPricingTool.js';

// Test configuration
const TEST_DOMAIN = 'example.com';

async function testTool(ToolClass, input, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${description}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    const tool = new ToolClass();
    console.log(`Tool: ${tool.name}`);
    console.log(`Input:`, JSON.stringify(input, null, 2));
    
    const result = await tool.execute(input);
    console.log(`\nResult:`);
    if (result.content && result.content[0]) {
      console.log(result.content[0].text);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    if (error.stack && process.env.DEBUG) {
      console.error(error.stack);
    }
  }
}

async function runTests() {
  console.log('Starting MCP Tools Test Suite');
  console.log('Environment:', process.env.NODE_ENV || 'production');
  console.log('API User:', process.env.NC_USERNAME || 'NOT SET');
  console.log('API Key:', process.env.NC_API_KEY ? '***SET***' : 'NOT SET');
  console.log('Client IP:', process.env.NC_CLIENT_IP || 'AUTO-DETECT');
  
  // Test 1: Check Domain
  await testTool(
    CheckDomainTool,
    { domain: TEST_DOMAIN },
    'Check Domain Availability'
  );
  
  // Test 2: Get Domain List
  await testTool(
    GetDomainListTool,
    { page: '1', pageSize: '10' },
    'List Domains in Account'
  );
  
  // Test 3: Get Domain Info (testing with your domain)
  await testTool(
    GetDomainInfoTool,
    { domain: 'atxvoip.com' },
    'Get Domain Information'
  );
  
  // Test 4: Get DNS Hosts (testing with domain that uses Namecheap DNS)
  await testTool(
    GetDNSHostsTool,
    { domain: 'atxvoip.com' },
    'Get DNS Records'
  );
  
  // Test 5: Get Pricing
  await testTool(
    GetPricingTool,
    { tld: 'com' },
    'Get .com Pricing'
  );
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('Test suite completed');
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});