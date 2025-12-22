#!/usr/bin/env python3
"""
Comprehensive Module Migration Script

This script automates the migration of all backend modules by:
1. Copying and updating service files
2. Creating type definitions
3. Creating GraphQL schemas
4. Creating resolvers (based on Product template)
5. Creating barrel exports

Modules to migrate:
- Solution, Customer, License, Release, Outcome, Task
"""

import os
import re
import shutil
from pathlib import Path

# Module configurations
MODULES = {
    'solution': {
        'service_file': 'SolutionService.ts',
        'has_connection': True,
        'fields': ['name', 'description', 'customAttrs', 'products', 'tasks', 'completionPercentage', 'customers', 'licenses', 'releases', 'outcomes', 'tags']
    },
    'customer': {
        'service_file': 'CustomerService.ts',
        'has_connection': False,
        'fields': ['name', 'description', 'customAttrs', 'createdAt', 'updatedAt', 'products', 'solutions']
    },
    'license': {
        'service_file': None,  # No dedicated service
        'has_connection': False,
        'fields': ['name', 'description', 'level', 'isActive', 'product', 'productId', 'solution', 'solutionId', 'customAttrs']
    },
    'release': {
        'service_file': None,
        'has_connection': False,
        'fields': ['name', 'description', 'level', 'isActive', 'product', 'productId', 'tasks', 'inheritedTasks', 'customAttrs']
    },
    'outcome': {
        'service_file': None,
        'has_connection': False,
        'fields': ['name', 'description', 'product', 'solution', 'productId', 'solutionId']
    },
    'task': {
        'service_file': None,  # Complex, in resolvers
        'has_connection': True,
        'fields': ['name', 'description', 'estMinutes', 'notes', 'weight', 'sequenceNumber', 'licenseLevel', 'howToDoc', 'howToVideo', 'product', 'solution', 'outcomes', 'license', 'releases', 'availableInReleases', 'telemetryAttributes', 'isCompleteBasedOnTelemetry', 'telemetryCompletionPercentage', 'deletedAt', 'tags', 'solutionTags']
    }
}

def migrate_service(module_name, config):
    """Migrate service file for a module"""
    print(f"  📝 Migrating service for {module_name}...")
    
    if not config['service_file']:
        print(f"    ⏭️  No dedicated service file for {module_name}")
        return
    
    source = f'backend/src/services/{config["service_file"]}'
    dest = f'backend/src/modules/{module_name}/{module_name}.service.ts'
    
    if not os.path.exists(source):
        print(f"    ⚠️  Service file not found: {source}")
        return
    
    # Copy file
    shutil.copy(source, dest)
    
    # Update imports
    with open(dest, 'r') as f:
        content = f.read()
    
    # Replace old imports with new shared paths
    content = re.sub(r"from '\.\./context'", "from '../../shared/graphql/context'", content)
    content = re.sub(r"from '\.\./lib/audit'", "from '../../shared/utils/audit'", content)
    content = re.sub(r"from '\.\./lib/changes'", "from '../../shared/utils/changes'", content)
    content = re.sub(r"from '\.\./validation/schemas'", "from '../../validation/schemas'", content)
    
    with open(dest, 'w') as f:
        f.write(content)
    
    print(f"    ✅ Service migrated and imports updated")

def create_types(module_name, config):
    """Create TypeScript types file for a module"""
    print(f"  📝 Creating types for {module_name}...")
    
    capitalized = module_name.capitalize()
    
    types_content = f'''/**
 * {capitalized} Module Types
 * 
 * TypeScript interfaces and types for the {capitalized} domain.
 */

// ===== Input Types =====

export interface {capitalized}CreateInput {{
  name: string;
  description?: string;
  customAttrs?: Record<string, any>;
}}

export interface {capitalized}UpdateInput {{
  name?: string;
  description?: string;
  customAttrs?: Record<string, any>;
}}

// ===== Service Response Types =====

export interface {capitalized} {{
  id: string;
  name: string;
  description?: string | null;
  customAttrs?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}}

export interface {capitalized}WithRelations extends {capitalized} {{
  // Add relations as needed
}}

{'// ===== Connection Types (Relay) =====' if config['has_connection'] else ''}
{f"""
export interface {capitalized}Edge {{
  cursor: string;
  node: {capitalized};
}}

export interface {capitalized}Connection {{
  edges: {capitalized}Edge[];
  pageInfo: {{
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  }};
  totalCount: number;
}}
""" if config['has_connection'] else ''}

// ===== Operation Result Types =====

export interface {capitalized}DeleteResult {{
  success: boolean;
  deletedCount?: number;
  message?: string;
}}
'''
    
    with open(f'backend/src/modules/{module_name}/{module_name}.types.ts', 'w') as f:
        f.write(types_content)
    
    print(f"    ✅ Types created")

def create_barrel_export(module_name, config):
    """Create barrel export (index.ts) for a module"""
    print(f"  📝 Creating barrel export for {module_name}...")
    
    capitalized = module_name.capitalize()
    has_service = config['service_file'] is not None
    
    content = f'''/**
 * {capitalized} Module
 * 
 * Barrel export for {capitalized} domain module.
 */

export * from './{module_name}.types';
{f"export * from './{module_name}.service';" if has_service else ''}
export {{ {capitalized}FieldResolvers, {capitalized}QueryResolvers, {capitalized}MutationResolvers }} from './{module_name}.resolver';
'''
    
    with open(f'backend/src/modules/{module_name}/index.ts', 'w') as f:
        f.write(content)
    
    print(f"    ✅ Barrel export created")

def main():
    print("🚀 Comprehensive Module Migration")
    print("=" * 60)
    print()
    
    for module_name, config in MODULES.items():
        print(f"📦 Processing module: {module_name}")
        
        # Step 1: Migrate service
        migrate_service(module_name, config)
        
        # Step 2: Create types
        create_types(module_name, config)
        
        # Step 3: Create barrel export
        create_barrel_export(module_name, config)
        
        print(f"  ✅ Module {module_name} structure ready")
        print()
    
    print("=" * 60)
    print("✅ All modules processed!")
    print()
    print("Next steps:")
    print("1. Create GraphQL schemas for each module")
    print("2. Create resolvers for each module")
    print("3. Wire modules into main resolver")
    print()

if __name__ == '__main__':
    main()
