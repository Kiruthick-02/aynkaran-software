/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WhatsAppService } from './whatsappService.js';
import { sendEmailReceipt } from '../utils/emailService.js';
import { sendSMSNotification } from '../utils/smsService.js';

const MAX_NOTIFICATION_RETRIES = 3;

export class NotificationService {
  constructor(db) {
    this.db = db;
  }

  async dispatch({
    reminderId = null,
    batchId = null,
    candidateId = null,
    advisorId = null,
    recipient,
    channel,
    subject = '',
    messageBody,
    templateId = null,
    variables = {},
    mediaUrl = null,
    retryCount = 0
  }) {
    if (!recipient || !channel || !messageBody) {
      throw new Error('Recipient, channel, and messageBody are mandatory for notification dispatch.');
    }

    const logId = `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();
    let result = { success: false, simulated: false, error: null, provider: null, providerMessageId: null };

    try {
      const normalizedChannel = channel.toUpperCase();

      if (normalizedChannel === 'WHATSAPP') {
        const waResult = await WhatsAppService.sendMessage({
          recipient,
          message: messageBody,
          templateId,
          variables,
          mediaUrl
        });
        result = {
          success: waResult.success,
          simulated: Boolean(waResult.simulated),
          error: waResult.error || null,
          provider: waResult.provider || 'WhatsApp Gateway',
          providerMessageId: waResult.providerMessageId || null,
          formattedMessage: waResult.messageBody || messageBody
        };
      } else if (normalizedChannel === 'EMAIL') {
        const emailResult = await sendEmailReceipt(
          recipient,
          subject || 'Aynkaran Notification',
          messageBody,
          null,
          variables
        );
        result = {
          success: emailResult.success,
          simulated: Boolean(emailResult.simulated),
          error: emailResult.error || null,
          provider: 'SMTP Gateway',
          providerMessageId: emailResult.messageId || null,
          formattedMessage: messageBody
        };
      } else if (normalizedChannel === 'SMS') {
        const smsResult = await sendSMSNotification(recipient, messageBody, variables);
        result = {
          success: smsResult.success,
          simulated: Boolean(smsResult.simulated),
          error: smsResult.error || null,
          provider: smsResult.gateway || 'Digital SMS Gateway',
          providerMessageId: smsResult.providerMessageId || null,
          formattedMessage: smsResult.messageBody || messageBody
        };
      } else {
        throw new Error(`Unsupported communication channel: ${channel}`);
      }

      const logEntry = {
        id: logId,
        reminderId,
        batchId,
        candidateId,
        advisorId,
        recipient,
        channel: normalizedChannel,
        templateId,
        subject,
        messageBody: result.formattedMessage || messageBody,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        status: result.success ? (result.simulated ? 'SIMULATED' : 'SENT') : 'FAILED',
        failureReason: result.error,
        retryCount,
        sentAt: now,
        createdAt: now
      };

      if (this.db?.collection) {
        await this.db.collection('notification_logs').insertOne(logEntry);
      }

      return {
        id: logId,
        success: result.success,
        simulated: result.simulated,
        status: logEntry.status,
        providerMessageId: result.providerMessageId,
        error: result.error
      };
    } catch (err) {
      console.error('[NotificationService.dispatch Error]', err);

      const failedEntry = {
        id: logId,
        reminderId,
        batchId,
        candidateId,
        advisorId,
        recipient,
        channel: channel.toUpperCase(),
        templateId,
        subject,
        messageBody,
        status: 'FAILED',
        failureReason: err.message,
        retryCount,
        sentAt: now,
        createdAt: now
      };

      if (this.db?.collection) {
        await this.db.collection('notification_logs').insertOne(failedEntry);
      }

      return {
        id: logId,
        success: false,
        status: 'FAILED',
        error: err.message
      };
    }
  }

  async retry(notificationId) {
    if (!this.db?.collection) throw new Error('Database connection required.');

    const log = await this.db.collection('notification_logs').findOne({ id: notificationId });
    if (!log) throw new Error('Notification record not found.');

    if (log.retryCount >= MAX_NOTIFICATION_RETRIES) {
      throw new Error(`Maximum retry limit (${MAX_NOTIFICATION_RETRIES}) exceeded for this notification.`);
    }

    const nextRetryCount = (log.retryCount || 0) + 1;

    const dispatchResult = await this.dispatch({
      reminderId: log.reminderId,
      batchId: log.batchId,
      candidateId: log.candidateId,
      advisorId: log.advisorId,
      recipient: log.recipient,
      channel: log.channel,
      subject: log.subject,
      messageBody: log.messageBody,
      templateId: log.templateId,
      retryCount: nextRetryCount
    });

    return dispatchResult;
  }

  async executeBatch(batchId) {
    if (!this.db?.collection) throw new Error('Database connection required.');

    const batch = await this.db.collection('notification_batches').findOne({ id: batchId });
    if (!batch) throw new Error('Notification batch not found.');

    if (batch.approvalRequired && batch.approvalStatus !== 'APPROVED') {
      throw new Error('Notification batch requires Owner/Manager approval before dispatching.');
    }

    await this.db.collection('notification_batches').updateOne(
      { id: batchId },
      { $set: { status: 'PROCESSING', startedAt: new Date().toISOString() } }
    );

    let successCount = 0;
    let failureCount = 0;

    for (const recipientItem of batch.recipientIds) {
      const recipientTarget = typeof recipientItem === 'string' ? recipientItem : (recipientItem.mobile || recipientItem.email);
      const candId = typeof recipientItem === 'object' ? recipientItem.candidateId : null;
      const advId = typeof recipientItem === 'object' ? recipientItem.advisorId : null;

      const res = await this.dispatch({
        batchId: batch.id,
        candidateId: candId,
        advisorId: advId,
        recipient: recipientTarget,
        channel: batch.channel,
        subject: batch.subject,
        messageBody: batch.messageBody,
        variables: typeof recipientItem === 'object' ? recipientItem : {}
      });

      if (res.success) successCount++;
      else failureCount++;

      await new Promise(r => setTimeout(r, 100));
    }

    const finishedAt = new Date().toISOString();
    const finalBatchStatus = failureCount === 0 ? 'COMPLETED' : (successCount > 0 ? 'COMPLETED' : 'FAILED');

    await this.db.collection('notification_batches').updateOne(
      { id: batchId },
      {
        $set: {
          status: finalBatchStatus,
          completedAt: finishedAt,
          successCount,
          failureCount
        }
      }
    );

    return {
      batchId,
      status: finalBatchStatus,
      successCount,
      failureCount
    };
  }
}
