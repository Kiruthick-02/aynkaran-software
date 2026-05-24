/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class Exam {
  // SQLite handles IRDAI licensing exam tracker as serialized items in trainee profiles.
  static getMetaSpecification() {
    return {
      scheduledDate: 'TEXT',
      score: 'INTEGER',
      result: 'TEXT', // Pass, Fail, Awaiting
      agentCodeGenerated: 'TEXT'
    };
  }
}
