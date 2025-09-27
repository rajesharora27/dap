# Product-Tasks CSV Export/Import Format Design

## CSV Structure
The CSV will have a flat structure where each row can represent either:
1. A product (when task columns are empty)
2. A task (when task columns are filled)

## Column Definitions

### Product Columns
- `product_id` - Product UUID
- `product_name` - Product name
- `product_description` - Product description  
- `product_customAttrs` - JSON string of custom attributes
- `product_statusPercent` - Completion percentage

### Task Columns  
- `task_id` - Task UUID (empty for product-only rows)
- `task_name` - Task name
- `task_description` - Task description
- `task_estMinutes` - Estimated minutes
- `task_weight` - Task weight percentage
- `task_licenseLevel` - License level (Essential/Advantage/Signature)
- `task_priority` - Task priority (Low/Medium/High/Critical)  
- `task_notes` - Task notes
- `task_sequenceNumber` - Task sequence number
- `task_completedAt` - Completion timestamp (ISO string)

### License Columns (for reference)
- `licenses` - JSON string of product licenses

### Outcome Columns (for reference)
- `outcomes` - JSON string of product outcomes
- `task_outcomeIds` - JSON array of outcome IDs for the task

## Example CSV Structure

```csv
product_id,product_name,product_description,product_customAttrs,product_statusPercent,task_id,task_name,task_description,task_estMinutes,task_weight,task_licenseLevel,task_priority,task_notes,task_sequenceNumber,task_completedAt,licenses,outcomes,task_outcomeIds
cmfft123,E-Commerce Platform,Online shopping platform,"{""category"":""web""}",25,,,,,,,,,,,"[{""id"":""lic1"",""name"":""Essential"",""level"":1}]","[{""id"":""out1"",""name"":""Sales Growth""}]",
,,,,,cmfft456,User Authentication,Implement login system,120,10,Essential,High,Security critical,1,,,,,"[""out1""]"
,,,,,cmfft789,Payment Gateway,Process payments,180,15,Essential,Critical,PCI compliance required,2,,,,,"[""out1""]"
```

## Import Logic
1. Group rows by product_id
2. For each product:
   - Create/update product from first row with that product_id
   - Create/update all tasks for that product
   - Validate weight totals don't exceed 100%
   - Validate sequence numbers are unique within product
   - Validate license levels exist for the product
   - Handle outcome associations

## Export Logic  
1. Query product with all related data
2. Create one row for product metadata 
3. Create additional rows for each task
4. Include all relationships as JSON strings where needed
