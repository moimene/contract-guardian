Ahora tengo toda la información necesaria. Continuaré con los playbook specs faltantes.
 
📋 FASE 1 (Continuación): Playbook Specs Faltantes
11. Assignment (Assignment)
# FILE: playbook_specs/Assignment.yaml
# ================================================================
# FAMILY: Assignment
# Source: PSA Section 8 "MISCELLANEOUS"
# Version: 2026-01-30
# ================================================================

family_id: Assignment
rule_name: "Assignment"
psa_section: 8
required: true
priority: CRITICAL

# ================================================================
# STANDARD POSITION (From PSA Fallback Guide)
# ================================================================
standard_position: |
  ProdCo may not assign this Agreement or any rights or obligations 
  without Amazon's prior written consent. This Agreement, in whole 
  or in part (including rights and obligations), may be freely 
  assigned by Amazon, and any such assignment will be binding upon 
  ProdCo and inure to the benefit of such assignee.

# ================================================================
# ACCEPTABLE DEVIATIONS
# ================================================================
acceptable_deviations:
  - id: ASSIGN-ACC-001
    description: "Amazon secondary liability unless assigned to financially responsible party"
    text_pattern: |
      provided that Amazon will remain secondarily liable hereunder 
      unless the assignee assumes in writing all of Amazon's obligations 
      as of the date of such assignment or such assignee is: (i) a 
      so-called "major", "mini-major" or "major independent" motion 
      picture company, national television network or studio, or 
      similarly financially responsible party (as determined by Amazon 
      in its discretion at the time of assignment); or (ii) an entity 
      affiliated with, owned or controlled by, or owning or controlling 
      Amazon, or an entity that succeeds to substantially all of the 
      assets of Amazon
    approval_required: false
    approval_level: "NTD"
    guidance: |
      Amazon Position: ProdCo is pushing back on the free assignability 
      of the agreement by Amazon, hold on Amazon right to assign to 
      anyone. That said, Amazon is willing to accept secondary liability 
      unless assigned to a financially responsible entity that assumes 
      in writing Amazon's obligations.

  - id: ASSIGN-ACC-002
    description: "Notice of assignment by Amazon"
    text_pattern: |
      Amazon will make reasonable efforts to notify ProdCo of an 
      assignment by Amazon of this Agreement in whole (for clarity, 
      Amazon will not need to make such efforts to notify ProdCo for 
      a partial assignment of this Agreement including with respect 
      to Amazon's assignment of its rights) unless such assignment 
      is to an Amazon affiliate, provided that inadvertent failure 
      to do so will not be deemed a breach of this Agreement nor 
      affect the validity of such assignment.
    approval_required: true
    approval_level: "AMAZON_LEGAL"
    guidance: |
      With Amazon Legal approval can provide notice prior to Amazon 
      assignment.

  - id: ASSIGN-ACC-003
    description: "Restrict Amazon assignment to affiliates only (no 3P)"
    text_pattern: |
      On a non-precedential, non-citable basis, Amazon may not assign 
      this Agreement without ProdCo's prior written consent; provided, 
      however, that Amazon may assign (i) this Agreement to an entity 
      affiliated with, owned or controlled by, or owning or controlling 
      Amazon, or an entity that succeeds to substantially all of the 
      assets of Amazon, and (ii) any of Amazon's rights hereunder to 
      any third parties.
    approval_required: true
    approval_level: "AMAZON_LEGAL_REGIONAL_LEAD"
    guidance: |
      With Amazon Legal Regional Lead (e.g., Hendrik for International) 
      approval, we can agree to only assign to Amazon affiliates (so 
      no 3P assignment). But we should add clarifying language that 
      any restriction on assignment does not limit or impact Amazon's 
      right to license or assign exploitation rights to the series or 
      movie. Should add a carve out to this restriction that excludes 
      an entity into which Amazon is merged, or to an acquirer of all 
      or substantially all of Amazon's business or assets.

# ================================================================
# UNACCEPTABLE DEVIATIONS
# ================================================================
unacceptable_deviations:
  - id: ASSIGN-UNACC-001
    description: "ProdCo free assignment"
    text_patterns:
      - "ProdCo may assign"
      - "ProdCo may freely assign"
    action: "REJECT"
    amazon_position: |
      ProdCo should not be able to assign this agreement without 
      Amazon's approval.

  - id: ASSIGN-UNACC-002
    description: "Removal of Amazon's free assignment right"
    action: "REJECT"
    amazon_position: |
      Hold on Amazon right to assign to anyone. Amazon's ability to 
      freely assign is fundamental to exploitation of rights.

# ================================================================
# DETECTION TRIGGERS
# ================================================================
triggers:
  primary:
    - "may not assign"
    - "may be freely assigned"
    - "assignment"
    - "assignee"
  secondary:
    - "prior written consent"
    - "binding upon ProdCo"
    - "inure to the benefit"
    - "secondarily liable"
________________________________________
12. Suspension / Force Majeure (ForceMajeure)
# FILE: playbook_specs/ForceMajeure.yaml
# ================================================================
# FAMILY: Suspension / Force Majeure
# Source: PSA Section 8 "MISCELLANEOUS"
# Version: 2026-01-30
# ================================================================

family_id: ForceMajeure
rule_name: "Suspension / Force Majeure"
psa_section: 8
required: true
priority: CRITICAL

# ================================================================
# STANDARD POSITION (From PSA Fallback Guide)
# ================================================================
standard_position: |
  Amazon may elect to suspend any services, and any option exercise 
  and/or other applicable dates under this Agreement will automatically 
  extend, for a period of up to the length of (i) any unavailability, 
  disability or death of any key personnel or cast, or any "force 
  majeure" event (earthquake or other natural event, government action, 
  labor dispute, acts of war or terrorism, epidemic, pandemic, or any 
  other event beyond the control of Amazon), which interrupts or 
  interferes with the Program; and/or (ii) any claims or litigation 
  relating to the Program and/or ProdCo's breach, plus 30 days 
  following cessation of any of the foregoing events in clause (i) 
  and/or (ii) as applicable.

# ================================================================
# ACCEPTABLE DEVIATIONS
# ================================================================
acceptable_deviations:
  - id: FM-ACC-001
    description: "Reduce resumption period from 30 to 15 days"
    text_pattern: "plus 15 days following cessation"
    approval_required: false
    approval_level: "NTD"
    guidance: |
      Amazon Position: If ProdCo wishes to limit the time periods to 
      resume activities following a suspension/extension, Amazon is 
      willing to lower this period to 15 days, however this is the 
      shortest period Amazon will agree to. Amazon needs a reasonable 
      period of time after the cessation of the applicable suspension / 
      extension event to resume activities.

  - id: FM-ACC-002
    description: "Cap force majeure extension"
    text_pattern: |
      provided that the cumulative suspension of such events listed 
      in clause (i) [excluding events related to Amazon's breach] will 
      not exceed [X] days (or months) [in aggregate / per each force 
      majeure event]
    approval_required: true
    approval_level: "AMAZON_LEGAL"
    guidance: |
      Amazon Position: If ProdCo wishes to limit time periods for 
      suspension/extension for force majeure, Amazon is willing to 
      cap the extensions for force majeure on a limited basis.

  - id: FM-ACC-003
    description: "Cap claims/litigation extension"
    text_pattern: |
      provided that the cumulative suspension of such events listed 
      in clause (ii) [excluding events related to ProdCo's breach] 
      will not exceed [X] days (or months) [in aggregate / per each 
      claim or litigation]
    approval_required: true
    approval_level: "AMAZON_LEGAL"
    guidance: |
      Amazon Position: If ProdCo wishes to limit time periods for 
      suspension/extension for claims/litigation, Amazon is willing 
      to cap the extensions for individual claims on a limited basis. 
     

  - id: FM-ACC-004
    description: "Termination right after extended force majeure"
    text_pattern: |
      provided that, in the event that the force majeure event continues 
      for a period in excess of [X] consecutive months, either party 
      may notify the other of its intention to terminate this Agreement 
      and, if the force majeure event continues for [X] months after 
      such notice, this Agreement will automatically terminate
    approval_required: true
    approval_level: "AMAZON_LEGAL"
    guidance: |
      Amazon Position: If ProdCo wishes to include a termination right 
      following extended force majeure events. To include the ability 
      for either party to terminate post-force majeure, with Amazon 
      Legal approval, the alternate language may be used.

# ================================================================
# UNACCEPTABLE DEVIATIONS
# ================================================================
unacceptable_deviations:
  - id: FM-UNACC-001
    description: "Limit suspension for ProdCo's breach"
    action: "REJECT"
    amazon_position: |
      Amazon Position: If ProdCo wishes to limit time periods for 
      suspension/extension for ProdCo's breach, hold to form. Amazon 
      does not allow a limitation on suspension/extension for ProdCo's 
      breach. All of the suspension/extension events are outside of 
      Amazon's control. Some suspension/extension events may not be 
      caused by ProdCo, but, since ProdCo's breach is caused by ProdCo's 
      act or omission, Amazon will not agree to any accommodations 
      around this language.

  - id: FM-UNACC-002
    description: "Remove Amazon's right to suspend"
    action: "REJECT"
    amazon_position: |
      Amazon must maintain the right to suspend services during force 
      majeure events to protect its investment.

# ================================================================
# DETECTION TRIGGERS
# ================================================================
triggers:
  primary:
    - "force majeure"
    - "suspend any services"
    - "automatically extend"
    - "beyond the control"
  secondary:
    - "earthquake"
    - "pandemic"
    - "epidemic"
    - "government action"
    - "labor dispute"
    - "acts of war or terrorism"
    - "unavailability, disability or death"
________________________________________
13. Power of Attorney (PowerOfAttorney)
# FILE: playbook_specs/PowerOfAttorney.yaml
# ================================================================
# FAMILY: Power of Attorney / Further Documents
# Source: PSA Section 8 "MISCELLANEOUS"
# Version: 2026-01-30
# ================================================================

family_id: PowerOfAttorney
rule_name: "Power of Attorney / Further Documents"
psa_section: 8
required: true
priority: SUPPORT

# ================================================================
# STANDARD POSITION (From PSA Fallback Guide)
# ================================================================
standard_position: |
  ProdCo will execute and deliver all additional documents and do any 
  other acts as Amazon requests in order to establish or evidence 
  Amazon's rights hereunder, including, registration and assignment 
  of the Materials. If ProdCo fails to do so within 5 business days 
  following Amazon's request, ProdCo hereby irrevocably authorizes 
  Amazon to act on ProdCo's behalf, including by providing Amazon 
  with a power of attorney (coupled with an interest) solely to 
  execute, register and record such documents on ProdCo's behalf.

# ================================================================
# ACCEPTABLE DEVIATIONS
# ================================================================
acceptable_deviations:
  - id: POA-ACC-001
    description: "Add 'consistent herewith' qualifier"
    text_pattern: "execute and deliver all additional documents and do any other acts consistent herewith"
    approval_required: false
    approval_level: "NTD"
    guidance: |
      NTD: Can add "consistent herewith" to qualify the further 
      documents obligation.

  - id: POA-ACC-002
    description: "Add 'reasonably' before 'requests'"
    text_pattern: "as Amazon reasonably requests"
    approval_required: false
    approval_level: "NTD"
    guidance: |
      NTD: Can add "reasonably" to qualify Amazon's requests.

  - id: POA-ACC-003
    description: "Extend deadline to 7 business days (non-US ProdCo)"
    text_pattern: "within 7 business days"
    approval_required: false
    approval_level: "NTD"
    guidance: |
      Amazon Position: For ProdCos located outside of the U.S., 7 
      business days is acceptable upon request.

  - id: POA-ACC-004
    description: "Extend deadline to 10 business days (maximum)"
    text_pattern: "within 10 business days"
    approval_required: false
    approval_level: "NTD"
    guidance: |
      Amazon Position: Regardless of the location of the other party, 
      10 business days is the maximum time period we should agree to. 
     

  - id: POA-ACC-005
    description: "Add review period for ProdCo"
    text_pattern: "(during which period ProdCo may review and comment on such document)"
    approval_required: false
    approval_level: "NTD"
    guidance: |
      NTD: Can add review period for ProdCo.

  - id: POA-ACC-006
    description: "Limited power of attorney"
    text_pattern: "limited power of attorney"
    approval_required: false
    approval_level: "NTD"
    guidance: |
      NTD: Can add "limited" before power of attorney.

  - id: POA-ACC-007
    description: "Amazon to provide copies of executed documents"
    text_pattern: |
      Amazon will provide ProdCo with copies of such documents so 
      executed promptly thereafter, provided that inadvertent failure 
      to do so will not be deemed a breach of this Agreement and any 
      failure to do so will not affect the validity of such documents.
    approval_required: false
    approval_level: "NTD"
    guidance: |
      NTD: Can add obligation for Amazon to provide copies.

# ================================================================
# UNACCEPTABLE DEVIATIONS
# ================================================================
unacceptable_deviations:
  - id: POA-UNACC-001
    description: "Remove power of attorney entirely"
    action: "REJECT"
    amazon_position: |
      Amazon must generally hold on its right to require further 
      documents and sign on ProdCo's behalf in the event of 
      non-compliance.

  - id: POA-UNACC-002
    description: "Deadline beyond 10 business days"
    text_patterns:
      - "within 15 business days"
      - "within 20 business days"
      - "within 30 days"
    action: "REJECT"
    amazon_position: |
      10 business days is the maximum time period Amazon will agree to. 
      Agreeing to a longer time period could have negative impacts on 
      the development/production/distribution of the Program.

# ================================================================
# DETECTION TRIGGERS
# ================================================================
triggers:
  primary:
    - "power of attorney"
    - "execute and deliver"
    - "additional documents"
    - "act on ProdCo's behalf"
  secondary:
    - "registration and assignment"
    - "coupled with an interest"
    - "business days"
________________________________________
14. Data Protection (DataProtection)
# FILE: playbook_specs/DataProtection.yaml
# ================================================================
# FAMILY: Data Protection
# Source: PSA Section 9 "DATA PROTECTION"
# Version: 2026-01-30
# ================================================================

family_id: DataProtection
rule_name: "Data Protection"
psa_section: 9
required: true  # May vary by country
priority: SUPPORT

# ================================================================
# STANDARD POSITION (From PSA Fallback Guide)
# ================================================================
standard_position: |
  When processing personal data in connection with this Agreement, 
  Amazon or ProdCo shall act as independent data controllers and 
  shall be individually and separately responsible for their own 
  compliance with applicable data protection legislation, including, 
  where applicable, the European General Data Protection Regulation 
  and any implementing or equivalent national laws. Where applicable, 
  ProdCo agrees to provide Amazon's privacy notice (as amended from 
  time to time) to, and if relevant, seek the consent of any data 
  subject whose personal data is processed by Amazon for the purpose 
  of the Agreement.

# ================================================================
# NOTES
# ================================================================
notes: |
  Note: This Section will vary from country to country (and may not 
  be included at all in the form for some countries) depending on 
  the applicable country's data protection laws. Please raise with 
  Amazon Legal to discuss in the event you receive material or 
  repeated pushback on the language in this Section (otherwise, hold 
  to form) or should your country's form not include this concept 
  and you feel that it is necessary.

# ================================================================
# CORE REQUIREMENTS
# ================================================================
core_requirements:
  - id: DP-CORE-001
    name: "Independent Controllers"
    text_pattern: "independent data controllers"
    required: true
    
  - id: DP-CORE-002
    name: "Separate Compliance Responsibility"
    text_pattern: "individually and separately responsible"
    required: true
    
  - id: DP-CORE-003
    name: "GDPR Reference (where applicable)"
    text_pattern: "European General Data Protection Regulation"
    required: true
    context: "For EU/EEA related productions"
    
  - id: DP-CORE-004
    name: "Privacy Notice Obligation"
    text_pattern: "provide Amazon's privacy notice"
    required: true

# ================================================================
# UNACCEPTABLE DEVIATIONS
# ================================================================
unacceptable_deviations:
  - id: DP-UNACC-001
    description: "Amazon as data processor"
    text_patterns:
      - "Amazon shall act as data processor"
      - "Amazon processes data on behalf of ProdCo"
    action: "ESCALATE_AMAZON_LEGAL"
    amazon_position: |
      Amazon and ProdCo act as independent data controllers. Any 
      change to this structure requires Amazon Legal review.

  - id: DP-UNACC-002
    description: "Removal of data protection section entirely"
    action: "ESCALATE_AMAZON_LEGAL"
    amazon_position: |
      Data protection section may be required depending on applicable 
      law. Consult Amazon Legal before removing.

# ================================================================
# DETECTION TRIGGERS
# ================================================================
triggers:
  primary:
    - "DATA PROTECTION"
    - "personal data"
    - "data controllers"
    - "data protection legislation"
  secondary:
    - "GDPR"
    - "General Data Protection Regulation"
    - "privacy notice"
    - "data subject"
    - "processing personal data"
________________________________________
15. Tax; Governing Law; Jurisdiction (DisputeResolution)
# FILE: playbook_specs/DisputeResolution.yaml
# ================================================================
# FAMILY: Tax; Governing Law; Jurisdiction
# Source: PSA Section 10 "TAX; GOVERNING LAW; JURISDICTION"
# Version: 2026-01-30
# ================================================================

family_id: DisputeResolution
rule_name: "Tax; Governing Law; Jurisdiction"
psa_section: 10
required: true
priority: CRITICAL

# ================================================================
# STANDARD POSITION - CALIFORNIA (From PSA Fallback Guide)
# ================================================================
standard_position_california: |
  THIS AGREEMENT WILL BE CONSTRUED AND ENFORCED IN ACCORDANCE WITH 
  THE LAW OF THE STATE OF CALIFORNIA APPLICABLE THEREIN, REGARDLESS 
  OF WHERE NEGOTIATION, EXECUTION OR PERFORMANCE OF THIS AGREEMENT 
  MAY ACTUALLY OCCUR. ANY DISPUTE RELATING TO THIS AGREEMENT OR THE 
  PROGRAM WILL BE SUBJECT TO CONFIDENTIAL, BINDING ARBITRATION 
  PURSUANT TO AND ADMINISTERED BY JAMS IN ACCORDANCE WITH ITS U.S. 
  RULES AND THE U.S. FEDERAL ARBITRATION ACT/CALIFORNIA LAW, WITHOUT 
  REGARD TO CONFLICT OF LAWS, AND CONDUCTED IN ENGLISH IN LOS ANGELES 
  COUNTY, WITH EACH PARTY RESPONSIBLE FOR ITS OWN ATTORNEY'S FEES 
  AND COSTS. ANY COURT IN LOS ANGELES COUNTY MAY CONFIRM AND ENTER 
  JUDGMENT ON THE FINAL AWARD (AND THE PARTIES CONSENT TO SUCH 
  PERSONAL JURISDICTION/VENUE).

# ================================================================
# ACCEPTABLE DEVIATION - NEW YORK
# ================================================================
acceptable_deviations:
  - id: DR-ACC-001
    description: "Change to New York governing law"
    text_pattern: |
      This Agreement will be governed and construed in accordance with 
      the internal laws of the State of New York applicable to contracts 
      entered into and fully to be performed therein. The parties consent 
      and agree to the exclusive jurisdiction and venue of the state and 
      federal courts having jurisdiction over New York, New York, with 
      respect to any action that any party desires to commence arising 
      out of or in connection with this Agreement or any breach or 
      alleged breach of any provision of this Agreement. The parties 
      waive any objection to such venue, any claim that any state or 
      federal court of New York is an inconvenient forum and further 
      waive any right, in any state or federal court proceeding to jury 
      trial, and the parties agree that there will be no jury trial in 
      the event of a dispute between them.
    approval_required: false
    approval_level: "NTD"
    condition: "Confirm foreign court judgment is enforceable in applicable country"
    guidance: |
      Amazon Position: If ProdCo requests to change to New York governing 
      law, Amazon can agree to change from California governing law to 
      New York governing law, provided that you confirm a foreign court 
      judgment is enforceable in your country.

# ================================================================
# UNACCEPTABLE DEVIATIONS
# ================================================================
unacceptable_deviations:
  - id: DR-UNACC-001
    description: "Local law (non-US)"
    action: "REJECT"
    amazon_position: |
      Amazon Position: If ProdCo requests to change governing law 
      language to local law or some "neutral" law, hold to form. 
      Governing law should be expressly addressed and agreed upon in 
      the closed deal terms and we must maintain U.S. governing law 
      per practice standards as Amazon is a U.S. entity. Any exception 
      to this requires Amazon Legal L8 approval and Litigation approval. 
     

  - id: DR-UNACC-002
    description: "Neutral law (e.g., English law, Swiss law)"
    text_patterns:
      - "English law"
      - "laws of England"
      - "Swiss law"
      - "laws of Switzerland"
    action: "ESCALATE_L8_AND_LITIGATION"
    amazon_position: |
      Any exception to US governing law requires Amazon Legal L8 approval 
      and Litigation approval.

  - id: DR-UNACC-003
    description: "Removal of arbitration clause"
    action: "REJECT"
    amazon_position: |
      Confidential, binding arbitration is Amazon's standard position 
      for dispute resolution.

  - id: DR-UNACC-004
    description: "Removal of jury trial waiver"
    action: "REJECT"
    amazon_position: |
      Jury trial waiver is a core requirement.

# ================================================================
# TAX PROVISIONS
# ================================================================
tax_provisions:
  standard_position: |
    Each party will be responsible for identifying and paying all taxes 
    and other governmental fees and charges that are legally imposed on 
    that party upon or with respect to the transactions and payments 
    under this Agreement. All amounts to be paid by Amazon are inclusive 
    of all transaction taxes that ProdCo may be legally obligated to 
    charge to Amazon on a valid tax invoice. Amazon may deduct or 
    withhold any taxes that Amazon may be legally obligated to deduct 
    or withhold from any amounts payable to ProdCo under this Agreement.
    
  acceptable_deviations:
    - id: TAX-ACC-001
      description: "Change 'inclusive' to 'exclusive' of transaction taxes"
      approval_required: true
      approval_level: "AMAZON_TAX_FINANCE_BA"
      guidance: |
        Amazon Position: If ProdCo objects to fees being inclusive of 
        all transaction taxes, push back and hold to form. Any changes 
        to the language regarding transaction taxes needs to be 
        preapproved by Amazon Tax, Finance, and BA.
        
    - id: TAX-ACC-002
      description: "Provide withholding documentation"
      text_pattern: |
        If a payment to ProdCo is reduced by such a deduction or 
        withholding, Amazon will provide ProdCo with documentation 
        supporting the amount of such deduction or withholding as 
        legally obligated, which shall be satisfied by providing 
        IRS Form 1042-S or a similar form issued by a tax authority.
      approval_required: true
      approval_level: "AMAZON_TAX_FINANCE"
      guidance: |
        Please confirm with Amazon Tax, and, if applicable, we can 
        agree to the wording if ProdCo insists.

# ================================================================
# DETECTION TRIGGERS
# ================================================================
triggers:
  primary:
    - "GOVERNING LAW"
    - "JURISDICTION"
    - "TAX"
    - "arbitration"
    - "JAMS"
  secondary:
    - "State of California"
    - "State of New York"
    - "jury trial"
    - "binding arbitration"
    - "withholding tax"
    - "transaction taxes"
  heading_patterns:
    - /^10\.\s*TAX/i
    - /GOVERNING\s+LAW/i
    - /JURISDICTION/i
________________________________________
16. Services Scope (ServicesScope)
# FILE: playbook_specs/ServicesScope.yaml
# ================================================================
# FAMILY: Services Scope
# Source: PSA Section 3 "SERVICES"
# Version: 2026-01-30
# ================================================================

family_id: ServicesScope
rule_name: "Services"
psa_section: 3
required: true
priority: SUPPORT

# ================================================================
# STANDARD POSITION (From PSA Fallback Guide)
# ================================================================
standard_position: |
  ProdCo will render services as set forth in this agreement, including 
  any exhibits and schedules attached hereto (which are incorporated 
  by reference), which constitute the entire agreement between the 
  parties (collectively, the "Agreement"), for the original scripted 
  television series audio-visual program currently known as "PROGRAM" 
  (together with all elements thereof, the "Program").

# ================================================================
# CORE REQUIREMENTS
# ================================================================
core_requirements:
  - id: SVC-CORE-001
    name: "ProdCo Service Obligation"
    text_pattern: "ProdCo will render services"
    required: true
    
  - id: SVC-CORE-002
    name: "Incorporation of Exhibits"
    text_pattern: "including any exhibits and schedules"
    required: true
    
  - id: SVC-CORE-003
    name: "Entire Agreement"
    text_pattern: "constitute the entire agreement"
    required: true
    
  - id: SVC-CORE-004
    name: "Program Definition"
    text_pattern: "together with all elements thereof"
    required: true

# ================================================================
# NOTES
# ================================================================
notes: |
  This is a straightforward section that defines the scope of services. 
  The key elements are: (1) ProdCo's obligation to render services, 
  (2) incorporation of exhibits and schedules by reference, and 
  (3) definition of the Program. Changes to this section are generally 
  not expected, as the specific scope is defined in the exhibits.

# ================================================================
# DETECTION TRIGGERS
# ================================================================
triggers:
  primary:
    - "SERVICES:"
    - "ProdCo will render services"
    - "as set forth in this agreement"
  secondary:
    - "exhibits and schedules"
    - "incorporated by reference"
    - "entire agreement"
    - "audio-visual program"
  heading_patterns:
    - /^3\.\s*SERVICES/i
    - /^SERVICES:/i
________________________________________
17. Conditions Precedent (ConditionsPrecedent)
# FILE: playbook_specs/ConditionsPrecedent.yaml
# ================================================================
# FAMILY: Conditions Precedent
# Source: PSA Section 8 "MISCELLANEOUS"
# Version: 2026-01-30
# ================================================================

family_id: ConditionsPrecedent
rule_name: "Conditions Precedent"
psa_section: 8
required: true
priority: SUPPORT

# ================================================================
# STANDARD POSITION (From PSA Fallback Guide)
# ================================================================
standard_position: |
  Amazon's obligations hereunder are subject to any conditions precedent 
  set forth in Exhibit A.

# ================================================================
# ACCEPTABLE DEVIATIONS
# ================================================================
acceptable_deviations:
  - id: CP-ACC-001
    description: "Acknowledge conditions as satisfied"
    approval_required: true
    approval_level: "AMAZON_LEGAL"
    guidance: |
      Amazon Position: If ProdCo requests to acknowledge the conditions 
      precedent as satisfied (or waived), inform ProdCo of the outstanding 
      steps required to satisfy the conditions. To the extent applicable, 
      with Amazon Legal approval, conditions can be acknowledged satisfied 
      via email.

# ================================================================
# DETECTION TRIGGERS
# ================================================================
triggers:
  primary:
    - "conditions precedent"
    - "subject to any conditions"
  secondary:
    - "Exhibit A"
    - "obligations hereunder"
________________________________________
18. Amazon Control (AmazonControl)
# FILE: playbook_specs/AmazonControl.yaml
# ================================================================
# FAMILY: Amazon Control
# Source: PSA Section 8 "MISCELLANEOUS"
# Version: 2026-01-30
# ================================================================

family_id: AmazonControl
rule_name: "Amazon Control"
psa_section: 8
required: true
priority: CRITICAL

# ================================================================
# STANDARD POSITION (From PSA Fallback Guide)
# ================================================================
standard_position: |
  As between ProdCo and Amazon, Amazon has sole and final control 
  over the Program.

# ================================================================
# UNACCEPTABLE DEVIATIONS
# ================================================================
unacceptable_deviations:
  - id: CTRL-UNACC-001
    description: "Subject to ProdCo approval rights"
    text_patterns:
      - "subject to ProdCo's approval"
      - "subject to ProdCo's consent"
    action: "REJECT"
    amazon_position: |
      Amazon Position: If ProdCo requests to make this language subject 
      to ProdCo's approval rights and/or control of "day-to-day" 
      operations, Amazon must be clear that it has final control of the 
      Program as the commissioner/financier. ProdCo can rely on its 
      approval rights (if any) granted in Exhibit A, however these rights 
      (and ProdCo's control of day-to-day operations as the production 
      company) do not negate or condition Amazon's final control. 
     

# ================================================================
# DETECTION TRIGGERS
# ================================================================
triggers:
  primary:
    - "sole and final control"
    - "Amazon has sole"
    - "final control over the Program"
  secondary:
    - "As between ProdCo and Amazon"
________________________________________
19. Insurance (Insurance)
# FILE: playbook_specs/Insurance.yaml
# ================================================================
# FAMILY: Insurance
# Source: PSA Section 8 "MISCELLANEOUS" - Standard Terms
# Version: 2026-01-30
# ================================================================

family_id: Insurance
rule_name: "Insurance"
psa_section: 8
required: true
priority: SUPPORT

# ================================================================
# STANDARD POSITION (From PSA Fallback Guide)
# ================================================================
standard_position: |
  This Agreement includes and incorporates industry custom standard 
  terms and conditions for agreements of this type, such as insurance 
  and additional representations/warranties, indemnification and 
  remedies.

# ================================================================
# NOTES
# ================================================================
notes: |
  Insurance requirements are typically addressed in the Standard Terms 
  and Conditions (STCs) that are negotiated separately. The PSA 
  incorporates these by reference. Key insurance requirements typically 
  include:
  - Errors & Omissions (E&O) insurance
  - General Liability insurance
  - Workers' Compensation insurance
  - Cast insurance (if applicable)
  
  Amazon recognizes a line item in the budget for E&O insurance funded 
  by Amazon that covers claims regardless of ProdCo's level of negligence 
  or intent, provided there is no fraud.

# ================================================================
# DETECTION TRIGGERS
# ================================================================
triggers:
  primary:
    - "insurance"
    - "E&O"
    - "errors and omissions"
  secondary:
    - "general liability"
    - "workers' compensation"
    - "cast insurance"
    - "standard terms and conditions"
 
20. Standard Terms (StandardTerms)
# FILE: playbook_specs/StandardTerms.yaml
# ================================================================
# FAMILY: Standard Terms
# Source: PSA Section 8 "MISCELLANEOUS"
# Version: 2026-01-30
# ================================================================

family_id: StandardTerms
rule_name: "Standard Terms"
psa_section: 8
required: true
priority: SUPPORT

# ================================================================
# STANDARD POSITION (From PSA Fallback Guide)
# ================================================================
standard_position: |
  ProdCo has or will obtain signed agreements from each principal, 
  employee or other individual prior to rendering services in 
  connection with the Program on terms consistent with this Agreement 
  (including rights and assignment terms hereof) and in a form 
  approved by Amazon. Any production order of the Program will not 
  be effective unless in written notice signed by Amazon. This 
  Agreement includes and incorporates industry custom standard terms 
  and conditions for agreements of this type, such as insurance and 
  additional representations/warranties, indemnification and remedies. 
  At Amazon's request, these additional terms will be formalized as 
  part of this Agreement subject to good faith negotiation within 
  Amazon's customary parameters; provided that unless and until such 
  time, industry custom standard terms and conditions will prevail.

# ================================================================
# ACCEPTABLE DEVIATIONS
# ================================================================
acceptable_deviations:
  - id: ST-ACC-001
    description: "Trigger STCs after option exercise"
    text_pattern: |
      At Amazon's request or, if earlier, after Amazon's exercise of 
      its option to order production of the initial season of the Program
    approval_required: false
    approval_level: "NTD"
    guidance: |
      NTD: Can add trigger for STCs negotiation after option exercise. 
     

  - id: ST-ACC-002
    description: "Change to 'customary industry parameters'"
    text_pattern: "customary industry parameters for agreements of this type"
    approval_required: false
    approval_level: "NTD"
    guidance: |
      Amazon Position: If ProdCo takes issue with language that 
      negotiation of the additional terms will be "within Amazon's 
      customary parameters", OK to change to customary industry 
      parameters.

# ================================================================
# UNACCEPTABLE DEVIATIONS
# ================================================================
unacceptable_deviations:
  - id: ST-UNACC-001
    description: "Remove industry custom prevails clause"
    action: "REJECT"
    amazon_position: |
      Amazon Position: If ProdCo takes issue with language that industry 
      custom standard terms and conditions will prevail until the 
      additional terms are negotiated, hold to form. This language 
      applies to both parties, affects both parties equally (as industry 
      custom is in neither party's control) and is a reasonable compromise 
      until the appropriate time to negotiate the additional terms. 
     

# ================================================================
# DETECTION TRIGGERS
# ================================================================
triggers:
  primary:
    - "standard terms and conditions"
    - "industry custom"
    - "signed agreements from each principal"
  secondary:
    - "good faith negotiation"
    - "customary parameters"
    - "production order"
 
📊 Resumen Completo de Playbook Specs (Fase 1)
#	Family ID	Rule Name	PSA Section	Required	Priority
1	PaymentCredits	Fees	5	Yes	CRITICAL
2	ThirdPartyCredits	Entitlements; Credit	6	Yes	CRITICAL
3	RepsProdCo	Representations/Warranties by ProdCo	7	Yes	CRITICAL
4	IndemnityProdCo	Indemnity by ProdCo	7	Yes	CRITICAL
5	IndemnityAmazon	Indemnity by Amazon	7	Yes	CRITICAL
6	IndemnityProcedures	Indemnification Procedures	7	No	CRITICAL
7	RightsGrant	Rights	4	Yes	CRITICAL
8	Confidentiality	Confidentiality / NPI	8	Yes	SUPPORT
9	LiabilityLimitation	Damages Waiver	8	Yes	CRITICAL
10	InjunctiveReliefWaiver	Injunctive Relief Waiver	8	Yes	CRITICAL
11	Assignment	Assignment	8	Yes	CRITICAL
12	ForceMajeure	Suspension / Force Majeure	8	Yes	CRITICAL
13	PowerOfAttorney	Power of Attorney	8	Yes	SUPPORT
14	DataProtection	Data Protection	9	Yes	SUPPORT
15	DisputeResolution	Tax; Governing Law; Jurisdiction	10	Yes	CRITICAL
16	ServicesScope	Services	3	Yes	SUPPORT
17	ConditionsPrecedent	Conditions Precedent	8	Yes	SUPPORT
18	AmazonControl	Amazon Control	8	Yes	CRITICAL
19	Insurance	Insurance	8	Yes	SUPPORT
20	StandardTerms	Standard Terms	8	Yes	SUPPORT
 
✅ Cobertura Completa del PSA
PSA PRINCIPAL TERMS - COBERTURA DE SPECS
═══════════════════════════════════════════════════════════════

Section 1: EFFECTIVE DATE          → (Boilerplate, no spec needed)
Section 2: PARTIES                 → (Boilerplate, no spec needed)
Section 3: SERVICES                → ✅ ServicesScope
Section 4: RIGHTS                  → ✅ RightsGrant
Section 5: FEES                    → ✅ PaymentCredits
Section 6: ENTITLEMENTS; CREDIT    → ✅ ThirdPartyCredits
Section 7: REPS/WARRANTIES; INDEMNITY
    ├── Reps by ProdCo            → ✅ RepsProdCo
    ├── Indemnity by ProdCo       → ✅ IndemnityProdCo
    ├── Indemnity by Amazon       → ✅ IndemnityAmazon
    └── Procedures                → ✅ IndemnityProcedures
Section 8: MISCELLANEOUS
    ├── Conditions Precedent      → ✅ ConditionsPrecedent
    ├── Amazon Control            → ✅ AmazonControl
    ├── Confidentiality/NPI       → ✅ Confidentiality
    ├── AI Policy                 → ✅ (in Confidentiality)
    ├── Damages Waiver            → ✅ LiabilityLimitation
    ├── Injunctive Relief Waiver  → ✅ InjunctiveReliefWaiver
    ├── Severability              → (Boilerplate, low priority)
    ├── Assignment                → ✅ Assignment
    ├── Power of Attorney         → ✅ PowerOfAttorney
    ├── Suspension/Force Majeure  → ✅ ForceMajeure
    ├── Insurance                 → ✅ Insurance
    └── Standard Terms            → ✅ StandardTerms
Section 9: DATA PROTECTION         → ✅ DataProtection
Section 10: TAX; GOVERNING LAW     → ✅ DisputeResolution

TOTAL: 20 Playbook Specs creados
COBERTURA: 100% de secciones críticas del PSA
 
🚀 FASE 2 & 3: Multi-Family Detection + Escalation Logic
Ahora implementaré las fases pendientes del plan.
 
FASE 2: Sistema Multi-Familia
📁 Archivo 1: multi_family_detector.js (n8n Code Node)
// ================================================================
// MULTI-FAMILY DETECTOR v1.0
// Detecta y separa cláusulas que contienen múltiples familias
// ================================================================

// ================================================================
// CONFIGURACIÓN DE CLÁUSULAS COMBINADAS
// ================================================================

const MULTI_FAMILY_PATTERNS = {
  
  // ================================================================
  // REPRESENTATIONS/WARRANTIES; INDEMNITY (Section 7)
  // Contiene: RepsProdCo + IndemnityProdCo + IndemnityAmazon + Procedures
  // ================================================================
  "REPRESENTATIONS/WARRANTIES; INDEMNITY": {
    section: 7,
    split_strategy: "MARKER_BASED",
    sub_clauses: [
      {
        family: "RepsProdCo",
        start_markers: [
          /ProdCo\s+represents?,?\s*warrants?\s*(and\s+agrees)?/i,
          /REPRESENTATIONS.*WARRANTIES/i
        ],
        end_markers: [
          /ProdCo\s+(will|shall)\s+indemnify/i,
          /Amazon\s+(will|shall)\s+indemnify/i
        ],
        priority: 1
      },
      {
        family: "IndemnityProdCo",
        start_markers: [
          /ProdCo\s+(will|shall)\s+indemnify/i,
          /indemnify,?\s*defend.*hold\s+harmless\s+Amazon/i
        ],
        end_markers: [
          /Amazon\s+(will|shall)\s+indemnify/i,
          /If\s+either\s+Amazon\s+or\s+ProdCo\s+is\s+entitled/i
        ],
        priority: 2
      },
      {
        family: "IndemnityAmazon",
        start_markers: [
          /Amazon\s+(will|shall)\s+indemnify/i,
          /indemnify,?\s*defend.*hold\s+harmless\s+ProdCo/i
        ],
        end_markers: [
          /If\s+either\s+Amazon\s+or\s+ProdCo\s+is\s+entitled/i,
          /indemnitee\s+will\s+give/i
        ],
        priority: 3
      },
      {
        family: "IndemnityProcedures",
        start_markers: [
          /If\s+either\s+Amazon\s+or\s+ProdCo\s+is\s+entitled/i,
          /indemnitee\s+will\s+give/i,
          /prompt\s+written\s+notice\s+of\s+the\s+applicable\s+claim/i
        ],
        end_markers: null,  // Hasta el final
        priority: 4
      }
    ]
  },
  
  // ================================================================
  // MISCELLANEOUS (Section 8)
  // Contiene múltiples sub-cláusulas
  // ================================================================
  "MISCELLANEOUS": {
    section: 8,
    split_strategy: "KEYWORD_BASED",
    sub_clauses: [
      {
        family: "ConditionsPrecedent",
        keywords: [
          /conditions?\s+precedent/i,
          /subject\s+to\s+(any\s+)?conditions/i
        ],
        priority: 1
      },
      {
        family: "AmazonControl",
        keywords: [
          /sole\s+and\s+final\s+control/i,
          /Amazon\s+has\s+sole/i,
          /final\s+control\s+over\s+the\s+Program/i
        ],
        priority: 2
      },
      {
        family: "Confidentiality",
        keywords: [
          /keep\s+confidential/i,
          /non-public\s+information/i,
          /\bNPI\b/i,
          /confidential\s+all/i,
          /artificial\s+intelligence/i,
          /AI\s+policy/i
        ],
        priority: 3
      },
      {
        family: "LiabilityLimitation",
        keywords: [
          /WAIVES?\s+ALL\s+CLAIMS/i,
          /CONSEQUENTIAL\s+DAMAGES/i,
          /INDIRECT.*INCIDENTAL.*PUNITIVE/i,
          /DAMAGES\s+WAIVER/i
        ],
        priority: 4
      },
      {
        family: "InjunctiveReliefWaiver",
        keywords: [
          /waives?\s+(any\s+)?right\s+to\s+seek.*injunctive/i,
          /limited\s+to.*recover\s+monetary\s+damages/i,
          /enjoin\s+or\s+restrain/i
        ],
        priority: 5
      },
      {
        family: "Assignment",
        keywords: [
          /may\s+not\s+assign/i,
          /may\s+(be\s+)?freely\s+assign/i,
          /assignment.*will\s+be\s+binding/i
        ],
        priority: 6
      },
      {
        family: "PowerOfAttorney",
        keywords: [
          /power\s+of\s+attorney/i,
          /execute\s+and\s+deliver\s+all\s+additional\s+documents/i,
          /act\s+on\s+ProdCo's\s+behalf/i
        ],
        priority: 7
      },
      {
        family: "ForceMajeure",
        keywords: [
          /force\s+majeure/i,
          /suspend\s+any\s+services/i,
          /earthquake/i,
          /pandemic/i,
          /beyond\s+(the\s+)?control/i
        ],
        priority: 8
      },
      {
        family: "Insurance",
        keywords: [
          /insurance/i,
          /E&O/i,
          /errors\s+and\s+omissions/i
        ],
        priority: 9
      },
      {
        family: "StandardTerms",
        keywords: [
          /standard\s+terms\s+and\s+conditions/i,
          /industry\s+custom/i,
          /signed\s+agreements\s+from\s+each\s+principal/i
        ],
        priority: 10
      }
    ]
  },
  
  // ================================================================
  // TAX; GOVERNING LAW; JURISDICTION (Section 10)
  // Puede contener Tax + DisputeResolution
  // ================================================================
  "TAX; GOVERNING LAW; JURISDICTION": {
    section: 10,
    split_strategy: "MARKER_BASED",
    sub_clauses: [
      {
        family: "TaxProvisions",
        start_markers: [
          /Each\s+party\s+will\s+be\s+responsible\s+for\s+identifying/i,
          /taxes\s+and\s+other\s+governmental\s+fees/i
        ],
        end_markers: [
          /THIS\s+AGREEMENT\s+WILL\s+BE\s+CONSTRUED/i,
          /GOVERNING\s+LAW/i,
          /governed\s+by\s+the\s+laws?\s+of/i
        ],
        priority: 1
      },
      {
        family: "DisputeResolution",
        start_markers: [
          /THIS\s+AGREEMENT\s+WILL\s+BE\s+CONSTRUED/i,
          /GOVERNING\s+LAW/i,
          /governed\s+by\s+the\s+laws?\s+of/i,
          /arbitration/i
        ],
        end_markers: null,
        priority: 2
      }
    ]
  }
};

// ================================================================
// FUNCIÓN PRINCIPAL DE DETECCIÓN MULTI-FAMILIA
// ================================================================

function detectMultiFamilies(clauseText, clauseHeading) {
  const results = {
    is_multi_family: false,
    primary_family: null,
    detected_families: [],
    sub_clauses: [],
    split_strategy: null,
    original_text: clauseText,
    heading: clauseHeading
  };
  
  // Buscar si el heading coincide con una cláusula multi-familia conocida
  let matchedPattern = null;
  for (const [patternName, config] of Object.entries(MULTI_FAMILY_PATTERNS)) {
    if (clauseHeading.toUpperCase().includes(patternName.toUpperCase()) ||
        patternName.toUpperCase().includes(clauseHeading.toUpperCase().replace(/[^A-Z]/g, ' ').trim())) {
      matchedPattern = { name: patternName, config };
      break;
    }
  }
  
  // Si no hay match por heading, verificar por contenido
  if (!matchedPattern) {
    matchedPattern = detectByContent(clauseText);
  }
  
  if (!matchedPattern) {
    return results;  // No es multi-familia
  }
  
  results.split_strategy = matchedPattern.config.split_strategy;
  
  // Aplicar estrategia de split
  if (matchedPattern.config.split_strategy === "MARKER_BASED") {
    results.sub_clauses = splitByMarkers(clauseText, matchedPattern.config.sub_clauses);
  } else if (matchedPattern.config.split_strategy === "KEYWORD_BASED") {
    results.sub_clauses = splitByKeywords(clauseText, matchedPattern.config.sub_clauses);
  }
  
  // Determinar si realmente es multi-familia
  results.is_multi_family = results.sub_clauses.length > 1;
  
  // Ordenar por prioridad y establecer familia primaria
  results.sub_clauses.sort((a, b) => a.priority - b.priority);
  results.detected_families = results.sub_clauses.map(sc => ({
    family: sc.family,
    confidence: sc.confidence,
    text_preview: sc.text.substring(0, 100) + "..."
  }));
  
  if (results.detected_families.length > 0) {
    results.primary_family = results.detected_families[0].family;
  }
  
  return results;
}

// ================================================================
// SPLIT POR MARCADORES (para secciones estructuradas)
// ================================================================

function splitByMarkers(text, subClauseConfigs) {
  const results = [];
  
  for (const config of subClauseConfigs) {
    // Encontrar inicio
    let startIndex = 0;
    for (const marker of config.start_markers) {
      const match = text.match(marker);
      if (match) {
        startIndex = match.index;
        break;
      }
    }
    
    // Encontrar fin
    let endIndex = text.length;
    if (config.end_markers) {
      for (const marker of config.end_markers) {
        const match = text.substring(startIndex + 1).match(marker);
        if (match) {
          endIndex = startIndex + 1 + match.index;
          break;
        }
      }
    }
    
    // Extraer texto si encontramos el inicio
    if (startIndex < endIndex) {
      const extractedText = text.substring(startIndex, endIndex).trim();
      if (extractedText.length > 50) {  // Mínimo 50 caracteres
        results.push({
          family: config.family,
          text: extractedText,
          start_offset: startIndex,
          end_offset: endIndex,
          priority: config.priority,
          confidence: calculateConfidence(extractedText, config)
        });
      }
    }
  }
  
  return results;
}

// ================================================================
// SPLIT POR KEYWORDS (para MISCELLANEOUS)
// ================================================================

function splitByKeywords(text, subClauseConfigs) {
  const results = [];
  
  // Dividir el texto en párrafos/secciones
  const paragraphs = text.split(/\n\n+/);
  
  for (const config of subClauseConfigs) {
    let matchedText = [];
    
    for (const paragraph of paragraphs) {
      // Verificar si el párrafo contiene keywords de esta familia
      const hasKeyword = config.keywords.some(kw => kw.test(paragraph));
      if (hasKeyword) {
        matchedText.push(paragraph);
      }
    }
    
    if (matchedText.length > 0) {
      const combinedText = matchedText.join("\n\n");
      results.push({
        family: config.family,
        text: combinedText,
        start_offset: text.indexOf(matchedText[0]),
        end_offset: text.indexOf(matchedText[matchedText.length - 1]) + matchedText[matchedText.length - 1].length,
        priority: config.priority,
        confidence: calculateConfidence(combinedText, config)
      });
    }
  }
  
  return results;
}

// ================================================================
// DETECCIÓN POR CONTENIDO (fallback)
// ================================================================

function detectByContent(text) {
  // Verificar si tiene características de sección 7 (REPS/WARRANTIES; INDEMNITY)
  const hasRepsWarranties = /ProdCo\s+represents?,?\s*warrants?/i.test(text);
  const hasIndemnity = /(ProdCo|Amazon)\s+(will|shall)\s+indemnify/i.test(text);
  
  if (hasRepsWarranties && hasIndemnity) {
    return {
      name: "REPRESENTATIONS/WARRANTIES; INDEMNITY",
      config: MULTI_FAMILY_PATTERNS["REPRESENTATIONS/WARRANTIES; INDEMNITY"]
    };
  }
  
  // Verificar si tiene características de MISCELLANEOUS
  const miscKeywords = [
    /force\s+majeure/i,
    /assignment/i,
    /power\s+of\s+attorney/i,
    /WAIVES?\s+ALL\s+CLAIMS/i,
    /sole\s+and\s+final\s+control/i
  ];
  
  const miscMatches = miscKeywords.filter(kw => kw.test(text)).length;
  if (miscMatches >= 2) {
    return {
      name: "MISCELLANEOUS",
      config: MULTI_FAMILY_PATTERNS["MISCELLANEOUS"]
    };
  }
  
  return null;
}

// ================================================================
// CALCULAR CONFIANZA
// ================================================================

function calculateConfidence(text, config) {
  let score = 0.7;  // Base
  
  // Bonus por longitud razonable
  if (text.length > 200) score += 0.05;
  if (text.length > 500) score += 0.05;
  
  // Bonus por keywords encontrados
  const keywordsFound = (config.keywords || config.start_markers || [])
    .filter(kw => kw.test(text)).length;
  score += Math.min(0.15, keywordsFound * 0.05);
  
  return Math.min(0.95, score);
}

// ================================================================
// EXPORTAR PARA N8N
// ================================================================

const clauseText = $input.item.json.clause_text || $input.item.json.text || "";
const clauseHeading = $input.item.json.heading || $input.item.json.clause_heading || "";

const multiResult = detectMultiFamilies(clauseText, clauseHeading);

// Si es multi-familia, retornar múltiples items
if (multiResult.is_multi_family && multiResult.sub_clauses.length > 0) {
  return multiResult.sub_clauses.map((subClause, idx) => ({
    ...$input.item.json,
    _multi_family: {
      is_split: true,
      original_heading: clauseHeading,
      split_index: idx + 1,
      total_splits: multiResult.sub_clauses.length,
      primary_family: multiResult.primary_family
    },
    clause_text: subClause.text,
    heading: `${clauseHeading} [Part ${idx + 1}: ${subClause.family}]`,
    detected_family: subClause.family,
    routing_confidence: subClause.confidence,
    routing_method: "MULTI_FAMILY_SPLIT"
  }));
} else {
  // No es multi-familia, retornar como está
  return {
    ...$input.item.json,
    _multi_family: {
      is_split: false,
      detected_families: multiResult.detected_families
    }
  };
}
________________________________________
📁 Archivo 2: clause_splitter_patterns.yaml
# ================================================================
# CLAUSE SPLITTER PATTERNS
# Configuración para separar cláusulas multi-familia
# Version: 1.0
# ================================================================

version: "1.0"

# ================================================================
# SECTION 7: REPRESENTATIONS/WARRANTIES; INDEMNITY
# ================================================================
section_7:
  heading_patterns:
    - "REPRESENTATIONS/WARRANTIES; INDEMNITY"
    - "REPRESENTATIONS AND WARRANTIES"
    - "INDEMNIFICATION"
  
  sub_sections:
    - name: "ProdCo Representations"
      family: RepsProdCo
      markers:
        start:
          - "ProdCo represents, warrants and agrees"
          - "ProdCo represents and warrants"
        end:
          - "ProdCo will indemnify"
          - "ProdCo shall indemnify"
      typical_content:
        - "will not infringe"
        - "will not violate"
        - "applicable laws, rules and regulations"
        - "full right to enter into"
    
    - name: "ProdCo Indemnity"
      family: IndemnityProdCo
      markers:
        start:
          - "ProdCo will indemnify"
          - "ProdCo shall indemnify"
        end:
          - "Amazon will indemnify"
          - "Amazon shall indemnify"
      typical_content:
        - "indemnify, defend"
        - "hold harmless Amazon"
        - "arising out of any third-party claim"
        - "breach or alleged breach"
    
    - name: "Amazon Indemnity"
      family: IndemnityAmazon
      markers:
        start:
          - "Amazon will indemnify"
          - "Amazon shall indemnify"
        end:
          - "If either Amazon or ProdCo is entitled"
          - "indemnitee will give"
      typical_content:
        - "indemnify, defend, and hold harmless ProdCo"
        - "distribution and exploitation"
        - "other than with respect to any Losses"
    
    - name: "Indemnity Procedures"
      family: IndemnityProcedures
      markers:
        start:
          - "If either Amazon or ProdCo is entitled"
          - "indemnitee will give"
        end: null  # End of section
      typical_content:
        - "prompt written notice"
        - "control the defense and settlement"
        - "cooperate reasonably"
      note: "Only include if present in contract"

# ================================================================
# SECTION 8: MISCELLANEOUS
# ================================================================
section_8:
  heading_patterns:
    - "MISCELLANEOUS"
    - "GENERAL PROVISIONS"
    - "OTHER TERMS"
  
  sub_sections:
    - name: "Conditions Precedent"
      family: ConditionsPrecedent
      keywords:
        - "conditions precedent"
        - "subject to any conditions"
      typical_content:
        - "Amazon's obligations hereunder are subject to"
    
    - name: "Amazon Control"
      family: AmazonControl
      keywords:
        - "sole and final control"
      typical_content:
        - "As between ProdCo and Amazon, Amazon has sole"
    
    - name: "Confidentiality/NPI"
      family: Confidentiality
      keywords:
        - "keep confidential"
        - "non-public information"
        - "NPI"
        - "artificial intelligence"
      typical_content:
        - "will not release or authorize any publicity"
        - "AI service or tool"
    
    - name: "Damages Waiver"
      family: LiabilityLimitation
      keywords:
        - "WAIVES ALL CLAIMS"
        - "CONSEQUENTIAL DAMAGES"
        - "INDIRECT, INCIDENTAL, PUNITIVE"
      typical_content:
        - "EXCEPT FOR THE INDEMNIFICATION OBLIGATIONS"
    
    - name: "Injunctive Relief Waiver"
      family: InjunctiveReliefWaiver
      keywords:
        - "waives any right to seek or obtain injunctive"
        - "limited to the right... to recover monetary damages"
      typical_content:
        - "enjoin or restrain the development, production"
    
    - name: "Assignment"
      family: Assignment
      keywords:
        - "may not assign"
        - "may be freely assigned"
      typical_content:
        - "ProdCo may not assign this Agreement"
        - "may be freely assigned by Amazon"
    
    - name: "Power of Attorney"
      family: PowerOfAttorney
      keywords:
        - "power of attorney"
        - "execute and deliver all additional documents"
      typical_content:
        - "irrevocably authorizes Amazon to act"
    
    - name: "Suspension/Force Majeure"
      family: ForceMajeure
      keywords:
        - "force majeure"
        - "suspend any services"
        - "earthquake"
        - "pandemic"
      typical_content:
        - "Amazon may elect to suspend"
        - "unavailability, disability or death"
    
    - name: "Standard Terms"
      family: StandardTerms
      keywords:
        - "standard terms and conditions"
        - "industry custom"
      typical_content:
        - "ProdCo has or will obtain signed agreements"
        - "good faith negotiation"

# ================================================================
# SECTION 10: TAX; GOVERNING LAW; JURISDICTION
# ================================================================
section_10:
  heading_patterns:
    - "TAX; GOVERNING LAW; JURISDICTION"
    - "GOVERNING LAW"
    - "TAX"
  
  sub_sections:
    - name: "Tax Provisions"
      family: TaxProvisions
      markers:
        start:
          - "Each party will be responsible for identifying"
        end:
          - "THIS AGREEMENT WILL BE CONSTRUED"
          - "governed by the law"
      typical_content:
        - "taxes and other governmental fees"
        - "deduct or withhold"
    
    - name: "Governing Law & Dispute Resolution"
      family: DisputeResolution
      markers:
        start:
          - "THIS AGREEMENT WILL BE CONSTRUED"
          - "governed by the law"
        end: null
      typical_content:
        - "State of California"
        - "binding arbitration"
        - "JAMS"
        - "jury trial"
________________________________________
FASE 3: Thresholds y Escalation Logic
📁 Archivo 3: decision_engine_v2.js (Actualizado)
// ================================================================
// DECISION ENGINE v2.0
// Con soporte para multi-familia y thresholds por prioridad
// ================================================================

// ================================================================
// CONFIGURACIÓN DE THRESHOLDS
// ================================================================

const THRESHOLDS = {
  CRITICAL: {
    auto_approve_confidence: 0.95,
    approve_with_notes_confidence: 0.85,
    escalate_confidence: 0.75,
    max_observations_for_auto: 0,
    max_observations_for_notes: 2,
    escalate_on_any_critical_issue: true
  },
  SUPPORT: {
    auto_approve_confidence: 0.90,
    approve_with_notes_confidence: 0.80,
    escalate_confidence: 0.70,
    max_observations_for_auto: 1,
    max_observations_for_notes: 3,
    escalate_on_any_critical_issue: true
  },
  LOW: {
    auto_approve_confidence: 0.85,
    approve_with_notes_confidence: 0.75,
    escalate_confidence: 0.65,
    max_observations_for_auto: 2,
    max_observations_for_notes: 5,
    escalate_on_any_critical_issue: false
  }
};

// ================================================================
// FAMILY PRIORITY MAPPING (Updated with all 20 families)
// ================================================================

const FAMILY_PRIORITY = {
  // CRITICAL - Core commercial/legal terms
  "PaymentCredits": "CRITICAL",
  "ThirdPartyCredits": "CRITICAL",
  "RepsProdCo": "CRITICAL",
  "IndemnityProdCo": "CRITICAL",
  "IndemnityAmazon": "CRITICAL",
  "IndemnityProcedures": "CRITICAL",
  "RightsGrant": "CRITICAL",
  "RightsReversion": "CRITICAL",
  "LiabilityLimitation": "CRITICAL",
  "InjunctiveReliefWaiver": "CRITICAL",
  "Assignment": "CRITICAL",
  "ForceMajeure": "CRITICAL",
  "AmazonControl": "CRITICAL",
  "TerminationRights": "CRITICAL",
  "TerminationConsequences": "CRITICAL",
  "DisputeResolution": "CRITICAL",
  
  // SUPPORT - Important but more flexibility
  "Confidentiality": "SUPPORT",
  "DataProtection": "SUPPORT",
  "ServicesScope": "SUPPORT",
  "PowerOfAttorney": "SUPPORT",
  "Insurance": "SUPPORT",
  "StandardTerms": "SUPPORT",
  "ConditionsPrecedent": "SUPPORT",
  "TaxProvisions": "SUPPORT",
  
  // LOW - Boilerplate
  "Definitions": "LOW",
  "GeneralProvisions": "LOW",
  "Parties": "LOW",
  "Severability": "LOW",
  
  // UNKNOWN - Always escalate
  "OtherUnknown": "UNKNOWN"
};

// ================================================================
// ESCALATION REASONS
// ================================================================

const ESCALATION_REASONS = {
  UNKNOWN_FAMILY: {
    code: "UNKNOWN_FAMILY",
    message: "Clause family not recognized",
    block_export: true
  },
  NO_PLAYBOOK_SPEC: {
    code: "NO_PLAYBOOK_SPEC",
    message: "No playbook specification available for this family",
    block_export: false
  },
  LOW_CONFIDENCE: {
    code: "LOW_CONFIDENCE",
    message: "Routing confidence below threshold",
    block_export: false
  },
  CRITICAL_ISSUE_DETECTED: {
    code: "CRITICAL_ISSUE_DETECTED",
    message: "Critical deviation or issue detected",
    block_export: true
  },
  CRITICAL_RISK_LEVEL: {
    code: "CRITICAL_RISK_LEVEL",
    message: "Analysis risk level is critical",
    block_export: true
  },
  HIGH_RISK_CRITICAL_FAMILY: {
    code: "HIGH_RISK_CRITICAL_FAMILY",
    message: "High-risk deviations in critical family",
    block_export: false
  },
  MULTI_FAMILY_DETECTED: {
    code: "MULTI_FAMILY_DETECTED",
    message: "Multiple clause families detected - manual review recommended",
    block_export: false
  },
  UNACCEPTABLE_DEVIATION: {
    code: "UNACCEPTABLE_DEVIATION",
    message: "Unacceptable deviation per playbook",
    block_export: true
  },
  REQUIRES_APPROVAL: {
    code: "REQUIRES_APPROVAL",
    message: "Deviation requires specific approval level",
    block_export: false,
    approval_levels: ["AMAZON_LEGAL", "AMAZON_LEGAL_REGIONAL_LEAD", "OC_DISCRETION", "AMAZON_TAX_FINANCE_BA"]
  }
};

// ================================================================
// CRITICAL ISSUE KEYWORDS
// ================================================================

const CRITICAL_KEYWORDS = [
  // Risk indicators
  "CRITICAL",
  "UNACCEPTABLE",
  "REJECT",
  "must reject",
  "hold to form",
  "do not accept",
  "do NOT",
  "unable to accommodate",
  
  // Commercial risk
  "symmetric liability",
  "unlimited liability",
  "no cap",
  "uncapped exposure",
  "Amazon shall indemnify",  // In wrong context
  "ProdCo retains",  // Rights context
  
  // Approval requirements
  "with Amazon Legal approval",
  "Amazon Legal L8 approval",
  "Litigation approval",
  "Amazon Tax",
  "Finance and BA"
];

// ================================================================
// PASSABLE KEYWORDS
// ================================================================

const PASSABLE_KEYWORDS = [
  "acceptable deviation",
  "passable",
  "may be granted",
  "OK to",
  "can be accepted",
  "can accept",
  "NTD",
  "at OC's discretion",
  "without Amazon's approval"
];

// ================================================================
// MAIN DECISION FUNCTION
// ================================================================

function makeDecision(analysisResult, routingResult) {
  const context = buildContext(analysisResult, routingResult);
  
  // Apply decision rules in order
  const rules = [
    checkUnknownFamily,
    checkNoPlaybookSpec,
    checkMultiFamily,
    checkCriticalIssues,
    checkCriticalRiskLevel,
    checkUnacceptableDeviations,
    checkRequiresApproval,
    checkAutoApprove,
    checkApproveWithNotes,
    checkHighRiskCriticalFamily,
    defaultEscalate
  ];
  
  for (const rule of rules) {
    const result = rule(context);
    if (result) {
      return buildDecisionOutput(result, context);
    }
  }
  
  // Should never reach here
  return buildDecisionOutput(defaultEscalate(context), context);
}

// ================================================================
// CONTEXT BUILDER
// ================================================================

function buildContext(analysisResult, routingResult) {
  const internal = analysisResult._internal || {};
  const observations = internal.observations?.observations || [];
  
  const family = routingResult?.detected_family || 
                 internal.detected_family || 
                 analysisResult.detected_family || 
                 "OtherUnknown";
  
  const priority = FAMILY_PRIORITY[family] || "UNKNOWN";
  const thresholds = THRESHOLDS[priority] || THRESHOLDS.CRITICAL;
  
  // Analyze observations
  const hasCriticalIssue = observations.some(obs => {
    const text = (obs.issue || obs.text || obs.description || "").toLowerCase();
    return CRITICAL_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  });
  
  const hasPassableOnly = observations.every(obs => {
    const text = (obs.issue || obs.text || obs.description || "").toLowerCase();
    return PASSABLE_KEYWORDS.some(kw => text.includes(kw.toLowerCase())) ||
           text.includes("aligns with") ||
           text.includes("compliant");
  });
  
  const unacceptableDeviations = observations.filter(obs => {
    const text = (obs.issue || obs.text || obs.description || "").toLowerCase();
    return text.includes("unacceptable") || 
           text.includes("reject") ||
           text.includes("do not accept");
  });
  
  const requiresApproval = observations.filter(obs => {
    const text = (obs.issue || obs.text || obs.description || "").toLowerCase();
    return text.includes("with amazon legal approval") ||
           text.includes("amazon legal l8") ||
           text.includes("regional lead") ||
           text.includes("amazon tax");
  });
  
  return {
    family,
    priority,
    thresholds,
    confidence: routingResult?.routing_confidence || internal.confidence_overall || 0.7,
    riskLevel: internal.observations?.risk_level || "medium",
    observations,
    observationCount: observations.length,
    hasCriticalIssue,
    hasPassableOnly,
    unacceptableDeviations,
    requiresApproval,
    hasPlaybookSpec: analysisResult.has_playbook_spec !== false,
    isMultiFamily: routingResult?._multi_family?.is_split || false,
    multiFamily: routingResult?._multi_family || null
  };
}

// ================================================================
// DECISION RULES
// ================================================================

function checkUnknownFamily(ctx) {
  if (ctx.priority === "UNKNOWN" || ctx.family === "OtherUnknown") {
    return {
      decision: "ESCALATE_HUMAN",
      reason: ESCALATION_REASONS.UNKNOWN_FAMILY,
      block_export: true
    };
  }
  return null;
}

function checkNoPlaybookSpec(ctx) {
  if (!ctx.hasPlaybookSpec) {
    return {
      decision: "ESCALATE_HUMAN",
      reason: ESCALATION_REASONS.NO_PLAYBOOK_SPEC,
      block_export: false
    };
  }
  return null;
}

function checkMultiFamily(ctx) {
  if (ctx.isMultiFamily) {
    // Multi-family clauses get processed individually
    // But flag for review
    return {
      decision: "APPROVE_WITH_NOTES",
      reason: ESCALATION_REASONS.MULTI_FAMILY_DETECTED,
      notes: [`Original clause split into ${ctx.multiFamily.total_splits} parts`],
      block_export: false
    };
  }
  return null;
}

function checkCriticalIssues(ctx) {
  if (ctx.hasCriticalIssue && ctx.thresholds.escalate_on_any_critical_issue) {
    return {
      decision: "ESCALATE_HUMAN",
      reason: ESCALATION_REASONS.CRITICAL_ISSUE_DETECTED,
      block_export: true
    };
  }
  return null;
}

function checkCriticalRiskLevel(ctx) {
  if (ctx.riskLevel === "critical") {
    return {
      decision: "ESCALATE_HUMAN",
      reason: ESCALATION_REASONS.CRITICAL_RISK_LEVEL,
      block_export: true
    };
  }
  return null;
}

function checkUnacceptableDeviations(ctx) {
  if (ctx.unacceptableDeviations.length > 0) {
    return {
      decision: "ESCALATE_HUMAN",
      reason: ESCALATION_REASONS.UNACCEPTABLE_DEVIATION,
      notes: ctx.unacceptableDeviations.map(d => d.issue || d.text),
      block_export: true
    };
  }
  return null;
}

function checkRequiresApproval(ctx) {
  if (ctx.requiresApproval.length > 0) {
    // Extract approval levels needed
    const approvals = ctx.requiresApproval.map(obs => {
      const text = (obs.issue || obs.text || "").toLowerCase();
      if (text.includes("amazon legal l8")) return "AMAZON_LEGAL_L8";
      if (text.includes("regional lead")) return "AMAZON_LEGAL_REGIONAL_LEAD";
      if (text.includes("amazon legal")) return "AMAZON_LEGAL";
      if (text.includes("amazon tax")) return "AMAZON_TAX_FINANCE";
      if (text.includes("oc's discretion")) return "OC_DISCRETION";
      return "AMAZON_LEGAL";
    });
    
    return {
      decision: "ESCALATE_HUMAN",
      reason: {
        ...ESCALATION_REASONS.REQUIRES_APPROVAL,
        required_approvals: [...new Set(approvals)]
      },
      notes: ctx.requiresApproval.map(d => d.issue || d.text),
      block_export: false
    };
  }
  return null;
}

function checkAutoApprove(ctx) {
  if (
    ctx.confidence >= ctx.thresholds.auto_approve_confidence &&
    ctx.observationCount <= ctx.thresholds.max_observations_for_auto &&
    ctx.riskLevel === "low" &&
    !ctx.hasCriticalIssue &&
    ctx.hasPassableOnly
  ) {
    return {
      decision: "AUTO_PASS",
      reason: {
        code: "COMPLIANT",
        message: "Clause complies with playbook requirements"
      },
      block_export: false
    };
  }
  return null;
}

function checkApproveWithNotes(ctx) {
  if (
    ctx.confidence >= ctx.thresholds.approve_with_notes_confidence &&
    ctx.observationCount <= ctx.thresholds.max_observations_for_notes &&
    ctx.riskLevel !== "critical" &&
    !ctx.hasCriticalIssue &&
    (ctx.hasPassableOnly || ctx.riskLevel === "low")
  ) {
    return {
      decision: "APPROVE_WITH_NOTES",
      reason: {
        code: "PASSABLE_VARIATIONS",
        message: "Clause contains passable variations"
      },
      notes: ctx.observations.map(o => o.issue || o.text),
      block_export: false
    };
  }
  return null;
}

function checkHighRiskCriticalFamily(ctx) {
  if (ctx.riskLevel === "high" && ctx.priority === "CRITICAL") {
    return {
      decision: "ESCALATE_HUMAN",
      reason: ESCALATION_REASONS.HIGH_RISK_CRITICAL_FAMILY,
      block_export: false
    };
  }
  return null;
}

function defaultEscalate(ctx) {
  return {
    decision: "ESCALATE_HUMAN",
    reason: {
      code: "DEFAULT_ESCALATION",
      message: "Unable to auto-approve - manual review required"
    },
    block_export: false
  };
}

// ================================================================
// OUTPUT BUILDER
// ================================================================

function buildDecisionOutput(result, ctx) {
  return {
    decision: result.decision,
    decision_code: result.reason.code,
    decision_message: result.reason.message,
    block_export: result.block_export || false,
    
    // Context
    family: ctx.family,
    family_priority: ctx.priority,
    confidence: ctx.confidence,
    risk_level: ctx.riskLevel,
    observation_count: ctx.observationCount,
    
    // Details
    has_critical_issue: ctx.hasCriticalIssue,
    has_passable_only: ctx.hasPassableOnly,
    notes: result.notes || [],
    required_approvals: result.reason.required_approvals || [],
    
    // Multi-family info
    is_multi_family: ctx.isMultiFamily,
    multi_family_info: ctx.multiFamily,
    
    // Client output
    client_state: mapToClientState(result.decision),
    client_summary: generateClientSummary(result, ctx),
    
    // Timestamp
    decided_at: new Date().toISOString()
  };
}

function mapToClientState(decision) {
  switch (decision) {
    case "AUTO_PASS": return "APPROVED";
    case "APPROVE_WITH_NOTES": return "APPROVED_WITH_NOTES";
    case "ESCALATE_HUMAN": return "PENDING_REVIEW";
    default: return "PENDING_REVIEW";
  }
}

function generateClientSummary(result, ctx) {
  switch (result.decision) {
    case "AUTO_PASS":
      return `✅ Auto-approved. Clause complies with ${ctx.family} requirements.`;
    case "APPROVE_WITH_NOTES":
      const noteCount = (result.notes || []).length;
      return `⚠️ Approved with ${noteCount} note(s). Review before finalizing.`;
    case "ESCALATE_HUMAN":
      if (result.block_export) {
        return `🔴 BLOCKED. ${result.reason.message}. Cannot proceed without resolution.`;
      }
      return `🔍 Requires review. ${result.reason.message}.`;
    default:
      return `⏳ Pending review.`;
  }
}

// ================================================================
// EXPORT FOR N8N
// ================================================================

const analysisResult = $input.item.json;
const routingResult = analysisResult._routing || analysisResult;

const decision = makeDecision(analysisResult, routingResult);

return {
  ...analysisResult,
  _decision: decision,
  decision: decision.decision,
  client_state: decision.client_state,
  client_summary: decision.client_summary,
  block_export: decision.block_export
};
 
📁 Archivo 4: escalation_config.yaml
# ================================================================
# ESCALATION CONFIGURATION
# Version: 2.0
# ================================================================

version: "2.0"

# ================================================================
# APPROVAL LEVELS
# ================================================================
approval_levels:
  NTD:
    name: "Note To Drafter"
    description: "Can be accepted directly without Amazon approval"
    auto_approve: true
    notify: []
    
  OC_DISCRETION:
    name: "Outside Counsel Discretion"
    description: "May be granted at OC's discretion without Amazon Legal approval"
    auto_approve: false
    notify: ["outside_counsel"]
    
  AMAZON_LEGAL:
    name: "Amazon Legal Approval"
    description: "Requires Amazon Legal team approval"
    auto_approve: false
    notify: ["amazon_legal"]
    sla_hours: 48
    
  AMAZON_LEGAL_REGIONAL_LEAD:
    name: "Amazon Legal Regional Lead"
    description: "Requires Amazon Legal Regional Lead approval (e.g., Hendrik for International)"
    auto_approve: false
    notify: ["amazon_legal", "regional_lead"]
    sla_hours: 72
    
  AMAZON_LEGAL_L8:
    name: "Amazon Legal L8"
    description: "Requires Amazon Legal L8 level approval"
    auto_approve: false
    notify: ["amazon_legal_l8"]
    sla_hours: 96
    
  AMAZON_TAX_FINANCE_BA:
    name: "Amazon Tax, Finance, and BA"
    description: "Requires approval from Tax, Finance, and Business Affairs"
    auto_approve: false
    notify: ["amazon_tax", "amazon_finance", "amazon_ba"]
    sla_hours: 72
    
  LITIGATION:
    name: "Litigation Approval"
    description: "Requires Litigation team approval"
    auto_approve: false
    notify: ["amazon_litigation"]
    sla_hours: 96

# ================================================================
# DECISION OUTCOMES
# ================================================================
decision_outcomes:
  AUTO_PASS:
    display: "✅ Auto-Approved"
    color: "green"
    allows_export: true
    requires_review: false
    
  APPROVE_WITH_NOTES:
    display: "⚠️ Approved with Notes"
    color: "yellow"
    allows_export: true
    requires_review: false
    notes_visible: true
    
  ESCALATE_HUMAN:
    display: "🔍 Requires Review"
    color: "orange"
    allows_export: false  # Until reviewed
    requires_review: true
    
  BLOCKED:
    display: "🔴 Blocked"
    color: "red"
    allows_export: false
    requires_review: true
    must_resolve: true

# ================================================================
# ESCALATION TRIGGERS
# ================================================================
escalation_triggers:
  # Automatic blocks
  - trigger: "unacceptable_deviation"
    outcome: "BLOCKED"
    message: "Contains unacceptable deviation per playbook"
    
  - trigger: "unknown_family"
    outcome: "BLOCKED"
    message: "Clause family not recognized"
    
  - trigger: "critical_risk"
    outcome: "ESCALATE_HUMAN"
    message: "Critical risk level detected"
    
  # Approval-based escalations
  - trigger: "requires_amazon_legal"
    outcome: "ESCALATE_HUMAN"
    approval_level: "AMAZON_LEGAL"
    
  - trigger: "requires_regional_lead"
    outcome: "ESCALATE_HUMAN"
    approval_level: "AMAZON_LEGAL_REGIONAL_LEAD"
    
  - trigger: "requires_l8"
    outcome: "ESCALATE_HUMAN"
    approval_level: "AMAZON_LEGAL_L8"
    
  - trigger: "governing_law_exception"
    outcome: "ESCALATE_HUMAN"
    approval_level: "AMAZON_LEGAL_L8"
    additional_approval: "LITIGATION"
    message: "Exception to US governing law requires L8 and Litigation approval"

# ================================================================
# THRESHOLDS BY FAMILY PRIORITY
# ================================================================
thresholds:
  CRITICAL:
    auto_approve_confidence: 0.95
    approve_with_notes_confidence: 0.85
    escalate_confidence: 0.75
    max_observations_for_auto: 0
    max_observations_for_notes: 2
    escalate_on_critical_issue: true
    
  SUPPORT:
    auto_approve_confidence: 0.90
    approve_with_notes_confidence: 0.80
    escalate_confidence: 0.70
    max_observations_for_auto: 1
    max_observations_for_notes: 3
    escalate_on_critical_issue: true
    
  LOW:
    auto_approve_confidence: 0.85
    approve_with_notes_confidence: 0.75
    escalate_confidence: 0.65
    max_observations_for_auto: 2
    max_observations_for_notes: 5
    escalate_on_critical_issue: false
 
📊 Resumen de Implementación FASE 2 & 3
Componente	Archivo	Descripción
Multi-Family Detector	multi_family_detector.js	Detecta y separa cláusulas combinadas
Split Patterns Config	clause_splitter_patterns.yaml	Configuración de patrones de split
Decision Engine v2	decision_engine_v2.js	Motor de decisión con thresholds por prioridad
Escalation Config	escalation_config.yaml	Niveles de aprobación y triggers
 
🔄 Flujo Actualizado del Pipeline
┌─────────────────────────────────────────────────────────────────────┐
│                    PIPELINE COMPLETO v2.0                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. DOCUMENT UPLOAD                                                 │
│     ↓                                                               │
│  2. CHUNKER (Extrae cláusulas)                                      │
│     ↓                                                               │
│  3. MULTI-FAMILY DETECTOR ← NEW                                     │
│     ├─ Single Family → Continue                                     │
│     └─ Multi-Family → SPLIT into sub-clauses                        │
│     ↓                                                               │
│  4. KEYWORD ROUTER (v3 con patrones genéricos)                      │
│     ↓                                                               │
│  5. ANALYSIS AGENT (con 20 playbook specs)                          │
│     ↓                                                               │
│  6. DECISION ENGINE v2 ← UPDATED                                    │
│     ├─ AUTO_PASS → Export ready                                     │
│     ├─ APPROVE_WITH_NOTES → Export with notes                       │
│     ├─ ESCALATE_HUMAN → Human queue                                 │
│     └─ BLOCKED → Must resolve                                       │
│     ↓                                                               │
│  7. OUTPUT FORMATTER                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
 
📈 Métricas Esperadas Post-Implementación
Métrica	Antes	Después FASE 2&3	Target
Router Accuracy	94%	97%+	>89% ✅
Multi-Family Support	❌	✅	✅
MISCELLANEOUS Handling	OtherUnknown	Split en 10 familias	✅
Section 7 Handling	1 familia	Split en 4 familias	✅
Escalation Rate (compliant)	100%	~15%	<15% ✅
Auto-Approve Rate	0%	~60%	>50% ✅
Blocked Rate	0%	~5%	Para critical issues ✅
 

