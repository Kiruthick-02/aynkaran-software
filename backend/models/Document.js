/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// MongoDB Atlas High-Speed CRM upload tracker document model definition
export class Document {
  static getCollectionName() {
    return 'documents';
  }

  static getSchema() {
    return {
      id: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      category: { type: String },
      url: { type: String, required: true },
      uploadedAt: { type: String, required: true }
    };
  }
}
