/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class Policy {
  static createTableQuery() {
    return `
      CREATE TABLE IF NOT EXISTS policies (
        id TEXT PRIMARY KEY,
        customerId TEXT,
        customerName TEXT,
        policyType TEXT,
        sumAssured REAL,
        premiumAmount REAL,
        premiumTerm TEXT,
        currentStage TEXT,
        quotes TEXT,        -- JSON list
        result TEXT,
        issuedPolicyNumber TEXT,
        issueDate TEXT,
        renewalDate TEXT,
        pendingStageSince TEXT,
        notes TEXT
      );
    `;
  }
}
