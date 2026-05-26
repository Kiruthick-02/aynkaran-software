/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// MongoDB Atlas High-Speed CRM Recruitment Candidate/Trainee document model definition
export class Recruitment {
  static getCollectionName() {
    return 'candidates';
  }

  static getSchema() {
    return {
      id: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      mobile: { type: String, required: true },
      email: { type: String },
      appointmentDate: { type: String },
      currentStage: { type: String, required: true },
      stageHistory: {
        type: Array,
        default: [] // Array of { stage, date, note }
      },
      result: { type: String },
      documents: {
        type: Array,
        default: [] // Array of { id, name, category, url, uploadedAt }
      },
      fees: {
        type: Object,
        default: {
          applicationFeePaid: Boolean,
          trainingFeePaid: Boolean,
          appFeeAmount: Number,
          trainingFeeAmount: Number,
          appFeeDate: String,
          trainingFeeDate: String
        }
      },
      exam: {
        type: Object,
        default: {
          scheduledDate: String,
          result: String,
          score: Number,
          agentCodeGenerated: String
        }
      },
      pendingStageSince: { type: String, required: true },
      notes: { type: String }
    };
  }
}
