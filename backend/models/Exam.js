/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// MongoDB Atlas High-Speed CRM IRDAI certification exam document model definition
export class Exam {
  static getCollectionName() {
    return 'exams';
  }

  static getSchema() {
    return {
      scheduledDate: { type: String },
      score: { type: Number },
      result: { type: String }, // Pass, Fail, Awaiting
      agentCodeGenerated: { type: String }
    };
  }
}
