/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class NotificationLog {
  static create(data = {}) {
    const now = new Date().toISOString();
    return {
      id: data.id || `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      reminderId: data.reminderId || null,
      batchId: data.batchId || null,
      candidateId: data.candidateId || null,
      advisorId: data.advisorId || null,
      recipient: data.recipient,
      channel: data.channel || 'WHATSAPP', // EMAIL, SMS, WHATSAPP
      templateId: data.templateId || null,
      subject: data.subject || '',
      messageBody: data.messageBody || '',
      provider: data.provider || null,
      providerMessageId: data.providerMessageId || null,
      status: data.status || 'PENDING', // SENT, DELIVERED, FAILED, SIMULATED
      failureReason: data.failureReason || null,
      retryCount: data.retryCount || 0,
      sentAt: data.sentAt || now,
      deliveredAt: data.deliveredAt || null,
      createdAt: data.createdAt || now
    };
  }
}
