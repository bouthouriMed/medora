/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean existing data (in correct order to handle foreign keys)
  await prisma.doctorRating.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.waitlistEntry.deleteMany({});
  await prisma.insuranceClaim.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.patientCustomFieldValue.deleteMany({});
  await prisma.customField.deleteMany({});
  await prisma.noteTemplate.deleteMany({});
  await prisma.preset.deleteMany({});
  await prisma.recurringAppointment.deleteMany({});
  await prisma.patientTag.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.appointmentRequest.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.clinicSettings.deleteMany({});
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

  // Create Users (Doctor, Staff, Admin)
  const hashedPassword = await bcrypt.hash('password123', 10);

  const doctorPermissions = [
    'view_patients', 'create_patients', 'edit_patients',
    'view_medical_records', 'create_medical_records',
    'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments',
    'view_invoices', 'create_invoices', 'edit_invoices',
    'view_tasks', 'create_tasks', 'edit_tasks',
    'view_lab_results', 'create_lab_results',
    'view_presets', 'create_presets',
    'view_tags', 'create_tags',
    'view_custom_fields', 'create_custom_fields',
    'view_note_templates', 'create_note_templates',
    'view_users', 'create_users', 'edit_users',
    'view_settings', 'edit_settings',
  ];

  const nursePermissions = [
    'view_patients', 'create_patients', 'edit_patients',
    'view_medical_records', 'create_medical_records',
    'view_appointments', 'create_appointments',
    'view_tasks', 'create_tasks', 'edit_tasks',
    'view_lab_results', 'create_lab_results',
    'view_presets',
    'view_tags', 'create_tags',
    'view_custom_fields',
    'view_note_templates',
  ];

  const staffPermissions = [
    'view_patients', 'create_patients',
    'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments',
    'view_invoices', 'create_invoices', 'edit_invoices',
    'view_tasks', 'create_tasks',
    'view_lab_results',
    'view_presets',
    'view_tags', 'create_tags',
    'view_custom_fields',
    'view_note_templates',
  ];

  const adminPermissions = [
    'view_patients', 'create_patients', 'edit_patients', 'delete_patients',
    'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments',
    'view_invoices', 'create_invoices', 'edit_invoices',
    'view_tasks', 'create_tasks', 'edit_tasks',
    'view_lab_results', 'create_lab_results',
    'view_presets', 'create_presets',
    'view_tags', 'create_tags',
    'view_custom_fields', 'create_custom_fields',
    'view_note_templates', 'create_note_templates',
    'view_users', 'create_users', 'edit_users', 'delete_users',
    'view_settings', 'edit_settings',
  ];

  const doctor = await prisma.user.create({
    data: {
      email: 'dr.smith@medora.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'DOCTOR',
      clinicId: clinic.id,
      permissions: doctorPermissions,
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
      permissions: staffPermissions,
    },
  });
  console.log('Created staff:', staff.email);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@medora.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      clinicId: clinic.id,
      permissions: adminPermissions,
    },
  });
  console.log('Created admin:', admin.email);

  const nurse = await prisma.user.create({
    data: {
      email: 'nurse@medora.com',
      password: hashedPassword,
      firstName: 'Emily',
      lastName: 'Johnson',
      role: 'NURSE',
      clinicId: clinic.id,
      permissions: nursePermissions,
    },
  });
  console.log('Created nurse:', nurse.email);

  // Create Tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: { name: 'VIP', color: '#f59e0b', clinicId: clinic.id },
    }),
    prisma.tag.create({
      data: { name: 'New Patient', color: '#10b981', clinicId: clinic.id },
    }),
    prisma.tag.create({
      data: { name: 'Chronic Condition', color: '#ef4444', clinicId: clinic.id },
    }),
    prisma.tag.create({
      data: { name: 'Follow-up Required', color: '#8b5cf6', clinicId: clinic.id },
    }),
    prisma.tag.create({
      data: { name: 'Insurance', color: '#3b82f6', clinicId: clinic.id },
    }),
  ]);
  console.log('Created', tags.length, 'tags');

  // Create Custom Fields
  const customFields = await Promise.all([
    prisma.customField.create({
      data: { name: 'Insurance ID', fieldType: 'TEXT', clinicId: clinic.id },
    }),
    prisma.customField.create({
      data: { name: 'Emergency Contact', fieldType: 'TEXT', clinicId: clinic.id },
    }),
    prisma.customField.create({
      data: { name: 'Blood Type', fieldType: 'SELECT', options: 'A+,A-,B+,B-,AB+,AB-,O+,O-', clinicId: clinic.id },
    }),
    prisma.customField.create({
      data: { name: 'Allergies', fieldType: 'TEXT', clinicId: clinic.id },
    }),
  ]);
  console.log('Created', customFields.length, 'custom fields');

  // Create Presets
  const presets = await Promise.all([
    prisma.preset.create({
      data: { name: 'Annual Checkup', type: 'PROCEDURE', price: 150, description: 'Yearly health examination', clinicId: clinic.id },
    }),
    prisma.preset.create({
      data: { name: 'Follow-up Visit', type: 'PROCEDURE', price: 75, description: 'Follow-up consultation', clinicId: clinic.id },
    }),
    prisma.preset.create({
      data: { name: 'Flu Vaccination', type: 'PROCEDURE', price: 50, description: 'Influenza vaccine', clinicId: clinic.id },
    }),
    prisma.preset.create({
      data: { name: 'Blood Work', type: 'PROCEDURE', price: 100, description: 'Basic blood panel', clinicId: clinic.id },
    }),
    prisma.preset.create({
      data: { name: 'Consultation', type: 'PROCEDURE', price: 120, description: 'General consultation', clinicId: clinic.id },
    }),
    prisma.preset.create({
      data: { name: 'Hypertension', type: 'DIAGNOSIS', description: 'High blood pressure', clinicId: clinic.id },
    }),
    prisma.preset.create({
      data: { name: 'Type 2 Diabetes', type: 'DIAGNOSIS', description: 'Diabetes mellitus type 2', clinicId: clinic.id },
    }),
    prisma.preset.create({
      data: { name: 'Common Cold', type: 'DIAGNOSIS', description: 'Upper respiratory infection', clinicId: clinic.id },
    }),
    prisma.preset.create({
      data: { name: 'Amoxicillin 500mg', type: 'PRESCRIPTION', description: 'Take twice daily for 7 days', clinicId: clinic.id },
    }),
    prisma.preset.create({
      data: { name: 'Paracetamol 500mg', type: 'PRESCRIPTION', description: 'Take as needed for pain/fever', clinicId: clinic.id },
    }),
  ]);
  console.log('Created', presets.length, 'presets');

  // Create Note Templates
  const noteTemplates = await Promise.all([
    prisma.noteTemplate.create({
      data: { name: 'Follow-up in 2 weeks', content: 'Patient advised to return in 2 weeks for follow-up. Monitor symptoms.', clinicId: clinic.id },
    }),
    prisma.noteTemplate.create({
      data: { name: 'Lab Tests Required', content: 'Patient requires blood work. Fasting for 12 hours before sample collection.', clinicId: clinic.id },
    }),
    prisma.noteTemplate.create({
      data: { name: 'Medication Review', content: 'Reviewed current medications. No adverse reactions noted. Continue current dosage.', clinicId: clinic.id },
    }),
    prisma.noteTemplate.create({
      data: { name: 'Referral Letter', content: 'Referral letter provided to patient for specialist consultation.', clinicId: clinic.id },
    }),
    prisma.noteTemplate.create({
      data: { name: 'Payment Plan', content: 'Patient offered payment plan - 3 monthly installments.', clinicId: clinic.id },
    }),
  ]);
  console.log('Created', noteTemplates.length, 'note templates');

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
        patientTags: {
          create: [{ tagId: tags[1].id }, { tagId: tags[4].id }],
        },
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
        patientTags: {
          create: [{ tagId: tags[2].id }],
        },
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
        patientTags: {
          create: [{ tagId: tags[0].id }, { tagId: tags[3].id }],
        },
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

  // Create Custom Field Values for patients
  await Promise.all([
    prisma.patientCustomFieldValue.create({
      data: { patientId: patients[0].id, customFieldId: customFields[0].id, value: 'INS-12345' },
    }),
    prisma.patientCustomFieldValue.create({
      data: { patientId: patients[0].id, customFieldId: customFields[1].id, value: 'John Johnson - 555-1234' },
    }),
    prisma.patientCustomFieldValue.create({
      data: { patientId: patients[0].id, customFieldId: customFields[2].id, value: 'O+' },
    }),
    prisma.patientCustomFieldValue.create({
      data: { patientId: patients[1].id, customFieldId: customFields[3].id, value: 'Penicillin' },
    }),
    prisma.patientCustomFieldValue.create({
      data: { patientId: patients[3].id, customFieldId: customFields[2].id, value: 'A+' },
    }),
  ]);
  console.log('Created custom field values for patients');

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

  // Create Medical Records for patients
  const vitals = await Promise.all([
    prisma.vital.create({
      data: {
        patientId: patients[0].id,
        clinicId: clinic.id,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 72,
        temperature: 98.6,
        weight: 70,
        height: 175,
        bmi: 22.9,
        recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.vital.create({
      data: {
        patientId: patients[1].id,
        clinicId: clinic.id,
        bloodPressureSystolic: 140,
        bloodPressureDiastolic: 90,
        heartRate: 80,
        temperature: 98.4,
        weight: 85,
        height: 180,
        bmi: 26.2,
        notes: 'Elevated blood pressure - monitoring',
        recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.vital.create({
      data: {
        patientId: patients[3].id,
        clinicId: clinic.id,
        bloodPressureSystolic: 135,
        bloodPressureDiastolic: 88,
        heartRate: 76,
        temperature: 98.2,
        weight: 92,
        height: 178,
        bmi: 29.0,
        notes: 'BP slightly elevated',
        recordedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log('Created', vitals.length, 'vitals records');

  // Create Diagnoses
  const diagnoses = await Promise.all([
    prisma.diagnosis.create({
      data: {
        patientId: patients[1].id,
        clinicId: clinic.id,
        icdCode: 'E11.9',
        description: 'Type 2 diabetes mellitus without complications',
        status: 'ACTIVE',
        diagnosedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.diagnosis.create({
      data: {
        patientId: patients[3].id,
        clinicId: clinic.id,
        icdCode: 'I10',
        description: 'Essential (primary) hypertension',
        status: 'CHRONIC',
        diagnosedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.diagnosis.create({
      data: {
        patientId: patients[0].id,
        clinicId: clinic.id,
        icdCode: 'J06.9',
        description: 'Acute upper respiratory infection',
        status: 'RESOLVED',
        diagnosedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log('Created', diagnoses.length, 'diagnoses');

  // Create Prescriptions
  const prescriptions = await Promise.all([
    prisma.prescription.create({
      data: {
        patientId: patients[1].id,
        clinicId: clinic.id,
        prescribedById: doctor.id,
        medication: 'Metformin 500mg',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '90 days',
        instructions: 'Take with meals',
        refills: 3,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.prescription.create({
      data: {
        patientId: patients[3].id,
        clinicId: clinic.id,
        prescribedById: doctor.id,
        medication: 'Lisinopril 10mg',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '90 days',
        instructions: 'Take in the morning',
        refills: 3,
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.prescription.create({
      data: {
        patientId: patients[0].id,
        clinicId: clinic.id,
        prescribedById: doctor.id,
        medication: 'Paracetamol 500mg',
        dosage: '500mg',
        frequency: 'As needed',
        duration: '7 days',
        instructions: 'Take for fever or pain, max 4 times daily',
        refills: 0,
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'COMPLETED',
      },
    }),
  ]);
  console.log('Created', prescriptions.length, 'prescriptions');

  // Create Allergies
  const allergies = await Promise.all([
    prisma.allergy.create({
      data: {
        patientId: patients[0].id,
        clinicId: clinic.id,
        allergen: 'Penicillin',
        severity: 'SEVERE',
        reaction: 'Anaphylaxis, difficulty breathing',
      },
    }),
    prisma.allergy.create({
      data: {
        patientId: patients[1].id,
        clinicId: clinic.id,
        allergen: 'Sulfa drugs',
        severity: 'MODERATE',
        reaction: 'Skin rash, itching',
      },
    }),
    prisma.allergy.create({
      data: {
        patientId: patients[2].id,
        clinicId: clinic.id,
        allergen: 'Latex',
        severity: 'MILD',
        reaction: 'Skin irritation',
      },
    }),
  ]);
  console.log('Created', allergies.length, 'allergies');

  // Create Conditions
  const conditions = await Promise.all([
    prisma.condition.create({
      data: {
        patientId: patients[1].id,
        clinicId: clinic.id,
        name: 'Type 2 Diabetes',
        status: 'CHRONIC',
        notes: 'Well-controlled with medication',
        diagnosedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.condition.create({
      data: {
        patientId: patients[3].id,
        clinicId: clinic.id,
        name: 'Hypertension',
        status: 'CHRONIC',
        notes: 'On medication, BP monitored weekly',
        diagnosedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.condition.create({
      data: {
        patientId: patients[0].id,
        clinicId: clinic.id,
        name: 'Asthma',
        status: 'ACTIVE',
        notes: 'Mild, uses rescue inhaler as needed',
        diagnosedAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log('Created', conditions.length, 'conditions');

  // Create Tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Follow up with Alice Johnson',
        description: 'Review lab results and adjust medication if needed',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        assignedTo: doctor.id,
        clinicId: clinic.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Call Bob Williams insurance',
        description: 'Verify insurance coverage for new medication',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        assignedTo: staff.id,
        clinicId: clinic.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Schedule Carol Davis annual checkup',
        description: 'Patient due for yearly physical examination',
        status: 'PENDING',
        priority: 'LOW',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignedTo: staff.id,
        clinicId: clinic.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Review David Brown blood pressure log',
        description: 'Patient has been tracking BP at home',
        status: 'COMPLETED',
        priority: 'HIGH',
        assignedTo: doctor.id,
        clinicId: clinic.id,
      },
    }),
  ]);
  console.log('Created', tasks.length, 'tasks');

  // Create Lab Results
  const labResults = await Promise.all([
    prisma.labResult.create({
      data: {
        patientId: patients[0].id,
        clinicId: clinic.id,
        testName: 'Complete Blood Count (CBC)',
        category: 'Blood Test',
        status: 'COMPLETED',
        result: 'WBC: 7.5, RBC: 4.8, Hemoglobin: 14.2, Platelets: 250',
        normalRange: 'WBC: 4.5-11.0, RBC: 4.5-5.5, Hemoglobin: 12.0-16.0, Platelets: 150-400',
        orderedBy: doctor.id,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        notes: 'All values within normal range',
      },
    }),
    prisma.labResult.create({
      data: {
        patientId: patients[1].id,
        clinicId: clinic.id,
        testName: 'Hemoglobin A1C',
        category: 'Blood Test',
        status: 'COMPLETED',
        result: 'HbA1c: 7.2%, Estimated Average Glucose: 156 mg/dL',
        normalRange: 'HbA1c: <5.7%, Estimated Average Glucose: <100 mg/dL',
        orderedBy: doctor.id,
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        notes: 'Diabetes not well controlled - consider medication adjustment',
      },
    }),
    prisma.labResult.create({
      data: {
        patientId: patients[3].id,
        clinicId: clinic.id,
        testName: 'Lipid Panel',
        category: 'Blood Test',
        status: 'COMPLETED',
        result: 'Total Cholesterol: 210, LDL: 130, HDL: 45, Triglycerides: 175',
        normalRange: 'Total Cholesterol: <200, LDL: <100, HDL: >40, Triglycerides: <150',
        orderedBy: doctor.id,
        completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        notes: 'Elevated LDL - recommend dietary changes',
      },
    }),
    prisma.labResult.create({
      data: {
        patientId: patients[2].id,
        clinicId: clinic.id,
        testName: 'Urinalysis',
        category: 'Urine Test',
        status: 'PENDING',
        orderedBy: doctor.id,
      },
    }),
  ]);
  console.log('Created', labResults.length, 'lab results');

  // Create Recurring Appointments
  await prisma.recurringAppointment.create({
    data: {
      patientId: patients[1].id,
      doctorId: doctor.id,
      clinicId: clinic.id,
      frequency: 'MONTHLY',
      interval: 1,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('Created 1 recurring appointment');

  // Create Clinic Settings
  await prisma.clinicSettings.upsert({
    where: { clinicId: clinic.id },
    update: {},
    create: {
      clinicId: clinic.id,
      consultationFee: 120.00,
      fromEmail: 'noreply@medorahealth.com',
      smtpHost: 'smtp.example.com',
      smtpPort: '587',
      emailNotifications: true,
    },
  });
  console.log('Created clinic settings');

  // Create Messages (doctor-patient conversations)
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        senderId: doctor.id,
        senderType: 'USER',
        receiverId: patients[0].id,
        receiverType: 'PATIENT',
        body: 'Hi Alice, your lab results are ready. Everything looks good! Please schedule a follow-up in 2 weeks.',
        clinicId: clinic.id,
        isRead: true,
      },
    }),
    prisma.message.create({
      data: {
        senderId: patients[0].id,
        senderType: 'PATIENT',
        receiverId: doctor.id,
        receiverType: 'USER',
        body: 'Thank you Dr. Smith! I will book the appointment right away.',
        clinicId: clinic.id,
        isRead: true,
      },
    }),
    prisma.message.create({
      data: {
        senderId: doctor.id,
        senderType: 'USER',
        receiverId: patients[1].id,
        receiverType: 'PATIENT',
        body: 'Bob, your A1C levels are still elevated. Let\'s discuss adjusting your medication at the next visit.',
        clinicId: clinic.id,
        isRead: false,
      },
    }),
    prisma.message.create({
      data: {
        senderId: nurse.id,
        senderType: 'USER',
        receiverId: patients[2].id,
        receiverType: 'PATIENT',
        body: 'Hi Carol, just a reminder that your vaccination appointment is tomorrow at 10 AM.',
        clinicId: clinic.id,
        isRead: false,
      },
    }),
  ]);
  console.log('Created', messages.length, 'messages');

  // Create Insurance Claims
  const insuranceClaims = await Promise.all([
    prisma.insuranceClaim.create({
      data: {
        patientId: patients[0].id,
        clinicId: clinic.id,
        insuranceProvider: 'Blue Cross Blue Shield',
        policyNumber: 'BCBS-2024-001234',
        claimAmount: 350.00,
        status: 'APPROVED',
        approvedAmount: 280.00,
        submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        notes: 'Annual checkup and blood work covered',
      },
    }),
    prisma.insuranceClaim.create({
      data: {
        patientId: patients[1].id,
        clinicId: clinic.id,
        insuranceProvider: 'Aetna',
        policyNumber: 'AET-2024-005678',
        claimAmount: 500.00,
        status: 'SUBMITTED',
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        notes: 'Diabetes management - quarterly visit',
      },
    }),
    prisma.insuranceClaim.create({
      data: {
        patientId: patients[3].id,
        clinicId: clinic.id,
        insuranceProvider: 'United Healthcare',
        policyNumber: 'UHC-2024-009012',
        claimAmount: 200.00,
        status: 'DENIED',
        submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        denialReason: 'Pre-authorization not obtained',
        notes: 'Follow-up visit denied - appealing',
      },
    }),
  ]);
  console.log('Created', insuranceClaims.length, 'insurance claims');

  // Create Waitlist Entries
  const waitlistEntries = await Promise.all([
    prisma.waitlistEntry.create({
      data: {
        patientId: patients[2].id,
        clinicId: clinic.id,
        preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        preferredTimeStart: '09:00',
        priority: 'HIGH',
        reason: 'Persistent headaches - needs urgent evaluation',
        status: 'WAITING',
      },
    }),
    prisma.waitlistEntry.create({
      data: {
        patientId: patients[4].id,
        clinicId: clinic.id,
        preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        preferredTimeStart: '14:00',
        priority: 'NORMAL',
        reason: 'Annual wellness check',
        status: 'WAITING',
      },
    }),
  ]);
  console.log('Created', waitlistEntries.length, 'waitlist entries');

  // Create Notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: doctor.id,
        type: 'APPOINTMENT_REQUEST',
        title: 'New Appointment Request',
        message: 'Carol Davis has requested an appointment for next Tuesday.',
        priority: 'NORMAL',
        actionUrl: '/appointment-requests',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: doctor.id,
        type: 'LAB_RESULT',
        title: 'Lab Results Ready',
        message: 'CBC results for Alice Johnson are now available.',
        priority: 'HIGH',
        actionUrl: '/lab-results',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: doctor.id,
        type: 'PRESCRIPTION_REQUEST',
        title: 'Prescription Refill Request',
        message: 'Bob Williams has requested a refill for Metformin 500mg.',
        priority: 'NORMAL',
        actionUrl: '/prescription-requests',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: nurse.id,
        type: 'APPOINTMENT_REMINDER',
        title: 'Upcoming Appointments',
        message: 'You have 3 appointments scheduled for today.',
        priority: 'LOW',
        actionUrl: '/appointments',
        isRead: true,
      },
    }),
  ]);
  console.log('Created', notifications.length, 'notifications');

  // Create Doctor Ratings
  const ratings = await Promise.all([
    prisma.doctorRating.create({
      data: {
        doctorId: doctor.id,
        clinicId: clinic.id,
        patientId: patients[0].id,
        overall: 5,
        bedsideManner: 5,
        waitTime: 4,
        clarity: 5,
        isAnonymous: false,
        comment: 'Dr. Smith is incredibly thorough and caring. Best doctor I have ever had!',
      },
    }),
    prisma.doctorRating.create({
      data: {
        doctorId: doctor.id,
        clinicId: clinic.id,
        patientId: patients[3].id,
        overall: 4,
        bedsideManner: 5,
        waitTime: 3,
        clarity: 4,
        isAnonymous: false,
        comment: 'Great doctor, but wait times can be long. Worth the wait though.',
      },
    }),
    prisma.doctorRating.create({
      data: {
        doctorId: doctor.id,
        clinicId: clinic.id,
        patientId: patients[4].id,
        overall: 5,
        bedsideManner: 5,
        waitTime: 5,
        clarity: 5,
        isAnonymous: false,
        comment: 'Always explains everything clearly. Very patient and professional.',
      },
    }),
  ]);
  console.log('Created', ratings.length, 'doctor ratings');

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
  console.log('Users:', 4, '(1 Doctor, 1 Nurse, 1 Staff, 1 Admin)');
  console.log('Patients:', patients.length);
  console.log('Appointments:', appointments.length);
  console.log('Invoices:', invoices.length, `(${invoices.length - unpaidCount} paid, ${unpaidCount} unpaid)`);
  console.log('Tags:', tags.length);
  console.log('Custom Fields:', customFields.length);
  console.log('Presets:', presets.length);
  console.log('Note Templates:', noteTemplates.length);
  console.log('Vitals:', vitals.length);
  console.log('Diagnoses:', diagnoses.length);
  console.log('Prescriptions:', prescriptions.length);
  console.log('Allergies:', allergies.length);
  console.log('Conditions:', conditions.length);
  console.log('Tasks:', tasks.length);
  console.log('Lab Results:', labResults.length);
  console.log('Total Revenue: $' + (totalRevenue._sum.amount?.toFixed(2) || '0.00'));
  console.log('\nLogin credentials:');
  console.log('  Doctor: dr.smith@medora.com / password123');
  console.log('  Nurse: nurse@medora.com / password123');
  console.log('  Staff: staff@medora.com / password123');
  console.log('  Admin: admin@medora.com / password123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
