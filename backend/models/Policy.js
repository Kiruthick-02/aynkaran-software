/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// MongoDB Atlas High-Speed CRM Policy lead track document model definition
export class Policy {
  static getCollectionName() {
    return 'policies';
  }

  static getSchema() {
    return {
      id: { type: String, required: true, unique: true },
      customerId: { type: String, required: true },
      customerName: { type: String, required: true },
      policyType: { type: String, required: true },
      sumAssured: { type: Number, required: true },
      premiumAmount: { type: Number, required: true },
      premiumTerm: { type: String, required: true },
      currentStage: { type: String, required: true },
      quotes: {
        type: Array,
        default: [] // Array of { id, description, amount, date }
      },
      result: { type: String }, // Yes, No, or undefined
      issuedPolicyNumber: { type: String },
      issueDate: { type: String },
      renewalDate: { type: String },
      pendingStageSince: { type: String, required: true },
      notes: { type: String }
    };
  }
}
