import { GoogleGenerativeAI } from '@google/generative-ai';

let _client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set');
    _client = new GoogleGenerativeAI(apiKey);
  }
  return _client;
}

interface VisitNoteInput {
  appointment: {
    dateTime: string;
    notes?: string | null;
    type?: string | null;
    status: string;
    doctor: { firstName: string; lastName: string; specialty?: string | null };
    patient: { firstName: string; lastName: string; dateOfBirth?: string | null };
  };
  history: {
    vitals?: Array<{ bloodPressureSystolic?: number | null; bloodPressureDiastolic?: number | null; heartRate?: number | null; temperature?: number | null; weight?: number | null; oxygenSat?: number | null; recordedAt: string }>;
    diagnoses?: Array<{ icdCode: string; description: string; status: string }>;
    prescriptions?: Array<{ medication: string; dosage: string; frequency: string; status: string }>;
    allergies?: Array<{ allergen: string; severity: string }>;
    conditions?: Array<{ name: string; status: string }>;
  };
}

interface PatientSummaryInput {
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string | null;
    gender?: string | null;
    bloodType?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  history: {
    vitals?: Array<{ bloodPressureSystolic?: number | null; bloodPressureDiastolic?: number | null; heartRate?: number | null; temperature?: number | null; weight?: number | null; height?: number | null; oxygenSat?: number | null; recordedAt: string }>;
    diagnoses?: Array<{ icdCode: string; description: string; status: string; diagnosedAt: string }>;
    prescriptions?: Array<{ medication: string; dosage: string; frequency: string; status: string }>;
    allergies?: Array<{ allergen: string; severity: string; reaction?: string | null }>;
    conditions?: Array<{ name: string; status: string }>;
    labResults?: Array<{ testName: string; result: string; status: string; orderedAt: string }>;
    medicalRecords?: Array<{ type: string; title: string; date: string }>;
  };
}

class AiService {
  async generateVisitNote(input: VisitNoteInput): Promise<string> {
    const { appointment, history } = input;

    const age = appointment.patient.dateOfBirth
      ? Math.floor((Date.now() - new Date(appointment.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const vitalsText = history.vitals?.slice(0, 3).map(v => {
      const parts = [];
      if (v.bloodPressureSystolic) parts.push(`BP ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic} mmHg`);
      if (v.heartRate) parts.push(`HR ${v.heartRate} bpm`);
      if (v.temperature) parts.push(`Temp ${v.temperature}°F`);
      if (v.weight) parts.push(`Wt ${v.weight} kg`);
      if (v.oxygenSat) parts.push(`SpO2 ${v.oxygenSat}%`);
      return `[${new Date(v.recordedAt).toLocaleDateString()}] ${parts.join(', ')}`;
    }).join('\n') || 'No recent vitals';

    const diagnosesText = history.diagnoses?.filter(d => d.status === 'ACTIVE').map(d => `- ${d.icdCode}: ${d.description}`).join('\n') || 'None';
    const medsText = history.prescriptions?.filter(p => p.status === 'ACTIVE').map(p => `- ${p.medication} ${p.dosage} ${p.frequency}`).join('\n') || 'None';
    const allergiesText = history.allergies?.map(a => `- ${a.allergen} (${a.severity})`).join('\n') || 'NKDA';

    const prompt = `You are a clinical documentation assistant. Generate a professional SOAP note for the following visit.

Patient: ${appointment.patient.firstName} ${appointment.patient.lastName}${age ? `, ${age} years old` : ''}
Date: ${new Date(appointment.dateTime).toLocaleDateString()}
Provider: Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}${appointment.doctor.specialty ? ` (${appointment.doctor.specialty})` : ''}
Visit type: ${appointment.type || 'Office Visit'}
Appointment notes: ${appointment.notes || 'None provided'}

RECENT VITALS:
${vitalsText}

ACTIVE DIAGNOSES:
${diagnosesText}

CURRENT MEDICATIONS:
${medsText}

ALLERGIES:
${allergiesText}

Generate a complete SOAP note with the four sections: Subjective, Objective, Assessment, and Plan. Be concise and clinically appropriate. Use professional medical language.`;

    const model = getClient().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async generatePatientSummary(input: PatientSummaryInput): Promise<string> {
    const { patient, history } = input;

    const age = patient.dateOfBirth
      ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const vitalsText = history.vitals?.slice(0, 5).map(v => {
      const parts = [];
      if (v.bloodPressureSystolic) parts.push(`BP ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`);
      if (v.heartRate) parts.push(`HR ${v.heartRate}`);
      if (v.temperature) parts.push(`T ${v.temperature}°F`);
      if (v.weight) parts.push(`Wt ${v.weight}kg`);
      if (v.height) parts.push(`Ht ${v.height}cm`);
      if (v.oxygenSat) parts.push(`SpO2 ${v.oxygenSat}%`);
      return `[${new Date(v.recordedAt).toLocaleDateString()}] ${parts.join(', ')}`;
    }).join('\n') || 'No vitals recorded';

    const diagnosesText = history.diagnoses?.map(d => `- [${d.status}] ${d.icdCode}: ${d.description} (${new Date(d.diagnosedAt).toLocaleDateString()})`).join('\n') || 'None';
    const medsText = history.prescriptions?.map(p => `- [${p.status}] ${p.medication} ${p.dosage} ${p.frequency}`).join('\n') || 'None';
    const allergiesText = history.allergies?.map(a => `- ${a.allergen} (${a.severity})${a.reaction ? ': ' + a.reaction : ''}`).join('\n') || 'NKDA';
    const conditionsText = history.conditions?.map(c => `- [${c.status}] ${c.name}`).join('\n') || 'None';
    const labsText = history.labResults?.slice(0, 5).map(l => `- ${l.testName}: ${l.result} [${l.status}] (${new Date(l.orderedAt).toLocaleDateString()})`).join('\n') || 'None';

    const prompt = `You are a clinical documentation assistant. Generate a comprehensive patient clinical summary.

PATIENT DEMOGRAPHICS:
Name: ${patient.firstName} ${patient.lastName}
${age ? `Age: ${age} years` : ''}
${patient.gender ? `Gender: ${patient.gender}` : ''}
${patient.bloodType ? `Blood Type: ${patient.bloodType}` : ''}

VITAL SIGNS HISTORY:
${vitalsText}

DIAGNOSES:
${diagnosesText}

MEDICATIONS:
${medsText}

ALLERGIES:
${allergiesText}

CHRONIC CONDITIONS:
${conditionsText}

RECENT LAB RESULTS:
${labsText}

Generate a comprehensive clinical summary with these 5 sections:
1. Patient Overview
2. Active Medical Problems
3. Medications & Allergies
4. Recent Diagnostics & Vitals
5. Clinical Impressions & Recommendations

Be thorough and clinically precise. Use professional medical language suitable for handoff or referral documentation.`;

    const model = getClient().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

export default new AiService();
