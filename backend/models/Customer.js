/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class Customer {
  static createTableQuery() {
    return `
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        fatherName TEXT,
        motherName TEXT,
        dob TEXT,
        mobileNumber TEXT UNIQUE,
        emailId TEXT,
        address TEXT,
        spouseName TEXT,
        kycDocuments TEXT, -- JSON Object
        nominee TEXT,      -- JSON Object
        work TEXT,         -- JSON Object
        createdAt TEXT
      );
    `;
  }
}
