const express = require('express');
const router = express.Router();
const storageService = require('../services/storageService');
const { requireAuth } = require('./authRoutes');
router.use(requireAuth);
/**
 * GET /api/audit
 * Analyze vault security metrics
 */
router.get('/', (req, res) => {
  const passwords = storageService.getPasswords(req.masterKey);
  const notes = storageService.getNotes();
  const logs = storageService.getAuditLogs();
  let weakCount = 0;
  let strongCount = 0;
  let totalScoreSum = 0;
  const passwordMap = new Map(); // plainPassword -> count
  const duplicates = [];
  passwords.forEach(p => {
    const score = p.strength.score;
    totalScoreSum += score;
    if (score < 60) {
      weakCount++;
    } else if (score >= 80) {
      strongCount++;
    }
    const count = passwordMap.get(p.password) || 0;
    passwordMap.set(p.password, count + 1);
  });
  // Calculate reused passwords
  let reusedCount = 0;
  passwordMap.forEach((count, pwd) => {
    if (count > 1) {
      reusedCount += count;
      const affectedTitles = passwords.filter(p => p.password === pwd).map(p => p.title);
      duplicates.push({
        passwordPreview: pwd.substring(0, 2) + '***',
        count,
        affectedTitles
      });
    }
  });
  const totalPasswords = passwords.length;
  const averageStrengthScore = totalPasswords > 0 ? Math.round(totalScoreSum / totalPasswords) : 100;
  
  // Overall Health Score (penalize for weak & reused passwords)
  let healthScore = averageStrengthScore;
  if (reusedCount > 0) healthScore = Math.max(10, healthScore - (reusedCount * 15));
  if (weakCount > 0) healthScore = Math.max(10, healthScore - (weakCount * 10));
  const recommendations = [];
  if (weakCount > 0) {
    recommendations.push(`Improve ${weakCount} weak password${weakCount > 1 ? 's' : ''} using the Password Generator.`);
  }
  if (reusedCount > 0) {
    recommendations.push(`You are reusing passwords across ${reusedCount} accounts. Generate unique passwords for each service.`);
  }
  if (totalPasswords < 5) {
    recommendations.push('Add more credentials to centralize your project access security.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Excellent! All stored credentials follow high security guidelines.');
  }
  res.json({
    success: true,
    data: {
      metrics: {
        healthScore,
        totalPasswords,
        totalNotes: notes.length,
        strongCount,
        weakCount,
        reusedCount,
        averageStrengthScore
      },
      duplicates,
      recommendations,
      logs
    }
  });
});
module.exports = router;
