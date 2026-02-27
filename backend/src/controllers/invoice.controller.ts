import { Response } from 'express';
import invoiceService from '../services/invoice.service';
import type { AuthRequest } from '../types/express.d';

export class InvoiceController {
  async create(req: AuthRequest, res: Response) {
    try {
      const invoice = await invoiceService.create(req.user!.clinicId, req.body);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const { status } = req.query;
      const invoices = await invoiceService.getAll(
        req.user!.clinicId,
        status as 'PAID' | 'UNPAID' | undefined
      );
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const invoice = await invoiceService.getById(req.params.id as string, req.user!.clinicId);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getUnpaid(req: AuthRequest, res: Response) {
    try {
      const invoices = await invoiceService.getUnpaid(req.user!.clinicId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getRevenueSummary(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const summary = await invoiceService.getRevenueSummary(
        req.user!.clinicId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async markAsPaid(req: AuthRequest, res: Response) {
    try {
      await invoiceService.markAsPaid(req.params.id as string, req.user!.clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async markAsUnpaid(req: AuthRequest, res: Response) {
    try {
      await invoiceService.markAsUnpaid(req.params.id as string, req.user!.clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await invoiceService.delete(req.params.id as string, req.user!.clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export default new InvoiceController();
