import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

// Create email transporter
const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('📧 SMTP credentials not configured — email notifications disabled');
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Create Twilio client
const createTwilioClient = () => {
  if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE) {
    console.log('📱 Twilio credentials not configured — SMS notifications disabled');
    return null;
  }
  try {
    const twilio = require('twilio');
    return twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (e) {
    console.log('📱 Twilio package not installed — SMS notifications disabled');
    return null;
  }
};

const sendEmailNotification = async (transporter, vendorEmail, vendorName, taskTitle, clientName, dueDate) => {
  if (!transporter || !vendorEmail) return;

  try {
    await transporter.sendMail({
      from: `"Wedding CRM" <${process.env.SMTP_USER}>`,
      to: vendorEmail,
      subject: `⚠️ Task Reminder: "${taskTitle}" is due soon`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">⏰ Task Reminder</h1>
          </div>
          <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <p style="color: #374151; font-size: 16px;">Dear <strong>${vendorName}</strong>,</p>
            <p style="color: #374151; font-size: 16px;">This is a reminder that the following task is pending and due soon:</p>
            <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0;">
              <p style="margin: 4px 0; color: #6b7280;"><strong>Task:</strong> ${taskTitle}</p>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Client:</strong> ${clientName}</p>
              <p style="margin: 4px 0; color: #ef4444;"><strong>Due:</strong> ${new Date(dueDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
            <p style="color: #374151; font-size: 16px;">Please ensure this task is completed before the deadline.</p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">— Wedding CRM System</p>
          </div>
        </div>
      `
    });
    console.log(`📧 Email sent to ${vendorEmail} for task "${taskTitle}"`);
  } catch (error) {
    console.error(`📧 Failed to send email to ${vendorEmail}:`, error.message);
  }
};

const sendSMSNotification = async (twilioClient, vendorPhone, vendorName, taskTitle, clientName, dueDate) => {
  if (!twilioClient || !vendorPhone) return;

  // Format phone number for Twilio (add +91 for India if not already formatted)
  let formattedPhone = vendorPhone;
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+91${formattedPhone}`;
  }

  try {
    await twilioClient.messages.create({
      body: `⏰ Reminder: Task "${taskTitle}" for client ${clientName} is due at ${new Date(dueDate).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' })}. Please complete it ASAP. — Wedding CRM`,
      from: process.env.TWILIO_PHONE,
      to: formattedPhone
    });
    console.log(`📱 SMS sent to ${formattedPhone} for task "${taskTitle}"`);
  } catch (error) {
    console.error(`📱 Failed to send SMS to ${formattedPhone}:`, error.message);
  }
};

const checkAndNotifyVendors = async () => {
  console.log(`🔔 [${new Date().toLocaleString('en-IN')}] Running vendor notification check...`);

  const transporter = createTransporter();
  const twilioClient = createTwilioClient();

  if (!transporter && !twilioClient) {
    console.log('🔔 No notification channels configured, skipping...');
    return;
  }

  try {
    const now = new Date();
    const fiveHoursLater = new Date(now.getTime() + 5 * 60 * 60 * 1000);

    // Find pending tasks with due date within next 5 hours that have pending vendors
    const tasks = await Task.find({
      status: 'pending',
      dueDate: { $gte: now, $lte: fiveHoursLater },
      'taskVendors.status': 'pending'
    })
      .populate('wedding', 'name clientName')
      .populate('taskVendors.vendor', 'name phone email');

    if (tasks.length === 0) {
      console.log('🔔 No tasks requiring vendor notifications.');
      return;
    }

    for (const task of tasks) {
      const clientName = task.wedding?.clientName || 'Unknown Client';

      for (const tv of task.taskVendors) {
        if (tv.status !== 'pending' || !tv.vendor) continue;

        // Check if we already sent a notification for this task-vendor combo
        const existingNotification = await Notification.findOne({
          type: 'task_due',
          'relatedTo.model': 'Task',
          'relatedTo.id': task._id,
          title: { $regex: tv.vendor.name, $options: 'i' },
          createdAt: { $gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) } // within last 6 hours
        });

        if (existingNotification) {
          console.log(`🔔 Already notified ${tv.vendor.name} for task "${task.title}" recently, skipping.`);
          continue;
        }

        // Send notifications
        await sendEmailNotification(
          transporter,
          tv.vendor.email,
          tv.vendor.name,
          task.title,
          clientName,
          task.dueDate
        );

        await sendSMSNotification(
          twilioClient,
          tv.vendor.phone,
          tv.vendor.name,
          task.title,
          clientName,
          task.dueDate
        );

        // Record that we sent this notification
        await Notification.create({
          user: task.createdBy || task.assignedTo,
          type: 'task_due',
          title: `Vendor reminder sent to ${tv.vendor.name}`,
          message: `Reminder sent for task "${task.title}" - due ${new Date(task.dueDate).toLocaleString('en-IN')}`,
          relatedTo: { model: 'Task', id: task._id }
        });
      }
    }

    console.log(`🔔 Notification check complete. Processed ${tasks.length} task(s).`);
  } catch (error) {
    console.error('🔔 Notification scheduler error:', error.message);
  }
};

// Start the scheduler — runs every 30 minutes
export const startNotificationScheduler = () => {
  console.log('🔔 Vendor notification scheduler started (runs every 30 minutes)');

  // Run every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    checkAndNotifyVendors();
  });

  // Also run once on startup after a short delay
  setTimeout(() => {
    checkAndNotifyVendors();
  }, 5000);
};
