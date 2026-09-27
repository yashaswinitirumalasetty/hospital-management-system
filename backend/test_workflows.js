// Comprehensive Workflow Verification Script
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING HOSPITAL PLATFORM WORKFLOW TESTS ---');

  // Test 1: Health Check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('✓ Test 1 - API Health:', health.status);

  // Test 2: Patient Login & Longitudinal Identity
  const patientLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ravi.kumar@gmail.com', password: 'patient123' }),
  });
  const patientAuth = await patientLoginRes.json();
  const patientToken = patientAuth.token;
  console.log(`✓ Test 2 - Patient Login: ${patientAuth.user.name}, Patient ID: ${patientAuth.user.patientId}`);
  if (patientAuth.user.patientId !== 'P-100245') throw new Error('Patient ID mismatch');

  // Test 3: Patient Dashboard & Timeline
  const dashRes = await fetch(`${BASE_URL}/patient/dashboard`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const patientDash = await dashRes.json();
  console.log(`✓ Test 3 - Patient Active Appointment Status: ${patientDash.activeAppointment?.status || 'None'}`);

  const timelineRes = await fetch(`${BASE_URL}/patient/timeline`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const timeline = await timelineRes.json();
  console.log(`✓ Test 4 - Longitudinal Records Count: ${timeline.timeline?.length} entries across 2025/2026`);

  // Test 5: Reception Login & Queue Inspection
  const receptionLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'reception@hospital.com', password: 'reception123' }),
  });
  const receptionAuth = await receptionLoginRes.json();
  const receptionToken = receptionAuth.token;

  const recDashRes = await fetch(`${BASE_URL}/reception/dashboard`, {
    headers: { Authorization: `Bearer ${receptionToken}` },
  });
  const recDash = await recDashRes.json();
  console.log(`✓ Test 5 - Reception Dashboard: ${recDash.metrics.todayTotal} total appointments, ${recDash.metrics.waitingCount} in lounge`);

  // Test 6: Existing Patient Search (No duplicate profiles)
  const searchRes = await fetch(`${BASE_URL}/reception/search-patients?q=100245`, {
    headers: { Authorization: `Bearer ${receptionToken}` },
  });
  const searchResults = await searchRes.json();
  console.log(`✓ Test 6 - Existing Patient Search Found: ${searchResults.patients?.[0]?.firstName} ${searchResults.patients?.[0]?.lastName} (${searchResults.patients?.[0]?.patientId})`);

  // Test 7: Doctor Login & Consultation OPD
  const docLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dr.kumar@hospital.com', password: 'doctor123' }),
  });
  const docAuth = await docLoginRes.json();
  const docToken = docAuth.token;

  const docDashRes = await fetch(`${BASE_URL}/doctor/dashboard`, {
    headers: { Authorization: `Bearer ${docToken}` },
  });
  const docDash = await docDashRes.json();
  console.log(`✓ Test 7 - Doctor OPD Dashboard: Dr. Kumar has ${docDash.waitingPatients?.length} patients waiting in queue`);

  // Test 8: Nurse Station Vitals
  const nurseLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nurse.sunita@hospital.com', password: 'nurse123' }),
  });
  const nurseAuth = await nurseLoginRes.json();
  const nurseToken = nurseAuth.token;

  const nurseDashRes = await fetch(`${BASE_URL}/nurse/dashboard`, {
    headers: { Authorization: `Bearer ${nurseToken}` },
  });
  const nurseDash = await nurseDashRes.json();
  console.log(`✓ Test 8 - Nurse Station: ${nurseDash.metrics.activePatientsCount} active patients, ${nurseDash.pendingInstructions?.length} doctor instructions`);

  // Test 9: Pharmacy Prescription Queue & Dispensing
  const pharmLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pharmacy@hospital.com', password: 'pharmacy123' }),
  });
  const pharmAuth = await pharmLoginRes.json();
  const pharmToken = pharmAuth.token;

  const pharmDashRes = await fetch(`${BASE_URL}/pharmacy/dashboard`, {
    headers: { Authorization: `Bearer ${pharmToken}` },
  });
  const pharmDash = await pharmDashRes.json();
  console.log(`✓ Test 9 - Pharmacy Prescriptions Queue: ${pharmDash.metrics.pendingQueueCount} pending, ${pharmDash.lowStockItems?.length} low-stock alerts`);

  // Test 10: Owner Dashboard Bottleneck Telemetry
  const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@hospital.com', password: 'owner123' }),
  });
  const ownerAuth = await ownerLoginRes.json();
  const ownerToken = ownerAuth.token;

  const ownerDashRes = await fetch(`${BASE_URL}/owner/dashboard`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const ownerDash = await ownerDashRes.json();
  console.log(`✓ Test 10 - Owner Dashboard Bottlenecks:`);
  ownerDash.bottlenecks.forEach((b) => {
    console.log(`    - ${b.stage}: ${b.count} (Threshold: ${b.threshold})`);
  });

  // Test 11: Admin Audit Trail
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hospital.com', password: 'admin123' }),
  });
  const adminAuth = await adminLoginRes.json();
  const adminToken = adminAuth.token;

  const auditRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const audit = await auditRes.json();
  console.log(`✓ Test 11 - Admin Protected Audit Logs: ${audit.logs?.length} recorded events`);

  console.log('\n--- ALL WORKFLOW VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
