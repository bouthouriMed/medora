import { Response } from 'express';
import notificationService from '../services/notification.service';
import { AuthRequest } from '../types/express.d';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { unreadOnly, type, page, limit } = req.query;

    const result = await notificationService.findByUser({
      userId,
      unreadOnly: unreadOnly === 'true',
      type: type as any,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await notificationService.markAsRead(id, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await notificationService.delete(id, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await notificationService.findByUser({
      userId,
      unreadOnly: true,
      limit: 1,
    });

    res.json({ unreadCount: result.unreadCount });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
