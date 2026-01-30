-- ================================================================
-- RAG EXAMPLES EXPANSION - MIGRATION
-- Adds examples for families with 0% coverage
-- ================================================================

-- Clear existing examples for families being expanded (optional)
-- DELETE FROM policy_examples WHERE clause_family IN ('RightsGrant', 'ServicesScope', 'Confidentiality', 'Parties', 'GeneralProvisions', 'Assignment');

-- ================================================================
-- RightsGrant Examples (Previously 0 examples)
-- ================================================================
INSERT INTO policy_examples (clause_family, article, clause_text, rating, confidence_boost, key_triggers)
VALUES 
(
  'RightsGrant',
  '3.1',
  'RIGHTS: All rights in the Program, including all materials commissioned (including the results and proceeds of services of all personnel rendering services), are being specially ordered and commissioned by Amazon as a work made for hire for Amazon. Amazon shall be the author and exclusive owner for copyright purposes and otherwise. To the extent that any of the foregoing may not be considered a work made for hire, ProdCo hereby irrevocably assigns to Amazon all right, title, and interest in and to the Program and all such materials, including all copyrights.',
  'ACCEPTABLE',
  0.95,
  '["All rights in the Program", "work made for hire", "exclusive owner", "irrevocably assigns", "including all copyrights"]'::jsonb
),
(
  'RightsGrant',
  '3.2',
  'Amazon shall own exclusively and in perpetuity, throughout the universe, in all languages, and in all media now known or hereafter developed, all right, title, and interest in and to the Program.',
  'ACCEPTABLE',
  0.98,
  '["Amazon shall own exclusively", "in perpetuity", "throughout the universe", "in all media"]'::jsonb
),
(
  'RightsGrant',
  '3.3',
  'ProdCo agrees that the results and proceeds of its services under this Agreement, including all creative contributions, shall be deemed works made for hire for Amazon, and Amazon shall be the sole author and owner of all intellectual property rights therein.',
  'ACCEPTABLE',
  0.93,
  '["results and proceeds", "works made for hire", "sole author and owner", "intellectual property rights"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- ServicesScope Examples (Previously 0 examples)
-- ================================================================
INSERT INTO policy_examples (clause_family, article, clause_text, rating, confidence_boost, key_triggers)
VALUES 
(
  'ServicesScope',
  '2.1',
  'SERVICES: ProdCo will render services as set forth in this agreement, including any exhibits and schedules hereto, to produce the Program.',
  'ACCEPTABLE',
  0.90,
  '["ProdCo will render services", "to produce the Program", "including any exhibits"]'::jsonb
),
(
  'ServicesScope',
  '2.2',
  'ProdCo shall render all production services necessary to complete the Program, including pre-production, principal photography, post-production, and delivery of final masters in accordance with first-class production standards.',
  'ACCEPTABLE',
  0.93,
  '["render all production services", "pre-production, principal photography, post-production", "delivery of final masters"]'::jsonb
),
(
  'ServicesScope',
  '2.3',
  'ProdCo agrees to deliver the Program suitable for worldwide distribution across all platforms, meeting all technical specifications provided by Amazon.',
  'ACCEPTABLE',
  0.88,
  '["deliver the Program", "worldwide distribution", "technical specifications"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- Confidentiality Examples (Previously 0 examples)
-- ================================================================
INSERT INTO policy_examples (clause_family, article, clause_text, rating, confidence_boost, key_triggers)
VALUES 
(
  'Confidentiality',
  '9.1',
  'DATA PROTECTION: When processing personal data in connection with this Agreement, Amazon or ProdCo shall comply with all applicable data protection laws and regulations, including but not limited to GDPR and CCPA.',
  'ACCEPTABLE',
  0.85,
  '["DATA PROTECTION", "personal data", "data protection laws", "GDPR"]'::jsonb
),
(
  'Confidentiality',
  '9.2',
  'ProdCo shall maintain in strict confidence and shall not disclose to any third party any Confidential Information of Amazon, including the terms of this Agreement, NPI, and any non-public information regarding Amazons business.',
  'ACCEPTABLE',
  0.92,
  '["maintain in strict confidence", "Confidential Information", "NPI", "shall not disclose"]'::jsonb
),
(
  'Confidentiality',
  '9.3',
  'Each party agrees to implement appropriate technical and organizational measures to protect personal data against unauthorized access, alteration, or destruction.',
  'ACCEPTABLE',
  0.87,
  '["protect personal data", "unauthorized access", "technical and organizational measures"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- Parties Examples (Previously 0 examples)
-- ================================================================
INSERT INTO policy_examples (clause_family, article, clause_text, rating, confidence_boost, key_triggers)
VALUES 
(
  'Parties',
  'PREAMBLE',
  'PARTIES: Amazon Content Services LLC ("Amazon"), a Delaware limited liability company with offices at 2021 Seventh Avenue, Seattle, Washington 98121, and [PRODCO NAME] ("ProdCo").',
  'ACCEPTABLE',
  0.95,
  '["PARTIES:", "Amazon Content Services LLC", "ProdCo"]'::jsonb
),
(
  'Parties',
  '1.1',
  'EFFECTIVE DATE: This Program Services Agreement is entered into as of [DATE] by and between Amazon Content Services LLC and the production company identified above.',
  'ACCEPTABLE',
  0.92,
  '["EFFECTIVE DATE", "entered into as of", "by and between"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- GeneralProvisions Examples (Previously 0 examples)
-- ================================================================
INSERT INTO policy_examples (clause_family, article, clause_text, rating, confidence_boost, key_triggers)
VALUES 
(
  'GeneralProvisions',
  '12.1',
  'MISCELLANEOUS (CONDITIONS PRECEDENT, DAMAGES, INJUNCTIVE RELIEF, ASSIGNMENT, ETC.): This Agreement, together with all exhibits and schedules, constitutes the entire agreement between the parties with respect to the subject matter hereof.',
  'ACCEPTABLE',
  0.80,
  '["MISCELLANEOUS", "CONDITIONS PRECEDENT", "ASSIGNMENT", "entire agreement"]'::jsonb
),
(
  'GeneralProvisions',
  '12.2',
  'If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect. This Agreement may be executed in counterparts.',
  'ACCEPTABLE',
  0.85,
  '["invalid or unenforceable", "remaining provisions", "counterparts"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- LiabilityLimitation Examples (Expanded)
-- ================================================================
INSERT INTO policy_examples (clause_family, article, clause_text, rating, confidence_boost, key_triggers)
VALUES 
(
  'LiabilityLimitation',
  '7.1',
  'IN NO EVENT SHALL AMAZON BE LIABLE FOR ANY CONSEQUENTIAL, INDIRECT, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO THIS AGREEMENT, REGARDLESS OF WHETHER SUCH DAMAGES WERE FORESEEABLE.',
  'ACCEPTABLE',
  0.96,
  '["IN NO EVENT SHALL", "CONSEQUENTIAL", "INDIRECT", "PUNITIVE DAMAGES"]'::jsonb
),
(
  'LiabilityLimitation',
  '7.2',
  'AMAZONS TOTAL AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE AMOUNTS ACTUALLY PAID BY AMAZON TO PRODCO UNDER THIS AGREEMENT DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM.',
  'ACCEPTABLE',
  0.94,
  '["TOTAL AGGREGATE LIABILITY", "SHALL NOT EXCEED", "AMOUNTS ACTUALLY PAID"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- Assignment Examples (Previously 0 examples)
-- ================================================================
INSERT INTO policy_examples (clause_family, article, clause_text, rating, confidence_boost, key_triggers)
VALUES 
(
  'Assignment',
  '11.1',
  'ProdCo may not assign this Agreement or any rights hereunder without Amazons prior written consent. Amazon may freely assign this Agreement to any affiliate or successor.',
  'ACCEPTABLE',
  0.92,
  '["may not assign", "without Amazons prior written consent", "may freely assign", "affiliate or successor"]'::jsonb
),
(
  'Assignment',
  '11.2',
  'This Agreement shall be binding upon and inure to the benefit of the parties and their respective successors and permitted assigns.',
  'ACCEPTABLE',
  0.88,
  '["binding upon", "inure to the benefit", "successors", "permitted assigns"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- RepsProdCo Examples (Expanded for combined clauses)
-- ================================================================
INSERT INTO policy_examples (clause_family, article, clause_text, rating, confidence_boost, key_triggers)
VALUES 
(
  'RepsProdCo',
  '5.3',
  'REPRESENTATIONS/WARRANTIES: ProdCo represents, warrants and agrees that: (i) the Program and all materials will not infringe any third party rights; (ii) ProdCo has obtained all necessary rights and clearances; (iii) the Program will not violate any law or regulation.',
  'ACCEPTABLE',
  0.94,
  '["ProdCo represents, warrants and agrees", "will not infringe", "all necessary rights", "will not violate"]'::jsonb
),
(
  'RepsProdCo',
  '5.4',
  'ProdCo represents and warrants that it has the full right, power, and authority to enter into this Agreement and to perform all of its obligations hereunder without violating any agreement to which it is a party.',
  'ACCEPTABLE',
  0.95,
  '["full right, power, and authority", "enter into this Agreement", "perform all of its obligations"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- DisputeResolution Examples (Expanded)
-- ================================================================
INSERT INTO policy_examples (clause_family, article, clause_text, rating, confidence_boost, key_triggers)
VALUES 
(
  'DisputeResolution',
  '10.1',
  'TAX; GOVERNING LAW; JURISDICTION: Each party will be responsible for identifying and paying any taxes arising from its activities under this Agreement. This Agreement shall be governed by the laws of the State of California without regard to conflict of law principles.',
  'ACCEPTABLE',
  0.91,
  '["TAX", "GOVERNING LAW", "JURISDICTION", "governed by the laws of", "State of California"]'::jsonb
),
(
  'DisputeResolution',
  '10.2',
  'The parties agree to submit to the exclusive jurisdiction of the courts located in Los Angeles County, California for the resolution of any disputes arising under this Agreement.',
  'ACCEPTABLE',
  0.93,
  '["exclusive jurisdiction", "courts located in", "Los Angeles County", "disputes"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- Verify insertion
-- ================================================================
SELECT 
  clause_family,
  COUNT(*) as example_count
FROM policy_examples
GROUP BY clause_family
ORDER BY example_count DESC;
