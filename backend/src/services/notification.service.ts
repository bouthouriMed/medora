import prisma from '../utils/prisma';

export type NotificationType = 
  | 'APPOINTMENT_REQUEST'
  | 'APPOINTMENT_APPROVED'
  | 'APPOINTMENT_REJECTED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REMINDER'
  | 'MESSAGE'
  | 'LAB_RESULT'
  | 'PRESCRIPTION_REQUEST'
  | 'PRESCRIPTION_READY'
  | 'SYSTEM_ALERT'
  | 'WAITLIST'
  | 'INVOICE'
  | 'RATING';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  userId: string;
  unreadOnly?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}

class NotificationService {
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        priority: input.priority || 'NORMAL',
        actionUrl: input.actionUrl,
        actionLabel: input.actionLabel,
        metadata: input.metadata || {},
      },
    });
  }

  async createMany(inputs: CreateNotificationInput[]) {
    const data = inputs.map(input => ({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      priority: input.priority || 'NORMAL',
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
      metadata: input.metadata || {},
    }));

    return prisma.notification.createMany({ data });
  }

  async findByUser(filters: NotificationFilters) {
    const { userId, unreadOnly, type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) where.isRead = false;
    if (type) where.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async delete(id: string, userId: string) {
    return prisma.notification.delete({
      where: { id, userId },
    });
  }

  async deleteOld(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutoffDate },
      },
    });
  }

  // Convenience methods for common notification scenarios
  async notifyAppointmentRequest(doctorId: string, patientName: string, dateTime: Date, appointmentId: string) {
    return this.create({
      userId: doctorId,
      type: 'APPOINTMENT_REQUEST',
      title: 'New Appointment Request',
      message: `${patientName} has requested an appointment for ${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString()}`,
      priority: 'NORMAL',
      actionUrl: `/appointments?highlight=${appointmentId}`,
      actionLabel: 'View Appointment',
      metadata: { appointmentId, patientName, dateTime: dateTime.toISOString() },
    });
  }

  async notifyAppointmentApproved(patientId: string, doctorName: string, dateTime: Date, appointmentId: string) {
    return this.create({
      userId: patientId,
      type: 'APPOINTMENT_APPROVED',
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${doctorName} on ${dateTime.toLocaleDateString()} has been confirmed.`,
      priority: 'NORMAL',
      actionUrl: `/portal?tab=appointments`,
      metadata: { appointmentId, doctorName, dateTime: dateTime.toISOString() },
    });
  }

  async notifyAppointmentRejected(patientId: string, doctorName: string, dateTime: Date, reason?: string) {
    return this.create({
      userId: patientId,
      type: 'APPOINTMENT_REJECTED',
      title: 'Appointment Cancelled',
      message: reason 
        ? `Your appointment with Dr. ${doctorName} on ${dateTime.toLocaleDateString()} has been cancelled. Reason: ${reason}`
        : `Your appointment with Dr. ${doctorName} on ${dateTime.toLocaleDateString()} has been cancelled.`,
      priority: 'NORMAL',
      actionUrl: `/portal?tab=appointments`,
      metadata: { doctorName, dateTime: dateTime.toISOString(), reason },
    });
  }

  async notifyNewMessage(receiverId: string, senderName: string, subject: string, conversationId: string) {
    return this.create({
      userId: receiverId,
      type: 'MESSAGE',
      title: `New message from ${senderName}`,
      message: subject,
      priority: 'NORMAL',
      actionUrl: `/messages?conversation=${conversationId}`,
      actionLabel: 'View Message',
      metadata: { senderName, conversationId },
    });
  }

  async notifyLabResult(patientId: string, labName: string, resultId: string) {
    return this.create({
      userId: patientId,
      type: 'LAB_RESULT',
      title: 'Lab Results Available',
      message: `Your lab results from ${labName} are now available.`,
      priority: 'NORMAL',
      actionUrl: `/portal?tab=lab-results`,
      actionLabel: 'View Results',
      metadata: { labName, resultId },
    });
  }

  async notifyPrescriptionRequest(doctorId: string, patientName: string, medication: string, requestId: string) {
    return this.create({
      userId: doctorId,
      type: 'PRESCRIPTION_REQUEST',
      title: 'New Prescription Request',
      message: `${patientName} has requested a prescription for ${medication}.`,
      priority: 'NORMAL',
      actionUrl: `/prescription-requests?highlight=${requestId}`,
      actionLabel: 'Review Request',
      metadata: { patientName, medication, requestId },
    });
  }

  async notifyPrescriptionReady(patientId: string, medication: string, pharmacyName?: string) {
    return this.create({
      userId: patientId,
      type: 'PRESCRIPTION_READY',
      title: 'Prescription Ready',
      message: pharmacyName 
        ? `Your prescription for ${medication} is ready for pickup at ${pharmacyName}.`
        : `Your prescription for ${medication} is ready for pickup.`,
      priority: 'NORMAL',
      actionUrl: `/portal?tab=prescriptions`,
      metadata: { medication, pharmacyName },
    });
  }

  async notifyWaitlist(patientId: string, doctorName: string, dateTime: Date) {
    return this.create({
      userId: patientId,
      type: 'WAITLIST',
      title: 'Appointment Available',
      message: `A slot has opened up with Dr. ${doctorName} on ${dateTime.toLocaleDateString()}. Book now before it's gone!`,
      priority: 'HIGH',
      actionUrl: `/appointments?action=new&doctor=${doctorName}&date=${dateTime.toISOString().split('T')[0]}`,
      actionLabel: 'Book Now',
      metadata: { doctorName, dateTime: dateTime.toISOString() },
    });
  }

  async notifyInvoice(patientId: string, invoiceNumber: string, amount: number, dueDate: Date) {
    return this.create({
      userId: patientId,
      type: 'INVOICE',
      title: `New Invoice #${invoiceNumber}`,
      message: `You have a new invoice for $${amount.toFixed(2)} due on ${dueDate.toLocaleDateString()}.`,
      priority: amount > 500 ? 'HIGH' : 'NORMAL',
      actionUrl: `/portal?tab=invoices`,
      actionLabel: 'View Invoice',
      metadata: { invoiceNumber, amount, dueDate: dueDate.toISOString() },
    });
  }

  async notifyRating(doctorId: string, patientName: string, rating: number, comment?: string) {
    return this.create({
      userId: doctorId,
      type: 'RATING',
      title: `New ${rating}-star rating`,
      message: comment 
        ? `${patientName} rated you ${rating} stars: "${comment}"`
        : `${patientName} rated you ${rating} stars.`,
      priority: 'LOW',
      actionUrl: `/doctor-ratings`,
      metadata: { patientName, rating, comment },
    });
  }

  async notifyAdmins(clinicId: string, title: string, message: string, priority: NotificationPriority = 'NORMAL') {
    const admins = await prisma.user.findMany({
      where: { clinicId, role: 'ADMIN' },
      select: { id: true },
    });

    return this.createMany(admins.map(admin => ({
      userId: admin.id,
      type: 'SYSTEM_ALERT' as NotificationType,
      title,
      message,
      priority,
    })));
  }
}

export default new NotificationService();
