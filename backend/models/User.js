/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// MongoDB Atlas High-Speed CRM User credentials document model definition
export class User {
  static getCollectionName() {
    return 'users';
  }

  static getSchema() {
    return {
      id: { type: String, required: true, unique: true },
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, default: 'Consultant' },
      displayName: { type: String },
      createdAt: { type: String, required: true }
    };
  }
}
