const Complaint = require('../models/Complaint');
const Comment = require('../models/Comment');

/**
 * Checks all active complaints for SLA breaches based on their priority.
 * High: 24 hours
 * Medium: 72 hours (3 days)
 * Low: 120 hours (5 days)
 * 
 * @param {object} io Socket.IO instance
 */
const checkSLA = async (io) => {
  try {
    const now = new Date();
    
    // SLA Thresholds in hours
    const SLA_THRESHOLDS = {
      High: 24,      // 1 day
      Medium: 72,    // 3 days
      Low: 120       // 5 days
    };

    const activeComplaints = await Complaint.find({
      status: { $nin: ['Resolved', 'Closed'] },
      sla_breach: false
    });

    let breachCount = 0;

    for (const complaint of activeComplaints) {
      const hoursSinceCreated = (now - new Date(complaint.createdAt)) / (1000 * 60 * 60);
      const threshold = SLA_THRESHOLDS[complaint.priority] || 120; // Default to Low priority limit

      if (hoursSinceCreated > threshold) {
        complaint.sla_breach = true;
        await complaint.save();

        // Create log activity comment
        await Comment.create({
          complaint_id: complaint._id,
          action: 'SLA Breach',
          content: `Complaint automatically flagged for SLA breach. It has been active for ${Math.round(hoursSinceCreated)} hours without resolution (Limit: ${threshold} hours).`,
        });

        // Broadcast real-time update
        if (io) {
          io.emit('complaint_updated', {
            id: complaint._id,
            action: 'SLA Breach',
            status: complaint.status
          });
        }
        
        breachCount++;
      }
    }

    if (breachCount > 0) {
      console.log(`[SLA Checker] SLA audit completed. Flagged ${breachCount} newly breached complaints.`);
    }
  } catch (error) {
    console.error('[SLA Checker Error]:', error.message);
  }
};

/**
 * Initializes the background SLA checker task.
 * @param {object} io Socket.IO instance
 */
const startSLAChecker = (io) => {
  // Run immediately on boot
  checkSLA(io);
  
  // Run every 10 minutes
  const intervalMs = 10 * 60 * 1000;
  setInterval(() => checkSLA(io), intervalMs);
  console.log('[SLA Checker] Background SLA monitor initialized.');
};

module.exports = {
  startSLAChecker,
  checkSLA
};
