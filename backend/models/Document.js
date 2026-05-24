/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class Document {
  // SQLite handles document tracking in relational mapping columns as JSON Arrays inside our candidate/customer contexts.
  static getMetaSpecification() {
    return {
      columns: {
        id: 'TEXT PRIMARY KEY',
        name: 'TEXT NOT NULL',
        category: 'TEXT',
        url: 'TEXT NOT NULL',
        uploadedAt: 'TEXT'
      }
    };
  }
}
