/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Advisor Schema Definition and Enums
 */
export const ADVISOR_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'RESIGNED',
  'TERMINATED',
  'EXPIRED',
  'TRANSFERRED',
  'ARCHIVED'
];

export const ADVISOR_GENDERS = ['Male', 'Female', 'Other'];

export class Advisor {
  static create(data = {}) {
    const now = new Date().toISOString();
    return {
      id: data.id || `adv-${Date.now().toString().slice(-6)}`,
      advisorCode: data.advisorCode?.trim(),
      candidateId: data.candidateId || null,
      fullName: data.fullName?.trim(),
      dateOfBirth: data.dateOfBirth || '',
      gender: data.gender || 'Male',
      bloodGroup: data.bloodGroup || '',
      mobile: data.mobile?.trim(),
      alternateMobile: data.alternateMobile?.trim() || '',
      email: data.email?.trim() || '',
      address: data.address?.trim() || '',
      city: data.city || 'Chennai',
      district: data.district || '',
      state: data.state || 'Tamil Nadu',
      pincode: data.pincode || '',
      insuranceCompanyId: data.insuranceCompanyId || 'comp-lic',
      insuranceCompanyName: data.insuranceCompanyName || data.insuranceCompany || 'LIC',
      licenseNumber: data.licenseNumber?.trim(),
      licenseIssueDate: data.licenseIssueDate || now.split('T')[0],
      licenseExpiryDate: data.licenseExpiryDate || '',
      joiningDate: data.joiningDate || now.split('T')[0],
      abpId: data.abpId || '',
      abpName: data.abpName || '',
      level1ManagerId: data.level1ManagerId || '',
      level1ManagerName: data.level1ManagerName || '',
      status: data.status || 'ACTIVE',
      experience: data.experience || 'Fresher',
      remarks: data.remarks || '',
      statusHistory: data.statusHistory || [
        {
          oldStatus: 'NONE',
          newStatus: data.status || 'ACTIVE',
          reason: 'Initial Registration',
          changedBy: data.createdBy || 'admin',
          changedAt: now
        }
      ],
      documents: data.documents || [],
      createdBy: data.createdBy || 'admin',
      updatedBy: data.updatedBy || 'admin',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
  }
}
