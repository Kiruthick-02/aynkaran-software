/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User definition structure mapping helper
export class User {
  static createTableQuery() {
    return `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'Consultant',
        displayName TEXT,
        createdAt TEXT
      );
    `;
  }
}
