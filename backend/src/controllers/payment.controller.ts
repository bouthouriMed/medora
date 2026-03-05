import { Request, Response } from 'express';
import paymentService from '../services/payment.service';
import type { AuthRequest } from '../types/express.d';

export async function createCheckoutSession(req: AuthRequest, res: Response) {
  try {
    const { invoiceId, returnUrl } = req.body;
    const result = await paymentService.createCheckoutSession(req.user!.clinicId, invoiceId, returnUrl);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function handleWebhook(req: Request, res: Response) {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const result = await paymentService.handleWebhook(req.body, sig);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function getPayments(req: AuthRequest, res: Response) {
  try {
    const payments = await paymentService.getPayments(req.user!.clinicId);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function recordManualPayment(req: AuthRequest, res: Response) {
  try {
    const payment = await paymentService.recordManualPayment(req.user!.clinicId, req.body);
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
