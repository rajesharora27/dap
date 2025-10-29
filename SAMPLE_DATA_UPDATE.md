# Sample Data Update Summary

## Overview
Updated the DAP application sample data from generic products to Cisco-specific networking and security products, aligned with real-world SASE and hybrid access use cases.

## Changes Made

### 1. Products Updated
**Old Products (Removed):**
- Retail Management App
- Financial Services App  
- IT Operations App
- AI-Powered Analytics App
- Network Management App

**New Cisco Products:**
- **Cisco Duo** - Multi-factor authentication and zero-trust access platform
- **Cisco SD-WAN** - Software-defined WAN with cloud-first architecture
- **Cisco Secure Firewall** - Next-generation firewall with advanced threat protection
- **Cisco ISE** - Identity Services Engine for network access control
- **Cisco Secure Access Sample** - SASE platform combining SD-WAN, security, and ZTNA

**Note:** Any manually created "Cisco Secure Access" product from the GUI is preserved.

### 2. Solutions Updated
**Old Solutions:**
- Enterprise Security Bundle
- Digital Transformation Package

**New Solutions:**
- **Hybrid Private Access** - Combines Cisco Secure Access, Duo, and Secure Firewall for hybrid workforce security
- **SASE** - Complete SASE platform with Cisco Secure Access, SD-WAN, and Duo for distributed enterprises

### 3. Customers Updated
**Old Customers:**
- Acme Corp, TechStart Inc, Meridian Financial

**New Customers:**
- **ACME** - Assigned to Hybrid Private Access solution
- **Chase** - Assigned to SASE solution

### 4. Comprehensive Data Included

Each product now includes:
- **3 License Tiers:** Essential, Advantage, Signature/Premier/Beyond
- **3 Releases:** Multiple version releases per product
- **4 Outcomes:** Security, performance, compliance, and operational outcomes
- **10-14 Tasks:** Detailed implementation tasks per product
- **1-2 Telemetry Attributes per Task:** With success criteria defined

**Total Sample Data:**
- 5 Products
- 15 Licenses
- 14 Releases
- 20 Outcomes
- 62 Tasks
- 62 Telemetry Attributes
- 2 Solutions
- 2 Customers
- 2 Customer Solution Assignments

## Files Updated

### Database & Scripts
1. **`create-complete-sample-data.sql`** - Complete rewrite with Cisco products, solutions, customers
2. **`remove-sample-data.sql`** - Updated to handle new product IDs while preserving manually created data
3. **`dap`** - Updated logging messages to reflect new Cisco products

### Backend Seed Files
1. **`backend/src/seed.ts`** - Updated product definitions, outcomes, licenses, and releases
2. **`backend/src/seed-solutions.ts`** - Updated solutions (Hybrid Private Access and SASE)

## How to Use

### Reset and Load New Sample Data
```bash
./dap reset
```

### Add Sample Data to Existing Database
```bash
./dap add-sample-data
```

### Remove Sample Data
```bash
./dap remove-sample-data
```

## Data Structure Details

### Cisco Duo Tasks (12 tasks)
- Directory Integration, MFA Policies, App Integration, Device Trust
- Adaptive Authentication, Self-Service Portal, SSO, Offline Access
- Reporting, API Integration, Trusted Endpoints, Security Monitoring

### Cisco SD-WAN Tasks (14 tasks)
- vManage Deployment, Controllers, Edge Onboarding, Overlay Design
- Security Policies, App-Aware Routing, Cloud OnRamp, QoS
- High Availability, Segmentation, Analytics, Automation, DIA, Migration

### Cisco Secure Firewall Tasks (13 tasks)
- Initial Setup, Access Control, IPS, Malware Defense, URL Filtering
- SSL Decryption, VPN, Application Control, High Availability
- Threat Intelligence, Logging, Security Analytics, Optimization

### Cisco ISE Tasks (12 tasks)
- Deployment, AD Integration, Network Devices, 802.1X
- Guest Access, BYOD, Profiling, TrustSec, Posture Assessment
- pxGrid, Monitoring, High Availability

### Cisco Secure Access Sample Tasks (11 tasks)
- SASE Architecture, ZTNA, Secure Web Gateway, CASB
- DLP Policies, FWaaS, Cloud Connectors, Identity Integration
- UX Optimization, Security Analytics, Compliance Reporting

## Testing the Application

After loading the sample data, you can test:

1. **View Products** - See all 5 Cisco products with complete attributes
2. **View Solutions** - Explore Hybrid Private Access and SASE bundles
3. **Customer View** - Check ACME and Chase customer assignments
4. **Adoption Plans** - Create and manage adoption plans for solutions
5. **Telemetry** - Enter telemetry values and see success criteria validation
6. **Task Management** - Track task completion across products and solutions

## Preserving Manual Data

The removal script is designed to preserve:
- Any "Cisco Secure Access" product created manually via the GUI
- Any other products not matching the sample product ID patterns
- User-created customers, solutions, and relationships

Sample product IDs follow the pattern: `prod-cisco-*` or `prod-*`  
Sample customer IDs follow the pattern: `customer-*`  
Sample solution IDs follow the pattern: `sol-*`

## Notes

- All tasks include realistic `howToDoc` and `howToVideo` URLs (example URLs)
- Telemetry attributes include detailed success criteria with operators and values
- License levels align with actual Cisco product tiers where applicable
- Solution assignments use realistic license levels (ADVANTAGE for ACME, SIGNATURE for Chase)
- Task sequences are logical and follow typical deployment workflows

## Migration from Old Data

If you have the old sample data:
1. Run `./dap remove-sample-data` to clean old products
2. Run `./dap add-sample-data` to load new Cisco products
3. Or simply run `./dap reset` for a complete fresh start

All existing manually created data will be preserved.



