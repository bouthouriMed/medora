import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' as any })
  : null;

class PaymentService {
  async createCheckoutSession(clinicId: string, invoiceId: string, returnUrl: string) {
    if (!stripe) throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in environment.');

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, clinicId },
      include: { patient: true, clinic: true },
    });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'PAID') throw new Error('Invoice is already paid');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice #${invoice.id.slice(0, 8)}`,
            description: `Payment for ${invoice.patient.firstName} ${invoice.patient.lastName}`,
          },
          unit_amount: Math.round(invoice.amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${returnUrl}?payment=success&invoiceId=${invoiceId}`,
      cancel_url: `${returnUrl}?payment=cancelled&invoiceId=${invoiceId}`,
      metadata: {
        invoiceId: invoice.id,
        clinicId,
        patientId: invoice.patientId,
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    if (!stripe) throw new Error('Stripe is not configured');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('Stripe webhook secret not configured');

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { invoiceId, clinicId, patientId } = session.metadata || {};

      if (invoiceId && clinicId && patientId) {
        await prisma.$transaction([
          prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: 'PAID', paidAt: new Date() },
          }),
          prisma.payment.create({
            data: {
              clinicId,
              invoiceId,
              patientId,
              amount: (session.amount_total || 0) / 100,
              method: 'STRIPE',
              stripePaymentId: session.payment_intent as string,
              stripeSessionId: session.id,
              status: 'COMPLETED',
            },
          }),
        ]);
      }
    }

    return { received: true };
  }

  async getPayments(clinicId: string) {
    return prisma.payment.findMany({
      where: { clinicId },
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordManualPayment(clinicId: string, data: {
    invoiceId: string;
    patientId: string;
    amount: number;
    method: string;
    notes?: string;
  }) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: data.invoiceId, clinicId },
    });
    if (!invoice) throw new Error('Invoice not found');

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          clinicId,
          invoiceId: data.invoiceId,
          patientId: data.patientId,
          amount: data.amount,
          method: data.method,
          notes: data.notes,
          status: 'COMPLETED',
        },
      }),
      prisma.invoice.update({
        where: { id: data.invoiceId },
        data: { status: 'PAID', paidAt: new Date() },
      }),
    ]);

    return payment;
  }
}

export default new PaymentService();
