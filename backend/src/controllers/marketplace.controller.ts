import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../types/express.d';

const prisma = new PrismaClient();

export async function getItems(req: AuthRequest, res: Response) {
  try {
    const { type } = req.query;
    const where: any = { clinicId: req.user!.clinicId };
    if (type) where.type = type;
    const items = await prisma.marketplaceItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createItem(req: AuthRequest, res: Response) {
  try {
    const { type, name, description, price, category } = req.body;
    const item = await prisma.marketplaceItem.create({
      data: { clinicId: req.user!.clinicId, type, name, description, price, category },
    });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function updateItem(req: AuthRequest, res: Response) {
  try {
    const item = await prisma.marketplaceItem.updateMany({
      where: { id: req.params.id, clinicId: req.user!.clinicId },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function deleteItem(req: AuthRequest, res: Response) {
  try {
    await prisma.marketplaceItem.deleteMany({
      where: { id: req.params.id, clinicId: req.user!.clinicId },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getOrders(req: AuthRequest, res: Response) {
  try {
    const { status, patientId } = req.query;
    const where: any = { clinicId: req.user!.clinicId };
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;
    const orders = await prisma.marketplaceOrder.findMany({
      where,
      include: {
        patient: { select: { firstName: true, lastName: true } },
        item: { select: { name: true, type: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createOrder(req: AuthRequest, res: Response) {
  try {
    const { patientId, itemId, quantity, notes } = req.body;
    const item = await prisma.marketplaceItem.findFirst({
      where: { id: itemId, clinicId: req.user!.clinicId, isActive: true },
    });
    if (!item) return res.status(404).json({ error: 'Item not found or inactive' });
    const order = await prisma.marketplaceOrder.create({
      data: {
        clinicId: req.user!.clinicId,
        patientId,
        itemId,
        quantity: quantity || 1,
        totalPrice: item.price * (quantity || 1),
        notes,
      },
    });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function updateOrder(req: AuthRequest, res: Response) {
  try {
    const { status, notes } = req.body;
    const order = await prisma.marketplaceOrder.updateMany({
      where: { id: req.params.id, clinicId: req.user!.clinicId },
      data: { ...(status && { status }), ...(notes !== undefined && { notes }) },
    });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

// Public endpoint - patients browse items by clinic
export async function getPublicItems(req: any, res: Response) {
  try {
    const { clinicId } = req.params;
    const { type } = req.query;
    const where: any = { clinicId, isActive: true };
    if (type) where.type = type;
    const items = await prisma.marketplaceItem.findMany({
      where,
      select: { id: true, type: true, name: true, description: true, price: true, category: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

// Public endpoint - patient places order via portal token
export async function createPublicOrder(req: any, res: Response) {
  try {
    const { token } = req.params;
    const patient = await prisma.patient.findFirst({ where: { portalToken: token } });
    if (!patient) return res.status(404).json({ error: 'Invalid token' });
    const { itemId, quantity, notes } = req.body;
    const item = await prisma.marketplaceItem.findFirst({
      where: { id: itemId, clinicId: patient.clinicId, isActive: true },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    const order = await prisma.marketplaceOrder.create({
      data: {
        clinicId: patient.clinicId,
        patientId: patient.id,
        itemId,
        quantity: quantity || 1,
        totalPrice: item.price * (quantity || 1),
        notes,
      },
    });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
