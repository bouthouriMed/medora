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

    const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });
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

    const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
  async portalChat(input: {
    patient: { firstName: string; lastName: string; dateOfBirth?: string | null };
    history: {
      diagnoses: Array<{ icdCode: string; description: string; status: string }>;
      prescriptions: Array<{ medication: string; dosage: string; frequency: string; status: string }>;
      allergies: Array<{ allergen: string; severity: string; reaction?: string | null }>;
      conditions: Array<{ name: string; status: string }>;
      vitals: Array<{ bloodPressureSystolic?: number | null; bloodPressureDiastolic?: number | null; heartRate?: number | null; temperature?: number | null; weight?: number | null; oxygenSat?: number | null; recordedAt: string }>;
      labResults: Array<{ testName: string; result: string | null; status: string; orderedAt: string }>;
    };
    message: string;
    conversationHistory: Array<{ role: string; content: string }>;
  }): Promise<string> {
    const { patient, history, message, conversationHistory } = input;

    const age = patient.dateOfBirth
      ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const diagnosesText = history.diagnoses.map(d => `- ${d.description} (${d.icdCode}) [${d.status}]`).join('\n') || 'None on record';
    const medsText = history.prescriptions.map(p => `- ${p.medication} ${p.dosage}, ${p.frequency} [${p.status}]`).join('\n') || 'None on record';
    const allergiesText = history.allergies.map(a => `- ${a.allergen} (${a.severity})${a.reaction ? ': ' + a.reaction : ''}`).join('\n') || 'No known allergies';
    const conditionsText = history.conditions.map(c => `- ${c.name} [${c.status}]`).join('\n') || 'None on record';
    const vitalsText = history.vitals.map(v => {
      const parts = [];
      if (v.bloodPressureSystolic) parts.push(`BP ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`);
      if (v.heartRate) parts.push(`HR ${v.heartRate}`);
      if (v.temperature) parts.push(`Temp ${v.temperature}°F`);
      if (v.weight) parts.push(`Weight ${v.weight}kg`);
      if (v.oxygenSat) parts.push(`O2 ${v.oxygenSat}%`);
      return `[${new Date(v.recordedAt).toLocaleDateString()}] ${parts.join(', ')}`;
    }).join('\n') || 'No vitals recorded';
    const labsText = history.labResults.map(l => `- ${l.testName}: ${l.result || 'Pending'} [${l.status}] (${new Date(l.orderedAt).toLocaleDateString()})`).join('\n') || 'No lab results';

    const conversationText = conversationHistory.map(m => `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content}`).join('\n');

    const prompt = `You are a friendly, helpful health assistant for a patient portal. You help patients understand their health information in simple, easy-to-understand language. Avoid medical jargon when possible, and explain terms simply when you must use them.

IMPORTANT RULES:
- Be warm, empathetic, and encouraging
- Use simple language a non-medical person can understand
- When discussing serious conditions or symptoms, always recommend the patient contact their healthcare provider
- Never diagnose or prescribe - only help them understand existing records
- If asked about something not in their records, say you don't have that information and suggest asking their doctor
- Keep responses concise but helpful

PATIENT INFORMATION:
Name: ${patient.firstName} ${patient.lastName}${age ? `, ${age} years old` : ''}

Diagnoses:
${diagnosesText}

Medications:
${medsText}

Allergies:
${allergiesText}

Conditions:
${conditionsText}

Recent Vitals:
${vitalsText}

Recent Lab Results:
${labsText}

${conversationText ? `PREVIOUS CONVERSATION:\n${conversationText}\n` : ''}
Patient's question: ${message}`;

    const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async generateDoctorBriefing(input: {
    patient: { firstName: string; lastName: string; dateOfBirth?: string | null };
    history: {
      vitals?: Array<{ bloodPressureSystolic?: number | null; bloodPressureDiastolic?: number | null; heartRate?: number | null; temperature?: number | null; weight?: number | null; oxygenSat?: number | null; recordedAt: string }>;
      diagnoses?: Array<{ icdCode: string; description: string; status: string; diagnosedAt: string }>;
      prescriptions?: Array<{ medication: string; dosage: string; frequency: string; status: string; startDate: string }>;
      allergies?: Array<{ allergen: string; severity: string; reaction?: string | null }>;
      conditions?: Array<{ name: string; status: string }>;
      labResults?: Array<{ testName: string; result: string | null; status: string; orderedAt: string }>;
      appointments?: Array<{ dateTime: string; status: string; notes?: string | null }>;
    };
    appointmentReason?: string;
  }): Promise<{ summary: string; risks: string[]; suggestedQuestions: string[]; keyAlerts: string[] }> {
    const { patient, history, appointmentReason } = input;

    const age = patient.dateOfBirth
      ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const vitalsText = history.vitals?.slice(0, 3).map(v => {
      const parts = [];
      if (v.bloodPressureSystolic) parts.push(`BP ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`);
      if (v.heartRate) parts.push(`HR ${v.heartRate}`);
      if (v.temperature) parts.push(`T ${v.temperature}°F`);
      if (v.weight) parts.push(`Wt ${v.weight}kg`);
      if (v.oxygenSat) parts.push(`SpO2 ${v.oxygenSat}%`);
      return `[${new Date(v.recordedAt).toLocaleDateString()}] ${parts.join(', ')}`;
    }).join('\n') || 'No vitals';

    const diagnosesText = history.diagnoses?.map(d => `- [${d.status}] ${d.icdCode}: ${d.description}`).join('\n') || 'None';
    const medsText = history.prescriptions?.map(p => `- [${p.status}] ${p.medication} ${p.dosage} ${p.frequency}`).join('\n') || 'None';
    const allergiesText = history.allergies?.map(a => `- ${a.allergen} (${a.severity})${a.reaction ? ': ' + a.reaction : ''}`).join('\n') || 'NKDA';
    const conditionsText = history.conditions?.map(c => `- [${c.status}] ${c.name}`).join('\n') || 'None';
    const labsText = history.labResults?.slice(0, 5).map(l => `- ${l.testName}: ${l.result || 'Pending'} [${l.status}]`).join('\n') || 'None';
    const recentVisits = history.appointments?.slice(0, 5).map(a => `- ${new Date(a.dateTime).toLocaleDateString()} [${a.status}]${a.notes ? ': ' + a.notes.substring(0, 100) : ''}`).join('\n') || 'No recent visits';

    const prompt = `You are a clinical decision support system. Generate a pre-consultation briefing for a doctor about to see a patient.

PATIENT: ${patient.firstName} ${patient.lastName}${age ? `, ${age} years old` : ''}
${appointmentReason ? `REASON FOR VISIT: ${appointmentReason}` : ''}

VITALS: ${vitalsText}
DIAGNOSES: ${diagnosesText}
MEDICATIONS: ${medsText}
ALLERGIES: ${allergiesText}
CONDITIONS: ${conditionsText}
LAB RESULTS: ${labsText}
RECENT VISITS: ${recentVisits}

Respond in JSON only:
{
  "summary": "2-3 sentence patient overview for the doctor to read in 10 seconds",
  "risks": ["list of important risk factors or concerns"],
  "suggestedQuestions": ["3-5 questions the doctor should ask based on the patient's history"],
  "keyAlerts": ["any critical alerts: drug interactions, abnormal labs, overdue screenings, allergy concerns"]
}`;

    try {
      const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return { summary: 'Unable to generate briefing', risks: [], suggestedQuestions: [], keyAlerts: [] };
    } catch {
      return { summary: 'AI service unavailable', risks: [], suggestedQuestions: [], keyAlerts: [] };
    }
  }

  async checkDrugInteractions(medications: string[]): Promise<{ interactions: Array<{ drug1: string; drug2: string; severity: string; description: string }> }> {
    if (medications.length < 2) return { interactions: [] };

    const prompt = `You are a pharmacology expert. Check for drug interactions between these medications:
${medications.map(m => `- ${m}`).join('\n')}

Respond in JSON only:
{
  "interactions": [
    { "drug1": "med1", "drug2": "med2", "severity": "mild|moderate|severe|contraindicated", "description": "brief description of interaction" }
  ]
}

Only include real, clinically significant interactions. If no interactions exist, return empty array.`;

    try {
      const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return { interactions: [] };
    } catch {
      return { interactions: [] };
    }
  }

  async checkAllergyConflicts(allergies: string[], medication: string): Promise<{ hasConflict: boolean; details: string }> {
    if (allergies.length === 0) return { hasConflict: false, details: '' };

    const prompt = `You are a pharmacology expert. Check if prescribing "${medication}" could be dangerous for a patient with these allergies:
${allergies.map(a => `- ${a}`).join('\n')}

Respond in JSON only:
{ "hasConflict": true/false, "details": "explanation if conflict exists, empty if not" }`;

    try {
      const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return { hasConflict: false, details: '' };
    } catch {
      return { hasConflict: false, details: '' };
    }
  }

  async triagePatient(symptoms: string, medicalHistory?: {
    conditions?: Array<{ name: string; status: string }>;
    medications?: Array<{ medication: string; dosage: string; frequency: string }>;
    allergies?: Array<{ allergen: string; severity: string }>;
  }): Promise<{ urgency: 'emergency' | 'urgent' | 'routine' | 'telehealth'; recommendation: string; reason: string }> {
    const conditionsText = medicalHistory?.conditions?.map(c => `${c.name} [${c.status}]`).join('\n') || 'None';
    const medicationsText = medicalHistory?.medications?.map(m => `${m.medication} ${m.dosage}`).join('\n') || 'None';
    const allergiesText = medicalHistory?.allergies?.map(a => `${a.allergen} (${a.severity})`).join('\n') || 'None';

    const prompt = `You are a medical triage assistant. Based on the patient's symptoms and medical history, determine the appropriate urgency level and recommendation.

Respond in JSON format only:
{
  "urgency": "emergency" | "urgent" | "routine" | "telehealth",
  "recommendation": "One sentence recommendation",
  "reason": "Brief explanation (2-3 sentences max)"
}

Urgency definitions:
- emergency: Requires immediate medical attention (call emergency services)
- urgent: Should be seen within 24 hours
- routine: Can wait for a regular appointment
- telehealth: Suitable for video consultation

Patient Symptoms: ${symptoms}

Medical History:
Conditions: ${conditionsText}
Current Medications: ${medicationsText}
Allergies: ${allergiesText}

CRITICAL: If symptoms suggest heart attack, stroke, severe bleeding, difficulty breathing, or other life-threatening conditions, ALWAYS return "emergency".`;

    try {
      const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { urgency: 'routine', recommendation: 'Schedule a regular appointment', reason: 'Unable to parse AI response' };
    } catch (error) {
      return { urgency: 'routine', recommendation: 'Schedule an appointment', reason: 'AI service unavailable' };
    }
  }
}

export default new AiService();
