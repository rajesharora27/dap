#!/usr/bin/env ts-node
/**
 * Generate Schema Context for AI Agent LLM
 * 
 * This script parses the Prisma schema and generates a JSON context file
 * that can be used by the AI Agent to understand the database structure.
 * 
 * Run: npx ts-node scripts/generate-schema-context.ts
 * Output: backend/config/schema-context.json
 * 
 * @version 1.0.0
 * @created 2025-12-09
 */

import * as fs from 'fs';
import * as path from 'path';

interface Column {
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    isUnique: boolean;
    hasDefault: boolean;
    description?: string;
    relation?: {
        model: string;
        fields?: string[];
        references?: string[];
    };
}

interface Model {
    name: string;
    columns: Column[];
    relations: string[];
    indexes: string[];
}

interface EnumDef {
    name: string;
    values: string[];
}

interface SchemaContext {
    models: Model[];
    enums: EnumDef[];
    relationships: { from: string; to: string; type: string; field: string }[];
    generatedAt: string;
    prismaSchemaPath: string;
}

const PRISMA_SCHEMA_PATH = path.join(__dirname, '../backend/prisma/schema.prisma');
const OUTPUT_PATH = path.join(__dirname, '../backend/config/schema-context.generated.json');

function parseType(typeDef: string): { type: string; nullable: boolean; isArray: boolean } {
    const isArray = typeDef.endsWith('[]');
    const nullable = typeDef.endsWith('?');
    let type = typeDef.replace('[]', '').replace('?', '');
    return { type, nullable, isArray };
}

function extractRelation(line: string): { model: string; fields?: string[]; references?: string[] } | null {
    const relationMatch = line.match(/@relation\(([^)]+)\)/);
    if (!relationMatch) return null;

    const relationArgs = relationMatch[1];
    const fieldsMatch = relationArgs.match(/fields:\s*\[([^\]]+)\]/);
    const referencesMatch = relationArgs.match(/references:\s*\[([^\]]+)\]/);

    const fields = fieldsMatch ? fieldsMatch[1].split(',').map(f => f.trim()) : undefined;
    const references = referencesMatch ? referencesMatch[1].split(',').map(r => r.trim()) : undefined;

    return { model: '', fields, references };
}

function parsePrismaSchema(content: string): SchemaContext {
    const lines = content.split('\n');
    const models: Model[] = [];
    const enums: EnumDef[] = [];
    const relationships: { from: string; to: string; type: string; field: string }[] = [];

    let currentModel: Model | null = null;
    let currentEnum: EnumDef | null = null;
    let inModel = false;
    let inEnum = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Model start
        const modelMatch = trimmed.match(/^model\s+(\w+)\s*\{/);
        if (modelMatch) {
            currentModel = { name: modelMatch[1], columns: [], relations: [], indexes: [] };
            inModel = true;
            continue;
        }

        // Enum start
        const enumMatch = trimmed.match(/^enum\s+(\w+)\s*\{/);
        if (enumMatch) {
            currentEnum = { name: enumMatch[1], values: [] };
            inEnum = true;
            continue;
        }

        // End of block
        if (trimmed === '}') {
            if (inModel && currentModel) {
                models.push(currentModel);
                currentModel = null;
                inModel = false;
            }
            if (inEnum && currentEnum) {
                enums.push(currentEnum);
                currentEnum = null;
                inEnum = false;
            }
            continue;
        }

        // Parse model fields
        if (inModel && currentModel) {
            // Skip comments and empty lines
            if (trimmed.startsWith('//') || trimmed === '' || trimmed.startsWith('@@')) {
                // Handle index/unique annotations
                if (trimmed.startsWith('@@index')) {
                    currentModel.indexes.push(trimmed);
                }
                continue;
            }

            // Parse field: name Type @modifiers
            const fieldMatch = trimmed.match(/^(\w+)\s+(\S+)(.*)$/);
            if (fieldMatch) {
                const [, fieldName, typeDef, modifiers] = fieldMatch;
                const { type, nullable, isArray } = parseType(typeDef);

                // Check for common modifiers
                const isPrimaryKey = modifiers.includes('@id');
                const isUnique = modifiers.includes('@unique');
                const hasDefault = modifiers.includes('@default');

                // Extract description from comment
                const descMatch = line.match(/\/\/\s*(.+)$/);
                const description = descMatch ? descMatch[1].trim() : undefined;

                // Check if it's a relation
                const isRelationType = /^[A-Z]/.test(type) && !['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal'].includes(type);

                const column: Column = {
                    name: fieldName,
                    type: isArray ? `${type}[]` : type,
                    nullable,
                    isPrimaryKey,
                    isUnique,
                    hasDefault,
                    description,
                };

                if (isRelationType) {
                    const relationInfo = extractRelation(modifiers);
                    if (relationInfo) {
                        relationInfo.model = type.replace('?', '').replace('[]', '');
                        column.relation = relationInfo;
                    }
                    currentModel.relations.push(fieldName);

                    // Track relationship
                    const relationType = isArray ? 'oneToMany' : (nullable ? 'optionalManyToOne' : 'manyToOne');
                    relationships.push({
                        from: currentModel.name,
                        to: type.replace('?', '').replace('[]', ''),
                        type: relationType,
                        field: fieldName,
                    });
                }

                currentModel.columns.push(column);
            }
        }

        // Parse enum values
        if (inEnum && currentEnum) {
            if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('@@')) {
                currentEnum.values.push(trimmed);
            }
        }
    }

    return {
        models,
        enums,
        relationships,
        generatedAt: new Date().toISOString(),
        prismaSchemaPath: PRISMA_SCHEMA_PATH,
    };
}

function generateLLMPrompt(context: SchemaContext): string {
    let prompt = `## Database Schema (Auto-generated from Prisma)\n\n`;
    prompt += `Generated: ${context.generatedAt}\n\n`;

    // Models section
    prompt += `### Models\n\n`;
    for (const model of context.models) {
        prompt += `**${model.name}**\n`;

        // Key columns
        const keyColumns = model.columns.filter(c =>
            c.isPrimaryKey || c.isUnique || c.description || c.relation
        );
        if (keyColumns.length > 0) {
            prompt += `- Columns: `;
            prompt += keyColumns.map(c => {
                let desc = c.name;
                if (c.isPrimaryKey) desc += ' (PK)';
                if (c.isUnique) desc += ' (unique)';
                if (c.nullable) desc += '?';
                if (c.description) desc += ` - ${c.description}`;
                return desc;
            }).join(', ');
            prompt += `\n`;
        }

        // Relations
        if (model.relations.length > 0) {
            prompt += `- Relations: ${model.relations.join(', ')}\n`;
        }
        prompt += `\n`;
    }

    // Enums section
    prompt += `### Enums\n\n`;
    for (const enumDef of context.enums) {
        prompt += `- **${enumDef.name}**: ${enumDef.values.join(', ')}\n`;
    }

    prompt += `\n### Relationship Paths (for LLM query generation)\n\n`;

    // Group relationships by source
    const bySource = new Map<string, typeof context.relationships>();
    for (const rel of context.relationships) {
        if (!bySource.has(rel.from)) bySource.set(rel.from, []);
        bySource.get(rel.from)!.push(rel);
    }

    for (const [from, rels] of bySource) {
        prompt += `**${from}** → ${rels.map(r => `${r.field} (${r.to})`).join(', ')}\n`;
    }

    return prompt;
}

async function main() {
    console.log('🔍 Parsing Prisma schema...');
    console.log(`   Source: ${PRISMA_SCHEMA_PATH}`);

    if (!fs.existsSync(PRISMA_SCHEMA_PATH)) {
        console.error(`❌ Prisma schema not found at: ${PRISMA_SCHEMA_PATH}`);
        process.exit(1);
    }

    const schemaContent = fs.readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
    const context = parsePrismaSchema(schemaContent);

    console.log(`\n📊 Parsed schema:`);
    console.log(`   Models: ${context.models.length}`);
    console.log(`   Enums: ${context.enums.length}`);
    console.log(`   Relationships: ${context.relationships.length}`);

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write JSON context
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(context, null, 2));
    console.log(`\n✅ Schema context written to: ${OUTPUT_PATH}`);

    // Generate and show LLM prompt
    const llmPrompt = generateLLMPrompt(context);
    const promptPath = OUTPUT_PATH.replace('.json', '.md');
    fs.writeFileSync(promptPath, llmPrompt);
    console.log(`✅ LLM prompt written to: ${promptPath}`);

    // Summary
    console.log(`\n📋 Summary for AI Agent:`);
    console.log(`   Core Models: Product, Solution, Customer, Task`);
    console.log(`   Adoption Models: CustomerProduct, CustomerTask, AdoptionPlan`);
    console.log(`   Telemetry Models: TelemetryAttribute, TelemetryValue`);

    // Show key relationship paths
    console.log(`\n🔗 Key Relationship Paths:`);
    console.log(`   Customer → tasks: Customer.products.adoptionPlan.tasks`);
    console.log(`   Product → customers: Product.customers.customer`);
    console.log(`   Task → product: Task.product`);
}

main().catch(console.error);
