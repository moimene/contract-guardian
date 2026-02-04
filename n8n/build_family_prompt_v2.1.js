// Build Family Prompt (CG-018) - v3.1 with Legal Team Few-Shot Examples
// ================================================================================
// This node builds the system/user prompts for Paranoid and Valuator agents,
// correctly rendering v3.0 acceptability_matrix objects and injecting RAG context.
// 
// CG-018 ADDITIONS:
// - formatFewShotExamples(): Injects legal team vetted examples for critical families
// - Families covered: PaymentCredits, IndemnityProcedures, Insurance, IndemnityAmazon

const data = $('Enrich Policy').first().json;
const family = data.policySpec?.clause_family || 'OtherUnknown';
const clauseText = data.clause_text;
const policySpec = data.policySpec || {};
const playbookSpec = data.playbookSpec;
const ragContext = data.ragContext || {};

// -------------------------
// v3 Formatters
// -------------------------
function formatUnacceptable(patterns = []) {
    if (!Array.isArray(patterns) || !patterns.length) return '  • None defined';
    return patterns.map(p => {
        if (!p || typeof p !== 'object') return `  • ${String(p)}`;
        return [
            `  • [${p.id || 'unacc'}] ${p.pattern || ''}`,
            p.example ? `    Example: "${p.example}"` : null,
            p.reason ? `    Reason: ${p.reason}` : null,
            p.risk_level ? `    Risk: ${p.risk_level}` : null,
        ].filter(Boolean).join('\n');
    }).join('\n');
}

function formatPassable(vars = []) {
    if (!Array.isArray(vars) || !vars.length) return '  • None defined';
    return vars.map(v => {
        if (!v || typeof v !== 'object') return `  • ${String(v)}`;
        return [
            `  • [${v.id || 'pas'}] ${v.pattern || v.variation || ''}`,
            v.condition ? `    Condition: ${v.condition}` : null,
            v.example ? `    Example: "${v.example}"` : null,
            v.reason ? `    Reason: ${v.reason}` : null,
            v.risk_level ? `    Risk: ${v.risk_level}` : null,
        ].filter(Boolean).join('\n');
    }).join('\n');
}

function formatAcceptable(examples = []) {
    if (!Array.isArray(examples) || !examples.length) return '  • None defined';
    return examples.slice(0, 3).map(e => {
        if (!e || typeof e !== 'object') return `  • ${String(e)}`;
        return [
            `  • [${e.id || 'acc'}] ${e.pattern || ''}`,
            e.example ? `    Example: "${e.example}"` : null,
            e.reason ? `    Reason: ${e.reason}` : null,
        ].filter(Boolean).join('\n');
    }).join('\n');
}

function formatRedFlags(flags = []) {
    if (!Array.isArray(flags) || !flags.length) return '  • None defined';
    return flags.map(f => `  • "${f}" → Severity: high, Category: MatchesUnacceptable`).join('\n');
}

function formatMustHave(anchors = []) {
    if (!Array.isArray(anchors) || !anchors.length) return '  • None defined';
    return anchors.map(a => `  • "${a}"`).join('\n');
}

function formatCoreRequirements(reqs = []) {
    if (!Array.isArray(reqs) || !reqs.length) return '  • None defined';
    return reqs.map(r => `  • ${r}`).join('\n');
}

function formatEscalationTriggers(triggers = []) {
    if (!Array.isArray(triggers) || !triggers.length) return '  • None defined';
    return triggers.map(t => `  • ${t}`).join('\n');
}

// -------------------------
// RAG Context Formatter
// -------------------------
function formatRagExamples(rag = {}) {
    const topUnacc = (rag.unacceptableExamples || rag.unacceptable || []).slice(0, 2);
    const topAcc = (rag.acceptableExamples || rag.acceptable || []).slice(0, 1);
    const topPass = (rag.passableExamples || rag.passable || []).slice(0, 1);

    let out = '';
    if (topUnacc.length) {
        out += '\n  UNACCEPTABLE examples (for grounding):\n';
        out += topUnacc.map((e, i) => `    ${i + 1}. ${String(e.example_text || e.text || e).slice(0, 400)}...`).join('\n');
    }
    if (topAcc.length) {
        out += '\n  ACCEPTABLE examples (for grounding):\n';
        out += topAcc.map((e, i) => `    ${i + 1}. ${String(e.example_text || e.text || e).slice(0, 400)}...`).join('\n');
    }
    if (topPass.length) {
        out += '\n  PASSABLE examples (for grounding):\n';
        out += topPass.map((e, i) => `    ${i + 1}. ${String(e.example_text || e.text || e).slice(0, 400)}...`).join('\n');
    }

    return out || '  • No RAG examples available';
}

// =========================================================================
// CG-018: Few-Shot Examples from Legal Team Report
// =========================================================================
const FEW_SHOT_EXAMPLES = {
    PaymentCredits: {
        unacceptable: [
            {
                text: "Notwithstanding anything herein to the contrary, Amazon shall have the right to offset any amounts owed under this Agreement against any other amounts that may be owed to ProdCo under any other agreement between the parties.",
                verdict: "UNACCEPTABLE",
                reason: "Cross-agreement offset without limitation"
            },
            {
                text: "Credits shall be issued at Amazon's discretion based on its assessment of the level of promotional support provided.",
                verdict: "UNACCEPTABLE",
                reason: "Discretionary credits without objective criteria"
            }
        ],
        acceptable: [
            {
                text: "Amazon shall calculate and apply Credits based on the formulas set forth in Exhibit A, with supporting documentation provided to ProdCo within thirty (30) days of each quarterly period.",
                verdict: "ACCEPTABLE",
                reason: "Objective calculation with transparency"
            }
        ]
    },
    IndemnityProcedures: {
        unacceptable: [
            {
                text: "ProdCo shall provide notice of any claim within five (5) business days of receipt, failing which ProdCo's indemnification rights shall be deemed waived.",
                verdict: "UNACCEPTABLE",
                reason: "Unreasonably short notice period with automatic forfeiture"
            },
            {
                text: "Amazon shall have sole control over the defense and settlement of any claim, including the right to settle claims without ProdCo's consent even where such settlement includes admissions of liability.",
                verdict: "UNACCEPTABLE",
                reason: "Sole control with settlement imposing liability without consent"
            }
        ],
        acceptable: [
            {
                text: "The Indemnifying Party shall provide prompt written notice of any claim, but in no event later than thirty (30) days after becoming aware of such claim. Failure to provide timely notice shall not relieve the Indemnified Party of its obligations except to the extent such failure materially prejudices the defense.",
                verdict: "ACCEPTABLE",
                reason: "Reasonable notice period with prejudice qualification"
            }
        ]
    },
    Insurance: {
        unacceptable: [
            {
                text: "ProdCo shall maintain insurance coverage as Amazon may reasonably require from time to time.",
                verdict: "UNACCEPTABLE",
                reason: "Open-ended requirement without specified limits"
            },
            {
                text: "Insurance shall be maintained with insurers having a minimum Best's rating of A+XV, and ProdCo shall provide certificates of insurance within seven (7) days of Amazon's request.",
                verdict: "UNACCEPTABLE",
                reason: "Unreasonably high rating requirement limiting market options"
            }
        ],
        acceptable: [
            {
                text: "ProdCo shall maintain commercial general liability insurance with limits not less than $5,000,000 per occurrence and $10,000,000 in the aggregate, with insurers rated A-VII or better by A.M. Best.",
                verdict: "ACCEPTABLE",
                reason: "Specified limits with reasonable rating requirement"
            }
        ]
    },
    IndemnityAmazon: {
        unacceptable: [
            {
                text: "Amazon agrees to indemnify ProdCo on the same terms and conditions as ProdCo's indemnification of Amazon.",
                verdict: "UNACCEPTABLE",
                reason: "Inappropriately symmetric indemnification"
            }
        ],
        acceptable: [
            {
                text: "Amazon shall indemnify ProdCo against third-party claims arising from Amazon's gross negligence or willful misconduct in operating the Amazon Service.",
                verdict: "ACCEPTABLE",
                reason: "Appropriately limited to Amazon's fault"
            }
        ]
    }
};

// =========================================================================
// CG-010: Standard Positions for Auto-Redline (Legal-vetted replacement text)
// All 26 families with legal-vetted replacement text (Appendix F)
// =========================================================================
const STANDARD_POSITIONS = {
    // ========== CRITICAL PRIORITY - ORIGINAL 5 ==========
    LiabilityLimitation: {
        priority: 'CRITICAL',
        summary: "Amazon's liability shall not be subject to mutual or symmetric caps. ProdCo liability caps are acceptable. Carve-outs required for gross negligence, willful misconduct, IP infringement, and confidentiality breaches.",
        replacement_text: "Notwithstanding the foregoing, nothing in this Agreement shall limit Amazon's liability for (a) death or personal injury caused by Amazon's negligence, (b) fraud or fraudulent misrepresentation, (c) gross negligence or willful misconduct, (d) breach of confidentiality obligations, or (e) infringement of ProdCo's intellectual property rights.",
        delete_triggers: ["shall not exceed", "aggregate liability", "capped at", "neither party shall be liable", "mutual limitation"]
    },
    IndemnityProdCo: {
        priority: 'CRITICAL',
        summary: "ProdCo shall provide broad, uncapped indemnification to Amazon covering IP infringement, product liability, regulatory violations, and third-party claims arising from ProdCo's content or products.",
        replacement_text: "ProdCo shall indemnify, defend, and hold harmless Amazon and its affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to: (a) ProdCo's breach of any representation, warranty, or obligation under this Agreement; (b) any claim that ProdCo's content, products, or services infringe any third-party intellectual property rights; (c) any product liability claims; and (d) ProdCo's violation of applicable laws or regulations.",
        delete_triggers: ["mutual indemnification", "each party shall indemnify", "capped at"]
    },
    IndemnityAmazon: {
        priority: 'CRITICAL',
        summary: "Amazon's indemnification shall be limited to claims arising from Amazon's gross negligence or willful misconduct in operating the Amazon Service. Symmetric indemnification is not acceptable.",
        replacement_text: "Amazon shall indemnify ProdCo against third-party claims to the extent arising directly from Amazon's gross negligence or willful misconduct in operating the Amazon Service, excluding any claims related to ProdCo's content, products, or instructions.",
        delete_triggers: ["same terms and conditions", "mutual indemnification", "symmetric"]
    },
    IndemnityProcedures: {
        priority: 'CRITICAL',
        summary: "Notice periods shall be reasonable (minimum 30 days). Failure to provide timely notice shall only reduce obligations to extent of actual prejudice. Settlement requires consent for admissions of liability.",
        replacement_text: "The Indemnifying Party shall provide prompt written notice of any claim, but in no event later than thirty (30) days after becoming aware of such claim. Failure to provide timely notice shall not relieve the Indemnifying Party of its obligations except to the extent such failure materially prejudices the defense. No settlement that admits liability or imposes obligations on the Indemnified Party shall be made without such party's prior written consent.",
        delete_triggers: ["five (5) business days", "deemed waived", "sole control", "without consent"]
    },
    Insurance: {
        priority: 'HIGH',
        summary: "Insurance requirements shall be specific and reasonable. Limits must be stated. Insurer rating requirements shall be A-VII or equivalent (not A+XV). Certificate delivery within 30 days.",
        replacement_text: "ProdCo shall maintain commercial general liability insurance with limits not less than $5,000,000 per occurrence and $10,000,000 in the aggregate, with insurers rated A-VII or better by A.M. Best. Certificates of insurance shall be provided within thirty (30) days of Amazon's written request.",
        delete_triggers: ["as Amazon may reasonably require", "from time to time", "A+XV", "seven (7) days"]
    },

    // ========== CRITICAL PRIORITY - NEW FROM LEGAL ==========
    TerminationRights: {
        priority: 'CRITICAL',
        summary: "Amazon shall have broad termination rights. ProdCo's termination rights shall be limited to material payment breaches only.",
        replacement_text: "Amazon may terminate this Agreement: (a) at any time for convenience upon thirty (30) days prior written notice to ProdCo; (b) immediately upon written notice if ProdCo commits a material breach of this Agreement that is not cured within ten (10) days after written notice thereof (or, if such breach is not capable of cure, immediately upon notice); or (c) immediately if ProdCo becomes insolvent, files for bankruptcy, or ceases to conduct business in the normal course. ProdCo may terminate this Agreement only upon Amazon's material breach of its payment obligations that remains uncured for thirty (30) days following ProdCo's written notice specifying such breach in reasonable detail.",
        delete_triggers: ["ProdCo may terminate for any reason", "ProdCo may terminate for convenience", "mutual termination for convenience", "either party may terminate at will", "immediate termination by ProdCo", "ProdCo may terminate upon notice", "termination requires mutual consent", "cure period exceeding thirty (30) days"]
    },
    TerminationConsequences: {
        priority: 'CRITICAL',
        summary: "All rights granted to Amazon shall survive termination. Key provisions survive indefinitely.",
        replacement_text: "Upon termination or expiration of this Agreement: (a) all rights granted to Amazon in any materials delivered prior to termination shall survive in perpetuity and remain fully vested in Amazon; (b) ProdCo shall immediately return or, at Amazon's option, destroy all Amazon Confidential Information and certify such destruction in writing; (c) Amazon shall pay ProdCo only for services satisfactorily performed and accepted by Amazon through the effective date of termination, less any amounts previously paid; (d) ProdCo shall deliver to Amazon all work-in-progress, raw footage, and production materials created through the termination date; and (e) the provisions of Sections [Indemnification], [Confidentiality], [Limitation of Liability], [Representations and Warranties], and [General Provisions] shall survive termination indefinitely.",
        delete_triggers: ["rights shall revert to ProdCo", "rights revert upon termination", "turnaround rights", "full payment upon termination", "kill fee equal to", "pay the full remaining", "accelerated payment", "survival period of one (1) year", "survival period of two (2) years", "limited survival"]
    },
    RightsGrant: {
        priority: 'CRITICAL',
        summary: "All rights in Program and Program Materials shall be owned exclusively by Amazon. Works made for hire with full assignment of all rights.",
        replacement_text: "All right, title, and interest in and to the Program, including without limitation all episodes, versions, edits, clips, stills, artwork, music, scripts, characters, storylines, and all other materials created in connection with the Program (collectively, \"Program Materials\"), shall be owned exclusively by Amazon. The Program Materials shall be considered \"works made for hire\" for Amazon under applicable copyright law. To the extent any Program Materials do not qualify as works made for hire, ProdCo hereby irrevocably assigns to Amazon all right, title, and interest therein, including all copyrights, in perpetuity and throughout the universe, in all media and formats now known or hereafter devised.",
        delete_triggers: ["ProdCo retains", "ProdCo reserves", "retained rights", "reserved rights", "rights shall revert", "non-exclusive license", "limited term", "license term of", "territory limited to", "co-ownership", "joint ownership"]
    },
    RightsReversion: {
        priority: 'CRITICAL',
        summary: "No reversion, turnaround, or recapture of any rights under any circumstances.",
        replacement_text: "All rights granted to Amazon hereunder are granted irrevocably and in perpetuity. There shall be no reversion, turnaround, or recapture of any rights under any circumstances, including without limitation non-production, non-exploitation, passage of time, or any breach or termination of this Agreement. For the avoidance of doubt, ProdCo acknowledges and agrees that Amazon shall have no obligation to produce, release, distribute, or otherwise exploit the Program, and any decision by Amazon not to do so shall not give rise to any reversion or recapture rights.",
        delete_triggers: ["rights shall revert", "reversion", "turnaround", "recapture", "right of first refusal", "right of last refusal", "if Amazon fails to exploit", "if Amazon does not produce", "automatic reversion", "rights return to ProdCo", "put option"]
    },
    AuditRights: {
        priority: 'CRITICAL',
        summary: "Amazon shall have broad audit rights. ProdCo shall not have audit rights over Amazon.",
        replacement_text: "Amazon and its authorized representatives shall have the right, upon not less than ten (10) business days prior written notice, to inspect and audit ProdCo's books, records, accounts, contracts, and documentation relating to this Agreement. Such audits may be conducted during normal business hours at ProdCo's principal place of business. ProdCo shall cooperate fully with any such audit and shall provide Amazon with reasonable access to personnel and records. ProdCo shall maintain all such records for a period of not less than five (5) years following the relevant transaction.",
        delete_triggers: ["ProdCo may audit Amazon", "mutual audit rights", "audit Amazon's books", "Amazon shall provide records", "reasonable advance notice of sixty (60) days", "ninety (90) days notice", "audit costs borne by Amazon"]
    },

    // ========== HIGH PRIORITY ==========
    PaymentCredits: {
        priority: 'HIGH',
        summary: "Payment terms subject to delivery acceptance. No MFN, no gross participations, no pay-or-play.",
        replacement_text: "Amazon shall pay ProdCo the Production Fee set forth in Exhibit A, payable as follows: (a) twenty percent (20%) upon execution of this Agreement and commencement of pre-production services; (b) sixty percent (60%) upon commencement of principal photography, payable in weekly installments proportionate to the production schedule; and (c) twenty percent (20%) upon delivery and acceptance by Amazon of the final master of each episode. All payments shall be subject to ProdCo's compliance with the approved budget and delivery schedule.",
        delete_triggers: ["most favored nations", "most favored", "MFN", "favored nations", "pari passu", "equal to the highest", "gross receipts", "first dollar gross", "full payment upon signing", "payment in advance", "kill fee", "pay or play"]
    },
    RepsProdCo: {
        priority: 'HIGH',
        summary: "Absolute representations and warranties without knowledge qualifiers. Survive in perpetuity.",
        replacement_text: "ProdCo represents, warrants, and covenants to Amazon that: (a) ProdCo has full right, power, and authority to enter into this Agreement and to grant the rights granted herein; (b) the Program and all Program Materials will be original or ProdCo will have obtained all necessary rights, licenses, clearances, and permissions for use thereof; (c) the Program and Program Materials will not infringe upon or violate any copyright, trademark, patent, trade secret, right of privacy, right of publicity, or any other right of any third party; (d) there are no claims, litigation, or proceedings pending or threatened against ProdCo that would adversely affect ProdCo's ability to perform hereunder or Amazon's rights in the Program. These representations and warranties shall survive in perpetuity.",
        delete_triggers: ["to ProdCo's knowledge", "to the best of ProdCo's knowledge", "to ProdCo's actual knowledge", "ProdCo is not aware", "material breach", "materially infringe", "in all material respects", "best efforts", "reasonable efforts", "survival period of", "representations expire"]
    },
    Confidentiality: {
        priority: 'HIGH',
        summary: "Strict confidentiality obligations surviving indefinitely. No residual knowledge exceptions.",
        replacement_text: "Each party agrees to maintain in strict confidence all Confidential Information of the other party and to use such Confidential Information solely for the purposes of this Agreement. With respect to Amazon, Confidential Information also includes all information regarding Amazon's programming strategy, release schedules, viewership data, subscriber information, and internal business processes. These confidentiality obligations shall survive indefinitely.",
        delete_triggers: ["confidentiality period of", "obligations expire after", "three (3) year confidentiality", "five (5) year confidentiality", "upon termination, confidentiality obligations cease", "ProdCo may retain copies", "residual knowledge", "general skills and knowledge"]
    },
    DataProtection: {
        priority: 'HIGH',
        summary: "ProdCo as processor only. Amazon as controller. Full audit and compliance rights.",
        replacement_text: "To the extent ProdCo processes any Personal Data on behalf of Amazon in connection with this Agreement, ProdCo shall: (a) process such Personal Data only in accordance with Amazon's documented instructions; (b) implement appropriate technical and organizational measures; (c) not engage any sub-processor without Amazon's prior written consent; (d) assist Amazon in responding to data subject requests; (e) notify Amazon without undue delay upon becoming aware of any Personal Data breach; (f) upon termination, return or delete all Personal Data as directed by Amazon.",
        delete_triggers: ["ProdCo is the controller", "ProdCo as data controller", "joint controllers", "co-controllers", "ProdCo determines the purposes", "ProdCo's privacy policy shall govern", "sub-processors at ProdCo's discretion"]
    },
    DisputeResolution: {
        priority: 'HIGH',
        summary: "California law, JAMS arbitration in Los Angeles. No jury trial.",
        replacement_text: "This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of laws principles. Any dispute arising out of or relating to this Agreement shall be resolved by binding arbitration administered by JAMS in Los Angeles, California. Each party irrevocably waives any right to trial by jury.",
        delete_triggers: ["laws of England", "English law", "laws of the United Kingdom", "Swiss law", "ProdCo's jurisdiction", "ICC arbitration", "LCIA arbitration", "litigation only", "no arbitration", "jury trial preserved"]
    },
    ForceMajeure: {
        priority: 'HIGH',
        summary: "Amazon may terminate after 30 days of force majeure. Payment only for services rendered.",
        replacement_text: "Neither party shall be liable for any failure or delay in performing its obligations (other than payment obligations) to the extent such failure or delay results from causes beyond such party's reasonable control. If a Force Majeure Event continues for more than thirty (30) consecutive days, Amazon may, at its option: (a) suspend the production schedule and extend all delivery dates; or (b) terminate this Agreement without further liability except for payment for services satisfactorily rendered prior to termination.",
        delete_triggers: ["commercially impracticable", "economically impracticable", "significantly more expensive", "ProdCo may terminate for force majeure", "continue making payments during force majeure", "Amazon waives right to terminate", "full remaining Production Fee"]
    },

    // ========== MEDIUM PRIORITY ==========
    Assignment: {
        priority: 'MEDIUM',
        summary: "Amazon may freely assign. ProdCo requires Amazon's prior written consent.",
        replacement_text: "Amazon may assign this Agreement, in whole or in part, to any affiliate or to any entity that acquires all or substantially all of Amazon's assets or business relating to the Program, without ProdCo's consent. ProdCo may not assign this Agreement without Amazon's prior written consent, which may be withheld in Amazon's sole discretion.",
        delete_triggers: ["neither party may assign", "mutual consent required for assignment", "ProdCo may assign to affiliates", "ProdCo may freely assign", "assignment upon notice"]
    },
    Publicity: {
        priority: 'MEDIUM',
        summary: "Amazon has sole control over all publicity. ProdCo requires approval for any statements.",
        replacement_text: "Amazon shall have sole and exclusive control over all publicity, marketing, advertising, and promotion of the Program. ProdCo shall not issue any press release, public announcement, or other public statement regarding this Agreement or the Program without Amazon's prior written approval.",
        delete_triggers: ["mutual approval of publicity", "ProdCo may issue press releases", "ProdCo may reference the Program", "ProdCo may use Amazon's name", "joint marketing", "co-branded"]
    },
    ServicesScope: {
        priority: 'MEDIUM',
        summary: "Amazon has final approval over all creative elements. Scope may be modified by Amazon.",
        replacement_text: "ProdCo shall provide all production services necessary to produce the Program in accordance with the specifications, budget, and schedule set forth in the attached Exhibits. Amazon shall have the right to modify the scope of services at any time upon written notice. Amazon shall have final approval over all creative elements including scripts, casting, director selection, locations, and final cut.",
        delete_triggers: ["ProdCo shall have final creative control", "ProdCo's creative vision", "creative decisions by ProdCo", "final cut by ProdCo", "scope cannot be modified", "Amazon may not change specifications"]
    },
    AmazonControl: {
        priority: 'MEDIUM',
        summary: "Amazon has sole control over exploitation. No obligation to produce or release.",
        replacement_text: "Amazon shall have sole and exclusive control over all aspects of the exploitation of the Program, including the timing, manner, and extent of any release, distribution, or exhibition. Amazon's decisions in these matters shall be final. Amazon shall have no obligation to produce, release, distribute, or otherwise exploit the Program.",
        delete_triggers: ["mutual agreement on release", "ProdCo approval of release date", "ProdCo consultation on pricing", "shared control", "joint decision", "Amazon shall consult with ProdCo", "guaranteed release", "commitment to release"]
    },
    SurvivalRemedies: {
        priority: 'MEDIUM',
        summary: "Key provisions survive indefinitely. Cumulative remedies.",
        replacement_text: "The following provisions shall survive any termination or expiration of this Agreement indefinitely: (a) all grants of rights to Amazon; (b) all indemnification obligations; (c) all confidentiality obligations; (d) all representations and warranties; (e) limitation of liability; (f) audit rights. The rights and remedies provided herein are cumulative and not exclusive.",
        delete_triggers: ["survival period of one (1) year", "survival period of two (2) years", "survival period of five (5) years", "limited survival", "obligations terminate upon expiration", "exclusive remedy", "sole remedy"]
    },

    // ========== LOW PRIORITY ==========
    GeneralProvisions: {
        priority: 'LOW',
        summary: "Entire agreement. Written amendments only. Severability. No implied waiver.",
        replacement_text: "This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations and agreements. This Agreement may not be amended except by a written instrument signed by both parties. If any provision is held invalid, the remaining provisions shall continue in full force and effect. No waiver shall be effective unless in writing.",
        delete_triggers: ["oral modifications permitted", "course of dealing shall modify", "implied waiver", "waiver by conduct", "failure to enforce constitutes waiver"]
    },
    ThirdPartyCredits: {
        priority: 'LOW',
        summary: "ProdCo responsible for credit compliance. No breach for inadvertent credit failures.",
        replacement_text: "ProdCo shall ensure that all third-party credit obligations arising from agreements entered into by ProdCo are properly documented and disclosed to Amazon. ProdCo shall be solely responsible for compliance with all such credit obligations. No inadvertent failure to accord credit shall constitute a breach of this Agreement, and ProdCo's sole remedy shall be prospective correction.",
        delete_triggers: ["Amazon guarantees credit placement", "credit failure constitutes material breach", "ProdCo may terminate for credit failure", "Amazon responsible for third-party credits"]
    },
    MoralRights: {
        priority: 'LOW',
        summary: "Full waiver of moral rights. Amazon may modify without attribution or approval.",
        replacement_text: "To the fullest extent permitted by applicable law, ProdCo hereby irrevocably waives and agrees not to assert any and all moral rights in and to the Program and all Program Materials. ProdCo shall obtain equivalent waivers from all contributors. Amazon may modify, adapt, and create derivative works without attribution or approval.",
        delete_triggers: ["moral rights reserved", "right of integrity", "right of paternity", "right of attribution", "droit moral", "ProdCo approval of modifications", "approval of derivative works"]
    },
    AIPolicy: {
        priority: 'LOW',
        summary: "No Generative AI without prior written approval. Full disclosure and indemnification required.",
        replacement_text: "ProdCo shall not use any generative artificial intelligence tools to create any portion of the Program or Program Materials without Amazon's prior written approval. If approved, ProdCo shall maintain detailed records, disclose all AI-assisted content, ensure human review, warrant non-infringement, and indemnify Amazon for any claims arising from AI use.",
        delete_triggers: ["ProdCo may use AI at its discretion", "AI use permitted without approval", "no disclosure required", "AI content treated as original", "Amazon assumes risk of AI content"]
    },
    KeyPersons: {
        priority: 'LOW',
        summary: "Key Persons essential. No replacement without Amazon approval. Amazon may terminate if unavailable.",
        replacement_text: "The individuals identified as Key Persons are deemed essential to Amazon's decision to enter into this Agreement. ProdCo shall not replace any Key Person without Amazon's prior written approval. If any Key Person becomes unavailable, Amazon may approve a replacement, assume direct engagement, or terminate this Agreement.",
        delete_triggers: ["Key Persons at ProdCo's discretion", "ProdCo may replace Key Persons", "Amazon's approval not required for replacement", "non-exclusive services", "no attachment requirement"]
    }
};

/**
 * Get standard position for a family, with fallback
 * @param {string} familyId - The family identifier
 * @param {object} playbookSpec - The playbook spec from database (optional)
 * @returns {object} - { summary, replacement_text, delete_triggers }
 */
function getStandardPosition(familyId, playbookSpec = null) {
    // First try hardcoded STANDARD_POSITIONS (CG-010)
    if (STANDARD_POSITIONS[familyId]) {
        return STANDARD_POSITIONS[familyId];
    }

    // Then try playbookSpec from database
    if (playbookSpec?.amazon_position?.summary) {
        return {
            summary: playbookSpec.amazon_position.summary,
            replacement_text: playbookSpec.amazon_position.standard_clause || playbookSpec.amazon_position.summary,
            delete_triggers: []
        };
    }

    // No standard position available
    return null;
}

function formatFewShotExamples(familyId) {
    const examples = FEW_SHOT_EXAMPLES[familyId];
    if (!examples) return '';

    let out = '\n\nLEGAL TEAM FEW-SHOT EXAMPLES (CG-018 vetted):';

    if (examples.unacceptable && examples.unacceptable.length) {
        out += '\n\n  UNACCEPTABLE (must flag as RED):';
        examples.unacceptable.forEach((ex, i) => {
            out += `\n    ${i + 1}. "${ex.text.slice(0, 300)}..."`;
            out += `\n       → ${ex.verdict}: ${ex.reason}`;
        });
    }

    if (examples.acceptable && examples.acceptable.length) {
        out += '\n\n  ACCEPTABLE (GREEN if matches):';
        examples.acceptable.forEach((ex, i) => {
            out += `\n    ${i + 1}. "${ex.text.slice(0, 300)}..."`;
            out += `\n       → ${ex.verdict}: ${ex.reason}`;
        });
    }

    return out;
}

// -------------------------
// Build Prompts
// -------------------------
let paranoidSystem, valuatorSystem, TH_ANCHOR;

if (playbookSpec && playbookSpec.amazon_position) {
    const pos = playbookSpec.amazon_position || {};
    const matrix = playbookSpec.acceptability_matrix || {};
    const detection = playbookSpec.detection_patterns || {};
    const risk = playbookSpec.risk_assessment || {};

    // CG-018: Inject few-shot examples for critical families
    const fewShotBlock = formatFewShotExamples(playbookSpec.family_id);

    // CG-010: Get standard position for auto-redline
    const stdPos = getStandardPosition(playbookSpec.family_id, playbookSpec);

    // PARANOID SYSTEM PROMPT (English, imperative, v2.0)
    paranoidSystem = `PARANOID ANALYSIS AGENT — ${playbookSpec.display_name}
Version: 2.1 | Family: ${playbookSpec.family_id} | Priority: ${playbookSpec.priority}

YOUR MISSION
You must identify EVERY deviation, risk, or concern with HIGH RECALL.
False positives are acceptable. False negatives are NOT acceptable.

CRITICAL RULE (NO EMPTY OBSERVATIONS)
If ANY red_flag is found OR ANY unacceptable pattern is matched OR ANY must-have is missing:
- observations.length MUST be > 0
- risk_level MUST be RED or YELLOW (never GREEN)

MATCHING RULES (DETERMINISTIC)
- Match is case-insensitive and whitespace-tolerant.
- evidence MUST be an exact substring from clause_text.
- offsets are 0-indexed character positions in clause_text.
- If a must-have is missing: evidence = "[missing: <anchor>]" and offsets = {start:0,end:0}

AMAZON STANDARD POSITION
${pos.summary || 'Not defined'}

CORE REQUIREMENTS
${formatCoreRequirements(pos.core_requirements)}

MUST-HAVE ANCHORS (required elements)
${formatMustHave(detection.must_have)}

RED FLAGS (report immediately if found)
${formatRedFlags(detection.red_flags)}

UNACCEPTABLE PATTERNS (must reject if matched)
${formatUnacceptable(matrix?.unacceptable?.patterns)}

PASSABLE VARIATIONS (acceptable only with legal approval)
${formatPassable(matrix?.passable?.variations)}

ACCEPTABLE EXAMPLES (fully compliant language)
${formatAcceptable(matrix?.acceptable?.examples)}

ESCALATION TRIGGERS
${formatEscalationTriggers(risk.escalation_triggers)}
${fewShotBlock}

OUTPUT FORMAT (JSON ONLY)
Return exactly this structure:
{
  "observations": [
    {
      "evidence": "exact substring from clause_text OR [missing: <anchor>]",
      "offsets": { "start": 0, "end": 0 },
      "change_type": "missing|added|modified",
      "possible_category": "MatchesUnacceptable|MissingRequired|PassableVariation|UnknownChange",
      "pattern_matched": "red_flag OR pattern name",
      "confidence": 0.0,
      "severity": "high|medium|low",
      "reason": "brief explanation",
      "playbook_reference": "pattern id or null"
    }
  ],
  "summary": {
    "counts": {"total": 0, "missing": 0, "added": 0, "modified": 0},
    "coverage_confidence": 0.0,
    "red_flags_found": 0,
    "unacceptable_patterns_found": 0,
    "must_have_missing": 0
  },
  "risk_level": "RED|YELLOW|GREEN"
}`;

    // VALUATOR SYSTEM PROMPT (English, deterministic)
    valuatorSystem = `VALUATOR AGENT — ${playbookSpec.display_name}
Version: 2.1 | Mode: MODE_ENUMERATED_DEVIATIONS | Priority: ${playbookSpec.priority}

YOUR MISSION
Based on Paranoid observations, determine final_status and propose changes.

RULES
1. NO NEW TEXT - proposed replacement_text MUST come from playbook standard_position or fallback_clauses
2. SOURCE REQUIRED - every proposed_change needs source_reference with exact_text
3. DETERMINISTIC MAPPING:
   - observations contains MatchesUnacceptable → final_status = UnacceptableDeviation
   - observations contains MissingRequired → final_status = UnacceptableDeviation  
   - observations only PassableVariation → final_status = AcceptableDeviation
   - observations empty AND risk_level=GREEN → final_status = Compliant
4. ESCALATE ON UNCERTAINTY - if confidence_overall < 0.75 → escalation_recommended = true
5. GENERATE CHANGES - for each UnacceptableDeviation observation, create a proposed_change using the replacement_text below

STANDARD POSITION (use as source for replacement_text):
${stdPos?.summary || pos.summary || 'Not defined'}

REPLACEMENT TEXT (use verbatim in proposed_changes):
${stdPos?.replacement_text || 'Not available - escalate instead of suggesting changes'}

DELETE TRIGGERS (text patterns to target for deletion/replacement):
${(stdPos?.delete_triggers || []).map(t => `  • "${t}"`).join('\n') || '  • None defined'}

OUTPUT FORMAT (JSON ONLY):
{
  "final_status": "Compliant|AcceptableDeviation|UnacceptableDeviation|Ambiguous",
  "escalation_recommended": false,
  "escalation_reason": null,
  "proposed_changes": [
    {
      "target_text": "exact text from clause to replace",
      "replacement_text": "text from playbook standard_position",
      "change_type": "delete|replace|insert",
      "priority": "critical|high|medium",
      "source_reference": {
        "type": "standard_position|fallback_clause",
        "exact_text": "verbatim from playbook"
      }
    }
  ],
  "confidence_overall": 0.0
}`;

    TH_ANCHOR = playbookSpec.priority === 'CRITICAL' ? 0.86 : 0.85;

} else {
    // CG-018 FIX: Inject few-shot examples even without playbookSpec
    // Uses detected family from Router to provide grounding examples
    const fewShotBlock = formatFewShotExamples(family);

    // Fallback for families without playbookSpec but WITH few-shot examples
    paranoidSystem = `PARANOID ANALYSIS AGENT — ${family}
Family: ${family} | Status: LIMITED PLAYBOOK (Few-Shot Only)

YOUR MISSION
This clause family has limited playbook specification but LEGAL-VETTED EXAMPLES.
Analyze defensively using the examples as grounding.

ANALYZE FOR:
1. Party obligations and responsibilities
2. Timelines and conditions
3. Exclusions and limitations
4. Escape clauses or penalties
5. Any unusual or concerning language
6. MATCH clause against few-shot examples below

CRITICAL MATCHING RULES:
- If clause matches ANY UNACCEPTABLE example → risk_level = RED
- If clause matches ANY ACCEPTABLE example → risk_level = GREEN
- Otherwise → risk_level = YELLOW (escalate)
${fewShotBlock}

OUTPUT FORMAT:
{
  "observations": [
    {
      "evidence": "exact substring from clause_text",
      "offsets": { "start": 0, "end": 0 },
      "change_type": "added|modified|missing",
      "possible_category": "MatchesUnacceptable|MatchesAcceptable|UnknownChange",
      "pattern_matched": "description of matched pattern",
      "confidence": 0.0,
      "severity": "high|medium|low",
      "reason": "brief explanation",
      "playbook_reference": null
    }
  ],
  "summary": { "counts": {...}, "coverage_confidence": 0.0 },
  "risk_level": "RED|YELLOW|GREEN",
  "matched_few_shot": "description if matched"
}

IMPORTANT: Use few-shot examples as primary grounding for judgment.`;

    valuatorSystem = `VALUATOR AGENT — ${family}
Status: LIMITED PLAYBOOK (Few-Shot Only)

RULES:
1. If observations contain MatchesUnacceptable → final_status = UnacceptableDeviation
2. If observations contain MatchesAcceptable → final_status = Compliant
3. Otherwise → final_status = Ambiguous, escalation_recommended = true
4. No proposed_changes (no standard_position available)

OUTPUT FORMAT:
{
  "final_status": "Compliant|AcceptableDeviation|UnacceptableDeviation|Ambiguous",
  "escalation_recommended": true,
  "escalation_reason": "Limited playbook for ${family}",
  "proposed_changes": [],
  "confidence_overall": 0.0
}`;

    TH_ANCHOR = 0.85;
}

// -------------------------
// Build User Message (with RAG context)
// -------------------------
const ragBlock = `
RAG CONTEXT (for grounding only — DO NOT use as evidence; evidence must come from clause_text):
${formatRagExamples(ragContext)}`;

const paranoidUserMessage = `CLAUSE TEXT TO ANALYZE:
---
${clauseText}
---

${ragBlock}

INSTRUCTIONS:
1. First, check for ALL red flags (literal matches, case-insensitive)
2. Then, check for ALL must-have anchors (report missing ones)
3. Then, check for unacceptable patterns using examples for semantic matching
4. Finally, check for passable variations

Report EVERY finding with:
- evidence: exact substring from clause_text (or [missing: X])
- offsets: character positions in clause_text
- severity: high for red_flags/unacceptable, medium for passable, low for unknown

RESPOND ONLY WITH JSON.`;

// Build complete messages for OpenAI
const paranoidMessages = [
    { role: 'system', content: paranoidSystem },
    { role: 'user', content: paranoidUserMessage }
];

return [{
    json: {
        ...data,
        paranoidMessages,
        paranoidSystemPrompt: paranoidSystem,
        paranoidUserPrompt: paranoidUserMessage,
        valuatorSystemPrompt: valuatorSystem,
        TH_ANCHOR: TH_ANCHOR,
        usedDynamicPrompt: !!playbookSpec,
        promptVersion: '2.1',
        ragInjected: !!(ragContext && Object.keys(ragContext).length),
        fewShotInjected: FEW_SHOT_EXAMPLES.hasOwnProperty(family) || FEW_SHOT_EXAMPLES.hasOwnProperty(playbookSpec?.family_id)
    }
}];
