// backend/routes/advisorRoutes.js

import { Router } from 'express';
import { AdvisorController } from '../controllers/advisorController.js';

export function advisorRoutes(db) {
  const router = Router();
  const controller = new AdvisorController(db);

  // 1. Dashboard Aggregate Stats
  router.get('/dashboard-stats', controller.getDashboardStats);

  // 2. Hierarchy Options (ABPs & L1 Managers)
  router.get('/hierarchy-options', controller.getHierarchyOptions);

  // 3. Reports & Direct Exports (No OTP required)
  router.post('/export', controller.exportAdvisorData);

  // 4. Security Owner OTP Workflows (for bulk communications)
  router.post('/otp/request', controller.requestOtp);
  router.post('/otp/verify', controller.verifyOtp);

  // 5. Bulk Communications
  router.post('/reminders/bulk-send', controller.bulkSendReminders);

  // 6. Core Candidate-to-Advisor Conversion Gate
  router.post('/convert/:candidateId', controller.convertCandidateToAdvisor);

  // 7. General Advisor CRUD & Listings
  router.get('/', controller.listAdvisors);
  router.post('/', controller.createAdvisor);
  router.get('/:id', controller.getAdvisor);
  router.put('/:id', controller.updateAdvisor);
  router.delete('/:id', controller.deleteAdvisor);
  router.patch('/:id/status', controller.changeAdvisorStatus);

  // 8. Relational Sub-resources & Manual Milestone Progression
  router.get('/:id/policies', controller.getAdvisorPolicies);
  router.get('/:id/customers', controller.getAdvisorCustomers);
  router.get('/:id/performance', controller.getAdvisorPerformance);
  router.get('/:id/commission', controller.getAdvisorCommission);
  router.get('/:id/milestones', controller.getAdvisorMilestones);
  router.put('/:id/milestones', controller.updateAdvisorMilestone);

  return router;
}

export default advisorRoutes;
