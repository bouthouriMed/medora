import { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../types/express.d';

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const { status, priority, assignedTo } = req.query;

    const where: any = { clinicId };
    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (assignedTo) where.assignedTo = assignedTo as string;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
      ],
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const { title, description, status, priority, dueDate, patientId, assignedTo } = req.body as {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string;
      patientId?: string;
      assignedTo?: string;
    };

    const task = await prisma.task.create({
      data: {
        clinicId,
        title,
        description,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        patientId,
        assignedTo,
        createdBy: req.user!.id,
      },
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { clinicId } = req.user!;
    const { title, description, status, priority, dueDate, patientId, assignedTo } = req.body as {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string;
      patientId?: string;
      assignedTo?: string;
    };

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        patientId,
        assignedTo,
      },
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { clinicId } = req.user!;

    await prisma.task.deleteMany({
      where: { id, clinicId },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
