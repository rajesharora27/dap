# Sample Data Update - Enterprise Applications

## Overview
Updated sample data across all seed scripts to reflect real-world enterprise applications across 5 key domains: Retail, Financial Services, IT Operations, AI/ML, and Network Management.

## Date
October 8, 2025

## Changes Made

### Product Updates

Replaced generic sample products with industry-specific applications:

1. **Retail Management App** (`retail-app-001`)
   - Comprehensive retail POS, inventory, and customer analytics
   - Technology: React/Node.js/PostgreSQL
   - Target: Small-to-medium retail businesses
   - Deployment: Cloud-hybrid

2. **Financial Services App** (`financial-app-001`)
   - Enterprise trading and portfolio management platform
   - Technology: React/Java/Kafka
   - Compliance: SOX, PCI-DSS, GDPR
   - Deployment: Private cloud
   - High security and regulatory requirements

3. **IT Operations App** (`it-app-001`)
   - Unified IT monitoring and incident management
   - Technology: Angular/Python/Kubernetes
   - Integration: ServiceNow, Splunk, Jira
   - Deployment: On-premise/cloud hybrid

4. **AI-Powered Analytics App** (`ai-app-001`)
   - Machine learning platform with NLP and computer vision
   - Technology: Python/TensorFlow/PyTorch/FastAPI
   - Infrastructure: GPU-accelerated
   - Deployment: Cloud-native

5. **Network Management App** (`networking-app-001`)
   - Enterprise network monitoring with SD-WAN
   - Technology: React/Go/gRPC/TimescaleDB
   - Protocols: SNMP, NetFlow, BGP, OSPF
   - Security: Zero-trust architecture
   - Deployment: Distributed hybrid

### Outcomes by Product

#### Retail App
- POS System - Cloud POS with offline mode
- Inventory Management - Real-time tracking and reordering
- Customer Loyalty - Rewards and promotions
- Sales Analytics - Comprehensive reporting
- Multi-Store Management - Centralized control

#### Financial App
- Portfolio Management - Real-time tracking with analytics
- Trading Execution - High-frequency trading
- Compliance Reporting - SOX/PCI-DSS/GDPR automation
- Risk Assessment - VaR and stress testing
- Client Portal - Secure access and reporting

#### IT App
- Infrastructure Monitoring - Servers, networks, applications
- Incident Management - ITIL-compliant ITSM
- Automation Engine - Workflow automation
- Asset Management - IT asset tracking with CMDB
- Service Catalog - Self-service portal

#### AI App
- Predictive Analytics - Forecasting and anomaly detection
- Natural Language Processing - Sentiment analysis, entity extraction
- Computer Vision - Image recognition, object detection
- Recommendation Engine - Personalized recommendations
- Model Management - MLOps platform

#### Networking App
- Network Discovery - Automated topology mapping
- Performance Monitoring - Bandwidth, latency, packet loss
- Security Management - Firewall and threat intelligence
- Configuration Management - Config backup and auditing
- SD-WAN Orchestration - Policy-based routing

### License Tiers

Each product now has three license tiers with realistic descriptions:

**Retail App:**
- Retail Starter (Level 1) - Single location, basic features
- Retail Professional (Level 2) - Multi-location with loyalty
- Retail Enterprise (Level 3) - Unlimited locations with API

**Financial App:**
- Financial Basic (Level 1) - Up to 100 clients
- Financial Professional (Level 2) - Up to 1000 clients
- Financial Enterprise (Level 3) - Unlimited with algo trading

**IT App:**
- IT Essential (Level 1) - Up to 50 devices
- IT Advanced (Level 2) - Up to 500 devices with automation
- IT Enterprise (Level 3) - Unlimited devices with AIOps

**AI App:**
- AI Starter (Level 1) - Pre-built models, 10k API calls/month
- AI Professional (Level 2) - Custom training, 100k API calls/month
- AI Enterprise (Level 3) - Unlimited models and API calls

**Networking App:**
- Network Monitor (Level 1) - Up to 25 devices
- Network Professional (Level 2) - Up to 250 devices with SD-WAN
- Network Enterprise (Level 3) - Unlimited devices with automation

### Releases by Product

Each product has 5 progressive releases:

**Retail App:**
- v1.0 Alpha - Core POS
- v1.5 Beta - Inventory added
- v2.0 - Multi-store support
- v2.5 - Advanced analytics
- v3.0 - Enterprise features

**Financial App:**
- v1.0 - Trading core
- v1.5 - Risk module
- v2.0 - Algorithmic trading
- v2.5 - Real-time data feeds
- v3.0 - AI-powered trading

**IT App:**
- v1.0 - Basic monitoring
- v1.5 - ITSM integration
- v2.0 - Automation
- v2.5 - AI insights
- v3.0 - Full AIOps platform

**AI App:**
- v1.0 - ML core
- v1.5 - NLP capabilities
- v2.0 - Computer vision
- v2.5 - MLOps pipeline
- v3.0 - AutoML platform

**Networking App:**
- v1.0 - Network discovery
- v1.5 - Performance monitoring
- v2.0 - Security management
- v2.5 - SD-WAN orchestration
- v3.0 - Zero-trust architecture

### Tasks by Product

Each product has 6 comprehensive tasks with:
- Realistic task names and descriptions
- Accurate estimated minutes (420-900 minutes per task)
- Decimal weight percentages (6.00% - 25.00%)
- Priority levels (Critical, High, Medium, Low)
- Detailed notes with technical specifics
- Multiple howToDoc and howToVideo links (arrays)
- License level requirements (ESSENTIAL, ADVANTAGE, SIGNATURE)

#### Sample Task Structure (Retail App)
```typescript
{
  name: 'Build Cloud POS System',
  description: 'Develop cloud-based point-of-sale with offline mode, receipt printing, and payment terminal integration',
  estMinutes: 480,
  weight: 22.50,
  priority: 'Critical',
  notes: 'Support multiple payment methods including cash, card, mobile wallets with EMV certification',
  howToDoc: ['https://docs.retail.com/pos-setup', 'https://docs.retail.com/payment-terminals'],
  howToVideo: ['https://youtube.com/watch?v=cloud-pos-tutorial', 'https://youtube.com/watch?v=offline-mode'],
  licenseLevel: 'ESSENTIAL'
}
```

## Files Modified

### 1. backend/src/seed.ts
- Updated all 5 product definitions with enterprise applications
- Replaced outcomes for each product (5 outcomes per product)
- Updated license tiers (3 per product)
- Created comprehensive releases (5 per product)
- Detailed task definitions (6 per product with multiple links)

### 2. backend/src/seed-clean.ts
- Updated products array with new enterprise apps
- Replaced outcomes for all products
- Updated license definitions
- Simplified task definitions for clean seed
- Fixed howToDoc/howToVideo to use arrays

## Technical Details

### Weight Distribution
Tasks now use realistic decimal percentages:
- Retail: 22.50%, 18.75%, 15.25%, 13.50%, 16.50%, 13.50% = 100%
- Financial: 25.00%, 20.50%, 18.75%, 15.25%, 12.50%, 8.00% = 100%
- IT: 21.25%, 19.50%, 18.75%, 16.00%, 15.50%, 9.00% = 100%
- AI: 23.75%, 20.50%, 19.25%, 14.50%, 13.00%, 9.00% = 100%
- Networking: 22.00%, 19.75%, 20.50%, 15.25%, 16.50%, 6.00% = 100%

### Multiple Links Support
Tasks now support multiple documentation and video links:
- howToDoc: Array of documentation URLs
- howToVideo: Array of video tutorial URLs
- Example: `howToDoc: ['url1', 'url2', 'url3']`

### Industry-Specific URLs
Each domain has realistic documentation URLs:
- Retail: `docs.retail.com`
- Financial: `docs.fintech.com`
- IT: `docs.itops.com`
- AI: `docs.ai-platform.com`
- Networking: `docs.netops.com`

## Testing

### Running the Seed Scripts

**Full seed (development):**
```bash
cd /data/dap/backend
npm run seed
```

**Clean seed (minimal data):**
```bash
cd /data/dap/backend
npm run seed:clean
```

### Verification Steps

1. Check products are created with correct names and attributes
2. Verify outcomes are associated with correct products
3. Confirm licenses have proper levels and descriptions
4. Validate releases are in sequential order
5. Ensure tasks have proper weights totaling 100%
6. Check howToDoc and howToVideo are arrays with multiple links

## Benefits

### 1. Realistic Data
- Reflects actual enterprise application scenarios
- Industry-specific terminology and requirements
- Authentic compliance and security considerations

### 2. Better Testing
- Complex real-world scenarios
- Multiple integration points
- Varied technology stacks

### 3. Demo-Ready
- Professional product names
- Comprehensive feature sets
- Realistic license tiers

### 4. Educational Value
- Shows best practices for different domains
- Demonstrates various deployment models
- Illustrates security and compliance requirements

## Migration Notes

### For Existing Databases
If you have existing data:
1. Old product IDs (`sample-product-1`, `sample-product-2`, etc.) are replaced
2. New product IDs: `retail-app-001`, `financial-app-001`, etc.
3. Run `npm run seed` to update or reset database

### For New Installations
- Simply run `npm run seed` after initial setup
- All sample data will be created automatically

## Future Enhancements

Potential additions:
1. More products (e.g., Healthcare, Logistics, Manufacturing)
2. Additional outcomes per product
3. More granular task breakdowns
4. Custom attributes per domain
5. Integration examples
6. API documentation links

## Related Documentation
- WEIGHT_HOWTO_UPDATE.md - Weight and HowTo field changes
- HOWTO_DROPDOWN_FEATURE.md - Multiple links dropdown UI
- SAMPLE_DATA_MANAGEMENT.md - General sample data guidelines
