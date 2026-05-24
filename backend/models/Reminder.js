/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class Reminder {
  static createTableQuery() {
    return `
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        dueDate TEXT,
        targetId TEXT,
        targetType TEXT,
        triggerType TEXT,
        completed INTEGER DEFAULT 0,
        channels TEXT,      -- JSON structure
        createdAt TEXT
      );
    `;
  }
}
