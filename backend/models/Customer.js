/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// MongoDB Atlas High-Speed CRM client profile document model definition
export class Customer {
  static getCollectionName() {
    return 'customers';
  }

  static getSchema() {
    return {
      id: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      fatherName: { type: String },
      motherName: { type: String },
      dob: { type: String },
      mobileNumber: { type: String, required: true, unique: true },
      emailId: { type: String },
      address: { type: String },
      spouseName: { type: String },
      kycDocuments: {
        type: Object,
        default: {
          passportSizePhoto: undefined,
          aadhaarCard: undefined,
          panCard: undefined,
          incomeProof: undefined,
          educationCertificate: undefined,
          passport: undefined,
          signatureCopy: undefined
        }
      },
      nominee: {
        type: Object,
        default: {
          name: String,
          dob: String,
          relationship: String
        }
      },
      work: {
        type: Object,
        default: {
          annualIncome: Number,
          occupation: String
        }
      },
      createdAt: { type: String, required: true }
    };
  }
}
