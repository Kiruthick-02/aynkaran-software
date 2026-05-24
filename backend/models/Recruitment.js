/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class Recruitment {
  static createTableQuery() {
    return `
      CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mobile TEXT,
        email TEXT,
        appointmentDate TEXT,
        currentStage TEXT,
        stageHistory TEXT,  -- JSON list
        result TEXT,
        documents TEXT,     -- JSON list
        fees TEXT,          -- JSON Object
        exam TEXT,          -- JSON Object
        pendingStageSince TEXT,
        notes TEXT
      );
    `;
  }
}
