const nodemailer = require('nodemailer');

/**
 * Sends an email using SMTP credentials from env or logs to console as fallback
 * @param {object} options { to, subject, text, html }
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Mock / Log to console in development
      console.log('\n==================================================');
      console.log('                  MOCK EMAIL SENT                 ');
      console.log('==================================================');
      console.log(`To:      ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('--------------------------------------------------');
      console.log(text);
      console.log('==================================================\n');
      return { messageId: 'mock-email-id-' + Date.now() };
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || '"Grievance Portal" <noreply@grievanceportal.com>',
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return null;
  }
};

/**
 * Notify user that their complaint has been created
 */
const sendComplaintCreatedEmail = async (user, complaint) => {
  const subject = `Complaint Submitted Successfully - #${complaint._id.toString().substring(18)}`;
  const text = `Hi ${user.name},

Your complaint titled "${complaint.title}" has been successfully submitted and registered.

Complaint Details:
- Ticket ID: #${complaint._id}
- Description: ${complaint.description}
- Status: ${complaint.status}
- Priority: ${complaint.priority}
- Estimated SLA SLA Breach Status: ${complaint.sla_breach ? 'Breached' : 'Active'}

You can track the live progress of your complaint here: http://localhost:5173/complaints/${complaint._id}

Thank you,
Grievance Support Team`;

  return sendEmail({ to: user.email, subject, text });
};

/**
 * Notify user that their complaint status has changed
 */
const sendComplaintStatusUpdateEmail = async (user, complaint, oldStatus, newStatus) => {
  const subject = `Complaint Status Updated - #${complaint._id.toString().substring(18)}`;
  const text = `Hi ${user.name},

The status of your complaint titled "${complaint.title}" has been updated.

Updates:
- Ticket ID: #${complaint._id}
- Previous Status: ${oldStatus}
- New Status: ${newStatus}
${complaint.resolution_notes ? `- Resolution Notes: ${complaint.resolution_notes}` : ''}

You can view details and leave comments here: http://localhost:5173/complaints/${complaint._id}

Thank you,
Grievance Support Team`;

  return sendEmail({ to: user.email, subject, text });
};

/**
 * Notify staff member that a complaint has been assigned to them
 */
const sendComplaintAssignedEmail = async (staff, complaint) => {
  const subject = `New Complaint Assigned - #${complaint._id.toString().substring(18)}`;
  const text = `Hi ${staff.name},

A new complaint has been assigned to you for investigation and resolution.

Complaint Details:
- Ticket ID: #${complaint._id}
- Title: ${complaint.title}
- Description: ${complaint.description}
- Priority: ${complaint.priority}

Please log in to your dashboard to review and begin working on this complaint: http://localhost:5173/complaints/${complaint._id}

Thank you,
Grievance Support System`;

  return sendEmail({ to: staff.email, subject, text });
};

/**
 * Notify department head that a complaint has been escalated
 */
const sendComplaintEscalatedEmail = async (head, complaint) => {
  const subject = `URGENT: Complaint Escalated (Level ${complaint.escalation_level}) - #${complaint._id.toString().substring(18)}`;
  const text = `Hi ${head.name},

A complaint in your department has been escalated to Level ${complaint.escalation_level}.

Complaint Details:
- Ticket ID: #${complaint._id}
- Title: ${complaint.title}
- Description: ${complaint.description}
- Current Priority: ${complaint.priority}
- Escalation Level: Level ${complaint.escalation_level}

Please review the complaint and assign necessary resources to resolve it immediately: http://localhost:5173/complaints/${complaint._id}

Thank you,
Grievance Support System`;

  return sendEmail({ to: head.email, subject, text });
};

module.exports = {
  sendEmail,
  sendComplaintCreatedEmail,
  sendComplaintStatusUpdateEmail,
  sendComplaintAssignedEmail,
  sendComplaintEscalatedEmail,
};
