import app from '../hono';

async function runEndpointRegressionTests() {
  console.log('=== HARMONY FREQUENCY BACKEND ENDPOINT REGRESSION TEST ===\n');

  let passed = 0;
  let failed = 0;

  async function testEndpoint(
    name: string,
    path: string,
    init?: RequestInit,
    expectedStatus = 200,
    validateResponseBody?: (body: any) => boolean
  ) {
    try {
      const req = new Request(`http://localhost${path}`, init);
      const res = await app.fetch(req);
      const statusOk = res.status === expectedStatus;
      let bodyOk = true;
      let bodyData: any = null;
      try {
        bodyData = await res.json();
        if (validateResponseBody) {
          bodyOk = validateResponseBody(bodyData);
        }
      } catch {
        // Response may not be JSON
      }

      if (statusOk && bodyOk) {
        console.log(`[PASS] ${name} -> ${res.status}`);
        passed++;
      } else {
        console.error(`[FAIL] ${name} -> Got ${res.status} (Expected ${expectedStatus}), Body:`, bodyData);
        failed++;
      }
    } catch (err: any) {
      console.error(`[FAIL] ${name} -> Exception:`, err?.message || err);
      failed++;
    }
  }

  process.env.ADMIN_SECRET_KEY = 'test-secret-key-12345';

  // 1. Health & Public Reads
  await testEndpoint('GET / (Health)', '/', undefined, 200, (b) => b.status === 'ok');
  await testEndpoint('GET /data (Public Catalog)', '/data', undefined, 200, (b) => Array.isArray(b.frequencies) && Array.isArray(b.articles));
  await testEndpoint('GET /admin/status (Admin Health)', '/admin/status', undefined, 200);

  // 2. Auth Rejections (unauthorized calls)
  await testEndpoint('GET /audit (No Auth)', '/audit', undefined, 401);
  await testEndpoint('GET /api/subscription/status (No Auth)', '/api/subscription/status', undefined, 401);
  await testEndpoint('POST /frequencies (No Auth)', '/frequencies', { method: 'POST' }, 401);

  // 3. Admin CRUD - Data Reset
  await testEndpoint('POST /data/reset (Admin Auth)', '/data/reset', {
    method: 'POST',
    headers: { Authorization: 'Bearer test-secret-key-12345' },
  }, 200, (b) => b.ok === true);

  // 4. Admin CRUD - Frequency
  let createdFreqId = '';
  await testEndpoint('POST /frequencies (Valid Payload)', '/frequencies', {
    method: 'POST',
    headers: { Authorization: 'Bearer test-secret-key-12345', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '528Hz Miracle Tone',
      hz: 528,
      frequency: '528Hz',
      description: 'Transformation and miracles',
      category: 'solfeggio',
      benefits: ['DNA repair', 'Clarity'],
      isPremium: false,
      tags: ['transformation'],
    }),
  }, 201, (b) => { createdFreqId = b.id; return !!b.id; });

  if (createdFreqId) {
    await testEndpoint('PATCH /frequencies/:id (Update)', `/frequencies/${createdFreqId}`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer test-secret-key-12345', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated 528Hz Miracle Tone' }),
    }, 200, (b) => b.ok === true);

    await testEndpoint('DELETE /frequencies/:id (Delete)', `/frequencies/${createdFreqId}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-secret-key-12345' },
    }, 200, (b) => b.ok === true);
  }

  // 5. Admin CRUD - Curated Programs
  let createdProgId = '';
  await testEndpoint('POST /curated-programs (Valid Payload)', '/curated-programs', {
    method: 'POST',
    headers: { Authorization: 'Bearer test-secret-key-12345', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Deep Sleep Journey',
      description: 'Program for deep delta sleep',
      frequencies: ['freq-1'],
      duration: 30,
      category: 'sleep',
      isPremium: false,
    }),
  }, 201, (b) => { createdProgId = b.id; return !!b.id; });

  if (createdProgId) {
    await testEndpoint('DELETE /curated-programs/:id (Delete)', `/curated-programs/${createdProgId}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-secret-key-12345' },
    }, 200, (b) => b.ok === true);
  }

  // 6. Admin Audit Log Read
  await testEndpoint('GET /audit (Admin Auth)', '/audit', {
    headers: { Authorization: 'Bearer test-secret-key-12345' },
  }, 200, (b) => Array.isArray(b));

  console.log(`\n=== REGRESSION SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runEndpointRegressionTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
