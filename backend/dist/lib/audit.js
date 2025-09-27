"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const context_1 = require("../context");
async function logAudit(action, entity, entityId, details, userId) {
    try {
        await context_1.prisma.auditLog.create({ data: { action, entity, entityId, details, userId: userId || undefined } });
    }
    catch (e) {
        // swallow to avoid mutation failures due to audit issues
        // Ideally log somewhere persistent
        // console.error('Audit log failed', e);
    }
}
