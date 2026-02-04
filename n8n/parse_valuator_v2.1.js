// =====================================================
// Parse Valuator v2.1 (CG-012-FIX + CG-018 Auto-Correction)
// =====================================================
// This fix resolves:
// 1. Status override: if red flags → UnacceptableDeviation
// 2. Auto escalation for critical clauses
// 3. CG-018: Confidence consistency validation
// 4. CG-018: Proposed changes validation
// 5. CG-018: Deterministic status mapping
// =====================================================

const prevData = $('Parse Paranoid').first().json;
let valuatorOutput = {
    decision: 'ACCEPT',
    final_status: 'Compliant',
    needs_review: false,
    proposed_changes: [],
    internal_comment: '',
    client_state: 'OK',
    confidence_overall: 0.5,
    confidences: { anchor_confidence: 0.5 }
};
let validationErrors = prevData.paranoidValidationErrors || [];

// Parse LLM output
try {
    const raw = $json.choices?.[0]?.message?.content || '{}';
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    valuatorOutput = JSON.parse(cleaned);
} catch (e) {
    validationErrors.push({ field: 'valuator_json_parse', error: e.message, auto_fixed: false });
}

// Get paranoid analysis results
const paranoidOutput = prevData.paranoidOutput || {};
const observations = paranoidOutput.observations || [];
const redFlagHits = prevData._redFlagHits || [];
const riskLevel = paranoidOutput.risk_level || 'GREEN';

// CG-018: Deterministic status mapping
const hasUnacceptable = observations.some(o =>
    o.possible_category === 'MatchesUnacceptable' ||
    o.possible_category === 'MissingRequired'
);
const hasHighSeverity = observations.some(o => o.severity === 'high');
const hasPassable = observations.some(o => o.possible_category === 'PassableVariation');

let determinedStatus;
let determinedClientState;

if (hasUnacceptable || hasHighSeverity || riskLevel === 'RED') {
    determinedStatus = 'UnacceptableDeviation';
    determinedClientState = 'NEEDS_REDLINE';
} else if (hasPassable || riskLevel === 'YELLOW') {
    determinedStatus = 'AcceptableDeviation';
    determinedClientState = 'NEEDS_REVIEW';
} else if (observations.length === 0) {
    determinedStatus = 'Compliant';
    determinedClientState = 'OK';
} else {
    determinedStatus = 'AcceptableDeviation';
    determinedClientState = 'NEEDS_REVIEW';
}

// Override if LLM status doesn't match deterministic result
if (valuatorOutput.final_status !== determinedStatus) {
    validationErrors.push({
        field: 'final_status',
        error: `LLM said ${valuatorOutput.final_status}, corrected to ${determinedStatus}`,
        auto_fixed: true
    });
    valuatorOutput.final_status = determinedStatus;
}

if (valuatorOutput.client_state !== determinedClientState) {
    valuatorOutput.client_state = determinedClientState;
}

// CG-018: Validate proposed_changes
if (!Array.isArray(valuatorOutput.proposed_changes)) {
    validationErrors.push({
        field: 'proposed_changes',
        error: 'Not an array',
        auto_fixed: true
    });
    valuatorOutput.proposed_changes = [];
}

// =========================================================================
// CG-010: Auto-generate proposed_changes if LLM didn't provide them
// All 26 families with legal-vetted replacement text (Appendix F)
// =========================================================================
const STANDARD_POSITIONS = {
    // ========== CRITICAL PRIORITY - ORIGINAL 5 ==========
    LiabilityLimitation: {
        priority: 'CRITICAL',
        replacement_text: "Notwithstanding the foregoing, nothing in this Agreement shall limit Amazon's liability for (a) death or personal injury caused by Amazon's negligence, (b) fraud or fraudulent misrepresentation, (c) gross negligence or willful misconduct, (d) breach of confidentiality obligations, or (e) infringement of ProdCo's intellectual property rights.",
        delete_triggers: ["shall not exceed", "aggregate liability", "capped at", "neither party shall be liable", "mutual limitation"]
    },
    IndemnityProdCo: {
        priority: 'CRITICAL',
        replacement_text: "ProdCo shall indemnify, defend, and hold harmless Amazon and its affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to: (a) ProdCo's breach of any representation, warranty, or obligation under this Agreement; (b) any claim that ProdCo's content, products, or services infringe any third-party intellectual property rights; (c) any product liability claims; and (d) ProdCo's violation of applicable laws or regulations.",
        delete_triggers: ["mutual indemnification", "each party shall indemnify", "capped at"]
    },
    IndemnityAmazon: {
        priority: 'CRITICAL',
        replacement_text: "Amazon shall indemnify ProdCo against third-party claims to the extent arising directly from Amazon's gross negligence or willful misconduct in operating the Amazon Service, excluding any claims related to ProdCo's content, products, or instructions.",
        delete_triggers: ["same terms and conditions", "mutual indemnification", "symmetric"]
    },
    IndemnityProcedures: {
        priority: 'CRITICAL',
        replacement_text: "The Indemnifying Party shall provide prompt written notice of any claim, but in no event later than thirty (30) days after becoming aware of such claim. Failure to provide timely notice shall not relieve the Indemnifying Party of its obligations except to the extent such failure materially prejudices the defense. No settlement that admits liability or imposes obligations on the Indemnified Party shall be made without such party's prior written consent.",
        delete_triggers: ["five (5) business days", "deemed waived", "sole control", "without consent"]
    },
    Insurance: {
        priority: 'HIGH',
        replacement_text: "ProdCo shall maintain commercial general liability insurance with limits not less than $5,000,000 per occurrence and $10,000,000 in the aggregate, with insurers rated A-VII or better by A.M. Best. Certificates of insurance shall be provided within thirty (30) days of Amazon's written request.",
        delete_triggers: ["as Amazon may reasonably require", "from time to time", "A+XV", "seven (7) days"]
    },

    // ========== CRITICAL PRIORITY - NEW FROM LEGAL ==========
    TerminationRights: {
        priority: 'CRITICAL',
        replacement_text: "Amazon may terminate this Agreement: (a) at any time for convenience upon thirty (30) days prior written notice to ProdCo; (b) immediately upon written notice if ProdCo commits a material breach of this Agreement that is not cured within ten (10) days after written notice thereof (or, if such breach is not capable of cure, immediately upon notice); or (c) immediately if ProdCo becomes insolvent, files for bankruptcy, or ceases to conduct business in the normal course. ProdCo may terminate this Agreement only upon Amazon's material breach of its payment obligations that remains uncured for thirty (30) days following ProdCo's written notice specifying such breach in reasonable detail.",
        delete_triggers: ["ProdCo may terminate for any reason", "ProdCo may terminate for convenience", "mutual termination for convenience", "either party may terminate at will", "immediate termination by ProdCo", "ProdCo may terminate upon notice", "termination requires mutual consent", "termination requires mutual agreement", "cure period exceeding thirty (30) days", "cure period exceeding 30 days", "sixty (60) day cure period", "ninety (90) day cure period"]
    },
    TerminationConsequences: {
        priority: 'CRITICAL',
        replacement_text: "Upon termination or expiration of this Agreement: (a) all rights granted to Amazon in any materials delivered prior to termination shall survive in perpetuity and remain fully vested in Amazon; (b) ProdCo shall immediately return or, at Amazon's option, destroy all Amazon Confidential Information and certify such destruction in writing; (c) Amazon shall pay ProdCo only for services satisfactorily performed and accepted by Amazon through the effective date of termination, less any amounts previously paid; (d) ProdCo shall deliver to Amazon all work-in-progress, raw footage, and production materials created through the termination date; and (e) the provisions of Sections [Indemnification], [Confidentiality], [Limitation of Liability], [Representations and Warranties], and [General Provisions] shall survive termination indefinitely.",
        delete_triggers: ["rights shall revert to ProdCo", "rights revert upon termination", "turnaround rights", "full payment upon termination", "kill fee equal to", "pay the full remaining", "accelerated payment", "survival period of one (1) year", "survival period of two (2) years", "survival period of three (3) years", "limited survival", "obligations terminate upon", "no further obligations"]
    },
    RightsGrant: {
        priority: 'CRITICAL',
        replacement_text: "All right, title, and interest in and to the Program, including without limitation all episodes, versions, edits, clips, stills, artwork, music, scripts, characters, storylines, and all other materials created in connection with the Program (collectively, \"Program Materials\"), shall be owned exclusively by Amazon. The Program Materials shall be considered \"works made for hire\" for Amazon under applicable copyright law. To the extent any Program Materials do not qualify as works made for hire, ProdCo hereby irrevocably assigns to Amazon all right, title, and interest therein, including all copyrights, in perpetuity and throughout the universe, in all media and formats now known or hereafter devised, including all rights of exploitation, distribution, reproduction, public performance, display, and creation of derivative works. ProdCo shall execute any documents reasonably requested by Amazon to evidence or perfect such ownership.",
        delete_triggers: ["ProdCo retains", "ProdCo reserves", "retained rights", "reserved rights", "rights shall revert", "non-exclusive license", "limited term", "license term of", "territory limited to", "limited territory", "excluding", "subject to ProdCo's prior rights", "co-ownership", "joint ownership", "shared ownership"]
    },
    RightsReversion: {
        priority: 'CRITICAL',
        replacement_text: "All rights granted to Amazon hereunder are granted irrevocably and in perpetuity. There shall be no reversion, turnaround, or recapture of any rights under any circumstances, including without limitation non-production, non-exploitation, passage of time, or any breach or termination of this Agreement. For the avoidance of doubt, ProdCo acknowledges and agrees that Amazon shall have no obligation to produce, release, distribute, or otherwise exploit the Program, and any decision by Amazon not to do so shall not give rise to any reversion or recapture rights.",
        delete_triggers: ["rights shall revert", "reversion", "turnaround", "recapture", "right of first refusal", "right of last refusal", "if Amazon fails to exploit", "if Amazon does not produce", "if Amazon abandons", "automatic reversion", "rights return to ProdCo", "put option", "buyback", "purchase option"]
    },
    AuditRights: {
        priority: 'CRITICAL',
        replacement_text: "Amazon and its authorized representatives shall have the right, upon not less than ten (10) business days prior written notice, to inspect and audit ProdCo's books, records, accounts, contracts, and documentation relating to this Agreement, including without limitation production costs, third-party payments, residuals, and any amounts payable to or from ProdCo in connection with the Program. Such audits may be conducted during normal business hours at ProdCo's principal place of business or such other location where records are maintained. ProdCo shall cooperate fully with any such audit and shall provide Amazon with reasonable access to personnel and records. Amazon may conduct such audits no more than once per calendar year, provided that this limitation shall not apply to any audit commenced in connection with a bona fide dispute. ProdCo shall maintain all such records for a period of not less than five (5) years following the relevant transaction.",
        delete_triggers: ["ProdCo may audit Amazon", "mutual audit rights", "audit Amazon's books", "Amazon shall provide records", "reasonable advance notice of sixty (60) days", "ninety (90) days notice", "audit costs borne by Amazon", "Amazon shall pay for audit", "one (1) audit per Agreement term", "audit only upon dispute", "records retention of one (1) year", "records retention of two (2) years"]
    },

    // ========== HIGH PRIORITY ==========
    PaymentCredits: {
        priority: 'HIGH',
        replacement_text: "Amazon shall pay ProdCo the Production Fee set forth in Exhibit A, payable as follows: (a) twenty percent (20%) upon execution of this Agreement and commencement of pre-production services; (b) sixty percent (60%) upon commencement of principal photography, payable in weekly installments proportionate to the production schedule; and (c) twenty percent (20%) upon delivery and acceptance by Amazon of the final master of each episode. All payments shall be subject to ProdCo's compliance with the approved budget and delivery schedule. Amazon shall have the right to withhold payment for any deliverable that does not conform to the specifications set forth herein until such non-conformance is cured. If ProdCo is entitled to any contingent compensation based on Net Receipts, such participation shall be calculated and paid in accordance with Amazon's standard participation definition attached hereto as Exhibit B.",
        delete_triggers: ["most favored nations", "most favored", "MFN", "favored nations", "pari passu", "equal to the highest", "no less favorable than", "gross receipts", "first dollar gross", "adjusted gross receipts", "modified adjusted gross", "full payment upon signing", "payment in advance", "accelerated payment schedule", "kill fee", "pay or play"]
    },
    RepsProdCo: {
        priority: 'HIGH',
        replacement_text: "ProdCo represents, warrants, and covenants to Amazon that: (a) ProdCo has full right, power, and authority to enter into this Agreement and to grant the rights granted herein; (b) the Program and all Program Materials will be original or ProdCo will have obtained all necessary rights, licenses, clearances, and permissions for use thereof; (c) the Program and Program Materials will not infringe upon or violate any copyright, trademark, patent, trade secret, right of privacy, right of publicity, or any other right of any third party; (d) there are no claims, litigation, or proceedings pending or threatened against ProdCo that would adversely affect ProdCo's ability to perform hereunder or Amazon's rights in the Program; (e) ProdCo will comply with all applicable laws, regulations, and industry standards in the performance of its obligations; (f) all persons rendering services in connection with the Program will be legally authorized to work in the applicable jurisdiction; and (g) ProdCo will maintain accurate and complete records of all chain of title documentation. These representations and warranties shall survive in perpetuity.",
        delete_triggers: ["to ProdCo's knowledge", "to the best of ProdCo's knowledge", "to ProdCo's actual knowledge", "ProdCo is not aware", "ProdCo has no knowledge", "material breach", "materially infringe", "material respects", "in all material respects", "best efforts", "reasonable efforts", "commercially reasonable efforts", "survival period of", "representations expire", "warranties terminate", "limited survival"]
    },
    Confidentiality: {
        priority: 'HIGH',
        replacement_text: "Each party agrees to maintain in strict confidence all Confidential Information of the other party and to use such Confidential Information solely for the purposes of this Agreement. \"Confidential Information\" means all non-public information disclosed by one party to the other, including without limitation business plans, financial information, customer data, technical data, trade secrets, and the terms of this Agreement. With respect to Amazon, Confidential Information also includes all information regarding Amazon's programming strategy, release schedules, viewership data, subscriber information, and internal business processes. Confidential Information shall not include information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was rightfully known to the receiving party prior to disclosure; (c) is rightfully obtained from a third party without restriction; or (d) is independently developed without use of the disclosing party's Confidential Information. The receiving party may disclose Confidential Information if required by law, provided that it gives prompt notice to the disclosing party and cooperates in seeking a protective order. These confidentiality obligations shall survive indefinitely.",
        delete_triggers: ["confidentiality period of", "obligations expire after", "three (3) year confidentiality", "five (5) year confidentiality", "upon termination, confidentiality obligations cease", "return or destruction at ProdCo's option", "ProdCo may retain copies", "residual knowledge", "residuals clause", "general skills and knowledge"]
    },
    DataProtection: {
        priority: 'HIGH',
        replacement_text: "To the extent ProdCo processes any Personal Data (as defined under applicable data protection laws, including the EU General Data Protection Regulation \"GDPR\") on behalf of Amazon in connection with this Agreement, ProdCo shall: (a) process such Personal Data only in accordance with Amazon's documented instructions and solely for the purposes of performing its obligations under this Agreement; (b) implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk; (c) not engage any sub-processor without Amazon's prior written consent and ensure any approved sub-processor is bound by equivalent data protection obligations; (d) assist Amazon in responding to data subject requests and in ensuring compliance with Amazon's obligations under applicable data protection laws; (e) notify Amazon without undue delay upon becoming aware of any Personal Data breach; (f) upon termination, return or delete all Personal Data as directed by Amazon; and (g) make available to Amazon all information necessary to demonstrate compliance and allow for audits. The parties shall execute Amazon's standard Data Processing Addendum prior to any processing of Personal Data.",
        delete_triggers: ["ProdCo is the controller", "ProdCo as data controller", "joint controllers", "co-controllers", "ProdCo determines the purposes", "ProdCo may use Personal Data for", "ProdCo's privacy policy shall govern", "ProdCo may transfer data", "sub-processors at ProdCo's discretion"]
    },
    DisputeResolution: {
        priority: 'HIGH',
        replacement_text: "This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of laws principles. Any dispute, controversy, or claim arising out of or relating to this Agreement, or the breach, termination, or validity thereof, shall be resolved by binding arbitration administered by JAMS in Los Angeles, California, in accordance with its Comprehensive Arbitration Rules and Procedures. The arbitration shall be conducted by a single arbitrator mutually selected by the parties, or if the parties cannot agree, appointed by JAMS. The arbitrator's decision shall be final and binding, and judgment upon the award may be entered in any court of competent jurisdiction. Each party irrevocably waives any right to trial by jury in any action or proceeding arising out of or relating to this Agreement. Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent irreparable harm pending arbitration.",
        delete_triggers: ["laws of England", "English law", "laws of the United Kingdom", "Swiss law", "laws of Switzerland", "ProdCo's jurisdiction", "ICC arbitration", "LCIA arbitration", "litigation in lieu of arbitration", "litigation only", "no arbitration", "jury trial preserved", "right to jury trial"]
    },
    ForceMajeure: {
        priority: 'HIGH',
        replacement_text: "Neither party shall be liable for any failure or delay in performing its obligations (other than payment obligations) to the extent such failure or delay results from causes beyond such party's reasonable control, including without limitation acts of God, war, terrorism, civil unrest, government action, fire, flood, earthquake, or other natural disaster (\"Force Majeure Event\"). The affected party shall promptly notify the other party of the Force Majeure Event and use commercially reasonable efforts to mitigate its effects and resume performance. If a Force Majeure Event continues for more than thirty (30) consecutive days, Amazon may, at its option: (a) suspend the production schedule and extend all delivery dates by the duration of the Force Majeure Event; or (b) terminate this Agreement upon written notice to ProdCo without further liability except for payment for services satisfactorily rendered prior to termination. For the avoidance of doubt, the following shall not constitute Force Majeure Events: (i) economic hardship, market conditions, or increased costs; (ii) labor disputes involving ProdCo's personnel; (iii) failure of ProdCo's suppliers or subcontractors; or (iv) shortage of personnel, equipment, or facilities unless caused by a qualifying Force Majeure Event.",
        delete_triggers: ["commercially impracticable", "economically impracticable", "significantly more expensive", "uneconomical", "ProdCo may terminate for force majeure", "either party may terminate for force majeure", "continue making payments during force majeure", "payment obligations continue during", "Amazon waives right to terminate", "full remaining Production Fee", "shortage of personnel", "shortage of equipment"]
    },

    // ========== MEDIUM PRIORITY ==========
    Assignment: {
        priority: 'MEDIUM',
        replacement_text: "Amazon may assign this Agreement, in whole or in part, to any affiliate or to any entity that acquires all or substantially all of Amazon's assets or business relating to the Program, without ProdCo's consent. ProdCo may not assign, transfer, or delegate this Agreement or any of its rights or obligations hereunder, whether by operation of law or otherwise, without Amazon's prior written consent, which may be withheld in Amazon's sole discretion. Any purported assignment in violation of this Section shall be null and void. Subject to the foregoing, this Agreement shall be binding upon and inure to the benefit of the parties and their respective permitted successors and assigns.",
        delete_triggers: ["neither party may assign", "mutual consent required for assignment", "ProdCo may assign to affiliates", "ProdCo may freely assign", "assignment upon notice", "deemed consent after"]
    },
    Publicity: {
        priority: 'MEDIUM',
        replacement_text: "Amazon shall have sole and exclusive control over all publicity, marketing, advertising, and promotion of the Program. ProdCo shall not issue any press release, public announcement, or other public statement regarding this Agreement or the Program without Amazon's prior written approval. ProdCo shall not use Amazon's name, logo, trademarks, or any information about Amazon or the Program for any marketing, advertising, or promotional purpose without Amazon's prior written consent. Notwithstanding the foregoing, ProdCo may include a factual reference to its engagement on the Program in ProdCo's internal credentials materials, provided such reference is approved by Amazon in advance and does not disclose any Confidential Information.",
        delete_triggers: ["mutual approval of publicity", "ProdCo may issue press releases", "ProdCo may reference the Program", "ProdCo may use Amazon's name", "joint marketing", "co-branded", "ProdCo credit in marketing", "publicity rights shared"]
    },
    ServicesScope: {
        priority: 'MEDIUM',
        replacement_text: "ProdCo shall provide all production services necessary to produce the Program in accordance with the specifications, budget, and schedule set forth in the attached Exhibits, including without limitation: (a) development and pre-production services; (b) principal photography; (c) post-production services; (d) delivery of final masters meeting Amazon's technical specifications; and (e) such additional services as may be reasonably required by Amazon. Amazon shall have the right to modify the scope of services, specifications, or deliverables at any time upon written notice, with appropriate adjustments to the budget and schedule to be mutually agreed in good faith. Notwithstanding ProdCo's creative input, Amazon shall have final approval over all creative elements including without limitation scripts, casting, director selection, locations, and final cut.",
        delete_triggers: ["ProdCo shall have final creative control", "ProdCo's creative vision", "creative decisions by ProdCo", "final cut by ProdCo", "ProdCo's director approval", "ProdCo's casting approval", "scope cannot be modified", "fixed scope", "Amazon may not change specifications"]
    },
    AmazonControl: {
        priority: 'MEDIUM',
        replacement_text: "Amazon shall have sole and exclusive control over all aspects of the exploitation of the Program, including without limitation: (a) the timing, manner, and extent of any release, distribution, or exhibition; (b) the selection of distribution platforms, territories, and formats; (c) pricing, packaging, and bundling decisions; (d) marketing, advertising, and promotional strategies; (e) licensing to third parties; and (f) the decision whether to produce, complete, release, or continue exploitation of the Program. Amazon's decisions in these matters shall be final and shall not be subject to approval, consultation, or challenge by ProdCo. For the avoidance of doubt, Amazon shall have no obligation to produce, release, distribute, or otherwise exploit the Program.",
        delete_triggers: ["mutual agreement on release", "ProdCo approval of release date", "ProdCo consultation on pricing", "ProdCo consent to distribution", "shared control", "joint decision", "Amazon shall consult with ProdCo", "Amazon shall notify ProdCo before", "ProdCo may object to", "guaranteed release", "commitment to release", "minimum distribution commitment"]
    },
    SurvivalRemedies: {
        priority: 'MEDIUM',
        replacement_text: "The following provisions shall survive any termination or expiration of this Agreement and shall continue in full force and effect indefinitely: (a) all grants of rights to Amazon; (b) all indemnification obligations; (c) all confidentiality obligations; (d) all representations and warranties; (e) limitation of liability; (f) audit rights; (g) any payment obligations accrued prior to termination; and (h) any other provisions that by their nature should survive termination. The rights and remedies provided herein are cumulative and are not exclusive of any other rights or remedies available at law or in equity. No failure or delay by either party in exercising any right shall operate as a waiver thereof, nor shall any single or partial exercise preclude any other or further exercise thereof or the exercise of any other right.",
        delete_triggers: ["survival period of one (1) year", "survival period of two (2) years", "survival period of three (3) years", "survival period of five (5) years", "limited survival", "obligations terminate upon expiration", "no further obligations after termination", "exclusive remedy", "sole remedy", "waiver of other remedies", "election of remedies"]
    },

    // ========== LOW PRIORITY ==========
    GeneralProvisions: {
        priority: 'LOW',
        replacement_text: "This Agreement, together with all Exhibits attached hereto, constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, and agreements. This Agreement may not be amended or modified except by a written instrument signed by both parties. If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall continue in full force and effect, and the invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable. No waiver of any provision shall be effective unless in writing and signed by the waiving party. No failure or delay in exercising any right shall constitute a waiver thereof. This Agreement may be executed in counterparts, each of which shall be deemed an original and all of which together shall constitute one instrument. The headings in this Agreement are for convenience only and shall not affect its interpretation.",
        delete_triggers: ["oral modifications permitted", "course of dealing shall modify", "implied waiver", "waiver by conduct", "failure to enforce constitutes waiver", "this Agreement may be terminated orally"]
    },
    ThirdPartyCredits: {
        priority: 'LOW',
        replacement_text: "ProdCo shall ensure that all third-party credit obligations arising from agreements entered into by ProdCo in connection with the Program are properly documented and disclosed to Amazon. ProdCo shall be solely responsible for compliance with all such credit obligations and shall indemnify Amazon for any claims arising from ProdCo's failure to comply. Amazon shall use good faith efforts to accord credits in accordance with ProdCo's documented contractual commitments, provided that: (a) such credits are disclosed to Amazon prior to the applicable credit determination deadline; (b) such credits are consistent with industry custom and Amazon's standard practices; and (c) no inadvertent failure to accord credit shall constitute a breach of this Agreement, and ProdCo's sole remedy shall be prospective correction.",
        delete_triggers: ["Amazon guarantees credit placement", "credit failure constitutes material breach", "ProdCo may terminate for credit failure", "damages for credit failure", "Amazon responsible for third-party credits"]
    },
    MoralRights: {
        priority: 'LOW',
        replacement_text: "To the fullest extent permitted by applicable law, ProdCo hereby irrevocably waives and agrees not to assert any and all moral rights (including rights of paternity, integrity, and disclosure) and any similar rights under the laws of any jurisdiction (collectively, \"Moral Rights\") in and to the Program and all Program Materials. ProdCo shall obtain equivalent waivers from all directors, writers, and other contributors to the Program. Where Moral Rights cannot be waived under applicable law, ProdCo consents (and shall procure consent from all contributors) to Amazon's exercise of all rights granted hereunder, including without limitation the right to modify, adapt, and create derivative works from the Program Materials without attribution or approval.",
        delete_triggers: ["moral rights reserved", "right of integrity", "right of paternity", "right of attribution", "droit moral", "ProdCo approval of modifications", "approval of derivative works", "consultation on edits", "director's cut rights"]
    },
    AIPolicy: {
        priority: 'LOW',
        replacement_text: "ProdCo shall not use any generative artificial intelligence (\"Generative AI\") tools, including without limitation large language models, text-to-image generators, or AI-assisted writing tools, to create any portion of the Program or Program Materials without Amazon's prior written approval. If Amazon approves such use, ProdCo shall: (a) maintain detailed records of all AI tools used and their application; (b) disclose to Amazon all content created or substantially assisted by Generative AI; (c) ensure that all AI-generated content is subject to appropriate human review and oversight; (d) represent and warrant that all AI-generated content does not infringe any third-party rights; and (e) indemnify Amazon for any claims arising from the use of Generative AI. ProdCo acknowledges that use of Generative AI may affect clearances, guild requirements, and other production obligations, and ProdCo shall remain solely responsible for compliance with all such requirements.",
        delete_triggers: ["ProdCo may use AI at its discretion", "AI use permitted without approval", "no disclosure required", "AI content treated as original", "Amazon assumes risk of AI content", "no additional warranties for AI"]
    },
    KeyPersons: {
        priority: 'LOW',
        replacement_text: "The individuals identified in Exhibit [X] as \"Key Persons\" are deemed essential to Amazon's decision to enter into this Agreement. ProdCo shall ensure that each Key Person: (a) renders services in connection with the Program on an exclusive basis during principal photography and on a first-priority basis during all other production periods; (b) is bound by confidentiality obligations no less protective than those set forth herein; and (c) has assigned all rights in their contributions to the Program to ProdCo (and thereby to Amazon). ProdCo shall not replace any Key Person without Amazon's prior written approval. If any Key Person becomes unavailable for any reason, ProdCo shall promptly notify Amazon, and Amazon may, at its option: (i) approve a replacement; (ii) assume direct engagement of a replacement; or (iii) terminate this Agreement. Attachment of Key Persons is a material inducement for Amazon's entry into this Agreement.",
        delete_triggers: ["Key Persons at ProdCo's discretion", "ProdCo may replace Key Persons", "Key Person replacement upon notice", "Amazon's approval not required for replacement", "non-exclusive services", "Key Person may render services to others", "no attachment requirement"]
    }
};

const family = prevData.detected_family || prevData.family || 'OtherUnknown';
const clauseText = prevData.clause_text || '';

// Auto-generate if: UnacceptableDeviation AND no proposed_changes AND family has STANDARD_POSITION
if (determinedStatus === 'UnacceptableDeviation' &&
    valuatorOutput.proposed_changes.length === 0 &&
    STANDARD_POSITIONS[family]) {

    const stdPos = STANDARD_POSITIONS[family];
    const lowerClause = clauseText.toLowerCase();

    // Find matching delete triggers in clause text
    const matchedTriggers = stdPos.delete_triggers.filter(trigger =>
        lowerClause.includes(trigger.toLowerCase())
    );

    if (matchedTriggers.length > 0) {
        // Find the actual text that matches (with original casing)
        let targetText = '';
        for (const trigger of matchedTriggers) {
            const idx = lowerClause.indexOf(trigger.toLowerCase());
            if (idx !== -1) {
                // Find sentence/phrase containing the trigger
                let start = lowerClause.lastIndexOf('.', idx);
                let end = lowerClause.indexOf('.', idx + trigger.length);
                start = start === -1 ? 0 : start + 1;
                end = end === -1 ? Math.min(idx + 150, clauseText.length) : end + 1;
                targetText = clauseText.substring(start, end).trim();
                break;
            }
        }

        const autoChange = {
            target_text: targetText || `[Contains: ${matchedTriggers.slice(0, 2).join(', ')}]`,
            replacement_text: stdPos.replacement_text,
            change_type: 'replace',
            priority: 'critical',
            source_reference: {
                type: 'STANDARD_POSITION',
                exact_text: stdPos.replacement_text,
                source: 'CG-010 Auto-Redline v1'
            },
            matched_triggers: matchedTriggers,
            auto_generated: true
        };

        valuatorOutput.proposed_changes.push(autoChange);

        validationErrors.push({
            field: 'proposed_changes',
            error: `CG-010: Auto-generated 1 change from ${matchedTriggers.length} matched triggers`,
            auto_fixed: true
        });
    } else if (observations.length > 0) {
        // Fallback: use first observation as target
        const firstObs = observations[0];
        const autoChange = {
            target_text: firstObs.evidence || '[Review required]',
            replacement_text: stdPos.replacement_text,
            change_type: 'replace',
            priority: 'high',
            source_reference: {
                type: 'STANDARD_POSITION',
                exact_text: stdPos.replacement_text,
                source: 'CG-010 Auto-Redline v1 (observation-based)'
            },
            based_on_observation: firstObs.pattern_matched || firstObs.possible_category,
            auto_generated: true
        };

        valuatorOutput.proposed_changes.push(autoChange);

        validationErrors.push({
            field: 'proposed_changes',
            error: 'CG-010: Auto-generated 1 change from observation',
            auto_fixed: true
        });
    }
}

// Validate each proposed change
valuatorOutput.proposed_changes = valuatorOutput.proposed_changes.map((change, idx) => {
    if (!change.change_type && !change.op_type) {
        change.change_type = 'replace';
        validationErrors.push({
            field: `proposed_changes[${idx}].change_type`,
            error: 'Missing, defaulted to replace',
            auto_fixed: true
        });
    }
    if (!change.target_text && !change.original_text) {
        change.target_text = '';
        validationErrors.push({
            field: `proposed_changes[${idx}].target_text`,
            error: 'Missing',
            auto_fixed: true
        });
    }
    if (!change.replacement_text) {
        change.replacement_text = '';
    }
    if (!change.priority) {
        change.priority = 'medium';
    }
    // Ensure source_reference exists
    if (!change.source_reference) {
        change.source_reference = { type: 'auto_generated', exact_text: null };
    }
    return change;
});

// CG-018: Confidence validation
if (typeof valuatorOutput.confidence_overall !== 'number' ||
    valuatorOutput.confidence_overall < 0 ||
    valuatorOutput.confidence_overall > 1) {
    validationErrors.push({
        field: 'confidence_overall',
        error: `Invalid value: ${valuatorOutput.confidence_overall}`,
        auto_fixed: true
    });
    // Calculate confidence from paranoid output if available
    valuatorOutput.confidence_overall = paranoidOutput.summary?.coverage_confidence || 0.5;
}

// CG-018: Escalation logic
let escalationRecommended = valuatorOutput.escalation_recommended || false;
let escalationReason = valuatorOutput.escalation_reason || null;

// Force escalation for critical conditions
const forceEscalation =
    redFlagHits.length >= 2 ||
    observations.filter(o => o.severity === 'high').length >= 3 ||
    (hasUnacceptable && valuatorOutput.confidence_overall < 0.75);

if (forceEscalation && !escalationRecommended) {
    escalationRecommended = true;
    escalationReason = escalationReason ||
        `Auto-escalation: ${redFlagHits.length} red flags, ${observations.filter(o => o.severity === 'high').length} high-severity observations`;
    validationErrors.push({
        field: 'escalation_recommended',
        error: 'Forced escalation due to critical conditions',
        auto_fixed: true
    });
}

valuatorOutput.escalation_recommended = escalationRecommended;
valuatorOutput.escalation_reason = escalationReason;

// Build output
return [{
    json: {
        ...prevData,
        valuatorOutput: valuatorOutput,
        valuatorValidationErrors: validationErrors.filter(e => e.field.startsWith('valuator') || e.field.startsWith('final_') || e.field.startsWith('proposed_') || e.field.startsWith('confidence') || e.field.startsWith('escalation')),
        allValidationErrors: validationErrors,
        _autoCorrections: {
            ...prevData._autoCorrections,
            statusFixed: valuatorOutput.final_status !== determinedStatus,
            escalationForced: forceEscalation && !valuatorOutput.escalation_recommended,
            changesValidated: valuatorOutput.proposed_changes.length,
            totalErrors: validationErrors.length,
            allAutoFixed: validationErrors.every(e => e.auto_fixed)
        }
    }
}];
