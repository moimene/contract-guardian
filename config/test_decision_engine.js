const https = require('https');

const clauses = [
    { id: 'services', text: 'SERVICES: ProdCo will render all customary production services for the Program, including pre-production, principal photography, and post-production.' },
    { id: 'rights', text: 'RIGHTS: All Results and Proceeds created by ProdCo shall be works made for hire owned by Amazon. Amazon shall exclusively own all right, title, and interest throughout the universe in perpetuity.' },
    { id: 'fees', text: 'FEES: In full consideration, Amazon shall pay ProdCo a Production Fee of $5,000,000, payable in accordance with the payment schedule.' },
    { id: 'miscellaneous', text: 'MISCELLANEOUS: IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.' },
    { id: 'data-protection', text: 'DATA PROTECTION: Each party shall comply with applicable data protection laws when processing personal data.' },
    { id: 'dispute', text: 'TAX; GOVERNING LAW (a) All disputes shall be resolved by binding arbitration under JAMS rules in Los Angeles. (b) This Agreement shall be governed by California law.' }
];

async function testClause(clause) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            clause_instance_id: 'test-' + clause.id,
            clause_text: clause.text,
            run_id: 'decision-test-v2'
        });

        const options = {
            hostname: 'mmenendeza.app.n8n.cloud',
            path: '/webhook/clause-review-rag',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve({
                        id: clause.id,
                        family: result.detected_family,
                        decision: result.decision,
                        client_state: result.client_state,
                        escalation_reason: result._internal?.escalation_reason
                    });
                } catch (e) {
                    resolve({ id: clause.id, error: e.message });
                }
            });
        });
        req.on('error', (e) => resolve({ id: clause.id, error: e.message }));
        req.write(data);
        req.end();
    });
}

(async () => {
    console.log('Testing Decision Engine v2.0...\n');
    const results = [];
    for (const clause of clauses) {
        const result = await testClause(clause);
        console.log(`${result.id}: ${result.family} -> ${result.decision} (${result.escalation_reason || 'N/A'})`);
        results.push(result);
    }

    const decisions = results.filter(r => !r.error).map(r => r.decision);
    const escCount = decisions.filter(d => d === 'ESCALATE_HUMAN').length;
    const passCount = decisions.filter(d => d === 'AUTO_PASS').length;
    const notesCount = decisions.filter(d => d === 'APPROVE_WITH_NOTES').length;

    console.log('\n--- DECISION DISTRIBUTION ---');
    console.log(`ESCALATE_HUMAN:      ${escCount}/${decisions.length} (${Math.round(escCount / decisions.length * 100)}%)`);
    console.log(`AUTO_PASS:           ${passCount}/${decisions.length} (${Math.round(passCount / decisions.length * 100)}%)`);
    console.log(`APPROVE_WITH_NOTES:  ${notesCount}/${decisions.length} (${Math.round(notesCount / decisions.length * 100)}%)`);
    console.log('\nTarget: <15% escalation');
})();
