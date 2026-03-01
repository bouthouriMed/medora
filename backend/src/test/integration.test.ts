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

    describe('Tags CRUD', () => {
      let tagId: string;

      describe('POST /api/tags', () => {
        it('should create a new tag', async () => {
          const response = await request(app)
            .post('/api/tags')
            .set(authHeader())
            .send({
              name: 'VIP Patient',
              color: '#ff0000',
            });

          expect(response.status).toBe(201);
          expect(response.body.name).toBe('VIP Patient');
          tagId = response.body.id;
        });
      });

      describe('GET /api/tags', () => {
        it('should return all tags', async () => {
          const response = await request(app)
            .get('/api/tags')
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('DELETE /api/tags/:id', () => {
        it('should delete a tag', async () => {
          const response = await request(app)
            .delete(`/api/tags/${tagId}`)
            .set(authHeader());

          expect(response.status).toBe(200);
        });
      });

      describe('POST /api/patients/tags', () => {
        it('should add tag to patient', async () => {
          const tag = await request(app)
            .post('/api/tags')
            .set(authHeader())
            .send({ name: 'Test Tag', color: '#00ff00' });

          const response = await request(app)
            .post('/api/patients/tags')
            .set(authHeader())
            .send({
              patientId,
              tagId: tag.body.id,
            });

          expect(response.status).toBe(200);
        });
      });
    });

    describe('Custom Fields CRUD', () => {
      let customFieldId: string;

      describe('POST /api/custom-fields', () => {
        it('should create a custom field', async () => {
          const response = await request(app)
            .post('/api/custom-fields')
            .set(authHeader())
            .send({
              name: 'Insurance ID',
              fieldType: 'TEXT',
              required: false,
            });

          expect(response.status).toBe(201);
          expect(response.body.name).toBe('Insurance ID');
          customFieldId = response.body.id;
        });
      });

      describe('GET /api/custom-fields', () => {
        it('should return all custom fields', async () => {
          const response = await request(app)
            .get('/api/custom-fields')
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('GET /api/patients/:patientId/custom-fields', () => {
        it('should return patient custom fields', async () => {
          const response = await request(app)
            .get(`/api/patients/${patientId}/custom-fields`)
            .set(authHeader());

          expect(response.status).toBe(200);
        });
      });

      describe('DELETE /api/custom-fields/:id', () => {
        it('should delete a custom field', async () => {
          const response = await request(app)
            .delete(`/api/custom-fields/${customFieldId}`)
            .set(authHeader());

          expect(response.status).toBe(200);
        });
      });
    });

    describe('Note Templates CRUD', () => {
      let noteTemplateId: string;

      describe('POST /api/note-templates', () => {
        it('should create a note template', async () => {
          const response = await request(app)
            .post('/api/note-templates')
            .set(authHeader())
            .send({
              name: 'Follow-up Visit',
              content: 'Patient should return in 2 weeks',
              type: 'APPOINTMENT',
            });

          expect(response.status).toBe(201);
          expect(response.body.name).toBe('Follow-up Visit');
          noteTemplateId = response.body.id;
        });
      });

      describe('GET /api/note-templates', () => {
        it('should return all note templates', async () => {
          const response = await request(app)
            .get('/api/note-templates')
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(Array.isArray(response.body)).toBe(true);
        });

        it('should filter by type', async () => {
          const response = await request(app)
            .get('/api/note-templates?type=APPOINTMENT')
            .set(authHeader());

          expect(response.status).toBe(200);
        });
      });

      describe('DELETE /api/note-templates/:id', () => {
        it('should delete a note template', async () => {
          const response = await request(app)
            .delete(`/api/note-templates/${noteTemplateId}`)
            .set(authHeader());

          expect(response.status).toBe(200);
        });
      });
    });

    describe('Recurring Appointments', () => {
      let recurringId: string;

      describe('POST /api/recurring-appointments', () => {
        it('should create a recurring appointment', async () => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);

          const response = await request(app)
            .post('/api/recurring-appointments')
            .set(authHeader())
            .send({
              patientId,
              doctorId,
              frequency: 'WEEKLY',
              interval: 1,
              startDate: futureDate.toISOString(),
            });

          expect(response.status).toBe(201);
          expect(response.body.frequency).toBe('WEEKLY');
          recurringId = response.body.id;
        });
      });

      describe('GET /api/recurring-appointments', () => {
        it('should return all recurring appointments', async () => {
          const response = await request(app)
            .get('/api/recurring-appointments')
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('DELETE /api/recurring-appointments/:id', () => {
        it('should delete a recurring appointment', async () => {
          const response = await request(app)
            .delete(`/api/recurring-appointments/${recurringId}`)
            .set(authHeader());

          expect(response.status).toBe(200);
        });
      });
    });

    describe('Settings', () => {
      describe('GET /api/settings', () => {
        it('should return clinic settings', async () => {
          const response = await request(app)
            .get('/api/settings')
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('emailNotifications');
        });
      });

      describe('PUT /api/settings', () => {
        it('should update clinic settings', async () => {
          const response = await request(app)
            .put('/api/settings')
            .set(authHeader())
            .send({
              emailNotifications: true,
              smtpHost: 'smtp.gmail.com',
              smtpPort: '587',
            });

          expect(response.status).toBe(200);
        });
      });
    });

    describe('Export CSV', () => {
      describe('GET /api/export/patients', () => {
        it('should export patients as CSV', async () => {
          const response = await request(app)
            .get('/api/export/patients')
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(response.headers['content-type']).toContain('text/csv');
        });
      });

      describe('GET /api/export/appointments', () => {
        it('should export appointments as CSV', async () => {
          const response = await request(app)
            .get('/api/export/appointments')
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(response.headers['content-type']).toContain('text/csv');
        });
      });

      describe('GET /api/export/invoices', () => {
        it('should export invoices as CSV', async () => {
          const response = await request(app)
            .get('/api/export/invoices')
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(response.headers['content-type']).toContain('text/csv');
        });
      });
    });

    describe('Presets', () => {
      let presetId: string;

      describe('POST /api/presets', () => {
        it('should create a preset', async () => {
          const response = await request(app)
            .post('/api/presets')
            .set(authHeader())
            .send({
              name: 'Annual Checkup',
              type: 'PROCEDURE',
              price: 100,
            });

          expect(response.status).toBe(201);
          presetId = response.body.id;
        });
      });

      describe('GET /api/presets', () => {
        it('should return all presets', async () => {
          const response = await request(app)
            .get('/api/presets')
            .set(authHeader());

          expect(response.status).toBe(200);
        });

        it('should filter by type', async () => {
          const response = await request(app)
            .get('/api/presets?type=PROCEDURE')
            .set(authHeader());

          expect(response.status).toBe(200);
        });
      });

      describe('DELETE /api/presets/:id', () => {
        it('should delete a preset', async () => {
          const response = await request(app)
            .delete(`/api/presets/${presetId}`)
            .set(authHeader());

          expect(response.status).toBe(200);
        });
      });
    });

    describe('Patient Portal', () => {
      let portalToken: string;

      describe('POST /api/patients/:id/regenerate-token', () => {
        it('should regenerate patient portal token', async () => {
          const response = await request(app)
            .post(`/api/patients/${patientId}/regenerate-token`)
            .set(authHeader());

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('portalToken');
          portalToken = response.body.portalToken;
        });
      });

      describe('GET /api/public/patient/:token', () => {
        it('should return patient data for portal', async () => {
          const response = await request(app)
            .get(`/api/public/patient/${portalToken}`);

          expect(response.status).toBe(200);
          expect(response.body.patient).toHaveProperty('firstName');
          expect(response.body.clinic).toHaveProperty('name');
        });

        it('should fail with invalid token', async () => {
          const response = await request(app)
            .get('/api/public/patient/invalid-token');

          expect(response.status).toBe(404);
        });
      });
    });
  });
});
