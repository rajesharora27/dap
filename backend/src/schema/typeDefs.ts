import gql from 'graphql-tag';
import { commonTypeDefs } from '../modules/common/common.typeDefs';
import { authTypeDefs } from '../modules/auth/auth.typeDefs';
import { productTypeDefs } from '../modules/product/product.typeDefs';
import { solutionTypeDefs } from '../modules/solution/solution.typeDefs';
import { taskTypeDefs } from '../modules/task/task.typeDefs';
import { customerTypeDefs } from '../modules/customer/customer.typeDefs';
import { tagTypeDefs } from '../modules/tag/tag.typeDefs';
import { telemetryTypeDefs } from '../modules/telemetry/telemetry.typeDefs';
import { importTypeDefs } from '../modules/import/import.typeDefs';
import { auditTypeDefs } from '../modules/audit/audit.typeDefs';
import { adminTypeDefs } from '../modules/admin/admin.typeDefs';
import { aiTypeDefs } from '../modules/ai/ai.typeDefs';
import { backupTypeDefs } from '../modules/backup/backup.typeDefs';
import { searchTypeDefs } from '../modules/search/search.typeDefs';
import { changeTrackingTypeDefs } from '../modules/change-tracking/change-tracking.typeDefs';
import { diaryTypeDefs } from '../modules/my-diary/diary.typeDefs';
import { userActivityTypeDefs } from '../modules/user-activity';
import { settingsTypeDefs } from '../modules/settings';

export const typeDefs = [
  commonTypeDefs,
  authTypeDefs,
  productTypeDefs,
  solutionTypeDefs,
  taskTypeDefs,
  customerTypeDefs,
  tagTypeDefs,
  telemetryTypeDefs,
  importTypeDefs,
  auditTypeDefs,
  adminTypeDefs,
  aiTypeDefs,
  backupTypeDefs,
  searchTypeDefs,
  changeTrackingTypeDefs,
  diaryTypeDefs,
  userActivityTypeDefs,
  settingsTypeDefs
];
