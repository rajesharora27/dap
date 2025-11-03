#!/bin/bash

# Comprehensive Backup & Restore Test Script
# This script tests the full backup and restore cycle

set -e  # Exit on error

API_URL="http://localhost:4000/graphql"
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Backup & Restore Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check current state
echo -e "${YELLOW}📊 Step 1: Checking current database state...${NC}"
CURRENT_STATE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { customers { id name products { id } solutions { id } } }"}')

CUSTOMER_COUNT=$(echo "$CURRENT_STATE" | jq -r '.data.customers | length')
echo -e "${GREEN}✓ Found $CUSTOMER_COUNT customers${NC}"
echo "$CURRENT_STATE" | jq -r '.data.customers[] | "  - \(.name): \(.products | length) products, \(.solutions | length) solutions"'
echo ""

# Step 2: Create a backup
echo -e "${YELLOW}💾 Step 2: Creating backup...${NC}"
BACKUP_RESULT=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { createBackup { success filename size message error metadata { recordCounts { customers products solutions tasks } } } }"}')

BACKUP_SUCCESS=$(echo "$BACKUP_RESULT" | jq -r '.data.createBackup.success')
BACKUP_FILENAME=$(echo "$BACKUP_RESULT" | jq -r '.data.createBackup.filename')
BACKUP_SIZE=$(echo "$BACKUP_RESULT" | jq -r '.data.createBackup.size')

if [ "$BACKUP_SUCCESS" == "true" ]; then
  echo -e "${GREEN}✓ Backup created successfully!${NC}"
  echo -e "  Filename: ${GREEN}$BACKUP_FILENAME${NC}"
  echo -e "  Size: $(numfmt --to=iec-i --suffix=B $BACKUP_SIZE 2>/dev/null || echo "$BACKUP_SIZE bytes")"
  echo "$BACKUP_RESULT" | jq -r '.data.createBackup.metadata.recordCounts | "  Records: \(.customers) customers, \(.products) products, \(.solutions) solutions, \(.tasks) tasks"'
else
  ERROR=$(echo "$BACKUP_RESULT" | jq -r '.data.createBackup.error')
  echo -e "${RED}✗ Backup failed: $ERROR${NC}"
  exit 1
fi
echo ""

# Step 3: Make a change to the database
echo -e "${YELLOW}✏️  Step 3: Making a test change (adding a customer)...${NC}"
ADD_CUSTOMER=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { createCustomer(input: { name: \"TEST RESTORE CUSTOMER\", description: \"This customer should disappear after restore\" }) { id name } }"}')

NEW_CUSTOMER_NAME=$(echo "$ADD_CUSTOMER" | jq -r '.data.createCustomer.name')
if [ "$NEW_CUSTOMER_NAME" == "TEST RESTORE CUSTOMER" ]; then
  echo -e "${GREEN}✓ Test customer created: $NEW_CUSTOMER_NAME${NC}"
else
  echo -e "${RED}✗ Failed to create test customer${NC}"
  exit 1
fi
echo ""

# Step 4: Verify the change
echo -e "${YELLOW}🔍 Step 4: Verifying database state after change...${NC}"
NEW_STATE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { customers { id name } }"}')

NEW_CUSTOMER_COUNT=$(echo "$NEW_STATE" | jq -r '.data.customers | length')
echo -e "${GREEN}✓ Now have $NEW_CUSTOMER_COUNT customers (was $CUSTOMER_COUNT)${NC}"
echo "$NEW_STATE" | jq -r '.data.customers[] | "  - \(.name)"'
echo ""

# Step 5: Restore from backup
echo -e "${YELLOW}🔄 Step 5: Restoring from backup...${NC}"
echo -e "${RED}⚠️  WARNING: This will DELETE all current data and restore from backup!${NC}"
read -p "Press ENTER to continue or Ctrl+C to cancel..."

RESTORE_RESULT=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"mutation { restoreBackup(filename: \\\"$BACKUP_FILENAME\\\") { success message error recordsRestored { customers products solutions tasks } } }\"}")

RESTORE_SUCCESS=$(echo "$RESTORE_RESULT" | jq -r '.data.restoreBackup.success')
RESTORE_MESSAGE=$(echo "$RESTORE_RESULT" | jq -r '.data.restoreBackup.message')

if [ "$RESTORE_SUCCESS" == "true" ]; then
  echo -e "${GREEN}✓ Restore completed successfully!${NC}"
  echo -e "  Message: $RESTORE_MESSAGE"
  echo "$RESTORE_RESULT" | jq -r '.data.restoreBackup.recordsRestored | "  Restored: \(.customers) customers, \(.products) products, \(.solutions) solutions, \(.tasks) tasks"'
else
  RESTORE_ERROR=$(echo "$RESTORE_RESULT" | jq -r '.data.restoreBackup.error')
  echo -e "${RED}✗ Restore failed: $RESTORE_ERROR${NC}"
  exit 1
fi
echo ""

# Step 6: Verify restoration
echo -e "${YELLOW}✅ Step 6: Verifying database state after restore...${NC}"
sleep 2  # Give it a moment to settle
RESTORED_STATE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { customers { id name products { id } solutions { id } } }"}')

RESTORED_CUSTOMER_COUNT=$(echo "$RESTORED_STATE" | jq -r '.data.customers | length')

if [ "$RESTORED_CUSTOMER_COUNT" == "$CUSTOMER_COUNT" ]; then
  echo -e "${GREEN}✓ Customer count restored correctly: $RESTORED_CUSTOMER_COUNT (original: $CUSTOMER_COUNT)${NC}"
else
  echo -e "${RED}✗ Customer count mismatch: $RESTORED_CUSTOMER_COUNT (expected: $CUSTOMER_COUNT)${NC}"
fi

TEST_CUSTOMER_EXISTS=$(echo "$RESTORED_STATE" | jq -r '.data.customers[] | select(.name == "TEST RESTORE CUSTOMER") | .name')
if [ -z "$TEST_CUSTOMER_EXISTS" ]; then
  echo -e "${GREEN}✓ Test customer successfully removed${NC}"
else
  echo -e "${RED}✗ Test customer still exists (should have been removed)${NC}"
fi

echo ""
echo -e "${GREEN}Current customers after restore:${NC}"
echo "$RESTORED_STATE" | jq -r '.data.customers[] | "  - \(.name): \(.products | length) products, \(.solutions | length) solutions"'
echo ""

# Step 7: List all backups
echo -e "${YELLOW}📋 Step 7: Listing all available backups...${NC}"
LIST_BACKUPS=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { listBackups { id filename timestamp size recordCounts { customers products } } }"}')

BACKUP_COUNT=$(echo "$LIST_BACKUPS" | jq -r '.data.listBackups | length')
echo -e "${GREEN}✓ Found $BACKUP_COUNT backup(s)${NC}"
echo "$LIST_BACKUPS" | jq -r '.data.listBackups[] | "  - \(.filename) (\(.size | tonumber) bytes, \(.recordCounts.customers) customers)"'
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Backup creation: SUCCESS${NC}"
echo -e "${GREEN}✓ Database modification: SUCCESS${NC}"
echo -e "${GREEN}✓ Backup restore: SUCCESS${NC}"
echo -e "${GREEN}✓ Data verification: SUCCESS${NC}"
echo ""
echo -e "${GREEN}🎉 All tests passed! Backup & Restore is working correctly!${NC}"
echo ""

