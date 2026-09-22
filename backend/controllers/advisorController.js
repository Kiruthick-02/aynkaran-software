// backend/controllers/advisorController.js

import { NotificationService } from '../services/notificationService.js';
import { ReminderService } from '../services/reminderService.js';
import { sendEmailReceipt } from '../utils/emailService.js';
import { AdvisorMilestone } from '../models/AdvisorMilestone.js';

// Default static fallback hierarchy maps for validation
const DEFAULT_HIERARCHY_MAP = {
  'l1-201': 'abp-102', // Karthik M. -> Suresh Babu
  'l1-202': 'abp-101', // Suresh Kumar -> Anil Verma
  'l1-203': 'abp-103', // R. Vignesh -> M. Natarajan
  'L1-502': 'ABP-8045',
  'L1-509': 'ABP-8012',
  'L1-515': 'ABP-8090'
};

export class AdvisorController {
  constructor(db) {
    this.db = db;
    this.notificationService = new NotificationService(db);
    this.reminderService = new ReminderService(db);
  }

  /**
   * Helper: Record audit activity log
   */
  logActivity = async (username, action, target, metadata = {}) => {
    try {
      if (this.db?.collection) {
        await this.db.collection('logs').insertOne({
          id: `log-${Date.now().toString().slice(-5)}`,
          username: username || 'admin',
          action,
          target,
          metadata,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('[Audit Log Error]', e);
    }
  };

  deleteAdvisor = async (req, res) => {
    try {
      const { id } = req.params;
      if (req.body?.password !== '1111') return res.status(403).json({ error: 'Incorrect deletion password.' });
      const advisor = await this.db.collection('advisors').findOne({ $or: [{ id }, { advisorCode: id }] });
      const result = await this.db.collection('advisors').deleteOne({ $or: [{ id }, { advisorCode: id }] });
      if (!result.deletedCount) return res.status(404).json({ error: 'Advisor record not found.' });
      const linkedCandidateId = advisor?.candidateId;
      await this.db.collection('documents').deleteMany({
        $or: [
          { targetId: id },
          ...(advisor?.id ? [{ targetId: advisor.id }] : []),
          ...(linkedCandidateId ? [{ targetId: linkedCandidateId }] : [])
        ]
      });
      // Converted-candidate files are mirrored in the vault. Clear that mirror too,
      // otherwise the vault rebuilds the deleted advisor's files from candidate fields.
      if (linkedCandidateId) {
        await this.db.collection('candidates').updateOne(
          { $or: [{ id: linkedCandidateId }, { _id: linkedCandidateId }] },
          {
            $set: {
              documents: [],
              aadhaarUrl: null,
              aadhaarFrontUrl: null,
              aadhaarBackUrl: null,
              panUrl: null,
              photoUrl: null,
              profilePicture: null,
              passportPhoto: null,
              marksheetUrl: null,
              bankProofUrl: null,
              signatureUrl: null,
              licenseDocumentUrl: null,
              updatedAt: new Date().toISOString()
            }
          }
        );
      }
      await this.logActivity('admin', 'Deleted Advisor', `Advisor ${id} deleted.`);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * Validate ABP to L1 manager relationship
   */
  validateHierarchy = async (abpId, level1ManagerId) => {
    if (!abpId || !level1ManagerId) return { valid: true };

    // 1. Check custom DB records first
    if (this.db?.collection) {
      const l1 = await this.db.collection('level1_managers').findOne({
        $or: [{ id: level1ManagerId }, { code: level1ManagerId }]
      });
      if (l1 && l1.abpId && l1.abpId !== abpId && l1.abpCode !== abpId) {
        return {
          valid: false,
          error: `Hierarchy Violation: Level-1 Manager "${l1.name || level1ManagerId}" is assigned under ABP "${l1.abpCode || l1.abpId}", not "${abpId}".`
        };
      }
    }

    // 2. Check default hierarchy fallback
    const expectedAbp = DEFAULT_HIERARCHY_MAP[level1ManagerId];
    if (expectedAbp && expectedAbp !== abpId) {
      return {
        valid: false,
        error: `Hierarchy Violation: Level-1 Manager "${level1ManagerId}" belongs under ABP "${expectedAbp}", not "${abpId}".`
      };
    }

    return { valid: true };
  };

  /**
   * GET /api/advisors/dashboard-stats
   */
  getDashboardStats = async (req, res) => {
    try {
      const advisors = await this.db.collection('advisors').find().toArray();
      const policies = await this.db.collection('policies').find().toArray();

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentMonthPrefix = `${currentYear}-${currentMonth}`;

      const totalAdvisors = advisors.length;
      const activeAdvisors = advisors.filter(a => a.status === 'ACTIVE').length;
      const inactiveAdvisors = advisors.filter(a => a.status === 'INACTIVE').length;
      const suspendedAdvisors = advisors.filter(a => a.status === 'SUSPENDED').length;
      
      const newAdvisorsThisMonth = advisors.filter(a => {
        const joinDate = a.joiningDate || a.createdAt || '';
        return joinDate.startsWith(currentMonthPrefix);
      }).length;

      let totalActivePolicies = 0;
      let totalPremium = 0;
      let totalCommission = 0;

      for (const p of policies) {
        const isIssued = p.currentStage === 'Policy Issued' || p.currentStage === 'Renewal Date Assigned' || p.result === 'Yes';
        const prem = Number(p.premiumAmount || 0);
        if (isIssued) totalActivePolicies++;
        totalPremium += prem;
        const comm = Number(p.commissionAmount || (prem * 0.15));
        totalCommission += comm;
      }

      const currentMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      let expiringLicenses = 0;
      let missingDocuments = 0;

      for (const a of advisors) {
        if (a.licenseExpiryDate) {
          const expDate = new Date(a.licenseExpiryDate);
          if (!isNaN(expDate.getTime())) {
            const expMidnight = Date.UTC(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
            const diffDays = Math.round((expMidnight - currentMidnight) / (1000 * 3600 * 24));
            if (diffDays >= 0 && diffDays <= 60) {
              expiringLicenses++;
            }
          }
        }
        const docCount = Array.isArray(a.documents) ? a.documents.length : 0;
        if (docCount === 0) {
          missingDocuments++;
        }
      }

      res.json({
        success: true,
        stats: {
          totalAdvisors,
          activeAdvisors,
          inactiveAdvisors,
          suspendedAdvisors,
          newAdvisorsThisMonth,
          totalActivePolicies,
          totalPremium,
          totalCommission,
          expiringLicenses,
          missingDocuments
        }
      });
    } catch (e) {
      console.error('[AdvisorController.getDashboardStats Error]', e);
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * GET /api/advisors/hierarchy-options
   */
  getHierarchyOptions = async (req, res) => {
    try {
      const defaultAbps = [
        { id: 'abp-101', code: 'ABP-8012', name: 'Anil Verma', company: 'HDFC Life Insurance', contact: '+91 94432 01928' },
        { id: 'abp-102', code: 'ABP-8045', name: 'Suresh Babu', company: 'SBI Life Insurance', contact: '+91 90023 94812' },
        { id: 'abp-103', code: 'ABP-8090', name: 'M. Natarajan', company: 'Care Health Insurance', contact: '+91 98840 21940' }
      ];

      const defaultL1s = [
        { id: 'l1-201', code: 'L1-502', name: 'Karthik M.', abpId: 'abp-102', abpCode: 'ABP-8045', company: 'SBI Life Insurance', contact: '+91 99432 84192' },
        { id: 'l1-202', code: 'L1-509', name: 'Suresh Kumar', abpId: 'abp-101', abpCode: 'ABP-8012', company: 'HDFC Life Insurance', contact: '+91 98842 10928' },
        { id: 'l1-203', code: 'L1-515', name: 'R. Vignesh', abpId: 'abp-103', abpCode: 'ABP-8090', company: 'Care Health Insurance', contact: '+91 97712 34190' }
      ];

      const customAbps = await this.db.collection('abps').find().toArray();
      const customL1s = await this.db.collection('level1_managers').find().toArray();

      const abps = customAbps.length > 0 ? customAbps.map(a => ({ ...a, id: a.id || a.code })) : defaultAbps;
      const l1s = customL1s.length > 0 ? customL1s.map(l => ({ ...l, id: l.id || l.code })) : defaultL1s;

      res.json({
        success: true,
        abps,
        level1Managers: l1s
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * GET /api/advisors
   */
  listAdvisors = async (req, res) => {
    try {
      const { search, status, insuranceCompany, abp, level1Manager, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      let query = {};

      if (status && status !== 'All') query.status = status;
      if (insuranceCompany && insuranceCompany !== 'All') {
        query.insuranceCompanyName = { $regex: new RegExp(insuranceCompany, 'i') };
      }
      if (abp && abp !== 'All') query.$or = [{ abpId: abp }, { abpName: abp }];
      if (level1Manager && level1Manager !== 'All') query.$or = [{ level1ManagerId: level1Manager }, { level1ManagerName: level1Manager }];

      let list = await this.db.collection('advisors').find(query).toArray();

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(a =>
          (a.fullName || '').toLowerCase().includes(q) ||
          (a.advisorCode || '').toLowerCase().includes(q) ||
          (a.mobile || '').includes(q) ||
          (a.email || '').toLowerCase().includes(q) ||
          (a.licenseNumber || '').toLowerCase().includes(q)
        );
      }

      const allPolicies = await this.db.collection('policies').find().toArray();
      const allCandidates = await this.db.collection('candidates').find().toArray();
      const candMap = new Map(allCandidates.flatMap(c => [
        [String(c.id || ''), c],
        [String(c._id || ''), c]
      ]).filter(([k]) => k));

      const formatted = list.map(a => {
        const advPolicies = allPolicies.filter(p =>
          p.advisorId === a.id ||
          p.advisorCode === a.advisorCode ||
          p.agentCode === a.advisorCode
        );

        const activePolicies = advPolicies.filter(p =>
          p.currentStage === 'Policy Issued' || p.currentStage === 'Renewal Date Assigned' || p.result === 'Yes'
        );

        const totalPrem = advPolicies.reduce((acc, p) => acc + (Number(p.premiumAmount) || 0), 0);
        const totalComm = advPolicies.reduce((acc, p) => acc + (Number(p.commissionAmount) || (Number(p.premiumAmount || 0) * 0.15)), 0);

        const cand = a.candidateId ? candMap.get(String(a.candidateId)) : null;
        const advDocs = Array.isArray(a.documents) ? a.documents : [];
        const candDocs = Array.isArray(cand?.documents) ? cand.documents : [];
        const docMap = new Map();
        [...candDocs, ...advDocs].forEach(d => {
          if (d && (d.category || d.name)) {
            docMap.set(d.category || d.name, d);
          }
        });
        const mergedDocs = Array.from(docMap.values());
        const photoUrl = a.photoUrl || a.profilePicture || a.passportPhoto ||
          cand?.photoUrl || cand?.profilePicture || cand?.passportPhoto ||
          mergedDocs.find(d => {
            const cat = (d.category || d.name || '').toLowerCase();
            return cat.includes('photo') || cat.includes('passport') || cat.includes('profile');
          })?.url || null;

        return {
          ...a,
          id: a.id || a._id.toString(),
          _id: undefined,
          photoUrl,
          profilePicture: photoUrl,
          passportPhoto: photoUrl,
          activePoliciesCount: activePolicies.length,
          totalPoliciesCount: advPolicies.length,
          totalPremium: totalPrem,
          totalCommission: totalComm,
          documents: mergedDocs,
          statusHistory: Array.isArray(a.statusHistory) ? a.statusHistory : []
        };
      });

      formatted.sort((a, b) => {
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });

      res.json(formatted);
    } catch (e) {
      console.error('[AdvisorController.listAdvisors Error]', e);
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * GET /api/advisors/:id
   */
  getAdvisor = async (req, res) => {
    try {
      const { id } = req.params;
      const advisor = await this.db.collection('advisors').findOne({
        $or: [{ id }, { advisorCode: id }]
      });

      if (!advisor) {
        return res.status(404).json({ error: 'Advisor profile not found.' });
      }

      let candidate = null;
      if (advisor.candidateId) {
        candidate = await this.db.collection('candidates').findOne({
          $or: [{ id: advisor.candidateId }, { _id: advisor.candidateId }]
        });
      }

      const policies = await this.db.collection('policies').find({
        $or: [{ advisorId: advisor.id }, { advisorCode: advisor.advisorCode }, { agentCode: advisor.advisorCode }]
      }).toArray();

      const customerIds = [...new Set(policies.map(p => p.customerId).filter(Boolean))];
      const customerNames = [...new Set(policies.map(p => p.customerName).filter(Boolean))];

      const customers = await this.db.collection('customers').find({
        $or: [
          { id: { $in: customerIds } },
          { name: { $in: customerNames } }
        ]
      }).toArray();

      const milestones = await this.db.collection('advisor_milestones').find({
        $or: [{ advisorId: advisor.id }, { candidateId: advisor.candidateId }]
      }).sort({ stageNumber: 1 }).toArray();

      const reminders = await this.db.collection('reminders').find({
        $or: [{ advisorId: advisor.id }, { targetId: advisor.id }, { candidateId: advisor.candidateId }]
      }).sort({ dueDate: 1 }).toArray();

      const notifications = await this.db.collection('notification_logs').find({
        $or: [{ advisorId: advisor.id }, { candidateId: advisor.candidateId }]
      }).sort({ sentAt: -1 }).toArray();

      const totalPrem = policies.reduce((acc, p) => acc + (Number(p.premiumAmount) || 0), 0);
      const totalComm = policies.reduce((acc, p) => acc + (Number(p.commissionAmount) || (Number(p.premiumAmount || 0) * 0.15)), 0);

      // Merge documents from advisor + candidate
      const advisorDocs = Array.isArray(advisor.documents) ? advisor.documents : [];
      const candidateDocs = Array.isArray(candidate?.documents) ? candidate.documents : [];
      const docMap = new Map();
      [...candidateDocs, ...advisorDocs].forEach(d => {
        if (d && (d.category || d.name)) {
          docMap.set(d.category || d.name, d);
        }
      });
      const mergedDocs = Array.from(docMap.values());
      const photoUrl = advisor.photoUrl || advisor.profilePicture || advisor.passportPhoto ||
        candidate?.photoUrl || candidate?.profilePicture || candidate?.passportPhoto ||
        mergedDocs.find(d => {
          const cat = (d.category || d.name || '').toLowerCase();
          return cat.includes('photo') || cat.includes('passport') || cat.includes('profile');
        })?.url || null;

      const responseObj = {
        ...advisor,
        id: advisor.id || advisor._id.toString(),
        _id: undefined,
        candidate,
        photoUrl,
        profilePicture: photoUrl,
        passportPhoto: photoUrl,
        documents: mergedDocs,
        policies: policies.map(p => ({ ...p, id: p.id || p._id.toString(), _id: undefined })),
        customers: customers.map(c => ({ ...c, id: c.id || c._id.toString(), _id: undefined })),
        milestones: milestones.map(m => ({ ...m, _id: undefined })),
        reminders: reminders.map(r => ({ ...r, _id: undefined })),
        notifications: notifications.map(n => ({ ...n, _id: undefined })),
        stats: {
          totalPolicies: policies.length,
          activePolicies: policies.filter(p => p.currentStage === 'Policy Issued' || p.result === 'Yes').length,
          totalPremium: totalPrem,
          totalCommission: totalComm,
          customerCount: customers.length
        }
      };

      res.json(responseObj);
    } catch (e) {
      console.error('[AdvisorController.getAdvisor Error]', e);
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * POST /api/advisors
   */
  createAdvisor = async (req, res) => {
    try {
      const data = { ...req.body };
      const { advisorCode, fullName, mobile, insuranceCompanyId, licenseNumber, joiningDate } = data;

      if (!fullName || !mobile || !advisorCode || !licenseNumber) {
        return res.status(400).json({ error: 'Full Name, Mobile, Advisor Code, and License Number are mandatory.' });
      }

      const existingCode = await this.db.collection('advisors').findOne({ advisorCode: advisorCode.trim() });
      if (existingCode) {
        return res.status(400).json({ error: `Advisor Code "${advisorCode}" is already assigned to another advisor.` });
      }

      const existingLicense = await this.db.collection('advisors').findOne({ licenseNumber: licenseNumber.trim() });
      if (existingLicense) {
        return res.status(400).json({ error: `License Number "${licenseNumber}" is already registered in the system.` });
      }

      if (data.abpId && data.level1ManagerId) {
        const validHierarchy = await this.validateHierarchy(data.abpId, data.level1ManagerId);
        if (!validHierarchy.valid) {
          return res.status(400).json({ error: validHierarchy.error });
        }
      }

      const now = new Date().toISOString();
      const newAdvisor = {
        id: data.id || `adv-${Date.now().toString().slice(-6)}`,
        advisorCode: advisorCode.trim(),
        candidateId: data.candidateId || 'DIRECT_ENTRY',
        fullName: fullName.trim(),
        dateOfBirth: data.dateOfBirth || '',
        gender: data.gender || 'Male',
        bloodGroup: data.bloodGroup || '',
        mobile: mobile.trim(),
        alternateMobile: data.alternateMobile || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || 'Chennai',
        district: data.district || '',
        state: data.state || 'Tamil Nadu',
        pincode: data.pincode || '',
        insuranceCompanyId: insuranceCompanyId || 'comp-lic',
        insuranceCompanyName: data.insuranceCompanyName || data.insuranceCompany || 'LIC',
        licenseNumber: licenseNumber.trim(),
        licenseIssueDate: data.licenseIssueDate || now.split('T')[0],
        licenseExpiryDate: data.licenseExpiryDate || '',
        joiningDate: joiningDate || now.split('T')[0],
        abpId: data.abpId || '',
        abpName: data.abpName || '',
        level1ManagerId: data.level1ManagerId || '',
        level1ManagerName: data.level1ManagerName || '',
        status: data.status || 'ACTIVE',
        experience: data.experience || 'Fresher',
        remarks: data.remarks || '',
        statusHistory: [
          {
            oldStatus: 'NONE',
            newStatus: data.status || 'ACTIVE',
            reason: 'Initial Advisor Profile Created',
            changedBy: req.body.createdBy || 'admin',
            changedAt: now
          }
        ],
        documents: data.documents || [],
        createdBy: req.body.createdBy || 'admin',
        updatedBy: req.body.createdBy || 'admin',
        createdAt: now,
        updatedAt: now
      };

      await this.db.collection('advisors').insertOne(newAdvisor);
      await this.logActivity(req.body.createdBy || 'admin', 'Created Advisor', `${newAdvisor.fullName} (${newAdvisor.advisorCode})`);

      const responseObj = { ...newAdvisor };
      delete responseObj._id;
      res.status(201).json(responseObj);
    } catch (e) {
      console.error('[AdvisorController.createAdvisor Error]', e);
      res.status(400).json({ error: e.message });
    }
  };

  /**
   * POST /api/advisors/convert/:candidateId
   */
  convertCandidateToAdvisor = async (req, res) => {
    try {
      const { candidateId } = req.params;
      const {
        advisorCode,
        insuranceCompanyId,
        insuranceCompanyName,
        licenseNumber,
        licenseIssueDate,
        licenseExpiryDate,
        joiningDate,
        abpId,
        abpName,
        level1ManagerId,
        level1ManagerName,
        remarks,
        convertedBy = 'admin'
      } = req.body;

      // 1. Candidate Exists Verification
      const candidate = await this.db.collection('candidates').findOne({
        $or: [{ id: candidateId }, { _id: candidateId }]
      });

      if (!candidate) {
        return res.status(404).json({ error: 'Candidate record not found in the recruitment pipeline.' });
      }

      // 2. Candidate Status Not Obsolete
      if (candidate.status === 'Inactive' || candidate.status === 'Archived') {
        return res.status(400).json({ error: 'Candidate profile is archived/inactive and cannot be converted.' });
      }

      // 3. Training is Completed Verification
      const trainingComplete = candidate.trainingStatus === 'Completed' ||
        (candidate.stageHistory && candidate.stageHistory.some(h => h.stage === 'Training Completed' || h.stage === 'Training' || h.stage === 'TRAINING_COMPLETED'));
      if (!trainingComplete && req.body.overrideTraining !== true) {
        return res.status(400).json({
          error: 'Conversion Blocked: Candidate has not completed the mandatory licensing training program.',
          stage: 'TRAINING_COMPLETED',
          blocked: true
        });
      }

      // 4. Examination Result = PASS Verification
      const examPassed = candidate.examStatus === 'Passed' ||
        candidate.result === 'Pass' ||
        candidate.result === 'Passed' ||
        (candidate.exam && (candidate.exam.result === 'Pass' || candidate.exam.result === 'Passed'));

      if (!examPassed && req.body.overrideExam !== true) {
        return res.status(400).json({
          error: 'Conversion Blocked: Candidate examination result has not been recorded as PASS.',
          stage: 'EXAM_RESULT',
          blocked: true
        });
      }

      // 5. Eligibility is Confirmed Verification
      if (candidate.eligibility !== 'Eligible' && req.body.overrideEligibility !== true) {
        return res.status(400).json({
          error: 'Conversion Blocked: Candidate eligibility has not been confirmed.',
          stage: 'ELIGIBILITY_CONFIRMED',
          blocked: true
        });
      }

      // 6. Candidate is Not Already Converted Verification
      if (candidate.isConvertedToAdvisor === true) {
        return res.status(400).json({
          error: `Candidate is already converted to Advisor (Code: ${candidate.convertedAdvisorCode || 'N/A'}). Duplicate conversion blocked.`,
          alreadyConverted: true
        });
      }

      // 7. Mandatory Advisor Code & License Info Presence
      if (!advisorCode || !advisorCode.trim()) {
        return res.status(400).json({ error: 'Advisor Code is mandatory for advisor activation.' });
      }

      if (!licenseNumber || !licenseNumber.trim()) {
        return res.status(400).json({ error: 'Insurance License Number is mandatory.' });
      }

      // 8. Advisor Code Uniqueness
      const existingAdvCode = await this.db.collection('advisors').findOne({ advisorCode: advisorCode.trim() });
      if (existingAdvCode) {
        return res.status(400).json({ error: `Advisor Code "${advisorCode}" is already in use by advisor ${existingAdvCode.fullName}.` });
      }

      // 9. License Number Uniqueness
      const existingLic = await this.db.collection('advisors').findOne({ licenseNumber: licenseNumber.trim() });
      if (existingLic) {
        return res.status(400).json({ error: `License Number "${licenseNumber}" is already in use by advisor ${existingLic.fullName}.` });
      }

      // 10. Valid Insurance Company
      const finalCompanyName = insuranceCompanyName || candidate.insuranceCompany || 'LIC';
      const finalCompanyId = insuranceCompanyId || candidate.insuranceCompanyId || 'comp-lic';

      // 11. Valid ABP / Level-1 Manager Relationship
      if (abpId && level1ManagerId) {
        const validHierarchy = await this.validateHierarchy(abpId, level1ManagerId);
        if (!validHierarchy.valid) {
          return res.status(400).json({ error: validHierarchy.error });
        }
      }

      const now = new Date().toISOString();
      const todayDate = now.split('T')[0];
      const newAdvisorId = `adv-${Date.now().toString().slice(-6)}`;
      const candidateDocs = Array.isArray(candidate.documents) ? candidate.documents : [];

      const advisorRecord = {
        id: newAdvisorId,
        advisorCode: advisorCode.trim(),
        candidateId: candidate.id || candidateId,
        fullName: candidate.name,
        dateOfBirth: candidate.dateOfBirth || '',
        gender: candidate.gender || 'Male',
        bloodGroup: candidate.bloodGroup || '',
        mobile: candidate.mobile,
        alternateMobile: candidate.alternateMobile || '',
        email: candidate.email || '',
        address: candidate.address || '',
        city: candidate.city || 'Chennai',
        district: candidate.district || '',
        state: candidate.state || 'Tamil Nadu',
        pincode: candidate.pincode || '',
        insuranceCompanyId: finalCompanyId,
        insuranceCompanyName: finalCompanyName,
        licenseNumber: licenseNumber.trim(),
        licenseIssueDate: licenseIssueDate || todayDate,
        licenseExpiryDate: licenseExpiryDate || '',
        joiningDate: joiningDate || todayDate,
        abpId: abpId || '',
        abpName: abpName || '',
        level1ManagerId: level1ManagerId || '',
        level1ManagerName: level1ManagerName || '',
        status: 'ACTIVE',
        experience: candidate.qualification || 'Fresher',
        remarks: remarks || candidate.notes || 'Converted from verified candidate pipeline.',
        statusHistory: [
          {
            oldStatus: 'CANDIDATE_ELIGIBLE',
            newStatus: 'ACTIVE',
            reason: 'Candidate successfully completed all milestones and was converted to licensed Advisor.',
            changedBy: convertedBy,
            changedAt: now
          }
        ],
        documents: candidateDocs,
        photoUrl: candidate.photoUrl || candidate.profilePicture || candidate.passportPhoto || null,
        profilePicture: candidate.profilePicture || candidate.photoUrl || candidate.passportPhoto || null,
        passportPhoto: candidate.passportPhoto || candidate.photoUrl || candidate.profilePicture || null,
        photoFileName: candidate.photoFileName || null,
        aadhaarFrontUrl: candidate.aadhaarFrontUrl || null,
        aadhaarBackUrl: candidate.aadhaarBackUrl || null,
        aadhaarUrl: candidate.aadhaarUrl || null,
        panUrl: candidate.panUrl || null,
        bankProofUrl: candidate.bankProofUrl || null,
        marksheetUrl: candidate.marksheetUrl || null,
        signatureUrl: candidate.signatureUrl || null,
        createdBy: convertedBy,
        updatedBy: convertedBy,
        createdAt: now,
        updatedAt: now
      };

      await this.db.collection('advisors').insertOne(advisorRecord);

      await this.db.collection('candidates').updateOne(
        { id: candidate.id || candidateId },
        {
          $set: {
            isConvertedToAdvisor: true,
            convertedAdvisorId: newAdvisorId,
            convertedAdvisorCode: advisorCode.trim(),
            convertedAt: now,
            currentStage: 'Advisor Active',
            stageNumber: 16,
            advisorCreationDate: todayDate,
            advisorActivationDate: todayDate,
            abpAssignmentDate: abpId ? todayDate : undefined,
            l1AssignmentDate: level1ManagerId ? todayDate : undefined,
            updatedAt: now
          }
        }
      );

      await this.logActivity(convertedBy, 'Converted Candidate to Advisor', `Candidate: ${candidate.name} -> Advisor: ${advisorCode}`);

      if (candidate.mobile) {
        const welcomeMsg = `Congratulations ${candidate.name}! Your Insurance Advisor Code ${advisorCode} has been activated successfully with ${finalCompanyName}. Welcome to Aynkaran Consultants.`;
        this.notificationService.dispatch({
          candidateId: candidate.id || candidateId,
          advisorId: newAdvisorId,
          recipient: candidate.mobile,
          channel: 'WHATSAPP',
          subject: 'Advisor Code Activated - Aynkaran Consultants',
          messageBody: welcomeMsg,
          variables: {
            candidateName: candidate.name,
            advisorName: candidate.name,
            advisorCode: advisorCode.trim(),
            insuranceCompanyName: finalCompanyName,
            licenseNumber: licenseNumber.trim()
          }
        }).catch(e => console.error('[Activation WhatsApp Notice Error]', e));
      }

      const responseObj = { ...advisorRecord };
      delete responseObj._id;
      res.status(201).json({
        success: true,
        message: `Candidate "${candidate.name}" successfully converted to Advisor (Code: ${advisorCode}).`,
        advisor: responseObj
      });
    } catch (e) {
      console.error('[AdvisorController.convertCandidateToAdvisor Error]', e);
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * PUT /api/advisors/:id
   */
  updateAdvisor = async (req, res) => {
    try {
      const { id } = req.params;
      const data = { ...req.body };
      delete data._id;

      const existing = await this.db.collection('advisors').findOne({
        $or: [{ id }, { advisorCode: id }]
      });

      if (!existing) {
        return res.status(404).json({ error: 'Advisor profile not found.' });
      }

      if (data.abpId && data.level1ManagerId) {
        const validHierarchy = await this.validateHierarchy(data.abpId, data.level1ManagerId);
        if (!validHierarchy.valid) {
          return res.status(400).json({ error: validHierarchy.error });
        }
      }

      data.updatedAt = new Date().toISOString();
      await this.db.collection('advisors').updateOne(
        { id: existing.id || id },
        { $set: data }
      );

      await this.logActivity(req.body.updatedBy || 'admin', 'Updated Advisor Details', `${existing.fullName} (${existing.advisorCode})`);
      res.json({ id: existing.id || id, ...existing, ...data });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  };

  /**
   * PATCH /api/advisors/:id/status
   */
  changeAdvisorStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason, changedBy = 'admin' } = req.body;

      const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'EXPIRED', 'TRANSFERRED', 'ARCHIVED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed values: ${validStatuses.join(', ')}` });
      }

      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'A specific reason is required for status changes.' });
      }

      const advisor = await this.db.collection('advisors').findOne({
        $or: [{ id }, { advisorCode: id }]
      });

      if (!advisor) {
        return res.status(404).json({ error: 'Advisor profile not found.' });
      }

      const now = new Date().toISOString();
      const statusEntry = {
        oldStatus: advisor.status,
        newStatus: status,
        reason: reason.trim(),
        changedBy,
        changedAt: now
      };

      const history = Array.isArray(advisor.statusHistory) ? [...advisor.statusHistory, statusEntry] : [statusEntry];

      await this.db.collection('advisors').updateOne(
        { id: advisor.id || id },
        {
          $set: {
            status,
            statusHistory: history,
            updatedAt: now
          }
        }
      );

      await this.logActivity(changedBy, 'Changed Advisor Status', `${advisor.fullName} (${advisor.advisorCode}): ${advisor.status} -> ${status}`, { reason: reason.trim() });

      res.json({
        success: true,
        advisorId: advisor.id || id,
        oldStatus: advisor.status,
        newStatus: status,
        reason: reason.trim(),
        changedAt: now
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * GET /api/advisors/:id/policies
   */
  getAdvisorPolicies = async (req, res) => {
    try {
      const { id } = req.params;
      const advisor = await this.db.collection('advisors').findOne({ $or: [{ id }, { advisorCode: id }] });
      const advCode = advisor?.advisorCode || id;

      const policies = await this.db.collection('policies').find({
        $or: [{ advisorId: id }, { advisorId: advisor?.id }, { advisorCode: advCode }, { agentCode: advCode }]
      }).toArray();

      const formatted = policies.map(p => ({
        ...p,
        id: p.id || p._id.toString(),
        _id: undefined,
        commission: Number(p.commissionAmount || (Number(p.premiumAmount || 0) * 0.15))
      }));

      res.json(formatted);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * GET /api/advisors/:id/customers
   */
  getAdvisorCustomers = async (req, res) => {
    try {
      const { id } = req.params;
      const advisor = await this.db.collection('advisors').findOne({ $or: [{ id }, { advisorCode: id }] });
      const advCode = advisor?.advisorCode || id;

      const policies = await this.db.collection('policies').find({
        $or: [{ advisorId: id }, { advisorId: advisor?.id }, { advisorCode: advCode }, { agentCode: advCode }]
      }).toArray();

      const customerIds = [...new Set(policies.map(p => p.customerId).filter(Boolean))];
      const customerNames = [...new Set(policies.map(p => p.customerName).filter(Boolean))];

      const customers = await this.db.collection('customers').find({
        $or: [
          { id: { $in: customerIds } },
          { name: { $in: customerNames } }
        ]
      }).toArray();

      const formatted = customers.map(c => {
        const custPolicies = policies.filter(p => p.customerId === c.id || p.customerName === c.name);
        const activeCustPolicies = custPolicies.filter(p => p.currentStage === 'Policy Issued' || p.result === 'Yes');
        const custPremium = custPolicies.reduce((acc, p) => acc + (Number(p.premiumAmount) || 0), 0);
        const nextRenewal = custPolicies.map(p => p.renewalDate).filter(Boolean).sort()[0] || 'N/A';

        return {
          id: c.id || c._id.toString(),
          name: c.name,
          mobile: c.mobileNumber || c.mobile || 'N/A',
          policyCount: custPolicies.length,
          activePolicies: activeCustPolicies.length,
          totalPremium: custPremium,
          nextRenewal
        };
      });

      res.json(formatted);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * GET /api/advisors/:id/performance
   */
  getAdvisorPerformance = async (req, res) => {
    try {
      const { id } = req.params;
      const { month, year } = req.query;

      const advisor = await this.db.collection('advisors').findOne({ $or: [{ id }, { advisorCode: id }] });
      const advCode = advisor?.advisorCode || id;

      const policies = await this.db.collection('policies').find({
        $or: [{ advisorId: id }, { advisorId: advisor?.id }, { advisorCode: advCode }, { agentCode: advCode }]
      }).toArray();

      const now = new Date();
      const targetYear = year ? Number(year) : now.getFullYear();
      const targetMonth = month ? String(month).padStart(2, '0') : String(now.getMonth() + 1).padStart(2, '0');
      const targetMonthPrefix = `${targetYear}-${targetMonth}`;

      const totalPolicies = policies.length;
      const activePolicies = policies.filter(p => p.currentStage === 'Policy Issued' || p.currentStage === 'Renewal Date Assigned' || p.result === 'Yes').length;
      const newPoliciesThisMonth = policies.filter(p => (p.issueDate || p.createdAt || '').startsWith(targetMonthPrefix)).length;

      const totalPremium = policies.reduce((acc, p) => acc + (Number(p.premiumAmount) || 0), 0);
      const currentMonthPremium = policies
        .filter(p => (p.issueDate || p.createdAt || '').startsWith(targetMonthPrefix))
        .reduce((acc, p) => acc + (Number(p.premiumAmount) || 0), 0);
      const ytdPremium = policies
        .filter(p => (p.issueDate || p.createdAt || '').startsWith(String(targetYear)))
        .reduce((acc, p) => acc + (Number(p.premiumAmount) || 0), 0);

      const totalCommission = policies.reduce((acc, p) => acc + (Number(p.commissionAmount) || (Number(p.premiumAmount || 0) * 0.15)), 0);
      const currentMonthCommission = policies
        .filter(p => (p.issueDate || p.createdAt || '').startsWith(targetMonthPrefix))
        .reduce((acc, p) => acc + (Number(p.commissionAmount) || (Number(p.premiumAmount || 0) * 0.15)), 0);

      const renewalsCount = policies.filter(p => p.currentStage === 'Renewal Date Assigned').length;

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyTrends = monthNames.map((mName, idx) => {
        const mPrefix = `${targetYear}-${String(idx + 1).padStart(2, '0')}`;
        const mPols = policies.filter(p => (p.issueDate || p.createdAt || '').startsWith(mPrefix));
        const mSales = mPols.reduce((acc, p) => acc + (Number(p.premiumAmount) || 0), 0);
        const mComm = mPols.reduce((acc, p) => acc + (Number(p.commissionAmount) || (Number(p.premiumAmount || 0) * 0.15)), 0);
        return {
          month: mName,
          sales: mSales,
          commission: mComm,
          policyCount: mPols.length
        };
      });

      res.json({
        totalPolicies,
        activePolicies,
        newPoliciesThisMonth,
        totalPremium,
        currentMonthPremium,
        ytdPremium,
        totalCommission,
        currentMonthCommission,
        renewalsCount,
        monthlyTrends
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * GET /api/advisors/:id/commission
   */
  getAdvisorCommission = async (req, res) => {
    try {
      const { id } = req.params;
      const advisor = await this.db.collection('advisors').findOne({ $or: [{ id }, { advisorCode: id }] });
      const advCode = advisor?.advisorCode || id;

      const policies = await this.db.collection('policies').find({
        $or: [{ advisorId: id }, { advisorId: advisor?.id }, { advisorCode: advCode }, { agentCode: advCode }]
      }).toArray();

      const commissionEntries = policies.map(p => {
        const prem = Number(p.premiumAmount || 0);
        const commRate = Number(p.commissionRate || 15);
        const commAmount = Number(p.commissionAmount || (prem * (commRate / 100)));
        return {
          policyId: p.id,
          policyNumber: p.issuedPolicyNumber || p.id,
          customerName: p.customerName,
          policyType: p.policyType,
          premiumAmount: prem,
          commissionRate: `${commRate}%`,
          commissionAmount: commAmount,
          date: p.issueDate || p.createdAt?.split('T')[0] || 'N/A',
          status: p.currentStage === 'Policy Issued' ? 'DISBURSED' : 'PENDING_SETTLEMENT'
        };
      });

      const totalEarned = commissionEntries.reduce((acc, c) => acc + c.commissionAmount, 0);

      res.json({
        advisorCode: advCode,
        totalCommissionEarned: totalEarned,
        entries: commissionEntries
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * GET /api/advisors/:id/milestones
   */
  /**
   * GET /api/advisors/:id/milestones
   * Returns the authoritative 10-milestone onboarding roadmap.
   */
  getAdvisorMilestones = async (req, res) => {
    try {
      const { id } = req.params;
      const advisor = await this.db.collection('advisors').findOne({ $or: [{ id }, { advisorCode: id }] });
      const candidateId = advisor?.candidateId || id;
      const candidate = await this.db.collection('candidates').findOne({ $or: [{ id: candidateId }, { _id: candidateId }] });

      const storedMilestones = await this.db.collection('advisor_milestones').find({
        $or: [{ advisorId: id }, { candidateId }]
      }).sort({ stageNumber: 1 }).toArray();

      const milestoneMap = new Map();
      storedMilestones.forEach(m => milestoneMap.set(Number(m.stageNumber), m));

      // Calculate base candidate/advisor progress flags
      const isCandidateRegistered = !!candidate;
      const docsCount = Array.isArray(candidate?.documents) ? candidate.documents.length : 0;
      const unverifiedDocsCount = Array.isArray(candidate?.documents)
        ? candidate.documents.filter(d => d.verificationStatus !== 'VERIFIED').length
        : 0;
      const rejectedDocsCount = Array.isArray(candidate?.documents)
        ? candidate.documents.filter(d => d.verificationStatus === 'REJECTED').length
        : 0;
      const isTrainingScheduled = !!(candidate?.trainingScheduledDate || candidate?.trainingStartDate || candidate?.trainingStatus === 'Scheduled');
      const isTrainingInProgress = candidate?.trainingStatus === 'In Progress' || isTrainingScheduled;
      const isTrainingCompleted = candidate?.trainingStatus === 'Completed';
      const isExamRegistered = !!(candidate?.examRegistrationNumber || candidate?.examStatus === 'Registered');
      const isExamScheduled = !!(candidate?.examScheduledDate || candidate?.examStatus === 'Scheduled');
      const isExamAppeared = candidate?.examAppeared === true || candidate?.examStatus === 'Passed' || candidate?.examStatus === 'Failed';
      const isExamPassed = candidate?.examStatus === 'Passed' || candidate?.result === 'Pass' || candidate?.result === 'Passed';
      const isExamFailed = candidate?.examStatus === 'Failed' || candidate?.result === 'Fail';
      const isEligibilityConfirmed = isTrainingCompleted && isExamPassed && rejectedDocsCount === 0;
      const isAdvisorCreated = !!advisor || candidate?.isConvertedToAdvisor === true;
      const isCodeLicenseComplete = !!(advisor?.advisorCode && advisor?.licenseNumber);
      const isAbpAssigned = !!(advisor?.abpId || advisor?.abpName);
      const isL1Assigned = !!(advisor?.level1ManagerId || advisor?.level1ManagerName);
      const isAdvisorActive = advisor?.status === 'ACTIVE';

      // Determine the active current milestone number (1 to 10)
      let currentStageNum = 1;
      if (advisor) {
        currentStageNum = 10;
      } else if (candidate) {
        if (candidate.stageNumber) {
          currentStageNum = Math.min(Math.max(Number(candidate.stageNumber), 1), 10);
        } else if (isAdvisorCreated) currentStageNum = 13;
        else if (isEligibilityConfirmed) currentStageNum = 12;
        else if (isExamPassed) currentStageNum = 11;
        else if (isExamAppeared) currentStageNum = 10;
        else if (isExamScheduled) currentStageNum = 9;
        else if (isExamRegistered) currentStageNum = 8;
        else if (isTrainingCompleted) currentStageNum = 7;
        else if (isTrainingInProgress) currentStageNum = 6;
        else if (isTrainingScheduled) currentStageNum = 5;
        else if (unverifiedDocsCount === 0 && docsCount > 0) currentStageNum = 4;
        else if (docsCount > 0) currentStageNum = 3;
        else currentStageNum = 2;
      }

      const allStages = AdvisorMilestone.getStages();
      const detailedRoadmap = allStages.map(s => {
        const stageNum = s.stage;
        const stored = milestoneMap.get(stageNum);

        let stageStatus = 'PENDING';
        let blockedReason = null;

        if (stored?.status === 'COMPLETED' || stageNum < currentStageNum) {
          stageStatus = 'COMPLETED';
        } else if (stored?.status === 'FAILED' || (stageNum === 10 && isExamFailed)) {
          stageStatus = 'FAILED';
          blockedReason = 'Exam result is FAIL. Candidate must undergo re-training/re-examination.';
        } else if (stored?.status === 'BLOCKED') {
          stageStatus = 'BLOCKED';
          blockedReason = stored.remarks || 'Stage blocked by administrative policy.';
        } else if (stageNum === currentStageNum) {
          stageStatus = 'CURRENT';

          // Check if current stage has blocking conditions
          if (stageNum === 3 && rejectedDocsCount > 0) {
            stageStatus = 'BLOCKED';
            blockedReason = `${rejectedDocsCount} document(s) marked REJECTED. Please re-upload verified KYC documents.`;
          } else if (stageNum === 7 && !isTrainingCompleted) {
            stageStatus = 'BLOCKED';
            blockedReason = 'Training completion is mandatory before Exam Registration.';
          } else if (stageNum === 10 && isExamFailed) {
            stageStatus = 'FAILED';
            blockedReason = 'Exam result recorded as FAIL. Advisor creation is prohibited.';
          } else if (stageNum === 11 && (!isTrainingCompleted || !isExamPassed)) {
            stageStatus = 'BLOCKED';
            blockedReason = 'Eligibility criteria unmet: Both Training Completion and Exam PASS are mandatory.';
          }
        } else if (stageNum > currentStageNum) {
          stageStatus = 'PENDING';
        }

        return {
          stageNumber: stageNum,
          milestoneKey: s.key,
          milestoneName: s.name,
          purpose: s.purpose,
          activities: s.activities,
          entryCondition: s.entryCondition,
          completionConditions: s.completionConditions,
          nextAction: s.nextAction,
          transitionRule: s.transitionRule,
          status: stageStatus,
          blockedReason,
          plannedDate: stored?.plannedDate || null,
          actualDate: stored?.actualDate || null,
          completedDate: stored?.completedDate || (stageStatus === 'COMPLETED' ? (advisor?.joiningDate || candidate?.createdAt?.split('T')[0]) : null),
          completedBy: stored?.completedBy || (stageStatus === 'COMPLETED' ? 'admin' : null),
          remarks: stored?.remarks || (stageStatus === 'COMPLETED' ? 'Verified in pipeline' : ''),
          stageData: stored?.stageData || {}
        };
      });

      res.json({
        success: true,
        currentStageNumber: currentStageNum,
        candidate,
        advisor,
        stages: detailedRoadmap
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * PUT /api/advisors/:id/milestones
   * Strictly validates the 10-milestone onboarding transitions and records the audit trail.
   */
  updateAdvisorMilestone = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        stageNumber,
        status = 'COMPLETED',
        completedDate,
        remarks,
        stageData = {},
        updatedBy = 'admin',
        otp = null,
        isOverride = false
      } = req.body;

      const targetStageNum = Number(stageNumber);
      if (isNaN(targetStageNum) || targetStageNum < 1 || targetStageNum > 10) {
        return res.status(400).json({ error: 'Invalid milestone number. It must be an integer between 1 and 10.' });
      }

      const advisor = await this.db.collection('advisors').findOne({ $or: [{ id }, { advisorCode: id }] });
      const candidateId = advisor?.candidateId || id;
      const candidate = await this.db.collection('candidates').findOne({ $or: [{ id: candidateId }, { _id: candidateId }] });
      const advId = advisor?.id || id;
      const now = new Date().toISOString();
      const dateStr = completedDate || now.split('T')[0];

      // 1. Enforce sequential transitions on the server, not only in React.
      if (!isOverride) {
        if (targetStageNum > 1) {
          const predecessor = await this.db.collection('advisor_milestones').findOne({
            candidateId,
            stageNumber: targetStageNum - 1,
            status: 'COMPLETED'
          });
          if (!predecessor) {
            return res.status(400).json({ error: `Cannot complete milestone ${targetStageNum} until milestone ${targetStageNum - 1} is completed.` });
          }
        }
        if (targetStageNum === 9 && String(stageData.result || stageData.examResult || '').toUpperCase() === 'FAILED') {
          return res.status(400).json({ error: 'A failed certification result cannot unlock the active license milestone.' });
        }
        if (targetStageNum === 10 && candidate?.isConvertedToAdvisor) {
          return res.status(400).json({
            error: 'An active advisor license has already been generated for this candidate.'
          });
        }
      }

      // 2. Persist stage milestone record
      const filter = {
        $or: [
          { advisorId: advId, stageNumber: targetStageNum },
          { candidateId: candidateId, stageNumber: targetStageNum }
        ]
      };

      const stageDef = AdvisorMilestone.getStageByNumber(targetStageNum);
      const updateData = {
        status,
        completedDate: status === 'COMPLETED' ? dateStr : null,
        actualDate: dateStr,
        completedBy: updatedBy,
        remarks: remarks || `Progressed to Stage ${targetStageNum}: ${stageDef?.name || ''}`,
        stageData,
        lastUpdatedAt: now,
        updatedAt: now
      };

      await this.db.collection('advisor_milestones').updateOne(
        filter,
        {
          $set: updateData,
          $setOnInsert: {
            id: `ms-${advId}-${targetStageNum}`,
            candidateId,
            advisorId: advId,
            stageNumber: targetStageNum,
            milestoneKey: stageDef?.key || `STAGE_${targetStageNum}`,
            milestoneName: stageDef?.name || `Stage ${targetStageNum}`,
            plannedDate: dateStr,
            createdAt: now
          }
        },
        { upsert: true }
      );

      // 3. Update candidate or advisor domain fields synchronously
      const nextStageNum = Math.min(targetStageNum + (status === 'COMPLETED' ? 1 : 0), 10);
      const candidateUpdates = {
        stageNumber: nextStageNum,
        currentStage: stageDef?.name || `Stage ${targetStageNum}`,
        pendingStageSince: dateStr,
        updatedAt: now
      };

      if (targetStageNum === 4 && stageData.trainingStartDate) {
        candidateUpdates.trainingStartDate = stageData.trainingStartDate;
        candidateUpdates.trainingScheduledDate = stageData.trainingStartDate;
        candidateUpdates.trainingStatus = 'Scheduled';
      } else if (targetStageNum === 5) {
        candidateUpdates.trainingStatus = 'In Progress';
      } else if (targetStageNum === 6) {
        candidateUpdates.trainingStatus = 'Completed';
        candidateUpdates.trainingCompletionDate = dateStr;
      } else if (targetStageNum === 7 && stageData.examRegistrationNumber) {
        candidateUpdates.examRegistrationNumber = stageData.examRegistrationNumber;
        candidateUpdates.examStatus = 'Registered';
      } else if (targetStageNum === 8 && stageData.examScheduledDate) {
        candidateUpdates.examScheduledDate = stageData.examScheduledDate;
        candidateUpdates.examStatus = 'Scheduled';
      } else if (targetStageNum === 9) {
        candidateUpdates.examAppeared = stageData.appeared !== false;
      } else if (targetStageNum === 10) {
        const resValue = stageData.examResult || (status === 'FAILED' ? 'FAIL' : 'PASS');
        if (resValue === 'PASS' || resValue === 'Pass') {
          candidateUpdates.examStatus = 'Passed';
          candidateUpdates.result = 'Pass';
        } else if (resValue === 'FAIL' || resValue === 'Fail') {
          candidateUpdates.examStatus = 'Failed';
          candidateUpdates.result = 'Fail';
        }
      } else if (targetStageNum === 11) {
        candidateUpdates.eligibility = 'Eligible';
        candidateUpdates.eligibilityDate = dateStr;
      }

      if (candidateId) {
        await this.db.collection('candidates').updateOne(
          { $or: [{ id: candidateId }, { _id: candidateId }] },
          { $set: candidateUpdates }
        );
      }

      // 4. Log detailed Milestone Audit Trail
      const auditLog = {
        id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        candidateId,
        advisorId: advId,
        targetId: id,
        previousStage: candidate?.stageNumber || 1,
        newStage: nextStageNum,
        stageCompleted: targetStageNum,
        stageName: stageDef?.name,
        status,
        remarks: remarks || `Transitioned Stage ${targetStageNum} -> ${status}`,
        performedBy: updatedBy,
        otpReference: otp || null,
        isOverride,
        date: dateStr,
        timestamp: now
      };
      await this.db.collection('milestone_audit_logs').insertOne(auditLog);
      await this.logActivity(updatedBy, 'Milestone Pipeline Transition', `Target: ${id}, Completed Stage ${targetStageNum} (${stageDef?.name}) -> Next Stage: ${nextStageNum}`);

      res.json({
        success: true,
        stageNumber: targetStageNum,
        nextStageNumber: nextStageNum,
        status,
        date: dateStr,
        message: `Stage ${targetStageNum} (${stageDef?.name}) marked ${status}. Advancing to Stage ${nextStageNum}.`
      });
    } catch (e) {
      console.error('[Update Milestone Error]', e);
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * POST /api/advisors/otp/request
   */
  requestOtp = async (req, res) => {
    try {
      const { username = 'admin', actionType = 'SENSITIVE_OPERATION', targetDetails = '' } = req.body;
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      await this.db.collection('otps').updateOne(
        { username, actionType },
        {
          $set: {
            otp: otpCode,
            actionType,
            targetDetails,
            expiresAt,
            createdAt: new Date().toISOString()
          }
        },
        { upsert: true }
      );

      console.log(`
============================ OWNER OTP DISPATCH ============================
[Service Alert] Trigger OTP for ${actionType}
Owner Email      : kiruthickrn@gmail.com
Requested By     : ${username}
Target Details   : ${targetDetails}
OTP CODE         : ${otpCode}
Valid For        : 10 Minutes
=============================================================================
`);

      await this.logActivity(username, 'Requested Owner OTP', `Action: ${actionType} - Target: ${targetDetails}`);

      const emailSubject = `[SECURITY VERIFICATION] OTP for ${actionType}`;
      const emailBody = `Hello Business Manager / Owner,

A sensitive operation has been requested in Aynkaran Business CRM:

- Operation Type: ${actionType}
- Target Details: ${targetDetails || 'Advisor Management System'}
- Requested By: @${username}
- Time of Request: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Security One-Time Password (OTP):
--------------------------------------------------
OTP CODE: ${otpCode}
--------------------------------------------------
This OTP is valid for 10 minutes and can only be used once.

Best regards,
Aynkaran Business CRM Security Desk`;

      await sendEmailReceipt('kiruthickrn@gmail.com', emailSubject, emailBody).catch(e => console.error('[OTP Email Dispatch Error]', e));

      res.json({
        success: true,
        message: 'Security authorization OTP has been generated and sent to the Business Owner (kiruthickrn@gmail.com).'
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * POST /api/advisors/otp/verify
   */
  verifyOtp = async (req, res) => {
    try {
      const { username = 'admin', actionType = 'SENSITIVE_OPERATION', otp } = req.body;

      if (!otp || !otp.trim()) {
        return res.status(400).json({ success: false, error: 'OTP code is required.' });
      }

      const record = await this.db.collection('otps').findOne({ username, actionType });
      if (!record) {
        return res.status(400).json({ success: false, error: 'No active OTP request found for this operation.' });
      }

      if (Date.now() > record.expiresAt) {
        await this.db.collection('otps').deleteOne({ username, actionType });
        return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new OTP code.' });
      }

      if (record.otp !== otp.trim()) {
        return res.status(400).json({ success: false, error: 'OTP verification failed. Incorrect verification code.' });
      }

      await this.db.collection('otps').deleteOne({ username, actionType });
      await this.logActivity(username, 'Verified Owner OTP', `Action: ${actionType} - Success`);

      res.json({
        success: true,
        message: 'OTP authorization successful.'
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * POST /api/advisors/reminders/bulk-send
   */
  bulkSendReminders = async (req, res) => {
    try {
      const {
        recipients,
        channel = 'WHATSAPP',
        milestoneType = 'GENERAL_NOTICE',
        messageBody,
        subject = 'Aynkaran Notice',
        otp,
        username = 'admin'
      } = req.body;

      if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'Recipients list cannot be empty.' });
      }

      if (!messageBody || !messageBody.trim()) {
        return res.status(400).json({ error: 'Message body is required.' });
      }

      if (recipients.length > 3) {
        if (!otp) {
          return res.status(403).json({ error: 'Owner OTP authorization is required for bulk communications.', requiresOtp: true });
        }

        const otpRecord = await this.db.collection('otps').findOne({ username, actionType: 'BULK_COMMUNICATION' });
        if (!otpRecord || otpRecord.otp !== otp.trim() || Date.now() > otpRecord.expiresAt) {
          return res.status(403).json({ error: 'Invalid or expired OTP code. Bulk communication aborted.' });
        }

        await this.db.collection('otps').deleteOne({ username, actionType: 'BULK_COMMUNICATION' });
      }

      const batchId = `batch-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();

      const newBatch = {
        id: batchId,
        title: `Bulk ${channel} - ${milestoneType}`,
        milestoneType,
        channel,
        recipientCount: recipients.length,
        recipientIds: recipients,
        messageBody,
        subject,
        createdBy: username,
        approvalRequired: false,
        approvalStatus: 'APPROVED',
        approvedBy: username,
        approvedAt: now,
        status: 'PROCESSING',
        createdAt: now,
        updatedAt: now
      };

      await this.db.collection('notification_batches').insertOne(newBatch);

      const batchResult = await this.notificationService.executeBatch(batchId);
      await this.logActivity(username, 'Dispatched Bulk Notifications', `Batch ${batchId}: ${recipients.length} recipients via ${channel}`);

      res.json({
        success: true,
        batchId,
        recipientCount: recipients.length,
        ...batchResult
      });
    } catch (e) {
      console.error('[AdvisorController.bulkSendReminders Error]', e);
      res.status(500).json({ error: e.message });
    }
  };

  /**
   * POST /api/advisors/export
   */
  exportAdvisorData = async (req, res) => {
    try {
      const { reportType = 'MASTER', format = 'CSV', otp, username = 'admin' } = req.body;

      if (reportType === 'SENSITIVE_MASTER' || reportType === 'FULL_COMMISSION') {
        if (!otp) {
          return res.status(403).json({ error: 'Owner OTP authorization is required for sensitive export.', requiresOtp: true });
        }

        const otpRecord = await this.db.collection('otps').findOne({ username, actionType: 'SENSITIVE_EXPORT' });
        if (!otpRecord || otpRecord.otp !== otp.trim() || Date.now() > otpRecord.expiresAt) {
          return res.status(403).json({ error: 'Invalid or expired OTP code. Export aborted.' });
        }

        await this.db.collection('otps').deleteOne({ username, actionType: 'SENSITIVE_EXPORT' });
      }

      const advisors = await this.db.collection('advisors').find().toArray();
      const policies = await this.db.collection('policies').find().toArray();

      const exportRows = advisors.map(a => {
        const advPolicies = policies.filter(p => p.advisorId === a.id || p.advisorCode === a.advisorCode);
        const prem = advPolicies.reduce((acc, p) => acc + (Number(p.premiumAmount) || 0), 0);
        const comm = advPolicies.reduce((acc, p) => acc + (Number(p.commissionAmount) || (Number(p.premiumAmount || 0) * 0.15)), 0);

        return {
          'Advisor Code': a.advisorCode,
          'Full Name': a.fullName,
          'Mobile': a.mobile,
          'Email': a.email || 'N/A',
          'Company': a.insuranceCompanyName,
          'License Number': a.licenseNumber,
          'Joining Date': a.joiningDate,
          'Status': a.status,
          'ABP Sponsor': a.abpName || a.abpId || 'N/A',
          'Level-1 Manager': a.level1ManagerName || a.level1ManagerId || 'N/A',
          'Active Policies': advPolicies.length,
          'Total Premium (INR)': prem,
          'Total Commission (INR)': comm
        };
      });

      await this.logActivity(username, 'Exported Advisor Report', `Type: ${reportType}, Format: ${format}, Records: ${exportRows.length}`);

      res.json({
        success: true,
        reportType,
        format,
        rowCount: exportRows.length,
        data: exportRows
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
}
