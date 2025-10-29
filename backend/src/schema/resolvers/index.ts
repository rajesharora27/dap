import { GraphQLScalarType, Kind } from 'graphql';
import { ConnectionArguments, connectionFromArraySlice, cursorToOffset } from 'graphql-relay';
import { prisma, fallbackActive } from '../../context';
import { ExcelExportService, ExcelImportService, ImportMode } from '../../services/excel';
// (removed earlier simpler import replaced by extended import below)
import { updateProduct as fbUpdateProduct, softDeleteProduct as fbDeleteProduct, createProduct as fbCreateProduct, createTask as fbCreateTask, updateTask as fbUpdateTask, softDeleteTask as fbSoftDeleteTask, createSolution as fbCreateSolution, updateSolution as fbUpdateSolution, softDeleteSolution as fbDeleteSolution, createCustomer as fbCreateCustomer, updateCustomer as fbUpdateCustomer, softDeleteCustomer as fbDeleteCustomer, listCustomers as fbListCustomers, listLicenses, createLicense as fbCreateLicense, updateLicense as fbUpdateLicense, softDeleteLicense as fbDeleteLicense, createOutcome as fbCreateOutcome, updateOutcome as fbUpdateOutcome, softDeleteOutcome as fbSoftDeleteOutcome, listOutcomes as fbListOutcomes, listOutcomesForProduct as fbListOutcomesForProduct, getOutcomesForTask as fbGetOutcomesForTask, addProductToSolution as fbAddProductToSolution, removeProductFromSolution as fbRemoveProductFromSolution, addProductToCustomer as fbAddProductToCustomer, removeProductFromCustomer as fbRemoveProductFromCustomer, addSolutionToCustomer as fbAddSolutionToCustomer, removeSolutionFromCustomer as fbRemoveSolutionFromCustomer, reorderTasks as fbReorderTasks, fallbackConnections } from '../../lib/fallbackStore';
import { acquireLock, releaseLock } from '../../lib/lock';
import { createChangeSet, recordChange, commitChangeSet, undoChangeSet, listChangeSets, getChangeSet, revertChangeSet } from '../../lib/changes';
import { exportCsv, importCsv } from '../../lib/csv';
import { generateProductSampleCsv, generateTaskSampleCsv, validateProductHeaders, validateTaskHeaders } from '../../lib/csvSamples';
import { pubsub, PUBSUB_EVENTS } from '../../lib/pubsub';
import { 
  TelemetryAttributeResolvers,
  TelemetryValueResolvers, 
  TelemetryQueryResolvers,
  TelemetryMutationResolvers,
  TaskTelemetryResolvers
} from './telemetry';
import {
  CustomerAdoptionQueryResolvers,
  CustomerAdoptionMutationResolvers,
  CustomerProductWithPlanResolvers,
  AdoptionPlanResolvers,
  CustomerTaskResolvers,
  CustomerTelemetryAttributeResolvers,
  CustomerTelemetryValueResolvers
} from './customerAdoption';
import {
  SolutionAdoptionQueryResolvers,
  SolutionAdoptionMutationResolvers,
  CustomerSolutionWithPlanResolvers,
  SolutionAdoptionPlanResolvers,
  SolutionAdoptionProductResolvers,
  CustomerSolutionTaskResolvers
} from './solutionAdoption';
import { solutionReportingService } from '../../services/solutionReportingService';
import { fetchProductsPaginated, fetchTasksPaginated, fetchSolutionsPaginated } from '../../lib/pagination';
import { logAudit } from '../../lib/audit';
import { ensureRole, requireUser } from '../../lib/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  parseValue: (v: any) => v,
  serialize: (v: any) => v,
  parseLiteral(ast: any) {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
      case Kind.INT:
      case Kind.FLOAT:
        return ast.value as any;
      case Kind.OBJECT:
      case Kind.LIST:
        return (ast as any).value;
      default:
        return null;
    }
  }
});

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime scalar type',
  parseValue: (v: any) => {
    if (v instanceof Date) return v;
    if (typeof v === 'string' || typeof v === 'number') return new Date(v);
    return null;
  },
  serialize: (v: any) => {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'string') return v;
    return null;
  },
  parseLiteral(ast: any) {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  }
});

// Upload scalar for file uploads
const UploadScalar = new GraphQLScalarType({
  name: 'Upload',
  description: 'File upload scalar type',
  parseValue: (value: any) => value,
  serialize: () => {
    throw new Error('Upload serialization not supported');
  },
  parseLiteral: () => {
    throw new Error('Upload literal parsing not supported');
  }
});

// legacy helper kept for potential backward compatibility (unused now)
function relayFromArray<T>(items: T[], args: ConnectionArguments) {
  const offset = args.after ? cursorToOffset(args.after) + 1 : 0;
  const limit = args.first ?? 25;
  const slice = items.slice(offset, offset + limit);
  const conn = connectionFromArraySlice(slice, args, { sliceStart: offset, arrayLength: items.length });
  return { ...conn, totalCount: items.length };
}

export const resolvers = {
  JSON: JSONScalar,
  DateTime: DateTimeScalar,
  Upload: UploadScalar,
  Node: {
    __resolveType(obj: any) {
      if (obj.tasks !== undefined) return 'Product';
      if (obj.estMinutes !== undefined) return 'Task';
      return null;
    }
  },
  Product: {
    tasks: async (parent: any, args: any) => {
      if (fallbackActive) {
        return fallbackConnections.tasksForProduct(parent.id);
      }
      return fetchTasksPaginated(parent.id, args);
    },
    statusPercent: async (parent: any) => {
      try {
        if (fallbackActive) {
          const { tasks: allTasks } = require('../../lib/fallbackStore');
          const tasks = allTasks.filter((t: any) => t.productId === parent.id);
          if (!tasks.length) return 0;
          const totalWeight = tasks.reduce((a: number, t: any) => {
            const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : (t.weight || 0);
            return a + weight;
          }, 0) || 1;
          const completed = tasks.filter((t: any) => !!t.completedAt).reduce((a: number, t: any) => {
            const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : (t.weight || 0);
            return a + weight;
          }, 0);
          return Math.round((completed / totalWeight) * 100);
        }
        const tasks = await prisma.task.findMany({ where: { productId: parent.id, deletedAt: null } });
        if (!tasks.length) return 0;
        const totalWeight = tasks.reduce((a: number, t: any) => {
          const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : Number(t.weight || 0);
          const safeWeight = (isNaN(weight) || weight == null) ? 0 : weight;
          return a + safeWeight;
        }, 0) || 1;
        const completed = tasks.filter((t: any) => !!t.completedAt).reduce((a: number, t: any) => {
          const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : Number(t.weight || 0);
          const safeWeight = (isNaN(weight) || weight == null) ? 0 : weight;
          return a + safeWeight;
        }, 0);
        const result = Math.round((completed / totalWeight) * 100);
        return (isNaN(result) || !isFinite(result)) ? 0 : result;
      } catch (error) {
        console.error('Error calculating statusPercent:', error);
        return 0;
      }
    },
    completionPercentage: async (parent: any) => {
      try {
        if (fallbackActive) {
          const { tasks: allTasks } = require('../../lib/fallbackStore');
          const tasks = allTasks.filter((t: any) => t.productId === parent.id);
          if (!tasks.length) return 0;
          const totalWeight = tasks.reduce((a: number, t: any) => a + t.weight, 0) || 1;
          const completed = tasks.filter((t: any) => !!t.completedAt).reduce((a: number, t: any) => a + t.weight, 0);
          return Math.round((completed / totalWeight) * 100);
        }
        const tasks = await prisma.task.findMany({ where: { productId: parent.id, deletedAt: null } });
        if (!tasks.length) return 0;
        const totalWeight = tasks.reduce((a: number, t: any) => {
          const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : Number(t.weight || 0);
          const safeWeight = (isNaN(weight) || weight == null) ? 0 : weight;
          return a + safeWeight;
        }, 0) || 1;
        const completed = tasks.filter((t: any) => !!t.completedAt).reduce((a: number, t: any) => {
          const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : Number(t.weight || 0);
          const safeWeight = (isNaN(weight) || weight == null) ? 0 : weight;
          return a + safeWeight;
        }, 0);
        const result = Math.round((completed / totalWeight) * 100);
        return (isNaN(result) || !isFinite(result)) ? 0 : result;
      } catch (error) {
        console.error('Error calculating completionPercentage:', error);
        return 0;
      }
    },
    outcomes: async (parent: any) => {
      if (fallbackActive) {
        return fbListOutcomesForProduct(parent.id);
      }
      return prisma.outcome.findMany({ where: { productId: parent.id } });
    },
    licenses: async (parent: any) => {
      if (fallbackActive) {
        return listLicenses().filter((l: any) => l.productId === parent.id);
      }
      return prisma.license.findMany({ where: { productId: parent.id, deletedAt: null } });
    },
    releases: async (parent: any) => {
      if (fallbackActive) {
        // Fallback logic for releases would go here if needed
        return [];
      }
      return prisma.release.findMany({ 
        where: { productId: parent.id, deletedAt: null }, 
        orderBy: { level: 'asc' } 
      });
    }
  },
  Solution: {
    products: async (parent: any, args: any, ctx: any) => {
      if (fallbackActive) {
        const { products } = require('../../lib/fallbackStore');
        const list = products.filter((p: any) => parent.productIds?.includes(p.id));
        return { edges: list.map((p: any) => ({ cursor: Buffer.from(JSON.stringify({ id: p.id }), 'utf8').toString('base64'), node: p })), pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null }, totalCount: list.length };
      }
      // Fetch SolutionProduct records with order, then include the product
      const prods = await prisma.solutionProduct.findMany({ 
        where: { solutionId: parent.id }, 
        include: { product: true },
        orderBy: { order: 'asc' }  // Order by SolutionProduct.order field
      });
      // Map to products and attach order metadata
      const list = prods.map((sp: any) => ({ ...sp.product, _solutionProductOrder: sp.order }));
      return { edges: list.map((p: any) => ({ cursor: Buffer.from(JSON.stringify({ id: p.id }), 'utf8').toString('base64'), node: p })), pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: list.length };
    },
    tasks: async (parent: any, args: any) => {
      if (fallbackActive) {
        // For fallback, return empty tasks or implement fallback logic
        return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 };
      }
      return fetchTasksPaginated(undefined, { ...args, solutionId: parent.id });
    },
    completionPercentage: async (parent: any) => {
      if (fallbackActive) {
        return 0; // Fallback doesn't support solution tasks yet
      }
      const tasks = await prisma.task.findMany({ where: { solutionId: parent.id, deletedAt: null } });
      if (!tasks.length) return 0;
      const totalWeight = tasks.reduce((a: number, t: any) => {
        const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : t.weight;
        return a + weight;
      }, 0) || 1;
      const completed = tasks.filter((t: any) => !!t.completedAt).reduce((a: number, t: any) => {
        const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : t.weight;
        return a + weight;
      }, 0);
      return Math.round((completed / totalWeight) * 100);
    },
    releases: async (parent: any) => {
      if (fallbackActive) {
        // Fallback logic for releases would go here if needed
        return [];
      }
      return prisma.release.findMany({ 
        where: { solutionId: parent.id, deletedAt: null }, 
        orderBy: { level: 'asc' } 
      });
    },
    outcomes: async (parent: any) => {
      if (fallbackActive) {
        return [];
      }
      return prisma.outcome.findMany({ where: { solutionId: parent.id } });
    }
  },
  Customer: {
    products: (parent: any) => {
      if (fallbackActive) { 
        const { products } = require('../../lib/fallbackStore'); 
        return products.filter((p: any) => parent.productIds?.includes(p.id)); 
      }
      // Return CustomerProductWithPlan instead of just Product
      return prisma.customerProduct.findMany({ 
        where: { customerId: parent.id }, 
        include: { 
          product: true,
          customer: true,
        } 
      });
    },
    solutions: (parent: any) => {
      if (fallbackActive) { 
        const { solutions } = require('../../lib/fallbackStore'); 
        return solutions.filter((s: any) => parent.solutionIds?.includes(s.id)); 
      }
      // Return CustomerSolutionWithPlan instead of just Solution
      return prisma.customerSolution.findMany({ 
        where: { customerId: parent.id }, 
        include: { 
          solution: true,
          customer: true,
          adoptionPlan: true
        } 
      });
    }
  },
  Task: {
    weight: (parent: any) => {
      // Convert Prisma Decimal to Float
      if (parent.weight && typeof parent.weight === 'object' && 'toNumber' in parent.weight) {
        return parent.weight.toNumber();
      }
      return parent.weight || 0;
    },
    howToDoc: (parent: any) => {
      // Ensure it's always an array
      return parent.howToDoc || [];
    },
    howToVideo: (parent: any) => {
      // Ensure it's always an array
      return parent.howToVideo || [];
    },
    product: (parent: any) => {
      if (fallbackActive) {
        const { products } = require('../../lib/fallbackStore');
        return products.find((p: any) => p.id === parent.productId);
      }
      return parent.productId ? prisma.product.findUnique({ where: { id: parent.productId } }) : null;
    },
    solution: (parent: any) => {
      if (fallbackActive) {
        const { solutions } = require('../../lib/fallbackStore');
        return solutions.find((s: any) => s.id === parent.solutionId);
      }
      return parent.solutionId ? prisma.solution.findUnique({ where: { id: parent.solutionId } }) : null;
    },
    outcomes: async (parent: any) => {
      if (fallbackActive) {
        return fbGetOutcomesForTask(parent.id);
      }
      const taskOutcomes = await prisma.taskOutcome.findMany({
        where: { taskId: parent.id },
        include: { outcome: true }
      });
      return taskOutcomes.map((to: any) => to.outcome);
    },
    licenseLevel: (parent: any) => {
      // Convert Prisma enum to GraphQL enum
      const prismaToGraphQLMap: { [key: string]: string } = {
        'ESSENTIAL': 'Essential',
        'ADVANTAGE': 'Advantage',
        'SIGNATURE': 'Signature'
      };
      return prismaToGraphQLMap[parent.licenseLevel] || 'Essential';
    },
    license: async (parent: any) => {
      if (fallbackActive) {
        // In fallback mode, convert licenseLevel back to license object
        const licenses = listLicenses();
        const levelMap: { [key: string]: number } = {
          'ESSENTIAL': 1,
          'ADVANTAGE': 2,
          'SIGNATURE': 3
        };
        const requiredLevel = levelMap[parent.licenseLevel];
        return licenses.find((l: any) => l.level === requiredLevel && l.productId === parent.productId);
      }
      
      // Convert licenseLevel back to actual license object
      const levelMap: { [key: string]: number } = {
        'ESSENTIAL': 1,
        'ADVANTAGE': 2,
        'SIGNATURE': 3
      };
      const requiredLevel = levelMap[parent.licenseLevel];
      
      if (!requiredLevel || !parent.productId) {
        return null;
      }
      
      return await prisma.license.findFirst({
        where: {
          productId: parent.productId,
          level: requiredLevel,
          isActive: true,
          deletedAt: null
        }
      });
    },
    releases: async (parent: any) => {
      if (fallbackActive) {
        return [];
      }
      const taskReleases = await prisma.taskRelease.findMany({
        where: { taskId: parent.id },
        include: { release: true }
      });
      return taskReleases.map((tr: any) => tr.release);
    },
    availableInReleases: async (parent: any) => {
      if (fallbackActive) {
        return [];
      }
      // Get directly assigned releases
      const taskReleases = await prisma.taskRelease.findMany({
        where: { taskId: parent.id },
        include: { release: true }
      });
      const directReleases = taskReleases.map((tr: any) => tr.release);
      
      // Find all releases for the product/solution that have higher levels
      const productId = parent.productId;
      const solutionId = parent.solutionId;
      
      let allReleases: any[] = [];
      if (productId) {
        allReleases = await prisma.release.findMany({
          where: { productId, deletedAt: null },
          orderBy: { level: 'asc' }
        });
      } else if (solutionId) {
        allReleases = await prisma.release.findMany({
          where: { solutionId, deletedAt: null },
          orderBy: { level: 'asc' }
        });
      }
      
      // Get minimum release level this task is assigned to
      const minDirectLevel = Math.min(...directReleases.map((r: any) => r.level));
      
      // Include all releases at or above the minimum level
      const availableReleases = allReleases.filter((r: any) => r.level >= minDirectLevel);
      
      return availableReleases;
    },
    
    // Telemetry-related computed fields
    telemetryAttributes: TaskTelemetryResolvers.telemetryAttributes,
    
    isCompleteBasedOnTelemetry: TaskTelemetryResolvers.isCompleteBasedOnTelemetry,
    
    telemetryCompletionPercentage: TaskTelemetryResolvers.telemetryCompletionPercentage,
  },
  
  TelemetryAttribute: TelemetryAttributeResolvers,
  
  TelemetryValue: TelemetryValueResolvers,
  
  // Customer Adoption field resolvers
  CustomerProductWithPlan: CustomerProductWithPlanResolvers,
  AdoptionPlan: AdoptionPlanResolvers,
  CustomerTask: CustomerTaskResolvers,
  CustomerTelemetryAttribute: CustomerTelemetryAttributeResolvers,
  CustomerTelemetryValue: CustomerTelemetryValueResolvers,
  
  // Solution Adoption field resolvers
  CustomerSolutionWithPlan: CustomerSolutionWithPlanResolvers,
  SolutionAdoptionPlan: SolutionAdoptionPlanResolvers,
  SolutionAdoptionProduct: SolutionAdoptionProductResolvers,
  CustomerSolutionTask: CustomerSolutionTaskResolvers,
  
  Outcome: {
    product: (parent: any) => {
      if (!parent.productId) return null;
      if (fallbackActive) {
        const { products } = require('../../lib/fallbackStore');
        return products.find((p: any) => p.id === parent.productId);
      }
      return prisma.product.findUnique({ where: { id: parent.productId } });
    },
    solution: (parent: any) => {
      if (!parent.solutionId) return null;
      if (fallbackActive) {
        const { solutions } = require('../../lib/fallbackStore');
        return solutions.find((s: any) => s.id === parent.solutionId);
      }
      return prisma.solution.findUnique({ where: { id: parent.solutionId } });
    }
  },
  License: {
    product: (parent: any) => {
      if (fallbackActive) {
        const { products } = require('../../lib/fallbackStore');
        return products.find((p: any) => p.id === parent.productId);
      }
      return parent.productId ? prisma.product.findUnique({ where: { id: parent.productId } }) : null;
    }
  },
  Release: {
    product: (parent: any) => {
      if (fallbackActive) {
        const { products } = require('../../lib/fallbackStore');
        return products.find((p: any) => p.id === parent.productId);
      }
      return parent.productId ? prisma.product.findUnique({ where: { id: parent.productId } }) : null;
    },
    tasks: async (parent: any) => {
      if (fallbackActive) {
        return [];
      }
      const taskReleases = await prisma.taskRelease.findMany({
        where: { releaseId: parent.id },
        include: { task: true }
      });
      return taskReleases.map((tr: any) => tr.task);
    },
    inheritedTasks: async (parent: any) => {
      if (fallbackActive) {
        return [];
      }
      // Get all tasks that should be available in this release through inheritance
      // This includes tasks directly assigned to this release AND tasks from lower releases
      
      const productId = parent.productId;
      const solutionId = parent.solutionId;
      
      let lowerReleases: any[] = [];
      if (productId) {
        lowerReleases = await prisma.release.findMany({
          where: { 
            productId, 
            level: { lte: parent.level },
            deletedAt: null 
          },
          include: {
            tasks: {
              include: { task: true }
            }
          }
        });
      } else if (solutionId) {
        lowerReleases = await prisma.release.findMany({
          where: { 
            solutionId, 
            level: { lte: parent.level },
            deletedAt: null 
          },
          include: {
            tasks: {
              include: { task: true }
            }
          }
        });
      }
      
      // Collect all tasks from releases at or below this level
      const taskSet = new Set();
      const tasks: any[] = [];
      
      lowerReleases.forEach((release: any) => {
        release.tasks.forEach((tr: any) => {
          if (!taskSet.has(tr.task.id)) {
            taskSet.add(tr.task.id);
            tasks.push(tr.task);
          }
        });
      });
      
      return tasks;
    }
  },
  Query: {
    node: async (_: any, { id }: any) => {
      return prisma.product.findUnique({ where: { id } }) || prisma.task.findUnique({ where: { id } });
    },
    product: async (_: any, { id }: any) => {
      if (fallbackActive) {
        const { products } = require('../../lib/fallbackStore');
        return products.find((p: any) => p.id === id);
      }
      return prisma.product.findUnique({ 
        where: { id, deletedAt: null },
        include: {
          licenses: true,
          releases: true,
          outcomes: true
        }
      });
    },
    products: async (_: any, args: any) => {
      if (fallbackActive) return fallbackConnections.products();
      return fetchProductsPaginated(args);
    },
    solutions: async (_: any, args: any) => { if (fallbackActive) return fallbackConnections.solutions(); return fetchSolutionsPaginated(args); },
    tasks: async (_: any, args: any) => {
      if (args.productId) {
        return fetchTasksPaginated(args.productId, args);
      } else if (args.solutionId) {
        return fetchTasksPaginated(undefined, { ...args, solutionId: args.solutionId });
      } else {
        throw new Error('Either productId or solutionId must be provided');
      }
    },
    customers: async () => { if (fallbackActive) return fbListCustomers(); return prisma.customer.findMany({ where: { deletedAt: null } }).catch(() => []); },
    licenses: async () => { if (fallbackActive) return listLicenses(); return prisma.license.findMany({ where: { deletedAt: null } }); },
    releases: async (_: any, { productId }: any) => { 
      if (fallbackActive) return []; 
      const where: any = { deletedAt: null };
      if (productId) where.productId = productId;
      return prisma.release.findMany({ 
        where, 
        orderBy: [{ productId: 'asc' }, { level: 'asc' }] 
      }); 
    },

    outcomes: async (_: any, { productId, solutionId }: any) => {
      if (fallbackActive) return productId ? fbListOutcomesForProduct(productId) : fbListOutcomes();
      const where: any = {};
      if (productId) where.productId = productId;
      if (solutionId) where.solutionId = solutionId;
      return prisma.outcome.findMany({ where });
    },
    auditLogs: async (_: any, { limit = 50 }: any) => prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: Math.min(limit, 200) })
    , changeSets: async (_: any, { limit = 50 }: any) => listChangeSets(limit).then(async sets => Promise.all(sets.map(async (s: any) => ({ ...s, items: await prisma.changeItem.findMany({ where: { changeSetId: s.id } }) })))),
    changeSet: async (_: any, { id }: any) => getChangeSet(id).then(async (s: any) => s ? { ...s, items: await prisma.changeItem.findMany({ where: { changeSetId: s.id } }) } : null)
    , search: async (_: any, { query, first = 20 }: any) => {
      const q = query.trim();
      if (!q) return [];
      const products = await prisma.product.findMany({ where: { name: { contains: q, mode: 'insensitive' }, deletedAt: null }, take: first });
      const tasks = await prisma.task.findMany({ where: { name: { contains: q, mode: 'insensitive' }, deletedAt: null }, take: first });
      return [...products, ...tasks].slice(0, first);
    }
    , telemetry: async (_: any, { taskId, limit = 50 }: any) => prisma.telemetry.findMany({ where: { taskId }, orderBy: { createdAt: 'desc' }, take: Math.min(limit, 200) })
    
    // Telemetry Attribute queries
    , telemetryAttribute: TelemetryQueryResolvers.telemetryAttribute
    , telemetryAttributes: TelemetryQueryResolvers.telemetryAttributes
    , telemetryValue: TelemetryQueryResolvers.telemetryValue
    , telemetryValues: TelemetryQueryResolvers.telemetryValues
    , telemetryValuesByBatch: TelemetryQueryResolvers.telemetryValuesByBatch
    
    , taskDependencies: async (_: any, { taskId }: any) => prisma.taskDependency.findMany({ where: { taskId }, orderBy: { createdAt: 'asc' } })
    
    // Customer Adoption queries
    , customer: CustomerAdoptionQueryResolvers.customer
    , adoptionPlan: CustomerAdoptionQueryResolvers.adoptionPlan
    , adoptionPlansForCustomer: CustomerAdoptionQueryResolvers.adoptionPlansForCustomer
    , customerTask: CustomerAdoptionQueryResolvers.customerTask
    , customerTasksForPlan: CustomerAdoptionQueryResolvers.customerTasksForPlan
    , customerTelemetryDatabase: CustomerAdoptionQueryResolvers.customerTelemetryDatabase
    
    // Solution Adoption queries
    , solutionAdoptionPlan: SolutionAdoptionQueryResolvers.solutionAdoptionPlan
    , solutionAdoptionPlansForCustomer: SolutionAdoptionQueryResolvers.solutionAdoptionPlansForCustomer
    , customerSolutionTask: SolutionAdoptionQueryResolvers.customerSolutionTask
    , customerSolutionTasksForPlan: SolutionAdoptionQueryResolvers.customerSolutionTasksForPlan
    
    // Solution Reporting queries
    , solutionAdoptionReport: async (_: any, { solutionAdoptionPlanId }: any, ctx: any) => {
      requireUser(ctx);
      return await solutionReportingService.generateSolutionAdoptionReport(solutionAdoptionPlanId);
    }
    , solutionComparisonReport: async (_: any, { solutionId }: any, ctx: any) => {
      requireUser(ctx);
      return await solutionReportingService.generateSolutionComparisonReport(solutionId);
    }
    
    // Excel Export
    , exportProductToExcel: async (_: any, { productName }: any) => {
      const excelService = new ExcelExportService();
      const result = await excelService.exportProduct(productName);
      
      return {
        filename: result.filename,
        content: result.buffer.toString('base64'),
        mimeType: result.mimeType,
        size: result.size,
        stats: result.stats
      };
    }
  },
  Mutation: {
    signup: async (_: any, { email, username, password, role, name }: any) => {
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({ data: { email, username: username || email.split('@')[0], password: hashed, role, name } });
      const token = jwt.sign({ uid: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      return token;
    },
    login: async (_: any, { email, username, password }: any) => {
      const fallbackActive = (process.env.AUTH_FALLBACK || '').toLowerCase() === '1' || (process.env.AUTH_FALLBACK || '').toLowerCase() === 'true';
      if (fallbackActive) {
        const list = [
          { id: 'u-admin', username: 'admin', email: 'admin@example.com', password: 'admin', role: 'ADMIN' },
          { id: 'u-user', username: 'user', email: 'user@example.com', password: 'user', role: 'USER' }
        ];
        const u = list.find(u => (email && u.email === email) || (username && u.username === username));
        if (!u || u.password !== password) throw new Error('INVALID_CREDENTIALS');
        return jwt.sign({ uid: u.id, role: u.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      }
      let user = null;
      if (email) user = await prisma.user.findUnique({ where: { email } });
      if (!user && username) user = await prisma.user.findUnique({ where: { username } });
      if (!user) throw new Error('INVALID_CREDENTIALS');
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) throw new Error('INVALID_CREDENTIALS');
      return jwt.sign({ uid: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    },
    simpleLogin: async (_: any, { username, password }: any) => {
      const fallbackActive = (process.env.AUTH_FALLBACK || '').toLowerCase() === '1' || (process.env.AUTH_FALLBACK || '').toLowerCase() === 'true';
      if (fallbackActive) {
        const list = [
          { id: 'u-admin', username: 'admin', email: 'admin@example.com', password: 'admin', role: 'ADMIN' },
          { id: 'u-user', username: 'user', email: 'user@example.com', password: 'user', role: 'USER' }
        ];
        const u = list.find(u => u.username === username && u.password === password);
        if (!u) throw new Error('INVALID_CREDENTIALS');
        return jwt.sign({ uid: u.id, role: u.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      }
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) throw new Error('INVALID_CREDENTIALS');
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) throw new Error('INVALID_CREDENTIALS');
      return jwt.sign({ uid: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    },
    createProduct: async (_: any, { input }: any, ctx: any) => {
      if (!fallbackActive) ensureRole(ctx, 'ADMIN');
      if (fallbackActive) {
        const product = fbCreateProduct(input);
        await logAudit('CREATE_PRODUCT', 'Product', product.id, { input }, ctx.user?.id); return product;
      }

      // Extract license IDs from input and handle relationship
      const { licenseIds, ...productData } = input;

      // Create a new product
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          customAttrs: productData.customAttrs
        }
      });

      // Handle license relationship if licenseIds provided
      if (licenseIds && licenseIds.length > 0) {
        await prisma.license.updateMany({
          where: {
            id: { in: licenseIds },
            deletedAt: null  // Only update active licenses
          },
          data: { productId: product.id }
        });
      }

      await logAudit('CREATE_PRODUCT', 'Product', product.id, { input }, ctx.user?.id);
      return product;
    },
    updateProduct: async (_: any, { id, input }: any, ctx: any) => {
      if (!fallbackActive) ensureRole(ctx, 'ADMIN');
      if (fallbackActive) {
        const before = fbUpdateProduct(id, {});
        const updated = fbUpdateProduct(id, input);
        await logAudit('UPDATE_PRODUCT', 'Product', id, { before, after: updated });
        pubsub.publish(PUBSUB_EVENTS.PRODUCT_UPDATED, { productUpdated: updated });
        return updated;
      }
      const before = await prisma.product.findUnique({ where: { id } });

      // Extract license IDs from input and handle relationship update
      const { licenseIds, ...productData } = input;

      // Update the product with basic data
      const updated = await prisma.product.update({
        where: { id },
        data: productData
      });

      // Handle license relationship updates if licenseIds provided
      if (licenseIds !== undefined) {
        // First, clear existing licenses for this product
        await prisma.license.updateMany({
          where: { productId: id },
          data: { productId: null }
        });

        // Then, assign new licenses to this product
        if (licenseIds.length > 0) {
          await prisma.license.updateMany({
            where: {
              id: { in: licenseIds },
              deletedAt: null  // Only update active licenses
            },
            data: { productId: id }
          });
        }
      }

      if (before) {
        const cs = await createChangeSet();
        await recordChange(cs.id, 'Product', id, before, updated);
      }
      await logAudit('UPDATE_PRODUCT', 'Product', id, { before, after: updated });
      pubsub.publish(PUBSUB_EVENTS.PRODUCT_UPDATED, { productUpdated: updated });
      return updated;
    },
    deleteProduct: async (_: any, { id }: any, ctx: any) => {
      if (!fallbackActive) ensureRole(ctx, 'ADMIN');
      if (fallbackActive) {
        fbDeleteProduct(id);
        await logAudit('DELETE_PRODUCT', 'Product', id, {});
        return true;
      }
      
      try {
        // Hard delete: Remove all related entities first, then delete the product
        // This ensures cascading deletes work properly and no orphaned data remains
        
        // Delete related tasks
        await prisma.task.deleteMany({ where: { productId: id } });
        
        // Delete related outcomes
        await prisma.outcome.deleteMany({ where: { productId: id } });
        
        // Delete related licenses
        await prisma.license.deleteMany({ where: { productId: id } });
        
        // Delete related releases
        await prisma.release.deleteMany({ where: { productId: id } });
        
        // Delete product-solution relationships
        await prisma.solutionProduct.deleteMany({ where: { productId: id } });
        
        // Delete product-customer relationships
        await prisma.customerProduct.deleteMany({ where: { productId: id } });
        
        // Finally, delete the product itself
        await prisma.product.delete({ where: { id } });
        
        await logAudit('DELETE_PRODUCT', 'Product', id, {});
      } catch (error) {
        console.error('Error deleting product:', error);
        throw new Error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      return true;
    },
    createSolution: async (_: any, { input }: any, ctx: any) => { if (!fallbackActive) ensureRole(ctx, 'ADMIN'); if (fallbackActive) { const solution = fbCreateSolution(input); await logAudit('CREATE_SOLUTION', 'Solution', solution.id, { input }, ctx.user?.id); return solution; } const solution = await prisma.solution.create({ data: { name: input.name, description: input.description, customAttrs: input.customAttrs } }); await logAudit('CREATE_SOLUTION', 'Solution', solution.id, { input }, ctx.user?.id); return solution; },
    updateSolution: async (_: any, { id, input }: any, ctx: any) => { if (!fallbackActive) ensureRole(ctx, 'ADMIN'); if (fallbackActive) { const before = fbUpdateSolution(id, {}); const updated = fbUpdateSolution(id, input); await logAudit('UPDATE_SOLUTION', 'Solution', id, { before, after: updated }, ctx.user?.id); return updated; } const before = await prisma.solution.findUnique({ where: { id } }); const updated = await prisma.solution.update({ where: { id }, data: { ...input } }); if (before) { const cs = await createChangeSet(ctx.user?.id); await recordChange(cs.id, 'Solution', id, before, updated); } await logAudit('UPDATE_SOLUTION', 'Solution', id, { before, after: updated }, ctx.user?.id); return updated; },
    deleteSolution: async (_: any, { id }: any, ctx: any) => { if (!fallbackActive) ensureRole(ctx, 'ADMIN'); if (fallbackActive) { fbDeleteSolution(id); await logAudit('DELETE_SOLUTION', 'Solution', id, {}, ctx.user?.id); return true; } try { await prisma.solution.update({ where: { id }, data: { deletedAt: new Date() } }); } catch { } await logAudit('DELETE_SOLUTION', 'Solution', id, {}, ctx.user?.id); return true; },
    createCustomer: async (_: any, { input }: any, ctx: any) => { if (!fallbackActive) ensureRole(ctx, 'ADMIN'); if (fallbackActive) { const customer = fbCreateCustomer(input); await logAudit('CREATE_CUSTOMER', 'Customer', customer.id, { input }, ctx.user?.id); return customer; } const customer = await prisma.customer.create({ data: { name: input.name, description: input.description } }); await logAudit('CREATE_CUSTOMER', 'Customer', customer.id, { input }, ctx.user?.id); return customer; },
    updateCustomer: async (_: any, { id, input }: any, ctx: any) => { if (!fallbackActive) ensureRole(ctx, 'ADMIN'); if (fallbackActive) { const before = fbUpdateCustomer(id, {}); const updated = fbUpdateCustomer(id, input); await logAudit('UPDATE_CUSTOMER', 'Customer', id, { before, after: updated }, ctx.user?.id); return updated; } const before = await prisma.customer.findUnique({ where: { id } }); const updated = await prisma.customer.update({ where: { id }, data: { ...input } }); if (before) { const cs = await createChangeSet(ctx.user?.id); await recordChange(cs.id, 'Customer', id, before, updated); } await logAudit('UPDATE_CUSTOMER', 'Customer', id, { before, after: updated }, ctx.user?.id); return updated; },
    deleteCustomer: async (_: any, { id }: any, ctx: any) => { if (!fallbackActive) ensureRole(ctx, 'ADMIN'); if (fallbackActive) { fbDeleteCustomer(id); await logAudit('DELETE_CUSTOMER', 'Customer', id, {}, ctx.user?.id); return true; } try { await prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } }); } catch { } await logAudit('DELETE_CUSTOMER', 'Customer', id, {}, ctx.user?.id); return true; },
    createLicense: async (_: any, { input }: any, ctx: any) => {
      ensureRole(ctx, 'ADMIN');
      if (fallbackActive) {
        const l = fbCreateLicense(input);
        await logAudit('CREATE_LICENSE', 'License', l.id, { input }, ctx.user?.id);
        return l;
      }
      const l = await prisma.license.create({
        data: {
          name: input.name,
          description: input.description,
          level: input.level,
          isActive: input.isActive,
          productId: input.productId
        }
      });
      await logAudit('CREATE_LICENSE', 'License', l.id, { input }, ctx.user?.id);
      return l;
    },
    updateLicense: async (_: any, { id, input }: any, ctx: any) => {
      ensureRole(ctx, 'ADMIN');
      if (fallbackActive) {
        const before = fbUpdateLicense(id, {});
        const l = fbUpdateLicense(id, input);
        await logAudit('UPDATE_LICENSE', 'License', id, { before, after: l }, ctx.user?.id);
        return l;
      }
      const before = await prisma.license.findUnique({ where: { id } });
      const l = await prisma.license.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          level: input.level,
          isActive: input.isActive,
          productId: input.productId
        }
      });
      await logAudit('UPDATE_LICENSE', 'License', id, { before, after: l }, ctx.user?.id);
      return l;
    },
    deleteLicense: async (_: any, { id }: any, ctx: any) => { ensureRole(ctx, 'ADMIN'); if (fallbackActive) { fbDeleteLicense(id); await logAudit('DELETE_LICENSE', 'License', id, {}, ctx.user?.id); return true; } try { await prisma.license.update({ where: { id }, data: { deletedAt: new Date() } }); } catch { } await logAudit('DELETE_LICENSE', 'License', id, {}, ctx.user?.id); return true; },

    createRelease: async (_: any, { input }: any, ctx: any) => {
      ensureRole(ctx, 'ADMIN');
      if (fallbackActive) {
        // TODO: Add fallback support for releases if needed
        throw new Error('Release management not supported in fallback mode');
      }
      try {
        const r = await prisma.release.create({
          data: {
            name: input.name,
            description: input.description,
            level: input.level,
            isActive: input.isActive,
            productId: input.productId
          }
        });
        await logAudit('CREATE_RELEASE', 'Release', r.id, { input }, ctx.user?.id);
        return r;
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new Error('A release with this level already exists for this product');
        }
        throw error;
      }
    },
    updateRelease: async (_: any, { id, input }: any, ctx: any) => {
      ensureRole(ctx, 'ADMIN');
      if (fallbackActive) {
        throw new Error('Release management not supported in fallback mode');
      }
      const before = await prisma.release.findUnique({ where: { id } });
      try {
        const r = await prisma.release.update({
          where: { id },
          data: {
            name: input.name,
            description: input.description,
            level: input.level,
            isActive: input.isActive,
            productId: input.productId
          }
        });
        await logAudit('UPDATE_RELEASE', 'Release', id, { before, after: r }, ctx.user?.id);
        return r;
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new Error('A release with this level already exists for this product');
        }
        throw error;
      }
    },
    deleteRelease: async (_: any, { id }: any, ctx: any) => { 
      ensureRole(ctx, 'ADMIN'); 
      if (fallbackActive) {
        throw new Error('Release management not supported in fallback mode');
      }
      try { 
        await prisma.release.update({ where: { id }, data: { deletedAt: new Date() } }); 
      } catch { } 
      await logAudit('DELETE_RELEASE', 'Release', id, {}, ctx.user?.id); 
      return true; 
    },

    createOutcome: async (_: any, { input }: any, ctx: any) => {
      requireUser(ctx);
      
      // Validate that either productId or solutionId is provided (but not both)
      if (!input.productId && !input.solutionId) {
        throw new Error('Either productId or solutionId must be provided');
      }
      if (input.productId && input.solutionId) {
        throw new Error('Cannot provide both productId and solutionId');
      }
      
      if (fallbackActive) {
        try {
          // Check for duplicate names in the same product
          if (input.productId) {
            const existing = fbListOutcomesForProduct(input.productId).find(o => o.name === input.name);
            if (existing) {
              throw new Error(`An outcome with the name "${input.name}" already exists for this product. Please choose a different name.`);
            }
          }
          return fbCreateOutcome(input);
        } catch (error: any) {
          throw error;
        }
      }
      try {
        const outcome = await prisma.outcome.create({
          data: {
            name: input.name,
            description: input.description,
            productId: input.productId || null,
            solutionId: input.solutionId || null
          }
        });
        await logAudit('CREATE_OUTCOME', 'Outcome', outcome.id, { input }, ctx.user?.id);
        return outcome;
      } catch (error: any) {
        // Handle unique constraint violation for outcome name
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
          const target = input.productId ? 'product' : 'solution';
          throw new Error(`An outcome with the name "${input.name}" already exists for this ${target}. Please choose a different name.`);
        }
        // Re-throw other errors
        throw error;
      }
    },
    updateOutcome: async (_: any, { id, input }: any, ctx: any) => {
      requireUser(ctx);
      if (fallbackActive) {
        // Check for duplicate names in the same product
        const currentOutcome = fbListOutcomes().find(o => o.id === id);
        if (!currentOutcome) {
          throw new Error('Outcome not found');
        }
        const existing = fbListOutcomesForProduct(currentOutcome.productId).find(o => o.name === input.name && o.id !== id);
        if (existing) {
          throw new Error(`An outcome with the name "${input.name}" already exists for this product. Please choose a different name.`);
        }
        return fbUpdateOutcome(id, input);
      }
      const before = await prisma.outcome.findUnique({ where: { id } });
      const outcome = await prisma.outcome.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description
        }
      });
      await logAudit('UPDATE_OUTCOME', 'Outcome', id, { before, after: outcome }, ctx.user?.id);
      return outcome;
    },
    deleteOutcome: async (_: any, { id }: any, ctx: any) => {
      requireUser(ctx);
      if (fallbackActive) {
        return fbSoftDeleteOutcome(id);
      }
      try {
        await prisma.outcome.delete({ where: { id } });
      } catch { }
      await logAudit('DELETE_OUTCOME', 'Outcome', id, {}, ctx.user?.id);
      return true;
    },
    addProductToSolution: async (_: any, { solutionId, productId }: any, ctx: any) => { 
      ensureRole(ctx, 'ADMIN'); 
      if (fallbackActive) { 
        fbAddProductToSolution(solutionId, productId); 
        await logAudit('ADD_PRODUCT_SOLUTION', 'Solution', solutionId, { productId }, ctx.user?.id); 
        return true; 
      } 
      // Calculate next order number automatically (first added product = lowest order number)
      const maxOrderProduct = await prisma.solutionProduct.findFirst({
        where: { solutionId },
        orderBy: { order: 'desc' }
      });
      const nextOrder = (maxOrderProduct?.order || 0) + 1;
      
      await prisma.solutionProduct.upsert({ 
        where: { productId_solutionId: { productId, solutionId } }, 
        update: {}, 
        create: { productId, solutionId, order: nextOrder } 
      }); 
      await logAudit('ADD_PRODUCT_SOLUTION', 'Solution', solutionId, { productId, order: nextOrder }, ctx.user?.id); 
      return true; 
    },
    removeProductFromSolution: async (_: any, { solutionId, productId }: any, ctx: any) => { ensureRole(ctx, 'ADMIN'); if (fallbackActive) { fbRemoveProductFromSolution(solutionId, productId); await logAudit('REMOVE_PRODUCT_SOLUTION', 'Solution', solutionId, { productId }, ctx.user?.id); return true; } await prisma.solutionProduct.deleteMany({ where: { solutionId, productId } }); await logAudit('REMOVE_PRODUCT_SOLUTION', 'Solution', solutionId, { productId }, ctx.user?.id); return true; },
    addProductToCustomer: async (_: any, { customerId, productId }: any, ctx: any) => { ensureRole(ctx, 'ADMIN'); if (fallbackActive) { fbAddProductToCustomer(customerId, productId); await logAudit('ADD_PRODUCT_CUSTOMER', 'Customer', customerId, { productId }, ctx.user?.id); return true; } await prisma.customerProduct.upsert({ where: { customerId_productId: { customerId, productId } }, update: {}, create: { customerId, productId } }); await logAudit('ADD_PRODUCT_CUSTOMER', 'Customer', customerId, { productId }, ctx.user?.id); return true; },
    removeProductFromCustomer: async (_: any, { customerId, productId }: any, ctx: any) => { ensureRole(ctx, 'ADMIN'); if (fallbackActive) { fbRemoveProductFromCustomer(customerId, productId); await logAudit('REMOVE_PRODUCT_CUSTOMER', 'Customer', customerId, { productId }, ctx.user?.id); return true; } await prisma.customerProduct.deleteMany({ where: { customerId, productId } }); await logAudit('REMOVE_PRODUCT_CUSTOMER', 'Customer', customerId, { productId }, ctx.user?.id); return true; },
    addSolutionToCustomer: async (_: any, { customerId, solutionId }: any, ctx: any) => { ensureRole(ctx, 'ADMIN'); if (fallbackActive) { fbAddSolutionToCustomer(customerId, solutionId); await logAudit('ADD_SOLUTION_CUSTOMER', 'Customer', customerId, { solutionId }, ctx.user?.id); return true; } await prisma.customerSolution.upsert({ where: { customerId_solutionId: { customerId, solutionId } }, update: {}, create: { customerId, solutionId } }); await logAudit('ADD_SOLUTION_CUSTOMER', 'Customer', customerId, { solutionId }, ctx.user?.id); return true; },
    removeSolutionFromCustomer: async (_: any, { customerId, solutionId }: any, ctx: any) => { ensureRole(ctx, 'ADMIN'); if (fallbackActive) { fbRemoveSolutionFromCustomer(customerId, solutionId); await logAudit('REMOVE_SOLUTION_CUSTOMER', 'Customer', customerId, { solutionId }, ctx.user?.id); return true; } await prisma.customerSolution.deleteMany({ where: { customerId, solutionId } }); await logAudit('REMOVE_SOLUTION_CUSTOMER', 'Customer', customerId, { solutionId }, ctx.user?.id); return true; },
    reorderTasks: async (_: any, { productId, solutionId, order }: any, ctx: any) => {
      ensureRole(ctx, 'ADMIN');
      
      const entityType = productId ? 'Product' : 'Solution';
      const entityId = productId || solutionId;
      
      if (!entityId) {
        throw new Error('Either productId or solutionId must be provided');
      }
      
      if (fallbackActive) {
        const ok = fbReorderTasks(entityId, order);
        await logAudit('REORDER_TASKS', entityType, entityId, { order }, ctx.user?.id);
        return ok;
      }

      // Database implementation: Update sequence numbers based on new order
      try {
        // Use a transaction to avoid unique constraint violations
        await prisma.$transaction(async (tx: any) => {
          // First, set all sequence numbers to negative values to avoid conflicts
          for (let i = 0; i < order.length; i++) {
            await tx.task.update({
              where: { id: order[i] },
              data: { sequenceNumber: -(i + 1) }
            });
          }

          // Then, set them to the correct positive values
          for (let i = 0; i < order.length; i++) {
            await tx.task.update({
              where: { id: order[i] },
              data: { sequenceNumber: i + 1 }
            });
          }
        });

        await logAudit('REORDER_TASKS', entityType, entityId, { order }, ctx.user?.id);
        return true;
      } catch (error) {
        console.error('Failed to reorder tasks in database:', error);
        return false;
      }
    },
    createTask: async (_: any, { input }: any, ctx: any) => {
      console.log('🚀 CREATE_TASK CALLED - Raw input received:', JSON.stringify(input, null, 2));
      console.log('🚀 CREATE_TASK - howToDoc:', `"${input.howToDoc}"`);
      console.log('🚀 CREATE_TASK - howToVideo:', `"${input.howToVideo}"`);
      console.log('🚀 CREATE_TASK - Has howToDoc field:', Object.hasOwnProperty.call(input, 'howToDoc'));
      console.log('🚀 CREATE_TASK - Has howToVideo field:', Object.hasOwnProperty.call(input, 'howToVideo'));
      
      requireUser(ctx);

      // Ensure either productId or solutionId is provided
      if (!input.productId && !input.solutionId) {
        throw new Error('Either productId or solutionId must be provided');
      }

      // Ensure both are not provided
      if (input.productId && input.solutionId) {
        throw new Error('Cannot provide both productId and solutionId');
      }

      // Auto-assign sequence number if not provided with retry logic for race conditions
      if (!input.sequenceNumber) {
        if (fallbackActive) {
          // For fallback mode, find max sequence number from existing tasks
          const { tasks } = require('../../lib/fallbackStore');
          const existingTasks = tasks.filter((t: any) =>
            (input.productId && t.productId === input.productId) ||
            (input.solutionId && t.solutionId === input.solutionId)
          );
          const maxSequence = existingTasks.reduce((max: number, task: any) =>
            Math.max(max, task.sequenceNumber || 0), 0);
          input.sequenceNumber = maxSequence + 1;
        } else {
          // Get next available sequence number with retry logic for concurrent creation
          const lastTask = await prisma.task.findFirst({
            where: {
              deletedAt: null,
              ...(input.productId ? { productId: input.productId } : { solutionId: input.solutionId })
            },
            orderBy: { sequenceNumber: 'desc' }
          });
          input.sequenceNumber = (lastTask?.sequenceNumber || 0) + 1;
        }
      }

      if (fallbackActive) {
        // Extract outcomeIds before creating task
        const { outcomeIds, ...taskData } = input;
        const task = fbCreateTask(taskData);

        // Handle outcome associations if provided
        if (outcomeIds && outcomeIds.length > 0) {
          const { addTaskOutcome } = require('../../lib/fallbackStore');
          for (const outcomeId of outcomeIds) {
            addTaskOutcome(task.id, outcomeId);
          }
        }

        await logAudit('CREATE_TASK', 'Task', task.id, { input }, ctx.user?.id);
        pubsub.publish(PUBSUB_EVENTS.TASK_UPDATED, { taskUpdated: task });
        return task;
      }

      // Validate weightage sum for product/solution doesn't exceed 100
      const existingTasks = await prisma.task.findMany({
        where: {
          deletedAt: null,
          ...(input.productId ? { productId: input.productId } : { solutionId: input.solutionId })
        }
      });

      const currentWeightSum = existingTasks.reduce((sum: number, task: any) => {
        const weight = typeof task.weight === 'object' && 'toNumber' in task.weight ? task.weight.toNumber() : (task.weight || 0);
        return sum + weight;
      }, 0);
      if (currentWeightSum + (input.weight || 0) > 100) {
        throw new Error(`Total weight of tasks cannot exceed 100% for this ${input.productId ? 'product' : 'solution'}. Current: ${currentWeightSum.toFixed(2)}%, Trying to add: ${input.weight || 0}%`);
      }

      // Extract fields that need special handling
      const { outcomeIds, dependencies, licenseId, releaseIds, telemetryAttributes, ...taskData } = input;

      // Handle licenseId by converting it to licenseLevel
      let effectiveLicenseLevel = input.licenseLevel;
      if (licenseId && !effectiveLicenseLevel) {
        // Validate that the license belongs to the task's product (if product-based)
        if (input.productId) {
          // Look up the license and ensure it belongs to the task's product
          const license = await prisma.license.findFirst({
            where: {
              id: licenseId,
              productId: input.productId,  // Ensure license belongs to the task's product
              isActive: true,
              deletedAt: null
            }
          });

          if (!license) {
            throw new Error(`License with ID "${licenseId}" not found, is inactive, or does not belong to this product`);
          }

          // Convert license level number to string
          const levelMap: { [key: number]: string } = {
            1: 'Essential',
            2: 'Advantage',
            3: 'Signature'
          };
          effectiveLicenseLevel = levelMap[license.level] || 'Essential';
        } else if (input.solutionId) {
          // For solution-based tasks, we still need to find the license globally for now
          const license = await prisma.license.findFirst({
            where: {
              id: licenseId,
              isActive: true,
              deletedAt: null
            }
          });

          if (!license) {
            throw new Error(`License with ID "${licenseId}" not found or is inactive`);
          }

          // Convert license level number to string
          const levelMap: { [key: number]: string } = {
            1: 'Essential',
            2: 'Advantage',
            3: 'Signature'
          };
          effectiveLicenseLevel = levelMap[license.level] || 'Essential';
        }
      }

      // Convert GraphQL LicenseLevel enum to Prisma enum format
      const licenseLevelMap: { [key: string]: string } = {
        'Essential': 'ESSENTIAL',
        'Advantage': 'ADVANTAGE',
        'Signature': 'SIGNATURE'
      };
      const prismaLicenseLevel = effectiveLicenseLevel ? licenseLevelMap[effectiveLicenseLevel] || 'ESSENTIAL' : 'ESSENTIAL';

      // Validate that the license level corresponds to an actual license for the product
      if (input.productId && effectiveLicenseLevel) {
        const levelMap: { [key: string]: number } = {
          'Essential': 1,
          'Advantage': 2,
          'Signature': 3
        };
        const requiredLevel = levelMap[effectiveLicenseLevel];
        if (requiredLevel) {
          const productLicense = await prisma.license.findFirst({
            where: {
              productId: input.productId,
              level: requiredLevel,
              isActive: true,
              deletedAt: null
            }
          });
          if (!productLicense) {
            throw new Error(`License level "${effectiveLicenseLevel}" (level ${requiredLevel}) does not exist for this product. Please create the required license first.`);
          }
        }
      }

      // Create task with retry logic for sequence number conflicts
      let task;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          // Re-calculate sequence number on each attempt to handle race conditions
          if (attempts > 0) {
            // Only recalculate on retry attempts
            const lastTask = await prisma.task.findFirst({
              where: {
                deletedAt: null,
                ...(input.productId ? { productId: input.productId } : { solutionId: input.solutionId })
              },
              orderBy: { sequenceNumber: 'desc' }
            });
            taskData.sequenceNumber = (lastTask?.sequenceNumber || 0) + 1;
          }

          task = await prisma.task.create({
            data: {
              ...taskData,
              licenseLevel: prismaLicenseLevel
            }
          });

          // Success - break out of retry loop
          break;

        } catch (error: any) {
          attempts++;

          // Check if it's a sequence number conflict (Prisma unique constraint error)
          const isSequenceConflict = (error.code === 'P2002' &&
            error.meta?.target?.includes('sequenceNumber')) ||
            error.message?.includes('Unique constraint failed') ||
            error.message?.includes('sequenceNumber');

          if (isSequenceConflict && attempts < maxAttempts) {
            // Small delay to prevent tight retry loop with jitter
            await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 30));
            continue;
          }

          // If it's not a sequence number conflict or we've exceeded max attempts, rethrow
          throw error;
        }
      }

      if (!task) {
        throw new Error(`Failed to create task after ${maxAttempts} attempts due to sequence number conflicts`);
      }

      // Handle outcome associations if provided
      if (outcomeIds && outcomeIds.length > 0) {
        await prisma.taskOutcome.createMany({
          data: outcomeIds.map((outcomeId: string) => ({
            taskId: task.id,
            outcomeId: outcomeId
          }))
        });
      }

      // Handle release associations if provided
      if (releaseIds && releaseIds.length > 0) {
        // Validate that all releases belong to the task's product/solution
        const validReleases = await prisma.release.findMany({
          where: {
            id: { in: releaseIds },
            deletedAt: null,
            isActive: true,
            ...(input.productId ? { productId: input.productId } : { solutionId: input.solutionId })
          }
        });

        if (validReleases.length !== releaseIds.length) {
          throw new Error(`Some releases are invalid, inactive, or do not belong to this ${input.productId ? 'product' : 'solution'}`);
        }

        await prisma.taskRelease.createMany({
          data: releaseIds.map((releaseId: string) => ({
            taskId: task.id,
            releaseId: releaseId
          }))
        });
      }

      // Handle telemetry attributes if provided
      if (input.telemetryAttributes && input.telemetryAttributes.length > 0) {
        await prisma.telemetryAttribute.createMany({
          data: input.telemetryAttributes.map((attr: any, index: number) => ({
            taskId: task.id,
            name: attr.name,
            description: attr.description || '',
            dataType: attr.dataType,
            isRequired: attr.isRequired || false,
            successCriteria: attr.successCriteria || null,
            order: attr.order !== undefined ? attr.order : index,
            isActive: true
          }))
        });
      }

      await logAudit('CREATE_TASK', 'Task', task.id, { input }, ctx.user?.id);
      return task;
    },
    updateTask: async (_: any, { id, input }: any, ctx: any) => {
      requireUser(ctx);

      if (fallbackActive) {
        const before = fbUpdateTask(id, {});

        // Extract outcomeIds before updating task
        const { outcomeIds, ...taskData } = input;
        const task = fbUpdateTask(id, taskData);

        // Handle outcome associations if provided
        if (outcomeIds !== undefined) {
          const { removeTaskOutcome, addTaskOutcome, getOutcomesForTask } = require('../../lib/fallbackStore');

          // Get current outcomes for this task
          const currentOutcomes = getOutcomesForTask(id);

          // Remove all existing associations
          for (const outcome of currentOutcomes) {
            removeTaskOutcome(id, outcome.id);
          }

          // Add new associations if provided
          if (outcomeIds.length > 0) {
            for (const outcomeId of outcomeIds) {
              addTaskOutcome(id, outcomeId);
            }
          }
        }

        await logAudit('UPDATE_TASK', 'Task', id, { before, after: task }, ctx.user?.id);
        pubsub.publish(PUBSUB_EVENTS.TASK_UPDATED, { taskUpdated: task });
        return task;
      }

      const before = await prisma.task.findUnique({ where: { id } });
      if (!before) {
        throw new Error('Task not found');
      }

      // Track if sequence number is being updated
      let sequenceWasUpdated = false;

      // If sequence number is being updated, handle reordering
      if (input.sequenceNumber && input.sequenceNumber !== before.sequenceNumber) {
        const oldSequence = before.sequenceNumber;
        const newSequence = input.sequenceNumber;
        sequenceWasUpdated = true;

        console.log(`Reordering tasks: moving task ${id} from sequence ${oldSequence} to ${newSequence}`);

        // Use a transaction with two-step approach to avoid unique constraint violations
        await prisma.$transaction(async (tx: any) => {
          if (newSequence < oldSequence) {
            // Moving task to a lower sequence (e.g., from 5 to 2)
            // Step 1: Get all tasks that need to shift up
            const tasksToShift = await tx.task.findMany({
              where: {
                id: { not: id },
                deletedAt: null,
                sequenceNumber: { gte: newSequence, lt: oldSequence },
                ...(before.productId ? { productId: before.productId } : { solutionId: before.solutionId })
              },
              orderBy: { sequenceNumber: 'desc' } // Process in reverse order
            });

            // Step 2: Move affected tasks to temporary negative sequences
            for (let i = 0; i < tasksToShift.length; i++) {
              await tx.task.update({
                where: { id: tasksToShift[i].id },
                data: { sequenceNumber: -(i + 1000) }
              });
            }

            // Step 3: Move current task to new sequence
            await tx.task.update({
              where: { id },
              data: { sequenceNumber: newSequence }
            });

            // Step 4: Move affected tasks to their final sequences
            for (let i = 0; i < tasksToShift.length; i++) {
              await tx.task.update({
                where: { id: tasksToShift[i].id },
                data: { sequenceNumber: tasksToShift[i].sequenceNumber + 1 }
              });
            }
          } else if (newSequence > oldSequence) {
            // Moving task to a higher sequence (e.g., from 2 to 5)
            // Step 1: Get all tasks that need to shift down
            const tasksToShift = await tx.task.findMany({
              where: {
                id: { not: id },
                deletedAt: null,
                sequenceNumber: { gt: oldSequence, lte: newSequence },
                ...(before.productId ? { productId: before.productId } : { solutionId: before.solutionId })
              },
              orderBy: { sequenceNumber: 'asc' }
            });

            // Step 2: Move affected tasks to temporary negative sequences
            for (let i = 0; i < tasksToShift.length; i++) {
              await tx.task.update({
                where: { id: tasksToShift[i].id },
                data: { sequenceNumber: -(i + 1000) }
              });
            }

            // Step 3: Move current task to new sequence
            await tx.task.update({
              where: { id },
              data: { sequenceNumber: newSequence }
            });

            // Step 4: Move affected tasks to their final sequences
            for (let i = 0; i < tasksToShift.length; i++) {
              await tx.task.update({
                where: { id: tasksToShift[i].id },
                data: { sequenceNumber: tasksToShift[i].sequenceNumber - 1 }
              });
            }
          }
        });
      }

      // If weight is being updated, validate total doesn't exceed 100
      const beforeWeight = typeof before.weight === 'object' && 'toNumber' in before.weight ? before.weight.toNumber() : before.weight;
      if (input.weight !== undefined && input.weight !== beforeWeight) {
        const existingTasks = await prisma.task.findMany({
          where: {
            id: { not: id },
            deletedAt: null,
            ...(before.productId ? { productId: before.productId } : { solutionId: before.solutionId })
          }
        });

        const currentWeightSum = existingTasks.reduce((sum: number, task: any) => {
          const weight = typeof task.weight === 'object' && 'toNumber' in task.weight ? task.weight.toNumber() : (task.weight || 0);
          return sum + weight;
        }, 0);
        if (currentWeightSum + (input.weight || 0) > 100) {
          throw new Error(`Total weight of tasks cannot exceed 100% for this ${before.productId ? 'product' : 'solution'}. Current (excluding this task): ${currentWeightSum.toFixed(2)}%, Trying to set: ${input.weight || 0}%`);
        }
      }

      // Extract fields that need special handling
      const { outcomeIds, licenseId, releaseIds, telemetryAttributes, ...inputData } = input;

      // Handle licenseId by converting it to licenseLevel
      let effectiveLicenseLevel = inputData.licenseLevel;
      if (licenseId && !effectiveLicenseLevel) {
        // Validate that the license belongs to the task's product
        if (!before.productId) {
          throw new Error('Cannot assign license to task without a product');
        }

        // Look up the license and ensure it belongs to the task's product
        const license = await prisma.license.findFirst({
          where: {
            id: licenseId,
            productId: before.productId,  // Ensure license belongs to the task's product
            isActive: true,
            deletedAt: null
          }
        });

        if (!license) {
          throw new Error(`License with ID "${licenseId}" not found, is inactive, or does not belong to this product`);
        }

        // Convert license level number to string
        const levelMap: { [key: number]: string } = {
          1: 'Essential',
          2: 'Advantage',
          3: 'Signature'
        };
        effectiveLicenseLevel = levelMap[license.level] || 'Essential';

        // Update inputData with the converted license level
        inputData.licenseLevel = effectiveLicenseLevel;
      }

      // Convert GraphQL LicenseLevel enum to Prisma enum format if provided
      const licenseLevelMap: { [key: string]: string } = {
        'Essential': 'ESSENTIAL',
        'Advantage': 'ADVANTAGE',
        'Signature': 'SIGNATURE'
      };
      const updateData = { ...inputData }; // Now clean of licenseId and outcomeIds
      if (effectiveLicenseLevel) {
        updateData.licenseLevel = licenseLevelMap[effectiveLicenseLevel] || 'ESSENTIAL';

        // Validate that the license level corresponds to an actual license for the product
        if (before.productId) {
          const levelMap: { [key: string]: number } = {
            'Essential': 1,
            'Advantage': 2,
            'Signature': 3
          };
          const requiredLevel = levelMap[effectiveLicenseLevel];
          if (requiredLevel) {
            const productLicense = await prisma.license.findFirst({
              where: {
                productId: before.productId,
                level: requiredLevel,
                isActive: true,
                deletedAt: null
              }
            });
            if (!productLicense) {
              throw new Error(`License level "${effectiveLicenseLevel}" (level ${requiredLevel}) does not exist for this product. Please create the required license first.`);
            }
          }
        }
      }

      // Remove sequenceNumber from updateData if it was already handled in the reordering transaction
      if (sequenceWasUpdated && updateData.sequenceNumber !== undefined) {
        delete updateData.sequenceNumber;
      }

      const task = await prisma.task.update({
        where: { id },
        data: updateData
      });

      // Handle outcome associations if provided
      if (outcomeIds !== undefined) {
        // First, remove all existing associations
        await prisma.taskOutcome.deleteMany({
          where: { taskId: id }
        });

        // Then, create new associations if provided
        if (outcomeIds.length > 0) {
          await prisma.taskOutcome.createMany({
            data: outcomeIds.map((outcomeId: string) => ({
              taskId: id,
              outcomeId: outcomeId
            }))
          });
        }
      }

      // Handle release associations if provided
      if (releaseIds !== undefined) {
        // First, remove all existing associations
        await prisma.taskRelease.deleteMany({
          where: { taskId: id }
        });

        // Then, create new associations if provided
        if (releaseIds.length > 0) {
          // Validate that all releases belong to the task's product/solution
          const validReleases = await prisma.release.findMany({
            where: {
              id: { in: releaseIds },
              deletedAt: null,
              isActive: true,
              ...(before.productId ? { productId: before.productId } : { solutionId: before.solutionId })
            }
          });

          if (validReleases.length !== releaseIds.length) {
            throw new Error(`Some releases are invalid, inactive, or do not belong to this ${before.productId ? 'product' : 'solution'}`);
          }

          await prisma.taskRelease.createMany({
            data: releaseIds.map((releaseId: string) => ({
              taskId: id,
              releaseId: releaseId
            }))
          });
        }
      }

      // Handle telemetry attributes if provided
      if (telemetryAttributes !== undefined) {
        // First, remove all existing telemetry attributes
        await prisma.telemetryAttribute.deleteMany({
          where: { taskId: id }
        });

        // Then, create new attributes if provided
        if (telemetryAttributes.length > 0) {
          await prisma.telemetryAttribute.createMany({
            data: telemetryAttributes.map((attr: any, index: number) => ({
              taskId: id,
              name: attr.name,
              description: attr.description || '',
              dataType: attr.dataType,
              isRequired: attr.isRequired || false,
              successCriteria: attr.successCriteria || null,
              order: attr.order !== undefined ? attr.order : index,
              isActive: true
            }))
          });
        }
      }

      // Only create changeset if we have a valid user context
      if (before && ctx.user?.id) {
        const cs = await createChangeSet(ctx.user.id);
        await recordChange(cs.id, 'Task', id, before, task);
      }
      await logAudit('UPDATE_TASK', 'Task', id, { before, after: task }, ctx.user?.id);
      return task;
    },
    acquireLock: async (_: any, { entityType, entityId }: any, ctx: any) => { await acquireLock(ctx.sessionId || 'anon', entityType, entityId); await logAudit('ACQUIRE_LOCK', entityType, entityId, {}, ctx.user?.id); return true; },
    releaseLock: async (_: any, { entityType, entityId }: any, ctx: any) => { await releaseLock(ctx.sessionId || 'anon', entityType, entityId); await logAudit('RELEASE_LOCK', entityType, entityId, {}, ctx.user?.id); return true; },
    beginChangeSet: async (_: any, __: any, ctx: any) => { ensureRole(ctx, 'ADMIN'); const cs = await createChangeSet(ctx.user?.id); await logAudit('BEGIN_CHANGE_SET', 'ChangeSet', cs.id, {}, ctx.user?.id); return cs.id; },
    commitChangeSet: async (_: any, { id }: any, ctx: any) => { ensureRole(ctx, 'ADMIN'); await commitChangeSet(id); await logAudit('COMMIT_CHANGE_SET', 'ChangeSet', id, {}, ctx.user?.id); return true; },
    undoChangeSet: async (_: any, { id }: any, ctx: any) => { ensureRole(ctx, 'ADMIN'); await undoChangeSet(id); await logAudit('UNDO_CHANGE_SET', 'ChangeSet', id, {}, ctx.user?.id); return true; },
    revertChangeSet: async (_: any, { id }: any, ctx: any) => { ensureRole(ctx, 'ADMIN'); const ok = await revertChangeSet(id); await logAudit('REVERT_CHANGE_SET', 'ChangeSet', id, {}, ctx.user?.id); return ok; },

    // Task Export/Import (Tasks for specific product with append/overwrite modes)
    exportTasksCsv: async (_: any, { productId }: any, ctx: any) => {
      requireUser(ctx);

      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const tasks = await prisma.task.findMany({
        where: { productId, deletedAt: null },
        orderBy: { sequenceNumber: 'asc' },
        include: {
          outcomes: {
            select: { outcomeId: true }
          }
        }
      });

      const rows = tasks.map((task: any) => ({
        id: task.id,
        name: task.name,
        description: task.description || '',
        estMinutes: task.estMinutes,
        weight: task.weight,
        sequenceNumber: task.sequenceNumber,
        licenseLevel: task.licenseLevel,
        notes: task.notes || '',
        outcomeIds: task.outcomes.length > 0 ? JSON.stringify(task.outcomes.map((o: any) => o.outcomeId)) : ''
      }));

      const csv = exportCsv(rows);
      await logAudit('EXPORT_TASKS_CSV', 'Task', undefined, { count: tasks.length, productId }, ctx.user?.id);
      return csv;
    },

    importTasksCsv: async (_: any, { productId, csv, mode }: any, ctx: any) => {
      requireUser(ctx);

      const result = {
        success: false,
        productId,
        tasksCreated: 0,
        tasksUpdated: 0,
        tasksDeleted: 0,
        mode,
        errors: [] as string[],
        warnings: [] as string[]
      };

      try {
        // Verify product exists
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { id: true, name: true }
        });

        if (!product) {
          result.errors.push('Product not found');
          return result;
        }

        const rows = importCsv(csv);
        if (rows.length === 0) {
          result.errors.push('CSV file is empty');
          return result;
        }

        // Validate headers
        const headers = Object.keys(rows[0]);
        const headerValidation = validateTaskHeaders(headers);
        if (!headerValidation.valid) {
          result.errors.push(`Missing required fields: ${headerValidation.missing.join(', ')}`);
        }
        if (headerValidation.extra.length > 0) {
          result.warnings.push(`Ignoring unknown fields: ${headerValidation.extra.join(', ')}`);
        }
        if (result.errors.length > 0) {
          return result;
        }

        // Handle OVERWRITE mode - delete existing tasks first
        if (mode === 'OVERWRITE') {
          const deletedTasks = await prisma.task.updateMany({
            where: { productId, deletedAt: null },
            data: { deletedAt: new Date() }
          });
          result.tasksDeleted = deletedTasks.count;
        }

        // Validate weight sum
        const weightSum = rows.reduce((sum, row) => {
          const weight = parseFloat(row.weight) || 0;
          return sum + weight;
        }, 0);

        if (weightSum > 100) {
          result.warnings.push(`Total task weight ${weightSum.toFixed(1)}% exceeds 100%`);
        }

        // Track sequence numbers to ensure uniqueness
        const sequenceNumbers = new Set<number>();

        // Get existing sequence numbers for APPEND mode
        if (mode === 'APPEND') {
          const existingTasks = await prisma.task.findMany({
            where: { productId, deletedAt: null },
            select: { sequenceNumber: true }
          });
          existingTasks.forEach((task: any) => sequenceNumbers.add(task.sequenceNumber));
        }

        // Find next available sequence number for auto-assignment
        let nextSequence = 1;
        while (sequenceNumbers.has(nextSequence)) {
          nextSequence++;
        }

        for (const row of rows) {
          try {
            // Validate required fields
            if (!row.name?.trim()) {
              result.warnings.push('Skipping row with empty name');
              continue;
            }

            const estMinutes = parseInt(row.estMinutes) || 0;
            const weight = parseFloat(row.weight) || 0;
            let sequenceNumber = parseInt(row.sequenceNumber) || nextSequence;

            // Handle sequence number conflicts
            if (sequenceNumbers.has(sequenceNumber)) {
              result.warnings.push(`Task ${row.name}: sequence number ${sequenceNumber} already exists, using ${nextSequence}`);
              sequenceNumber = nextSequence;
              while (sequenceNumbers.has(nextSequence)) {
                nextSequence++;
              }
            }
            sequenceNumbers.add(sequenceNumber);
            nextSequence = Math.max(nextSequence, sequenceNumber) + 1;

            // Validate license level
            const validLicenseLevels = ['ESSENTIAL', 'ADVANTAGE', 'SIGNATURE'];
            let licenseLevel = 'ESSENTIAL';
            if (row.licenseLevel?.trim()) {
              const inputLevel = row.licenseLevel.toUpperCase();
              if (validLicenseLevels.includes(inputLevel)) {
                licenseLevel = inputLevel;
              } else {
                result.warnings.push(`Task ${row.name}: invalid license level '${row.licenseLevel}', using 'ESSENTIAL'`);
              }
            }

            const taskData = {
              productId,
              name: row.name.trim(),
              description: row.description?.trim() || null,
              estMinutes: estMinutes,
              weight: weight,
              sequenceNumber: sequenceNumber,
              licenseLevel: licenseLevel as any,
              notes: row.notes?.trim() || null
            };

            if (row.id?.trim()) {
              // Try to update existing task
              try {
                await prisma.task.update({
                  where: { id: row.id.trim() },
                  data: taskData
                });
                result.tasksUpdated++;
              } catch (e: any) {
                if (e.code === 'P2025') {
                  result.warnings.push(`Task ID ${row.id} not found, creating new task instead`);
                  await prisma.task.create({
                    data: { id: row.id.trim(), ...taskData }
                  });
                  result.tasksCreated++;
                } else {
                  throw e;
                }
              }
            } else {
              // Create new task
              await prisma.task.create({ data: taskData });
              result.tasksCreated++;
            }

          } catch (error: any) {
            result.errors.push(`Row ${row.name || 'unknown'}: ${error.message}`);
          }
        }

        result.success = result.errors.length === 0;

        await logAudit('IMPORT_TASKS_CSV', 'Task', undefined, {
          productId,
          mode,
          tasksCreated: result.tasksCreated,
          tasksUpdated: result.tasksUpdated,
          tasksDeleted: result.tasksDeleted,
          errorCount: result.errors.length,
          warningCount: result.warnings.length
        }, ctx.user?.id);

        return result;

      } catch (error: any) {
        result.errors.push(`Import failed: ${error.message}`);
        return result;
      }
    },

    downloadTaskSampleCsv: async () => {
      return generateTaskSampleCsv();
    },

    // Product Export/Import (Simple product fields only)
    exportProductsCsv: async (_: any, __: any, ctx: any) => {
      requireUser(ctx);

      const products = await prisma.product.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          statusPercent: true
        }
      });

      const rows = products.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        statusPercent: product.statusPercent || 0
      }));

      const csv = exportCsv(rows);
      await logAudit('EXPORT_PRODUCTS_CSV', 'Product', undefined, { count: products.length }, ctx.user?.id);
      return csv;
    },

    importProductsCsv: async (_: any, { csv }: any, ctx: any) => {
      requireUser(ctx);

      const result = {
        success: false,
        productsCreated: 0,
        productsUpdated: 0,
        errors: [] as string[],
        warnings: [] as string[]
      };

      try {
        const rows = importCsv(csv);
        if (rows.length === 0) {
          result.errors.push('CSV file is empty');
          return result;
        }

        // Validate headers - only allow simple product fields
        const headers = Object.keys(rows[0]);
        const requiredHeaders = ['name'];
        const allowedHeaders = ['id', 'name', 'description', 'statusPercent'];

        const missing = requiredHeaders.filter(h => !headers.includes(h));
        const invalid = headers.filter(h => !allowedHeaders.includes(h));

        if (missing.length > 0) {
          result.errors.push(`Missing required fields: ${missing.join(', ')}`);
        }
        if (invalid.length > 0) {
          result.warnings.push(`Ignoring unsupported fields (only simple product fields supported): ${invalid.join(', ')}`);
        }
        if (result.errors.length > 0) {
          return result;
        }

        for (const row of rows) {
          try {
            // Validate required fields
            if (!row.name?.trim()) {
              result.warnings.push('Skipping row with empty name');
              continue;
            }

            const productData = {
              name: row.name.trim(),
              description: row.description?.trim() || null,
              statusPercent: row.statusPercent ? Math.max(0, Math.min(100, parseInt(row.statusPercent) || 0)) : 0
            };

            if (row.id?.trim()) {
              // Try to update existing product
              try {
                await prisma.product.update({
                  where: { id: row.id.trim() },
                  data: productData
                });
                result.productsUpdated++;
              } catch (e: any) {
                if (e.code === 'P2025') {
                  result.warnings.push(`Product ID ${row.id} not found, creating new product instead`);
                  await prisma.product.create({
                    data: { id: row.id.trim(), ...productData }
                  });
                  result.productsCreated++;
                } else {
                  throw e;
                }
              }
            } else {
              // Create new product
              await prisma.product.create({ data: productData });
              result.productsCreated++;
            }

          } catch (error: any) {
            result.errors.push(`Row ${row.name || 'unknown'}: ${error.message}`);
          }
        }

        result.success = result.errors.length === 0;

        await logAudit('IMPORT_PRODUCTS_CSV', 'Product', undefined, {
          productsCreated: result.productsCreated,
          productsUpdated: result.productsUpdated,
          errorCount: result.errors.length,
          warningCount: result.warnings.length
        }, ctx.user?.id);

        return result;

      } catch (error: any) {
        result.errors.push(`Import failed: ${error.message}`);
        return result;
      }
    },

    downloadProductSampleCsv: async () => {
      return generateProductSampleCsv();
    },

    addTaskDependency: async (_: any, { taskId, dependsOnId }: any, ctx: any) => { requireUser(ctx); await prisma.taskDependency.create({ data: { taskId, dependsOnId } }); await logAudit('ADD_TASK_DEP', 'TaskDependency', taskId, { dependsOnId }); return true; },
    removeTaskDependency: async (_: any, { taskId, dependsOnId }: any, ctx: any) => { requireUser(ctx); await prisma.taskDependency.deleteMany({ where: { taskId, dependsOnId } }); await logAudit('REMOVE_TASK_DEP', 'TaskDependency', taskId, { dependsOnId }); return true; },
    addTelemetry: async (_: any, { taskId, data }: any, ctx: any) => { requireUser(ctx); await prisma.telemetry.create({ data: { taskId, data } }); await logAudit('ADD_TELEMETRY', 'Telemetry', taskId, {}); return true; },
    
    // Telemetry Attribute mutations
    createTelemetryAttribute: TelemetryMutationResolvers.createTelemetryAttribute,
    updateTelemetryAttribute: TelemetryMutationResolvers.updateTelemetryAttribute,
    deleteTelemetryAttribute: TelemetryMutationResolvers.deleteTelemetryAttribute,
    
    // Telemetry Value mutations
    addTelemetryValue: TelemetryMutationResolvers.addTelemetryValue,
    addBatchTelemetryValues: TelemetryMutationResolvers.addBatchTelemetryValues,
    updateTelemetryValue: TelemetryMutationResolvers.updateTelemetryValue,
    deleteTelemetryValue: TelemetryMutationResolvers.deleteTelemetryValue,
    
    queueTaskSoftDelete: async (_: any, { id }: any, ctx: any) => { ensureRole(ctx, 'ADMIN'); if (fallbackActive) { fbSoftDeleteTask(id); } else { await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } }); } await logAudit('QUEUE_TASK_DELETE', 'Task', id, {}); return true; },
    processDeletionQueue: async (_: any, { limit = 50 }: any, ctx: any) => {
      ensureRole(ctx, 'ADMIN');

      if (fallbackActive) {
        // In fallback mode, just return 0 as deletions are handled immediately
        await logAudit('PROCESS_DELETE_QUEUE', 'Task', undefined, { count: 0 });
        return 0;
      }

      // Find all tasks marked for deletion (soft deleted)
      const tasksToDelete = await prisma.task.findMany({
        where: {
          deletedAt: { not: null }
        },
        take: limit
      });

      // Actually delete them from the database and reorder sequence numbers
      let deletedCount = 0;
      for (const task of tasksToDelete) {
        try {
          // Get task details before deletion for sequence number reordering
          const taskToDelete = await prisma.task.findUnique({
            where: { id: task.id },
            select: {
              id: true,
              sequenceNumber: true,
              productId: true,
              solutionId: true
            }
          });

          if (!taskToDelete) {
            console.log(`Task ${task.id} not found for deletion`);
            continue; // Task might have been already deleted
          }

          console.log(`Deleting task ${task.id} with sequence ${taskToDelete.sequenceNumber} for product ${taskToDelete.productId}`);

          // Delete related records first (only delete records that exist in schema)
          await prisma.taskOutcome.deleteMany({ where: { taskId: task.id } });
          await prisma.telemetry.deleteMany({ where: { taskId: task.id } });

          // Delete the task
          await prisma.task.delete({ where: { id: task.id } });

          // Reorder sequence numbers for remaining tasks
          // All tasks with sequence numbers higher than the deleted task should be decremented by 1
          if (taskToDelete.sequenceNumber) {
            console.log(`Reordering tasks with sequence > ${taskToDelete.sequenceNumber} for product ${taskToDelete.productId}`);

            // Use two-step approach to avoid unique constraint violations
            // Step 1: Move all affected tasks to negative sequences
            const tasksToReorder = await prisma.task.findMany({
              where: {
                deletedAt: null,
                sequenceNumber: { gt: taskToDelete.sequenceNumber },
                ...(taskToDelete.productId ? { productId: taskToDelete.productId } : { solutionId: taskToDelete.solutionId })
              },
              orderBy: { sequenceNumber: 'asc' }
            });

            // Step 2: Update each task to temporary negative value, then to final value
            for (let i = 0; i < tasksToReorder.length; i++) {
              const task = tasksToReorder[i];
              const newSeq = task.sequenceNumber - 1;
              
              // First move to negative to avoid constraint
              await prisma.task.update({
                where: { id: task.id },
                data: { sequenceNumber: -(i + 1000) }
              });
            }

            // Step 3: Update to final positive values
            for (let i = 0; i < tasksToReorder.length; i++) {
              const task = tasksToReorder[i];
              const newSeq = task.sequenceNumber - 1;
              
              await prisma.task.update({
                where: { id: task.id },
                data: { sequenceNumber: newSeq }
              });
            }

            console.log(`Reordered ${tasksToReorder.length} tasks after deleting task with sequence ${taskToDelete.sequenceNumber}`);
          }

          deletedCount++;
        } catch (error: any) {
          console.error(`Failed to delete task ${task.id}:`, error.message);
        }
      }

      await logAudit('PROCESS_DELETE_QUEUE', 'Task', undefined, { count: deletedCount });
      return deletedCount;
    },

    // Customer Adoption mutations
    assignProductToCustomer: CustomerAdoptionMutationResolvers.assignProductToCustomer,
    updateCustomerProduct: CustomerAdoptionMutationResolvers.updateCustomerProduct,
    removeProductFromCustomerEnhanced: CustomerAdoptionMutationResolvers.removeProductFromCustomerEnhanced,
    createAdoptionPlan: CustomerAdoptionMutationResolvers.createAdoptionPlan,
    syncAdoptionPlan: CustomerAdoptionMutationResolvers.syncAdoptionPlan,
    updateCustomerTaskStatus: CustomerAdoptionMutationResolvers.updateCustomerTaskStatus,
    bulkUpdateCustomerTaskStatus: CustomerAdoptionMutationResolvers.bulkUpdateCustomerTaskStatus,
    addCustomerTelemetryValue: CustomerAdoptionMutationResolvers.addCustomerTelemetryValue,
    bulkAddCustomerTelemetryValues: CustomerAdoptionMutationResolvers.bulkAddCustomerTelemetryValues,
    evaluateTaskTelemetry: CustomerAdoptionMutationResolvers.evaluateTaskTelemetry,
    evaluateAllTasksTelemetry: CustomerAdoptionMutationResolvers.evaluateAllTasksTelemetry,
    exportCustomerAdoptionToExcel: CustomerAdoptionMutationResolvers.exportCustomerAdoptionToExcel,
    importCustomerAdoptionFromExcel: CustomerAdoptionMutationResolvers.importCustomerAdoptionFromExcel,
    exportAdoptionPlanTelemetryTemplate: CustomerAdoptionMutationResolvers.exportAdoptionPlanTelemetryTemplate,
    importAdoptionPlanTelemetry: CustomerAdoptionMutationResolvers.importAdoptionPlanTelemetry,
    
    // Solution Adoption mutations
    assignSolutionToCustomer: SolutionAdoptionMutationResolvers.assignSolutionToCustomer,
    updateCustomerSolution: SolutionAdoptionMutationResolvers.updateCustomerSolution,
    removeSolutionFromCustomerEnhanced: SolutionAdoptionMutationResolvers.removeSolutionFromCustomerEnhanced,
    createSolutionAdoptionPlan: SolutionAdoptionMutationResolvers.createSolutionAdoptionPlan,
    syncSolutionAdoptionPlan: SolutionAdoptionMutationResolvers.syncSolutionAdoptionPlan,
    updateCustomerSolutionTaskStatus: SolutionAdoptionMutationResolvers.updateCustomerSolutionTaskStatus,
    bulkUpdateCustomerSolutionTaskStatus: SolutionAdoptionMutationResolvers.bulkUpdateCustomerSolutionTaskStatus,
    evaluateSolutionTaskTelemetry: SolutionAdoptionMutationResolvers.evaluateSolutionTaskTelemetry,
    evaluateAllSolutionTasksTelemetry: SolutionAdoptionMutationResolvers.evaluateAllSolutionTasksTelemetry,
    addProductToSolutionEnhanced: SolutionAdoptionMutationResolvers.addProductToSolutionEnhanced,
    removeProductFromSolutionEnhanced: SolutionAdoptionMutationResolvers.removeProductFromSolutionEnhanced,
    reorderProductsInSolution: SolutionAdoptionMutationResolvers.reorderProductsInSolution,

    // Excel Import
    importProductFromExcel: async (_: any, { content, mode }: any, ctx: any) => {
      ensureRole(ctx, 'ADMIN');
      
      try {
        const buffer = Buffer.from(content, 'base64');
        const excelService = new ExcelImportService();
        
        // Map string mode to enum
        let importMode: ImportMode;
        switch (mode) {
          case 'CREATE_NEW':
            importMode = ImportMode.CREATE_NEW;
            break;
          case 'UPDATE_EXISTING':
            importMode = ImportMode.UPDATE_EXISTING;
            break;
          case 'CREATE_OR_UPDATE':
          default:
            importMode = ImportMode.CREATE_OR_UPDATE;
            break;
        }
        
        const result = await excelService.importProduct(buffer, importMode);
        
        await logAudit('IMPORT_PRODUCT', 'Product', result.productId, {
          productName: result.productName,
          mode: mode,
          success: result.success,
          stats: result.stats
        });
        
        return result;
      } catch (error: any) {
        console.error('Import failed:', error);
        return {
          success: false,
          productName: 'Unknown',
          stats: {
            tasksImported: 0,
            outcomesImported: 0,
            releasesImported: 0,
            licensesImported: 0,
            customAttributesImported: 0,
            telemetryAttributesImported: 0
          },
          errors: [
            {
              sheet: 'Import',
              message: error.message || 'Unknown error occurred during import',
              severity: 'error'
            }
          ],
          warnings: []
        };
      }
    }
  },
  Subscription: {
    productUpdated: {
      subscribe: () => pubsub.asyncIterator(PUBSUB_EVENTS.PRODUCT_UPDATED)
    },
    taskUpdated: {
      subscribe: () => pubsub.asyncIterator(PUBSUB_EVENTS.TASK_UPDATED)
    }
  }
};
