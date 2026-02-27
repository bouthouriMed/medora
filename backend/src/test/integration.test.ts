import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let authToken: string;
let clinicId: string;
let doctorId: string;
let patientId: string;
let appointmentId: string;
let invoiceId: string;

describe('API Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;
    await prisma.appointment.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.patient.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.clinic.deleteMany({});

    const clinic = await prisma.clinic.create({
      data: { name: 'Test Clinic', address: '123 Test St', phone: '555-1234' },
    });
    clinicId = clinic.id;

    const doctor = await prisma.user.create({
      data: {
        email: 'doctor@test.com',
        password: '$2a$10$testhash',
        firstName: 'Test',
        lastName: 'Doctor',
        role: 'DOCTOR',
        clinicId,
      },
    });
    doctorId = doctor.id;

    const patient = await prisma.patient.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phone: '555-9999',
        clinicId,
      },
    });
    patientId = patient.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `newuser${Date.now()}@test.com`,
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          clinicName: 'New Clinic',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
    });

    it('should fail with duplicate email', async () => {
      const duplicateEmail = `duplicate${Date.now()}@test.com`;
      
      await request(app)
        .post('/api/auth/register')
        .send({
          email: duplicateEmail,
          password: 'password123',
          firstName: 'First',
          lastName: 'User',
          clinicName: 'Test Clinic',
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: duplicateEmail,
          password: 'password123',
          firstName: 'Second',
          lastName: 'User',
          clinicName: 'Test Clinic',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = await prisma.user.update({
        where: { email: 'doctor@test.com' },
        data: { password: hashedPassword },
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'doctor@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      authToken = response.body.token;
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'doctor@test.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Protected Routes', () => {
    const authHeader = () => ({ Authorization: `Bearer ${authToken}` });

    describe('GET /api/dashboard', () => {
      it('should return dashboard data', async () => {
        const response = await request(app)
          .get('/api/dashboard')
          .set(authHeader());

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('todayAppointments');
        expect(response.body).toHaveProperty('upcomingAppointments');
        expect(response.body).toHaveProperty('monthlyRevenue');
        expect(response.body).toHaveProperty('unpaidInvoices');
      });

      it('should reject unauthenticated request', async () => {
        const response = await request(app)
          .get('/api/dashboard');

        expect(response.status).toBe(401);
      });
    });

    describe('Patients CRUD', () => {
      describe('POST /api/patients', () => {
        it('should create a new patient', async () => {
          const response = await request(app)
            .post('/api/patients')
            .set(authHeader())
            .send({
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@test.com',
              phone: '555-0001',
            });

          expect(response.status).toBe(201);
          expect(response.body.firstName).toBe('Jane');
        });
      });

      describe('GET /api/patients', () => {
        it('should return all patients', async () => {
          const response = await request(app)
            .get('/api/patients')
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(Array.isArray(response.body)).toBe(true);
        });

        it('should filter patients by search', async () => {
          const response = await request(app)
            .get('/api/patients?search=Jane')
            .set(authHeader());

          expect(response.status).toBe(200);
        });
      });
    });

    describe('Appointments CRUD', () => {
      describe('POST /api/appointments', () => {
        it('should create a new appointment', async () => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);

          const response = await request(app)
            .post('/api/appointments')
            .set(authHeader())
            .send({
              patientId,
              doctorId,
              dateTime: futureDate.toISOString(),
              notes: 'Test appointment',
            });

          expect(response.status).toBe(201);
          appointmentId = response.body.id;
          expect(response.body.status).toBe('SCHEDULED');
        });
      });

      describe('GET /api/appointments', () => {
        it('should return all appointments', async () => {
          const response = await request(app)
            .get('/api/appointments')
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('PUT /api/appointments/:id', () => {
        it('should update appointment status', async () => {
          const response = await request(app)
            .put(`/api/appointments/${appointmentId}`)
            .set(authHeader())
            .send({
              status: 'COMPLETED',
            });

          expect(response.status).toBe(200);
        });
      });
    });

    describe('Invoices CRUD', () => {
      describe('POST /api/invoices', () => {
        it('should create a new invoice', async () => {
          const response = await request(app)
            .post('/api/invoices')
            .set(authHeader())
            .send({
              patientId,
              appointmentId,
              amount: 150.00,
            });

          expect(response.status).toBe(201);
          invoiceId = response.body.id;
          expect(response.body.status).toBe('UNPAID');
        });
      });

      describe('GET /api/invoices', () => {
        it('should return all invoices', async () => {
          const response = await request(app)
            .get('/api/invoices')
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(Array.isArray(response.body)).toBe(true);
        });

        it('should filter by status', async () => {
          const response = await request(app)
            .get('/api/invoices?status=UNPAID')
            .set(authHeader());

          expect(response.status).toBe(200);
        });
      });

      describe('PUT /api/invoices/:id/pay', () => {
        it('should mark invoice as paid', async () => {
          const response = await request(app)
            .put(`/api/invoices/${invoiceId}/pay`)
            .set(authHeader());

          expect(response.status).toBe(204);
        });
      });

      describe('PUT /api/invoices/:id/unpay', () => {
        it('should mark invoice as unpaid', async () => {
          const response = await request(app)
            .put(`/api/invoices/${invoiceId}/unpay`)
            .set(authHeader());

          expect(response.status).toBe(204);
        });
      });
    });

    describe('Users CRUD', () => {
      describe('POST /api/auth/users', () => {
        it('should create a new user', async () => {
          const response = await request(app)
            .post('/api/auth/users')
            .set(authHeader())
            .send({
              email: `staff${Date.now()}@test.com`,
              password: 'password123',
              firstName: 'Staff',
              lastName: 'Member',
              role: 'STAFF',
            });

          expect(response.status).toBe(201);
        });
      });

      describe('GET /api/auth/users', () => {
        it('should return all users', async () => {
          const response = await request(app)
            .get('/api/auth/users')
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(Array.isArray(response.body)).toBe(true);
        });
      });
    });
  });
});
