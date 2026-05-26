/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// MongoDB Atlas High-Speed CRM automated notification remind document model definition
export class Reminder {
  static getCollectionName() {
    return 'reminders';
  }

  static getSchema() {
    return {
      id: { type: String, required: true, unique: true },
      title: { type: String, required: true },
      description: { type: String },
      dueDate: { type: String, required: true },
      targetId: { type: String, required: true },
      targetType: { type: String, required: true },
      triggerType: { type: String, required: true },
      completed: { type: Boolean, default: false },
      channels: {
        type: Object,
        default: {
          desktop: Boolean,
          whatsapp: Boolean,
          email: Boolean,
          sms: Boolean
        }
      },
      createdAt: { type: String, required: true }
    };
  }
}
