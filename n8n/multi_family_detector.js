// ================================================================
// MULTI-FAMILY DETECTOR v1.0
// Detecta y separa cláusulas que contienen múltiples familias
// For use in n8n Code Node
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
// EXPORT FOR N8N
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
