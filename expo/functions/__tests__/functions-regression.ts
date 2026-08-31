import { EventEmitter } from 'events';
import { setAdminClaim, deleteAccount, handleSubscriptionWebhook } from '../src/index';

async function runFunctionsRegressionTests() {
  console.log('=== FIREBASE FUNCTIONS REGRESSION TEST ===\n');

  let passed = 0;
  let failed = 0;

  process.env.ADMIN_SECRET_KEY = 'test-secret-key-12345';

  function createMockResponse() {
    const res: any = new EventEmitter();
    let statusCode = 200;
    let jsonBody: any = null;
    let headers: Record<string, string> = {};

    res.status = (code: number) => {
      statusCode = code;
      return res;
    };
    res.json = (data: any) => {
      jsonBody = data;
      res.emit('finish');
      return res;
    };
    res.send = (data: any) => {
      jsonBody = data;
      res.emit('finish');
      return res;
    };
    res.setHeader = (name: string, value: string) => {
      headers[name.toLowerCase()] = value;
      return res;
    };
    res.getHeader = (name: string) => headers[name.toLowerCase()];
    res.getStatus = () => statusCode;
    res.getBody = () => jsonBody;

    return res;
  }

  // 1. setAdminClaim - Method check
  {
    const req: any = { method: 'GET', headers: {}, body: {} };
    const res = createMockResponse();
    await (setAdminClaim as any)(req, res);
    if (res.getStatus() === 405) {
      console.log('[PASS] setAdminClaim (Method check)');
      passed++;
    } else {
      console.error('[FAIL] setAdminClaim (Method check)');
      failed++;
    }
  }

  // 2. setAdminClaim - No Auth
  {
    const req: any = { method: 'POST', headers: {}, body: {} };
    const res = createMockResponse();
    await (setAdminClaim as any)(req, res);
    if (res.getStatus() === 401) {
      console.log('[PASS] setAdminClaim (Unauthorized check)');
      passed++;
    } else {
      console.error('[FAIL] setAdminClaim (Unauthorized check)');
      failed++;
    }
  }

  // 3. deleteAccount - Method check
  {
    const req: any = { method: 'GET', headers: {}, body: {} };
    const res = createMockResponse();
    await (deleteAccount as any)(req, res);
    if (res.getStatus() === 405) {
      console.log('[PASS] deleteAccount (Method check)');
      passed++;
    } else {
      console.error('[FAIL] deleteAccount (Method check)');
      failed++;
    }
  }

  // 4. handleSubscriptionWebhook - Method check
  {
    const req: any = { method: 'GET', headers: {}, body: {} };
    const res = createMockResponse();
    await (handleSubscriptionWebhook as any)(req, res);
    if (res.getStatus() === 405) {
      console.log('[PASS] handleSubscriptionWebhook (Method check)');
      passed++;
    } else {
      console.error('[FAIL] handleSubscriptionWebhook (Method check)');
      failed++;
    }
  }

  // 5. handleSubscriptionWebhook - RevenueCat Event Payload
  {
    const req: any = {
      method: 'POST',
      headers: {},
      body: {
        event: {
          app_user_id: 'test-user-123',
          type: 'INITIAL_PURCHASE',
          entitlement_id: 'premium',
        },
      },
    };
    const res = createMockResponse();
    await (handleSubscriptionWebhook as any)(req, res);
    if (res.getStatus() === 200 && res.getBody()?.status === 'premium') {
      console.log('[PASS] handleSubscriptionWebhook (RevenueCat Payload)');
      passed++;
    } else {
      console.error('[FAIL] handleSubscriptionWebhook (RevenueCat Payload):', res.getStatus(), res.getBody());
      failed++;
    }
  }

  console.log(`\n=== FUNCTIONS REGRESSION SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runFunctionsRegressionTests().catch((err) => {
  console.error('Fatal error in functions regression test:', err);
  process.exit(1);
});
