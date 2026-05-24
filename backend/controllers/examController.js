/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// IRDAI Carrier Certification and online exams controller using MongoDB Atlas
export class ExamController {
  constructor(db) {
    this.db = db;
  }

  schedule = async (req, res) => {
    try {
      const { candidateId, scheduledDate } = req.body;
      
      const candidate = await this.db.collection('candidates').findOne({ id: candidateId });
      if (!candidate) return res.status(404).json({ error: 'Trainee file was not found.' });

      const examData = typeof candidate.exam === 'string' ? JSON.parse(candidate.exam || '{}') : (candidate.exam || {});
      examData.scheduledDate = scheduledDate;
      examData.result = 'Awaiting';

      await this.db.collection('candidates').updateOne(
        { id: candidateId },
        { $set: { exam: examData, currentStage: 'Schedule Exam' } }
      );

      res.json({ success: true, exam: examData, stage: 'Schedule Exam' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  updateResult = async (req, res) => {
    try {
      const { candidateId, result, score, agentCodeGenerated } = req.body;

      const candidate = await this.db.collection('candidates').findOne({ id: candidateId });
      if (!candidate) return res.status(404).json({ error: 'Trainee file was not found.' });

      const examData = typeof candidate.exam === 'string' ? JSON.parse(candidate.exam || '{}') : (candidate.exam || {});
      examData.result = result; // 'Pass' or 'Fail'
      examData.score = score;

      let nextStage = 'Reschedule Exam';
      if (result === 'Pass') {
        nextStage = agentCodeGenerated ? 'Generate Agent Code' : 'Exam Result';
        if (agentCodeGenerated) {
          examData.agentCodeGenerated = agentCodeGenerated;
        }
      }

      await this.db.collection('candidates').updateOne(
        { id: candidateId },
        { $set: { exam: examData, currentStage: nextStage } }
      );

      res.json({ success: true, exam: examData, stage: nextStage });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
}
