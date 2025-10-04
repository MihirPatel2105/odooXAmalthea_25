const nodemailer = require('nodemailer');
const { createTransporter } = require('../config/email');

// Email templates
const emailTemplates = {
  welcome: (data) => ({
    subject: 'Welcome to Expense Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Expense Management System!</h2>
        <p>Dear ${data.firstName},</p>
        <p>Welcome to the Expense Management System! Your company "${data.companyName}" has been successfully registered.</p>
        <p>You can now start managing your expenses efficiently with our platform.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <h3>Getting Started:</h3>
          <ul>
            <li>Create employee and manager accounts</li>
            <li>Set up approval workflows</li>
            <li>Configure expense policies</li>
            <li>Start submitting expenses</li>
          </ul>
        </div>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Expense Management Team</p>
      </div>
    `
  }),
  
  expenseSubmitted: (data) => ({
    subject: `New Expense Submitted - ${data.expenseId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Expense Awaiting Approval</h2>
        <p>Dear ${data.approverName},</p>
        <p>A new expense has been submitted and requires your approval:</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p><strong>Employee:</strong> ${data.employeeName}</p>
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Description:</strong> ${data.description}</p>
          <p><strong>Date:</strong> ${data.expenseDate}</p>
        </div>
        <p>Please log in to the system to review and approve this expense.</p>
        <p>Best regards,<br>The Expense Management System</p>
      </div>
    `
  }),
  
  expenseApproved: (data) => ({
    subject: `Expense Approved - ${data.expenseId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Expense Approved!</h2>
        <p>Dear ${data.employeeName},</p>
        <p>Your expense has been approved:</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #d4edda; border-radius: 5px; border-left: 4px solid #28a745;">
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Description:</strong> ${data.description}</p>
          <p><strong>Approved by:</strong> ${data.approverName}</p>
          ${data.comments ? `<p><strong>Comments:</strong> ${data.comments}</p>` : ''}
        </div>
        <p>Your reimbursement will be processed according to company policy.</p>
        <p>Best regards,<br>The Expense Management System</p>
      </div>
    `
  }),
  
  expenseRejected: (data) => ({
    subject: `Expense Rejected - ${data.expenseId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Expense Rejected</h2>
        <p>Dear ${data.employeeName},</p>
        <p>Your expense has been rejected:</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border-radius: 5px; border-left: 4px solid #dc3545;">
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Description:</strong> ${data.description}</p>
          <p><strong>Rejected by:</strong> ${data.approverName}</p>
          <p><strong>Reason:</strong> ${data.rejectionReason}</p>
        </div>
        <p>Please review the rejection reason and resubmit if necessary.</p>
        <p>Best regards,<br>The Expense Management System</p>
      </div>
    `
  }),

  userCreated: (data) => ({
    subject: 'Your Expense Management Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Account Created Successfully</h2>
        <p>Dear ${data.firstName},</p>
        <p>An account has been created for you in the Expense Management System for ${data.companyName}.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #e7f3ff; border-radius: 5px; border-left: 4px solid #0066cc;">
          <p><strong>Login URL:</strong> ${data.loginUrl}</p>
          <p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>
        </div>
        <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
        <p>If you have any questions, please contact your administrator.</p>
        <p>Best regards,<br>The Expense Management Team</p>
      </div>
    `
  })
};

// Send email function
exports.sendEmail = async ({ to, template, data, subject, html }) => {
  try {
    const transporter = createTransporter();
    
    let emailContent;
    if (template && emailTemplates[template]) {
      emailContent = emailTemplates[template](data);
    } else {
      emailContent = { subject, html };
    }

    const mailOptions = {
      from: `"Expense Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;

  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Send bulk emails
exports.sendBulkEmail = async (recipients) => {
  const results = [];
  for (const recipient of recipients) {
    try {
      const result = await exports.sendEmail(recipient);
      results.push({ success: true, email: recipient.to, messageId: result.messageId });
    } catch (error) {
      results.push({ success: false, email: recipient.to, error: error.message });
    }
  }
  return results;
};
