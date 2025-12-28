import { JSONScalar, DateTimeScalar, UploadScalar } from '../../modules/common/scalars';
import { CommonResolvers } from '../../modules/common/common.resolver';
import {
  TelemetryAttributeResolvers,
  TelemetryValueResolvers,
  TelemetryQueryResolvers,
  TelemetryMutationResolvers,
  TaskTelemetryResolvers
} from '../../modules/telemetry/telemetry.resolver';
import {
  CustomerTelemetryAttributeResolvers,
  CustomerTelemetryValueResolvers,
  CustomerTelemetryMutationResolvers
} from '../../modules/telemetry/customer-telemetry.resolver';
import {
  CustomerAdoptionQueryResolvers,
  CustomerAdoptionMutationResolvers,
  CustomerProductWithPlanResolvers,
  AdoptionPlanResolvers,
  CustomerTaskResolvers
} from '../../modules/customer/customer-adoption.resolver';
import {
  SolutionAdoptionQueryResolvers,
  SolutionAdoptionMutationResolvers,
  CustomerSolutionWithPlanResolvers,
  SolutionAdoptionPlanResolvers,
  SolutionAdoptionProductResolvers,
  CustomerSolutionTaskResolvers
} from '../../modules/solution/solution-adoption.resolver';
import { TagResolvers } from '../../modules/tag/tag.resolver';
import { BackupQueryResolvers, BackupMutationResolvers } from '../../modules/backup';
import { AuthQueryResolvers, AuthMutationResolvers } from '../../modules/auth';
import { AIQueryResolvers, AIMutationResolvers } from '../../modules/ai';
import { ImportQueryResolvers, ImportMutationResolvers } from '../../modules/import';
import { AuditQueryResolvers } from '../../modules/audit/audit.resolver';
import {
  ProductFieldResolvers,
  ProductQueryResolvers,
  ProductMutationResolvers
} from '../../modules/product';
import {
  LicenseFieldResolvers,
  LicenseQueryResolvers,
  LicenseMutationResolvers
} from '../../modules/license';
import {
  SolutionFieldResolvers,
  SolutionQueryResolvers,
  SolutionMutationResolvers
} from '../../modules/solution';
import {
  CustomerFieldResolvers,
  CustomerQueryResolvers,
  CustomerMutationResolvers
} from '../../modules/customer';
import {
  ReleaseFieldResolvers,
  ReleaseQueryResolvers,
  ReleaseMutationResolvers
} from '../../modules/release';
import {
  OutcomeFieldResolvers,
  OutcomeQueryResolvers,
  OutcomeMutationResolvers
} from '../../modules/outcome';
import {
  TaskFieldResolvers,
  TaskQueryResolvers,
  TaskMutationResolvers
} from '../../modules/task';
import { ChangeTrackingQueryResolvers, ChangeTrackingMutationResolvers } from '../../modules/change-tracking/change-tracking.resolver';
import { SearchQueryResolvers, SearchResolvers } from '../../modules/search/search.resolver';
import { pubsub, PUBSUB_EVENTS } from '../../shared/pubsub/pubsub';
import { solutionReportingService } from '../../modules/solution/solution-reporting.service';
import { requireUser } from '../../shared/auth/auth-helpers';
import { prisma } from '../../shared/graphql/context';

export const resolvers = {
  JSON: JSONScalar,
  DateTime: DateTimeScalar,
  Upload: UploadScalar,
  Node: CommonResolvers.Node,
  SearchResult: SearchResolvers.SearchResult,

  Product: ProductFieldResolvers,
  Solution: SolutionFieldResolvers,
  Customer: CustomerFieldResolvers,
  Task: TaskFieldResolvers,
  Outcome: OutcomeFieldResolvers,
  License: LicenseFieldResolvers,
  Release: ReleaseFieldResolvers,

  TelemetryAttribute: TelemetryAttributeResolvers,
  TelemetryValue: TelemetryValueResolvers,

  CustomerProductWithPlan: CustomerProductWithPlanResolvers,
  AdoptionPlan: AdoptionPlanResolvers,
  CustomerTask: CustomerTaskResolvers,
  CustomerTelemetryAttribute: CustomerTelemetryAttributeResolvers,
  CustomerTelemetryValue: CustomerTelemetryValueResolvers,

  CustomerSolutionWithPlan: CustomerSolutionWithPlanResolvers,
  SolutionAdoptionPlan: SolutionAdoptionPlanResolvers,
  SolutionAdoptionProduct: SolutionAdoptionProductResolvers,
  CustomerSolutionTask: CustomerSolutionTaskResolvers,

  Query: {
    ...TaskQueryResolvers,
    ...TagResolvers.Query,
    ...ProductQueryResolvers,
    ...LicenseQueryResolvers,
    ...SolutionQueryResolvers,
    ...CustomerQueryResolvers,
    ...ReleaseQueryResolvers,
    ...OutcomeQueryResolvers,
    ...TelemetryQueryResolvers,
    ...CustomerAdoptionQueryResolvers,
    ...SolutionAdoptionQueryResolvers,
    ...BackupQueryResolvers,
    ...AuthQueryResolvers,
    ...AIQueryResolvers,
    ...ChangeTrackingQueryResolvers,
    ...SearchQueryResolvers,
    ...ImportQueryResolvers,
    ...AuditQueryResolvers,

    node: async (_: any, { id }: any) => {
      // Generic fallback node resolver if domain resolvers don't handle it
      return prisma.product.findUnique({ where: { id } }) ||
        prisma.task.findUnique({ where: { id } }) ||
        prisma.solution.findUnique({ where: { id } }) ||
        prisma.customer.findUnique({ where: { id } });
    },
  },

  Mutation: {
    ...TagResolvers.Mutation,
    ...TaskMutationResolvers,
    ...ProductMutationResolvers,
    ...LicenseMutationResolvers,
    ...SolutionMutationResolvers,
    ...CustomerMutationResolvers,
    ...ReleaseMutationResolvers,
    ...OutcomeMutationResolvers,
    ...TelemetryMutationResolvers,
    ...CustomerAdoptionMutationResolvers,
    ...CustomerTelemetryMutationResolvers,
    ...SolutionAdoptionMutationResolvers,
    ...BackupMutationResolvers,
    ...AuthMutationResolvers,
    ...AIMutationResolvers,
    ...ImportMutationResolvers,
    ...ChangeTrackingMutationResolvers
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
