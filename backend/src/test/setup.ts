import { PrismaClient } from '@prisma/client';

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
}));

export const prisma = new PrismaClient();

export async function cleanupDatabase() {
  await prisma.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;
  await prisma.invoice.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.clinic.deleteMany({});
}

export async function createTestClinic() {
  const uniqueSuffix = Math.random().toString(36).substring(2, 8);
  return prisma.clinic.create({
    data: {
      name: 'Test Clinic',
      address: '123 Test St',
      phone: '555-1234',
      email: `clinic${uniqueSuffix}@test.com`,
    },
  });
}

export async function createTestUser(clinicId: string, role: 'DOCTOR' | 'STAFF' = 'DOCTOR') {
  const uniqueSuffix = Math.random().toString(36).substring(2, 8);
  return prisma.user.create({
    data: {
      email: `test${uniqueSuffix}@example.com`,
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role,
      clinicId,
    },
  });
}

export async function createTestPatient(clinicId: string) {
  const uniqueSuffix = Math.random().toString(36).substring(2, 8);
  return prisma.patient.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: `john${uniqueSuffix}@example.com`,
      phone: '555-9999',
      clinicId,
    },
  });
}

export async function createTestAppointment(clinicId: string, patientId: string, doctorId: string) {
  return prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      clinicId,
      dateTime: new Date(),
      status: 'SCHEDULED',
    },
  });
}

export async function createTestInvoice(clinicId: string, patientId: string, appointmentId: string) {
  return prisma.invoice.create({
    data: {
      patientId,
      clinicId,
      appointmentId,
      amount: 100.00,
      status: 'UNPAID',
    },
  });
}
