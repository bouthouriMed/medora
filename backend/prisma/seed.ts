import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean existing data
  await prisma.invoice.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.clinic.deleteMany({});

  console.log('Cleaned existing data');

  // Create Clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Medora Health Clinic',
      address: '123 Healthcare Ave, Medical City, MC 12345',
      phone: '+1 (555) 123-4567',
      email: 'contact@medorahealth.com',
    },
  });
  console.log('Created clinic:', clinic.name);

  // Create Users (Doctor and Staff)
  const hashedPassword = await bcrypt.hash('password123', 10);

  const doctor = await prisma.user.create({
    data: {
      email: 'dr.smith@medora.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'DOCTOR',
      clinicId: clinic.id,
    },
  });
  console.log('Created doctor:', doctor.email);

  const staff = await prisma.user.create({
    data: {
      email: 'staff@medora.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'STAFF',
      clinicId: clinic.id,
    },
  });
  console.log('Created staff:', staff.email);

  // Create Patients
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.j@email.com',
        phone: '+1 (555) 234-5678',
        dateOfBirth: new Date('1985-03-15'),
        address: '456 Oak Street, Springfield, SP 12345',
        notes: 'Allergic to penicillin',
        clinicId: clinic.id,
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Bob',
        lastName: 'Williams',
        email: 'bob.w@email.com',
        phone: '+1 (555) 345-6789',
        dateOfBirth: new Date('1972-07-22'),
        address: '789 Pine Avenue, Riverside, RV 23456',
        notes: 'Diabetic - monitoring blood sugar',
        clinicId: clinic.id,
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol.d@email.com',
        phone: '+1 (555) 456-7890',
        dateOfBirth: new Date('1990-11-08'),
        address: '321 Elm Street, Lakewood, LW 34567',
        notes: '',
        clinicId: clinic.id,
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.b@email.com',
        phone: '+1 (555) 567-8901',
        dateOfBirth: new Date('1968-01-30'),
        address: '654 Maple Drive, Hillside, HS 45678',
        notes: 'High blood pressure - medication follow-up',
        clinicId: clinic.id,
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Eva',
        lastName: 'Martinez',
        email: 'eva.m@email.com',
        phone: '+1 (555) 678-9012',
        dateOfBirth: new Date('1995-06-12'),
        address: '987 Cedar Lane, Valleyview, VV 56789',
        notes: 'Regular checkup patient',
        clinicId: clinic.id,
      },
    }),
  ]);
  console.log('Created', patients.length, 'patients');

  // Create Appointments
  const today = new Date();

  const appointments = await Promise.all([
    // Today's appointments
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        dateTime: new Date(today.setHours(9, 0, 0, 0)),
        status: 'COMPLETED',
        notes: 'Regular checkup - all clear',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        dateTime: new Date(today.setHours(10, 30, 0, 0)),
        status: 'SCHEDULED',
        notes: 'Follow-up for diabetes management',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        dateTime: new Date(today.setHours(14, 0, 0, 0)),
        status: 'SCHEDULED',
        notes: 'Initial consultation',
      },
    }),
    // Past appointments
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'COMPLETED',
        notes: 'Blood pressure check - stable',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[4].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        dateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'NO_SHOW',
        notes: 'Patient did not arrive',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        dateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'CANCELLED',
        notes: 'Rescheduled by patient',
      },
    }),
    // Future appointments
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'SCHEDULED',
        notes: 'Lab results review',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'SCHEDULED',
        notes: 'Treatment plan discussion',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'SCHEDULED',
        notes: 'Quarterly checkup',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[4].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        dateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: 'SCHEDULED',
        notes: 'Annual physical',
      },
    }),
  ]);
  console.log('Created', appointments.length, 'appointments');

  // Create Invoices
  const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED');
  
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        appointmentId: completedAppointments[0].id,
        patientId: patients[0].id,
        clinicId: clinic.id,
        amount: 150.00,
        status: 'PAID',
        paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.invoice.create({
      data: {
        appointmentId: completedAppointments[1].id,
        patientId: patients[3].id,
        clinicId: clinic.id,
        amount: 200.00,
        status: 'PAID',
        paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.invoice.create({
      data: {
        appointmentId: completedAppointments[0].id,
        patientId: patients[0].id,
        clinicId: clinic.id,
        amount: 75.00,
        status: 'PAID',
        paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.invoice.create({
      data: {
        appointmentId: completedAppointments[1].id,
        patientId: patients[3].id,
        clinicId: clinic.id,
        amount: 125.00,
        status: 'PAID',
        paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.invoice.create({
      data: {
        appointmentId: completedAppointments[0].id,
        patientId: patients[0].id,
        clinicId: clinic.id,
        amount: 300.00,
        status: 'PAID',
        paidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    }),
    // Unpaid invoices
    prisma.invoice.create({
      data: {
        appointmentId: appointments[0].id,
        patientId: patients[0].id,
        clinicId: clinic.id,
        amount: 175.00,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.invoice.create({
      data: {
        appointmentId: appointments[1].id,
        patientId: patients[1].id,
        clinicId: clinic.id,
        amount: 250.00,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.invoice.create({
      data: {
        appointmentId: appointments[2].id,
        patientId: patients[2].id,
        clinicId: clinic.id,
        amount: 350.00,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log('Created', invoices.length, 'invoices');

  // Summary
  const totalRevenue = await prisma.invoice.aggregate({
    where: { status: 'PAID', clinicId: clinic.id },
    _sum: { amount: true },
  });

  const unpaidCount = await prisma.invoice.count({
    where: { status: 'UNPAID', clinicId: clinic.id },
  });

  console.log('\n=== Seed Complete ===');
  console.log('Clinic:', clinic.name);
  console.log('Users:', 2, '(1 Doctor, 1 Staff)');
  console.log('Patients:', patients.length);
  console.log('Appointments:', appointments.length);
  console.log('Invoices:', invoices.length, `(${invoices.length - unpaidCount} paid, ${unpaidCount} unpaid)`);
  console.log('Total Revenue: $' + (totalRevenue._sum.amount?.toFixed(2) || '0.00'));
  console.log('\nLogin credentials:');
  console.log('  Doctor: dr.smith@medora.com / password123');
  console.log('  Staff: staff@medora.com / password123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
