import { Response } from 'express';
import reminderService from '../services/reminder.service';
import type { AuthRequest } from '../types/express.d';

export async function getPendingReminders(req: AuthRequest, res: Response) {
  try {
    const reminders = await reminderService.getPendingReminders(req.user!.clinicId);
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function triggerReminders(req: AuthRequest, res: Response) {
  try {
    const reminders = await reminderService.generateReminders();
    res.json({ sent: reminders.length, reminders });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
