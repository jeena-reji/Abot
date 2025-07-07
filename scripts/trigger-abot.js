const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://10.176.27.73/abotrest/abot/api/v5';
const USERNAME = 'admin';
const PASSWORD = 'admin1234';
const FEATURE_TAG = '@initial-attach-test';
const EXECUTION_NAME = new Date().toISOString().replace(/[:.]/g, '-'

(async () => {
  try {
    // Step 1: Login and get token
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      user_id: USERNAME,
      password: PASSWORD
    });
    const token = loginRes.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Trigger test execution
    await axios.post(`${BASE_URL}/feature_files/execute`, {
      feature_tags: FEATURE_TAG,
      build_id: 'default-build',
      access_type: '5G',
      execution_id: EXECUTION_NAME
    }, { headers });

    console.log(`🟢 Test triggered with execution ID: ${EXECUTION_NAME}`);

    // Step 3: Poll until test finishes
    let status = 'Running';
    while (status === 'Running') {
      const res = await axios.get(`${BASE_URL}/execution_status`, { headers });
      status = res.data.data.execution_status;
      console.log(`⏳ Status: ${status}`);
      if (status === 'Running') await new Promise(r => setTimeout(r, 5000));
    }

    // Step 4: Get summary results
    const resultRes = await axios.get(
      `${BASE_URL}/rca/execFeatureSummary`, {
        headers,
        params: {
          buildId: 'default-build',
          vendorKeys: '', // Optional
          accessTypes: '5G',
          loadState: '0,1',
          executionType: 0
        }
      }
    );

    const rows = resultRes.data.data || [];

    // Write CSV
    const csv = ['Feature,Pass Count,Fail Count,Execution Time(ms)'];
    rows.forEach(row => {
      csv.push(`${row.feature_name},${row.pass_count},${row.fail_count},${row.execution_time}`);
    });
    fs.writeFileSync('abot/reports/results.csv', csv.join('\n'));

    // Write summary JSON
    fs.writeFileSync('abot/reports/summary.json', JSON.stringify({
      executionId: EXECUTION_NAME,
      featuresTested: rows.length,
      passTotal: rows.reduce((a, b) => a + (b.pass_count || 0), 0),
      failTotal: rows.reduce((a, b) => a + (b.fail_count || 0), 0),
      status
    }, null, 2));

    console.log('✅ Summary and CSV written.');

  } catch (err) {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
  }
})();
