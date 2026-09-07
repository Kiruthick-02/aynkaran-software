/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class NotificationBatch {
  static create(data = {}) {
    const now = new Date().toISOString();
    return {
      id: data.id || `batch-${Date.now().toString().slice(-6)}`,
      title: data.title || 'Bulk Notification Batch',
      milestoneType: data.milestoneType || 'GENERAL_NOTICE',
      channel: data.channel || 'WHATSAPP',
      recipientCount: data.recipientCount || 0,
      recipientIds: data.recipientIds || [],
      messageBody: data.messageBody || '',
      subject: data.subject || '',
      createdBy: data.createdBy || 'admin',
      approvalRequired: data.approvalRequired !== undefined ? data.approvalRequired : true,
      approvalStatus: data.approvalStatus || 'PENDING', // PENDING, APPROVED, REJECTED
      approvedBy: data.approvedBy || null,
      approvedAt: data.approvedAt || null,
      status: data.status || 'DRAFT', // DRAFT, SCHEDULED, PROCESSING, COMPLETED, FAILED
      successCount: data.successCount || 0,
      failureCount: data.failureCount || 0,
      startedAt: data.startedAt || null,
      completedAt: data.completedAt || null,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
  }
}
