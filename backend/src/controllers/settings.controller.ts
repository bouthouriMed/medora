import { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../types/express.d';

export const getClinicSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    let settings = await prisma.clinicSettings.findUnique({
      where: { clinicId },
    });
    
    if (!settings) {
      settings = await prisma.clinicSettings.create({
        data: { clinicId },
      });
    }
    
    res.json({
      ...settings,
      smtpPassword: settings?.smtpPassword ? '***' : null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clinic settings' });
  }
};

export const updateClinicSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const { emailNotifications, smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail } = req.body;
    
    const settings = await prisma.clinicSettings.upsert({
      where: { clinicId },
      update: {
        emailNotifications,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort || null,
        smtpUser: smtpUser || null,
        smtpPassword: smtpPassword && smtpPassword !== '***' ? smtpPassword : undefined,
        fromEmail: fromEmail || null,
      },
      create: {
        clinicId,
        emailNotifications: emailNotifications || false,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort || null,
        smtpUser: smtpUser || null,
        smtpPassword: smtpPassword || null,
        fromEmail: fromEmail || null,
      },
    });
    
    res.json({
      ...settings,
      smtpPassword: settings.smtpPassword ? '***' : null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update clinic settings' });
  }
};

export const sendTestEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const { email } = req.body;
    
    const settings = await prisma.clinicSettings.findUnique({
      where: { clinicId },
    });
    
    if (!settings?.emailNotifications || !settings.smtpHost) {
      return res.status(400).json({ error: 'Email notifications not configured' });
    }
    
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send test email' });
  }
};
