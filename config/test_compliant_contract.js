const https = require('https');

/**
 * Compliant test clauses following Amazon playbook requirements
 * These should result in AUTO_PASS or APPROVE_WITH_NOTES
 */
const clauses = [
    {
        id: 'services-compliant',
        text: `SERVICES: ProdCo will render all production services as set forth in this Agreement, 
including any exhibits and schedules hereto, to produce the Program. Services shall include 
pre-production, principal photography, post-production, and delivery of final masters in 
accordance with Amazon's delivery specifications.`
    },
    {
        id: 'rights-compliant',
        text: `RIGHTS: All rights in the Program, including all materials commissioned (including 
the results and proceeds of services of all personnel rendering services), are being specially 
ordered and commissioned by Amazon as a work made for hire for Amazon. Amazon shall be the 
author and exclusive owner for copyright purposes and otherwise, throughout the universe, in 
perpetuity, in all media now known or hereafter developed. To the extent that any of the 
foregoing may not be considered a work made for hire, ProdCo hereby irrevocably assigns to 
Amazon all right, title, and interest in and to the Program and all such materials.`
    },
    {
        id: 'fees-compliant',
        text: `FEES: Subject to ProdCo's compliance with all material terms of this Agreement, 
Amazon shall pay ProdCo the Production Fee set forth in Exhibit A, payable in accordance 
with the milestone schedule attached hereto. Amazon shall have full offset rights against 
any amounts owed. Amazon shall have audit rights with respect to all costs and expenses.`
    },
    {
        id: 'indemnity-compliant',
        text: `INDEMNITY: ProdCo shall indemnify, defend, and hold harmless Amazon and its parents, 
subsidiaries, affiliates, successors, assigns, licensees, officers, directors, employees, 
and agents (collectively, "Amazon Indemnitees") from and against any and all claims, damages, 
liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or 
relating to any breach of ProdCo's representations, warranties, or obligations under this Agreement.`
    },
    {
        id: 'liability-compliant',
        text: `LIMITATION OF LIABILITY: IN NO EVENT SHALL AMAZON BE LIABLE FOR ANY CONSEQUENTIAL, 
INDIRECT, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES ARISING OUT OF THIS AGREEMENT. Amazon's 
total aggregate liability shall not exceed the Production Fee paid hereunder. ProdCo's 
indemnification obligations shall not be subject to any cap or limitation.`
    },
    {
        id: 'dispute-compliant',
        text: `GOVERNING LAW; DISPUTE RESOLUTION: This Agreement shall be governed by the laws of the 
State of Delaware. Any dispute arising out of this Agreement shall be resolved by binding 
arbitration administered by AAA in Seattle, Washington. Each party waives any right to a 
jury trial. Amazon may seek injunctive relief in any court of competent jurisdiction.`
    },
    {
        id: 'confidentiality-compliant',
        text: `DATA PROTECTION: When processing personal data in connection with this Agreement, 
each party shall comply with all applicable data protection laws and regulations, including 
GDPR where applicable. ProdCo shall maintain appropriate technical and organizational 
security measures and shall not transfer personal data outside the EEA without adequate safeguards.`
    }
];

async function testClause(clause) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            clause_instance_id: clause.id,
            clause_text: clause.text,
            run_id: 'compliant-test-v1'
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
                        reason: result._internal?.escalation_reason || 'N/A'
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
    console.log('='.repeat(60));
    console.log('  COMPLIANT CONTRACT TEST - Decision Engine v2.0');
    console.log('='.repeat(60));
    console.log('');

    const results = [];
    for (const clause of clauses) {
        const result = await testClause(clause);
        const icon = result.decision === 'ESCALATE_HUMAN' ? '🔴' :
            result.decision === 'APPROVE_WITH_NOTES' ? '🟡' : '🟢';
        console.log(`${icon} ${result.id.padEnd(25)} | ${(result.family || 'ERROR').padEnd(20)} | ${result.decision}`);
        if (result.decision === 'ESCALATE_HUMAN') {
            console.log(`   └─ Reason: ${result.reason}`);
        }
        results.push(result);
    }

    const valid = results.filter(r => !r.error);
    const escCount = valid.filter(r => r.decision === 'ESCALATE_HUMAN').length;
    const passCount = valid.filter(r => r.decision === 'AUTO_PASS').length;
    const notesCount = valid.filter(r => r.decision === 'APPROVE_WITH_NOTES').length;

    console.log('\n' + '='.repeat(60));
    console.log('  DECISION DISTRIBUTION');
    console.log('='.repeat(60));
    console.log(`  🟢 AUTO_PASS:           ${passCount}/${valid.length} (${Math.round(passCount / valid.length * 100)}%)`);
    console.log(`  🟡 APPROVE_WITH_NOTES:  ${notesCount}/${valid.length} (${Math.round(notesCount / valid.length * 100)}%)`);
    console.log(`  🔴 ESCALATE_HUMAN:      ${escCount}/${valid.length} (${Math.round(escCount / valid.length * 100)}%)`);
    console.log('');
    console.log(`  Target: <15% escalation`);
    console.log(`  Result: ${escCount / valid.length * 100 < 15 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('='.repeat(60));
})();
