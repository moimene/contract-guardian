const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
    'https://hvlsuwdqtffiilvampxq.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Family to policy_spec_id mapping
const familyIds = {
    'ServicesScope': '8738a28e-c49b-4ec3-b118-6c431ab9eb97',
    'TerminationRights': 'fdb4ebb0-e36e-4354-8fb6-0765c2c9040e',
    'Confidentiality': '39355e72-3557-4a8c-af9f-396a77685c6b',
    'ForceMajeure': '6fd9d092-efb3-4c4c-8d23-573af05f624d',
    'KeyPersons': '0e505aab-b599-4634-8ce2-bd813e19aa30',
    'MoralRights': '647ca658-23f9-45e4-895c-64ec596b2560',
    'DisputeResolution': 'cb303109-30ca-440d-8c14-1bc0af3dd7fe',
    'RightsGrant': 'ffce23c6-11e7-43bb-a76f-8e992d1e5b4b',
    'GoverningLaw': 'b57cc38a-4c04-4299-8d2d-8afe364231ec',
    'LiabilityLimitation': '2eddcdff-b691-495e-9238-9deda6e86769'
};

// Category mapping: STANDARD/ACCEPTABLE -> ACCEPTABLE, UNACCEPTABLE -> UNACCEPTABLE, NOT_COVERED -> NOT_COVERED
const categoryMap = {
    'STANDARD': 'STANDARD',
    'ACCEPTABLE': 'ACCEPTABLE',
    'UNACCEPTABLE': 'UNACCEPTABLE',
    'NOT_COVERED': 'NOT_COVERED'
};

// Examples parsed from the markdown file
const examples = [
    // ServicesScope
    { family: 'ServicesScope', category: 'STANDARD', text: 'ProdCo will render services as set forth in this agreement and any applicable Exhibit, including all pre-production, principal photography, and post-production services necessary to produce and deliver the Program in accordance with the approved budget and production schedule.', notes: 'Posición estándar Amazon - scope amplio con referencia a Exhibits' },
    { family: 'ServicesScope', category: 'STANDARD', text: 'ProdCo shall provide all production services required to complete the Program, including without limitation development, pre-production, principal photography, post-production, and delivery services.', notes: 'Variante estándar con lista de fases' },
    { family: 'ServicesScope', category: 'STANDARD', text: 'SERVICES: ProdCo will render all production services necessary to produce and deliver the Program to Amazon in accordance with this Agreement and the Production Schedule attached as Exhibit B.', notes: 'Formato con heading y referencia a schedule' },
    { family: 'ServicesScope', category: 'STANDARD', text: 'ProdCo agrees to produce the Program as an original scripted television series consisting of [X] episodes, each approximately [Y] minutes in length, in accordance with the specifications set forth in Exhibit A.', notes: 'Estándar con especificaciones técnicas' },
    { family: 'ServicesScope', category: 'ACCEPTABLE', text: 'Producer shall provide production services for the development and production of the Program, subject to the budget approved by Amazon and the delivery schedule mutually agreed upon by the parties.', notes: 'Aceptable - mutually agreed es tolerable si el budget approval está con Amazon' },
    { family: 'ServicesScope', category: 'ACCEPTABLE', text: 'ProdCo will render services to produce the Program. The scope of such services shall be as set forth in Schedule 1, which may be amended by mutual written agreement.', notes: 'Aceptable - referencia a Schedule con mecanismo de enmienda' },
    { family: 'ServicesScope', category: 'ACCEPTABLE', text: 'The Company shall provide all services necessary for the production of the Deliverables, including pre-production, principal photography, and post-production, in accordance with the Production Plan.', notes: 'Aceptable - terminología CPC Australia equivalente' },
    { family: 'ServicesScope', category: 'ACCEPTABLE', text: 'ProdCo shall produce and deliver the Program in accordance with the specifications and timeline set forth herein, provided that Amazon shall have approval rights over all key creative elements.', notes: 'Aceptable - incluye approval rights de Amazon' },
    { family: 'ServicesScope', category: 'UNACCEPTABLE', text: 'Producer shall have sole creative control over the production services and the manner in which the Program is produced.', notes: 'INACEPTABLE - contradice AmazonControl; Amazon debe tener control creativo' },
    { family: 'ServicesScope', category: 'UNACCEPTABLE', text: 'The scope of services may be modified by Producer at any time to accommodate creative requirements.', notes: 'INACEPTABLE - cambios de scope deben requerir aprobación de Amazon' },
    { family: 'ServicesScope', category: 'UNACCEPTABLE', text: 'ProdCo will render services on a best-efforts basis, with delivery dates being estimates only.', notes: 'INACEPTABLE - delivery dates deben ser firmes, no best efforts' },
    { family: 'ServicesScope', category: 'UNACCEPTABLE', text: "Producer may subcontract any or all production services without Amazon's consent.", notes: 'INACEPTABLE - subcontratación requiere consentimiento previo' },
    { family: 'ServicesScope', category: 'NOT_COVERED', text: 'Production services for virtual reality or metaverse content shall be governed by a separate technical specification.', notes: 'ESCALAR - VR/metaverse requiere revisión especializada' },
    { family: 'ServicesScope', category: 'NOT_COVERED', text: 'ProdCo shall provide AI-generated content as part of the production services.', notes: 'ESCALAR - uso de AI generativo requiere revisión legal específica' },
    { family: 'ServicesScope', category: 'NOT_COVERED', text: 'Services shall be provided in multiple territories simultaneously with different versioning requirements.', notes: 'ESCALAR - multi-territory simultáneo requiere análisis de derechos' },

    // TerminationRights
    { family: 'TerminationRights', category: 'STANDARD', text: 'Amazon may terminate this Agreement for any reason or no reason upon thirty (30) days\' prior written notice to ProdCo.', notes: 'Posición estándar Amazon - terminación por conveniencia unilateral' },
    { family: 'TerminationRights', category: 'STANDARD', text: 'Amazon may terminate this Agreement immediately upon written notice if ProdCo commits a material breach that remains uncured for fifteen (15) days after written notice thereof.', notes: 'Estándar - terminación por causa con cure period' },
    { family: 'TerminationRights', category: 'STANDARD', text: 'Amazon shall have the right to terminate this Agreement immediately, without prior notice, if ProdCo: (a) becomes insolvent; (b) files for bankruptcy; (c) commits fraud or willful misconduct; or (d) breaches any representation or warranty.', notes: 'Estándar - terminación inmediata sin cure para eventos graves' },
    { family: 'TerminationRights', category: 'STANDARD', text: 'Either party may terminate this Agreement upon material breach by the other party that remains uncured for thirty (30) days after written notice specifying such breach.', notes: 'Estándar mutual - terminación por causa con notice y cure' },
    { family: 'TerminationRights', category: 'ACCEPTABLE', text: 'Amazon may terminate this Agreement for convenience upon forty-five (45) days\' prior written notice.', notes: 'Aceptable - 45 días en lugar de 30 es tolerable' },
    { family: 'TerminationRights', category: 'ACCEPTABLE', text: 'Amazon may terminate for cause if ProdCo fails to cure a material breach within twenty (20) days of receiving written notice.', notes: 'Aceptable - 20 días cure period es razonable' },
    { family: 'TerminationRights', category: 'ACCEPTABLE', text: 'Client shall be entitled to terminate this Agreement immediately if the Company commits a material breach of its obligations hereunder.', notes: 'Aceptable - terminología CPC equivalente' },
    { family: 'TerminationRights', category: 'ACCEPTABLE', text: 'Amazon may terminate this Agreement if ProdCo fails to meet any Delivery Milestone by more than [X] days, provided Amazon has given ProdCo written notice and a reasonable opportunity to cure.', notes: 'Aceptable - trigger específico de milestone con cure' },
    { family: 'TerminationRights', category: 'UNACCEPTABLE', text: 'This Agreement may only be terminated by mutual written consent of the parties.', notes: 'INACEPTABLE - Amazon debe tener derecho unilateral de terminación' },
    { family: 'TerminationRights', category: 'UNACCEPTABLE', text: 'Producer may terminate this Agreement for convenience upon thirty (30) days\' notice.', notes: 'INACEPTABLE - terminación por conveniencia solo para Amazon, no para Producer' },
    { family: 'TerminationRights', category: 'UNACCEPTABLE', text: 'Neither party may terminate this Agreement prior to completion of the Program.', notes: 'INACEPTABLE - elimina derecho de terminación de Amazon' },
    { family: 'TerminationRights', category: 'UNACCEPTABLE', text: 'Amazon may terminate only for cause, and only after providing ProdCo with ninety (90) days to cure any breach.', notes: 'INACEPTABLE - 90 días cure period es excesivo; elimina terminación por conveniencia' },
    { family: 'TerminationRights', category: 'UNACCEPTABLE', text: 'In the event of termination, Amazon shall pay ProdCo for all services that would have been rendered through the end of the original Term.', notes: 'INACEPTABLE - full contract payout elimina beneficio de terminación' },
    { family: 'TerminationRights', category: 'NOT_COVERED', text: 'Termination provisions shall be subject to union or guild requirements in the applicable jurisdiction.', notes: 'ESCALAR - implicaciones laborales/gremiales requieren revisión' },
    { family: 'TerminationRights', category: 'NOT_COVERED', text: 'In the event of termination during principal photography, specific wind-down procedures shall apply.', notes: 'ESCALAR - wind-down durante producción activa requiere análisis específico' },
    { family: 'TerminationRights', category: 'NOT_COVERED', text: 'Termination for force majeure events shall be governed by Section [X].', notes: 'ESCALAR - intersección con force majeure requiere análisis conjunto' },

    // Confidentiality
    { family: 'Confidentiality', category: 'STANDARD', text: "ProdCo will keep confidential all non-public information ('NPI') relating to Amazon, the Program, or the Program's commercial performance. ProdCo will not disclose any NPI except as strictly necessary for the performance of this Agreement.", notes: 'Posición estándar Amazon - NPI definición amplia' },
    { family: 'Confidentiality', category: 'STANDARD', text: "ProdCo shall maintain in strict confidence all Confidential Information and shall not disclose such information to any third party without Amazon's prior written consent.", notes: 'Estándar con requisito de consentimiento previo' },
    { family: 'Confidentiality', category: 'STANDARD', text: "ProdCo will not input any NPI into any artificial intelligence service or tool without Amazon's prior written approval.", notes: 'Estándar - restricción específica de AI (posición actual Amazon)' },
    { family: 'Confidentiality', category: 'STANDARD', text: 'Confidential Information shall include, without limitation, the terms of this Agreement, all financial information, production schedules, creative materials, and any information marked as confidential.', notes: 'Estándar con definición enumerativa' },
    { family: 'Confidentiality', category: 'ACCEPTABLE', text: 'Each party agrees to keep confidential all non-public information received from the other party and to use such information only for purposes of this Agreement.', notes: 'Aceptable - confidencialidad mutual es tolerable' },
    { family: 'Confidentiality', category: 'ACCEPTABLE', text: 'ProdCo shall not disclose Confidential Information except to employees, agents, and contractors who have a need to know and who are bound by confidentiality obligations no less protective than those herein.', notes: 'Aceptable - carveout para empleados con need-to-know' },
    { family: 'Confidentiality', category: 'ACCEPTABLE', text: 'The confidentiality obligations shall survive for a period of five (5) years following expiration or termination of this Agreement.', notes: 'Aceptable - 5 años es duración razonable (perpétuo preferido pero no requerido)' },
    { family: 'Confidentiality', category: 'ACCEPTABLE', text: 'Confidential Information shall not include information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was known to the receiving party prior to disclosure; or (c) is independently developed by the receiving party.', notes: 'Aceptable - exclusiones estándar de confidencialidad' },
    { family: 'Confidentiality', category: 'UNACCEPTABLE', text: "Confidentiality obligations shall apply only to information expressly marked as 'Confidential' in writing.", notes: 'INACEPTABLE - marking requirement demasiado restrictivo; NPI incluye información no marcada' },
    { family: 'Confidentiality', category: 'UNACCEPTABLE', text: "ProdCo may disclose the terms of this Agreement to potential investors and financing sources without Amazon's consent.", notes: 'INACEPTABLE - disclosure de términos requiere consentimiento previo' },
    { family: 'Confidentiality', category: 'UNACCEPTABLE', text: 'The confidentiality obligations shall terminate upon expiration of this Agreement.', notes: 'INACEPTABLE - confidencialidad debe sobrevivir terminación' },
    { family: 'Confidentiality', category: 'UNACCEPTABLE', text: "ProdCo may use Amazon's Confidential Information for any purpose related to ProdCo's business.", notes: 'INACEPTABLE - uso limitado solo a performance del Agreement' },
    { family: 'Confidentiality', category: 'UNACCEPTABLE', text: 'ProdCo may share Confidential Information with its parent company and affiliates without restriction.', notes: 'INACEPTABLE - sharing con afiliadas requiere mismas protecciones' },
    { family: 'Confidentiality', category: 'NOT_COVERED', text: 'Confidentiality provisions shall be subject to GDPR and applicable data protection regulations.', notes: 'ESCALAR - intersección con DataProtection requiere análisis separado' },
    { family: 'Confidentiality', category: 'NOT_COVERED', text: 'ProdCo may be required to disclose Confidential Information pursuant to SEC filing requirements.', notes: 'ESCALAR - public company disclosure requiere revisión legal' },
    { family: 'Confidentiality', category: 'NOT_COVERED', text: 'Confidential Information includes personal data of talent and crew.', notes: 'ESCALAR - personal data triggers DataProtection analysis' },

    // ForceMajeure
    { family: 'ForceMajeure', category: 'STANDARD', text: 'Neither party shall be liable for any failure or delay in performing its obligations where such failure or delay results from causes beyond the reasonable control of such party, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, or earthquakes.', notes: 'Posición estándar Amazon - mutual carveout con lista enumerativa' },
    { family: 'ForceMajeure', category: 'STANDARD', text: 'Event of Force Majeure shall mean any event beyond the reasonable control of the affected party that prevents or delays performance hereunder, excluding labor disputes, strikes, or shortage of materials.', notes: 'Estándar con exclusión explícita de huelgas' },
    { family: 'ForceMajeure', category: 'STANDARD', text: 'If a Force Majeure event continues for more than [X] days, either party may terminate this Agreement upon written notice to the other party.', notes: 'Estándar - derecho de terminación tras período prolongado' },
    { family: 'ForceMajeure', category: 'STANDARD', text: 'The party affected by Force Majeure shall promptly notify the other party in writing and shall use commercially reasonable efforts to mitigate the effects of such event.', notes: 'Estándar - requisitos de notice y mitigación' },
    { family: 'ForceMajeure', category: 'ACCEPTABLE', text: 'Force Majeure shall not relieve either party from payment obligations that accrued prior to the Force Majeure event.', notes: 'Aceptable - carveout de pagos acumulados es razonable' },
    { family: 'ForceMajeure', category: 'ACCEPTABLE', text: 'In the event of Force Majeure, Amazon may elect to suspend production for a period not to exceed [X] days, during which time Amazon shall have no obligation to make payments.', notes: 'Aceptable - suspensión con límite temporal' },
    { family: 'ForceMajeure', category: 'ACCEPTABLE', text: 'Force Majeure events shall include government-mandated lockdowns, pandemics, and epidemics.', notes: 'Aceptable - inclusión explícita de pandemias post-COVID' },
    { family: 'ForceMajeure', category: 'ACCEPTABLE', text: 'The deadline for delivery shall be extended by the period of the Force Majeure event, plus [X] days for remobilization.', notes: 'Aceptable - extensión automática con buffer de remobilización' },
    { family: 'ForceMajeure', category: 'UNACCEPTABLE', text: 'Only Producer may claim Force Majeure relief; Amazon shall remain obligated to perform in all circumstances.', notes: 'INACEPTABLE - Force Majeure debe ser mutual' },
    { family: 'ForceMajeure', category: 'UNACCEPTABLE', text: 'Force Majeure includes labor disputes, strikes, and shortage of materials or personnel.', notes: 'INACEPTABLE - Amazon típicamente excluye labor disputes' },
    { family: 'ForceMajeure', category: 'UNACCEPTABLE', text: 'Force Majeure shall excuse all payment obligations for the duration of the event.', notes: 'INACEPTABLE - pagos por trabajo completado no deben ser excusados' },
    { family: 'ForceMajeure', category: 'UNACCEPTABLE', text: 'ProdCo may declare Force Majeure at its sole discretion.', notes: 'INACEPTABLE - declaración debe ser objetiva, no discrecional' },
    { family: 'ForceMajeure', category: 'NOT_COVERED', text: 'Specific pandemic protocols and insurance requirements shall be attached as Exhibit [X].', notes: 'ESCALAR - protocolos COVID/pandemia requieren revisión especializada' },
    { family: 'ForceMajeure', category: 'NOT_COVERED', text: 'Force Majeure provisions shall interact with cast insurance and completion bond requirements.', notes: 'ESCALAR - intersección con seguros requiere análisis conjunto' },
    { family: 'ForceMajeure', category: 'NOT_COVERED', text: 'Government incentive recapture in case of Force Majeure shall be addressed separately.', notes: 'ESCALAR - tax incentives requieren revisión fiscal' },

    // KeyPersons
    { family: 'KeyPersons', category: 'STANDARD', text: "The following individuals are designated as Key Persons: [names]. ProdCo shall ensure that each Key Person renders services as contemplated herein. ProdCo shall not replace any Key Person without Amazon's prior written approval.", notes: 'Posición estándar Amazon - aprobación previa para reemplazo' },
    { family: 'KeyPersons', category: 'STANDARD', text: 'If any Key Person becomes unavailable due to death, disability, or default, Amazon may, in its sole discretion: (a) approve a replacement; (b) suspend production; or (c) terminate this Agreement.', notes: 'Estándar - opciones de Amazon ante unavailability' },
    { family: 'KeyPersons', category: 'STANDARD', text: 'ProdCo represents and warrants that each Key Person has agreed to render services for the Program and is available during the Production Period.', notes: 'Estándar - rep sobre disponibilidad de Key Persons' },
    { family: 'KeyPersons', category: 'STANDARD', text: "Amazon's approval of a Key Person replacement shall not be unreasonably withheld, provided ProdCo presents candidates of comparable experience and stature.", notes: 'Estándar con reasonableness qualifier para aprobación' },
    { family: 'KeyPersons', category: 'ACCEPTABLE', text: "Key Persons include the Showrunner, Lead Director, and Executive Producer(s). Changes to Key Persons require Amazon's prior written consent, which shall not be unreasonably withheld or delayed.", notes: 'Aceptable - consent con reasonableness standard' },
    { family: 'KeyPersons', category: 'ACCEPTABLE', text: 'If a Key Person becomes unavailable, ProdCo shall notify Amazon within [X] business days and propose replacement candidates within [Y] days.', notes: 'Aceptable - timeline específico para notificación y propuestas' },
    { family: 'KeyPersons', category: 'ACCEPTABLE', text: 'Amazon may designate additional Key Persons by written notice during production.', notes: 'Aceptable - flexibilidad para agregar Key Persons' },
    { family: 'KeyPersons', category: 'ACCEPTABLE', text: 'Key Person services may be rendered remotely where production circumstances reasonably permit.', notes: 'Aceptable - flexibilidad post-COVID para servicios remotos' },
    { family: 'KeyPersons', category: 'UNACCEPTABLE', text: 'ProdCo may replace Key Persons at its discretion, provided replacements are of similar professional standing.', notes: 'INACEPTABLE - reemplazos requieren aprobación previa de Amazon' },
    { family: 'KeyPersons', category: 'UNACCEPTABLE', text: 'The unavailability of a Key Person shall not constitute a breach or trigger termination rights.', notes: 'INACEPTABLE - Amazon debe tener remedios ante unavailability' },
    { family: 'KeyPersons', category: 'UNACCEPTABLE', text: 'Key Persons are advisory only; ProdCo may staff the production as it deems appropriate.', notes: 'INACEPTABLE - Key Persons deben prestar servicios, no ser advisory' },
    { family: 'KeyPersons', category: 'UNACCEPTABLE', text: 'Amazon waives any right to approve Key Person replacements.', notes: 'INACEPTABLE - Amazon debe retener approval rights' },
    { family: 'KeyPersons', category: 'NOT_COVERED', text: 'Key Person arrangements shall be subject to SAG-AFTRA, DGA, or WGA collective bargaining agreements.', notes: 'ESCALAR - implicaciones gremiales requieren revisión laboral' },
    { family: 'KeyPersons', category: 'NOT_COVERED', text: 'Key Person insurance and essential elements coverage shall be addressed in Exhibit [X].', notes: 'ESCALAR - insurance requirements requieren revisión de riesgos' },
    { family: 'KeyPersons', category: 'NOT_COVERED', text: 'Key Person equity participation or backend compensation shall be addressed separately.', notes: 'ESCALAR - talent deals requieren negociación separada' },

    // MoralRights
    { family: 'MoralRights', category: 'STANDARD', text: 'To the extent permitted by applicable law, ProdCo hereby waives and agrees not to assert any moral rights (droit moral) or similar rights in and to the Program and all Materials.', notes: 'Posición estándar Amazon - waiver completo de moral rights' },
    { family: 'MoralRights', category: 'STANDARD', text: 'ProdCo shall obtain from all contributors, talent, and personnel a written waiver of any and all moral rights in their contributions to the Program.', notes: 'Estándar - obligación de obtener waivers de terceros' },
    { family: 'MoralRights', category: 'STANDARD', text: 'ProdCo agrees that Amazon may edit, modify, adapt, or otherwise alter the Program without obligation to consult ProdCo or any contributor, and no such action shall be deemed to infringe any moral rights.', notes: 'Estándar - derecho de modificación sin consulta' },
    { family: 'MoralRights', category: 'STANDARD', text: 'ProdCo irrevocably waives any right to object to distortion, mutilation, or modification of the Program or to receive attribution for its contribution.', notes: 'Estándar - waiver de derechos de integridad y atribución' },
    { family: 'MoralRights', category: 'ACCEPTABLE', text: 'To the fullest extent permitted by law in each applicable jurisdiction, ProdCo waives all moral rights and similar rights of authors in the Program.', notes: 'Aceptable - acknowledgment de variación jurisdiccional' },
    { family: 'MoralRights', category: 'ACCEPTABLE', text: 'ProdCo consents to any modifications Amazon may make to the Program and waives any claims for such modifications under moral rights or equivalent doctrines.', notes: 'Aceptable - consent framework en lugar de waiver donde waiver no es posible' },
    { family: 'MoralRights', category: 'ACCEPTABLE', text: 'ProdCo shall use commercially reasonable efforts to obtain moral rights waivers from all key creative contributors.', notes: 'Aceptable - commercially reasonable efforts en lugar de absolute obligation para waivers de terceros' },
    { family: 'MoralRights', category: 'ACCEPTABLE', text: 'Where moral rights cannot be waived under applicable law, ProdCo agrees not to enforce or assert such rights against Amazon.', notes: 'Aceptable - non-assertion donde waiver no es legalmente posible' },
    { family: 'MoralRights', category: 'UNACCEPTABLE', text: "ProdCo reserves all moral rights in the Program and Amazon shall not modify the Program without ProdCo's consent.", notes: 'INACEPTABLE - Amazon necesita derecho de modificación libre' },
    { family: 'MoralRights', category: 'UNACCEPTABLE', text: 'Moral rights of directors and writers shall remain intact pursuant to applicable guild agreements.', notes: 'INACEPTABLE - waiver debe obtenerse independientemente de guild agreements' },
    { family: 'MoralRights', category: 'UNACCEPTABLE', text: 'ProdCo may object to modifications that materially distort the creative intent of the Program.', notes: 'INACEPTABLE - no debe haber derecho de objeción' },
    { family: 'MoralRights', category: 'UNACCEPTABLE', text: 'Amazon shall provide on-screen credit acknowledging moral rights of key contributors.', notes: 'INACEPTABLE - credit obligations son separadas de moral rights' },
    { family: 'MoralRights', category: 'NOT_COVERED', text: 'Moral rights provisions in jurisdictions where waiver is prohibited (France, Germany) shall be addressed in local addenda.', notes: 'ESCALAR - jurisdicciones civil law requieren análisis específico' },
    { family: 'MoralRights', category: 'NOT_COVERED', text: 'Moral rights of composers and musicians shall be addressed pursuant to music licensing agreements.', notes: 'ESCALAR - music rights requieren revisión separada' },
    { family: 'MoralRights', category: 'NOT_COVERED', text: 'Talent moral rights subject to individual deal memos.', notes: 'ESCALAR - talent-specific deals requieren negociación individual' },

    // DisputeResolution
    { family: 'DisputeResolution', category: 'STANDARD', text: 'This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflicts of laws principles.', notes: 'Posición estándar Amazon - California law' },
    { family: 'DisputeResolution', category: 'STANDARD', text: 'Any dispute arising under this Agreement shall be resolved by binding arbitration administered by JAMS in Los Angeles, California.', notes: 'Estándar - JAMS arbitration en LA' },
    { family: 'DisputeResolution', category: 'STANDARD', text: 'EACH PARTY HEREBY IRREVOCABLY WAIVES ANY RIGHT TO TRIAL BY JURY IN ANY ACTION ARISING OUT OF OR RELATING TO THIS AGREEMENT.', notes: 'Estándar - jury trial waiver (ALL CAPS requerido)' },
    { family: 'DisputeResolution', category: 'STANDARD', text: 'The parties submit to the exclusive jurisdiction of the state and federal courts located in Los Angeles County, California.', notes: 'Estándar - exclusive jurisdiction en LA County' },
    { family: 'DisputeResolution', category: 'ACCEPTABLE', text: 'This Agreement shall be governed by the laws of the State of New York, without regard to conflicts of laws principles.', notes: 'Aceptable - New York law es alternativa común' },
    { family: 'DisputeResolution', category: 'ACCEPTABLE', text: 'Disputes shall be resolved by arbitration under the Commercial Arbitration Rules of the American Arbitration Association.', notes: 'Aceptable - AAA en lugar de JAMS' },
    { family: 'DisputeResolution', category: 'ACCEPTABLE', text: 'Prior to initiating arbitration, the parties shall attempt to resolve disputes through good faith negotiation for a period of thirty (30) days.', notes: 'Aceptable - mandatory negotiation period antes de arbitration' },
    { family: 'DisputeResolution', category: 'ACCEPTABLE', text: "The prevailing party in any dispute shall be entitled to recover its reasonable attorneys' fees and costs.", notes: 'Aceptable - fee-shifting provision' },
    { family: 'DisputeResolution', category: 'UNACCEPTABLE', text: "This Agreement shall be governed by the laws of [Producer's home jurisdiction].", notes: 'INACEPTABLE - debe ser California o New York, no jurisdicción de Producer' },
    { family: 'DisputeResolution', category: 'UNACCEPTABLE', text: 'All disputes shall be resolved in the courts of [non-US jurisdiction] under [non-US law].', notes: 'INACEPTABLE - para contratos Amazon US, debe ser US law y jurisdiction' },
    { family: 'DisputeResolution', category: 'UNACCEPTABLE', text: 'Either party may initiate litigation in any court of competent jurisdiction.', notes: 'INACEPTABLE - debe haber exclusive jurisdiction, no non-exclusive' },
    { family: 'DisputeResolution', category: 'UNACCEPTABLE', text: "Disputes shall be resolved by binding arbitration, with the arbitrator's decision subject to appeal.", notes: 'INACEPTABLE - arbitration debe ser final and binding, sin appeal' },
    { family: 'DisputeResolution', category: 'NOT_COVERED', text: 'Disputes involving guild or union matters shall be resolved pursuant to applicable CBA procedures.', notes: 'ESCALAR - labor disputes tienen foros especializados' },
    { family: 'DisputeResolution', category: 'NOT_COVERED', text: 'IP ownership disputes shall be resolved in federal court with exclusive jurisdiction.', notes: 'ESCALAR - IP disputes pueden requerir federal forum' },
    { family: 'DisputeResolution', category: 'NOT_COVERED', text: 'Cross-border disputes involving multiple Amazon entities shall be addressed in a master agreement.', notes: 'ESCALAR - multi-entity disputes requieren coordinación' },

    // RightsGrant
    { family: 'RightsGrant', category: 'STANDARD', text: "All rights in the Program (and all drafts, versions, and elements thereof) are being specially ordered and commissioned by Amazon as a 'work made for hire' for Amazon. Amazon shall be the author and exclusive owner for copyright purposes and otherwise.", notes: 'Posición estándar Amazon - work for hire + ownership' },
    { family: 'RightsGrant', category: 'STANDARD', text: 'ProdCo irrevocably grants, transfers, and assigns to Amazon all right, title, and interest in and to the Program, including all copyrights, throughout the universe, in perpetuity, in all media now known or hereafter devised.', notes: 'Estándar - assignment completo con alcance máximo' },
    { family: 'RightsGrant', category: 'STANDARD', text: 'If the Program or any element thereof is not a work made for hire, ProdCo hereby assigns to Amazon all right, title, and interest therein, including all copyrights.', notes: 'Estándar - fallback assignment si work for hire no aplica' },
    { family: 'RightsGrant', category: 'STANDARD', text: 'Amazon shall have the exclusive right to exploit the Program in any and all media, including without limitation theatrical, television, home video, streaming, and all ancillary and derivative rights.', notes: 'Estándar - enumeración de derechos de explotación' },
    { family: 'RightsGrant', category: 'ACCEPTABLE', text: 'The Program and all Materials shall be owned by Amazon. To the extent ProdCo retains any rights, ProdCo hereby assigns such rights to Amazon.', notes: 'Aceptable - ownership + assignment catch-all' },
    { family: 'RightsGrant', category: 'ACCEPTABLE', text: 'Amazon shall own all rights in the Program, subject only to third-party rights in pre-existing materials duly cleared by ProdCo.', notes: 'Aceptable - carveout para underlying rights con clearing obligation' },
    { family: 'RightsGrant', category: 'ACCEPTABLE', text: 'ProdCo assigns to Amazon all copyright and related rights in the Deliverables, in all territories and languages, for the full term of copyright.', notes: 'Aceptable - terminología alternativa con mismo efecto' },
    { family: 'RightsGrant', category: 'ACCEPTABLE', text: 'Amazon shall be the sole owner of all intellectual property rights in the Program, including but not limited to copyright, trademark, and any other proprietary rights.', notes: 'Aceptable - scope amplio de IP rights' },
    { family: 'RightsGrant', category: 'UNACCEPTABLE', text: 'ProdCo grants Amazon a non-exclusive license to exploit the Program.', notes: 'INACEPTABLE - debe ser ownership o exclusive license, no non-exclusive' },
    { family: 'RightsGrant', category: 'UNACCEPTABLE', text: "Amazon's rights in the Program shall be limited to [specific territories or platforms].", notes: 'INACEPTABLE - Amazon requiere rights worldwide en all media' },
    { family: 'RightsGrant', category: 'UNACCEPTABLE', text: 'ProdCo retains ownership of underlying formats, characters, and storylines.', notes: 'INACEPTABLE - Amazon debe owns all elements incluyendo format' },
    { family: 'RightsGrant', category: 'UNACCEPTABLE', text: 'Rights shall revert to ProdCo upon expiration of the initial Term.', notes: 'INACEPTABLE - rights deben ser in perpetuity sin reversion' },
    { family: 'RightsGrant', category: 'UNACCEPTABLE', text: "ProdCo grants Amazon rights for a term of [X] years, renewable at Amazon's option.", notes: 'INACEPTABLE - debe ser perpetuo, no term-limited' },
    { family: 'RightsGrant', category: 'NOT_COVERED', text: 'Rights to underlying literary material are subject to separate acquisition agreement.', notes: 'ESCALAR - underlying rights requieren chain of title review' },
    { family: 'RightsGrant', category: 'NOT_COVERED', text: 'Rights grant is subject to pre-existing distribution agreements in [territories].', notes: 'ESCALAR - holdbacks territoriales requieren análisis específico' },
    { family: 'RightsGrant', category: 'NOT_COVERED', text: 'Rights to music and soundtrack shall be addressed in separate music licensing agreements.', notes: 'ESCALAR - music rights son carve-out especial' },

    // GoverningLaw
    { family: 'GoverningLaw', category: 'STANDARD', text: 'This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflicts of laws principles.', notes: 'Posición estándar Amazon - California law' },
    { family: 'GoverningLaw', category: 'STANDARD', text: 'The laws of the State of California shall govern this Agreement. The UN Convention on Contracts for the International Sale of Goods shall not apply.', notes: 'Estándar con exclusión de CISG' },
    { family: 'GoverningLaw', category: 'ACCEPTABLE', text: 'This Agreement shall be governed by the laws of the State of New York.', notes: 'Aceptable - New York es alternativa común para US deals' },
    { family: 'GoverningLaw', category: 'ACCEPTABLE', text: 'This Agreement shall be governed by the laws of England and Wales.', notes: 'Aceptable - para producciones UK/European' },
    { family: 'GoverningLaw', category: 'ACCEPTABLE', text: 'California law shall govern this Agreement, except that intellectual property matters shall be governed by applicable federal law.', notes: 'Aceptable - carveout para IP federal law' },
    { family: 'GoverningLaw', category: 'UNACCEPTABLE', text: "This Agreement shall be governed by the laws of [Producer's home state/country].", notes: 'INACEPTABLE - Amazon requiere California, NY, o UK law' },
    { family: 'GoverningLaw', category: 'UNACCEPTABLE', text: 'The governing law shall be determined by the location where production occurs.', notes: 'INACEPTABLE - governing law debe ser fijo, no variable' },
    { family: 'GoverningLaw', category: 'UNACCEPTABLE', text: "Each party's obligations shall be governed by the laws of such party's jurisdiction.", notes: 'INACEPTABLE - split governing law crea incertidumbre' },
    { family: 'GoverningLaw', category: 'NOT_COVERED', text: 'Local labor and employment matters shall be governed by local law notwithstanding the governing law provision.', notes: 'ESCALAR - labor law carveouts requieren revisión HR/Employment' },
    { family: 'GoverningLaw', category: 'NOT_COVERED', text: 'Tax matters shall be governed by applicable tax treaties and local tax law.', notes: 'ESCALAR - tax carveouts requieren revisión fiscal' },

    // LiabilityLimitation
    { family: 'LiabilityLimitation', category: 'STANDARD', text: 'IN NO EVENT SHALL AMAZON BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, LOSS OF BUSINESS, OR LOSS OF DATA.', notes: 'Posición estándar Amazon - exclusión de daños indirectos (ALL CAPS)' },
    { family: 'LiabilityLimitation', category: 'STANDARD', text: "AMAZON'S TOTAL AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE AMOUNTS ACTUALLY PAID BY AMAZON TO PRODCO HEREUNDER.", notes: 'Estándar - cap vinculado a amounts paid' },
    { family: 'LiabilityLimitation', category: 'STANDARD', text: 'THE LIMITATIONS IN THIS SECTION SHALL APPLY REGARDLESS OF THE FORM OF ACTION, WHETHER IN CONTRACT, TORT, STRICT LIABILITY, OR OTHERWISE.', notes: 'Estándar - aplicación a todas las formas de acción' },
    { family: 'LiabilityLimitation', category: 'STANDARD', text: 'NOTWITHSTANDING THE FOREGOING, NOTHING IN THIS AGREEMENT SHALL LIMIT LIABILITY FOR FRAUD, GROSS NEGLIGENCE, OR WILLFUL MISCONDUCT.', notes: 'Estándar con carveouts para conducta dolosa' },
    { family: 'LiabilityLimitation', category: 'ACCEPTABLE', text: 'Neither party shall be liable to the other for consequential, indirect, or punitive damages arising out of this Agreement.', notes: 'Aceptable - limitación mutual de damages' },
    { family: 'LiabilityLimitation', category: 'ACCEPTABLE', text: "Each party's aggregate liability shall be limited to the greater of (a) amounts paid under this Agreement or (b) $[X].", notes: 'Aceptable - floor en addition to cap' },
    { family: 'LiabilityLimitation', category: 'ACCEPTABLE', text: 'Liability limitations shall not apply to breaches of confidentiality, indemnification obligations, or IP infringement.', notes: 'Aceptable - carveouts razonables para obligaciones críticas' },
    { family: 'LiabilityLimitation', category: 'ACCEPTABLE', text: "EXCEPT FOR INDEMNIFICATION OBLIGATIONS, NEITHER PARTY'S LIABILITY SHALL EXCEED THE PRODUCTION BUDGET.", notes: 'Aceptable - cap vinculado a budget con indemnity carveout' },
    { family: 'LiabilityLimitation', category: 'UNACCEPTABLE', text: "Amazon's liability shall be limited to $[nominal amount].", notes: 'INACEPTABLE - cap nominal no es razonable' },
    { family: 'LiabilityLimitation', category: 'UNACCEPTABLE', text: 'Producer waives all claims for damages against Amazon, regardless of cause.', notes: 'INACEPTABLE - waiver total no es razonable ni posiblemente enforceable' },
    { family: 'LiabilityLimitation', category: 'UNACCEPTABLE', text: 'Neither party shall be liable for any damages whatsoever.', notes: 'INACEPTABLE - illusory contract si no hay liability' },
    { family: 'LiabilityLimitation', category: 'UNACCEPTABLE', text: 'ProdCo shall have unlimited liability to Amazon for all damages.', notes: 'INACEPTABLE - liability asimétrica sin límite para Producer no es equilibrado' },
    { family: 'LiabilityLimitation', category: 'NOT_COVERED', text: 'Liability for environmental contamination or personal injury shall not be limited.', notes: 'ESCALAR - tort carveouts requieren revisión de riesgos' },
    { family: 'LiabilityLimitation', category: 'NOT_COVERED', text: 'Liability limitations are subject to applicable insurance coverage minimums.', notes: 'ESCALAR - intersección con Insurance requiere análisis conjunto' },
    { family: 'LiabilityLimitation', category: 'NOT_COVERED', text: 'Liability for breach of data protection obligations shall be governed by GDPR limitations.', notes: 'ESCALAR - GDPR limitations requieren análisis de DataProtection' }
];

async function generateEmbedding(text) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 1536
    });
    return response.data[0].embedding;
}

async function main() {
    console.log(`Loading ${examples.length} examples...`);

    let successCount = 0;
    let errorCount = 0;

    for (const ex of examples) {
        try {
            const policySpecId = familyIds[ex.family];
            if (!policySpecId) {
                console.error(`No policy_spec_id for family: ${ex.family}`);
                errorCount++;
                continue;
            }

            const embedding = await generateEmbedding(ex.text);

            const { error } = await supabase.from('variation_set').insert({
                policy_spec_id: policySpecId,
                category: ex.category,
                text: ex.text,
                metadata: { notes: ex.notes },
                embedding: embedding,
                is_active: true,
                origin: 'LEGAL_REVIEW'
            });

            if (error) {
                console.error(`Error inserting: ${ex.family}/${ex.category}:`, error.message);
                errorCount++;
            } else {
                successCount++;
                process.stdout.write(`\rInserted: ${successCount}/${examples.length}`);
            }

            // Rate limiting
            await new Promise(r => setTimeout(r, 100));

        } catch (err) {
            console.error(`Error processing: ${ex.family}:`, err.message);
            errorCount++;
        }
    }

    console.log(`\n\nDone! Success: ${successCount}, Errors: ${errorCount}`);
}

main().catch(console.error);
