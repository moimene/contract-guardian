import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { PolicySpec, VariationSet, PolicyContext, VariationExample } from './PolicySpec';

/**
 * PolicySpecLoader - Loads PolicySpec and VariationSet from local files
 * For production, use Supabase tables instead
 */
export class PolicySpecLoader {
    private rulesDir: string;
    private variationsDir: string;
    private cache: Map<string, PolicySpec> = new Map();
    private variationsCache: Map<string, VariationSet> = new Map();

    constructor(playbookDir: string = './playbook') {
        this.rulesDir = path.join(playbookDir, 'rules');
        this.variationsDir = path.join(playbookDir, 'variations');
    }

    /**
     * Load a PolicySpec by rule_id
     */
    loadPolicySpec(ruleId: string): PolicySpec | null {
        // Check cache
        if (this.cache.has(ruleId)) {
            return this.cache.get(ruleId)!;
        }

        const filePath = path.join(this.rulesDir, `${ruleId}.yaml`);

        if (!fs.existsSync(filePath)) {
            console.warn(`PolicySpec not found for rule_id: ${ruleId}`);
            return null;
        }

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const spec = yaml.parse(content) as PolicySpec;
            this.cache.set(ruleId, spec);
            return spec;
        } catch (error) {
            console.error(`Error loading PolicySpec for ${ruleId}:`, error);
            return null;
        }
    }

    /**
     * Load VariationSet for a rule_id
     */
    loadVariationSet(ruleId: string): VariationSet | null {
        // Check cache
        if (this.variationsCache.has(ruleId)) {
            return this.variationsCache.get(ruleId)!;
        }

        const filePath = path.join(this.variationsDir, `${ruleId}.json`);

        if (!fs.existsSync(filePath)) {
            console.warn(`VariationSet not found for rule_id: ${ruleId}`);
            return null;
        }

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const variations = JSON.parse(content) as VariationSet;
            this.variationsCache.set(ruleId, variations);
            return variations;
        } catch (error) {
            console.error(`Error loading VariationSet for ${ruleId}:`, error);
            return null;
        }
    }

    /**
     * Get full PolicyContext for agents
     */
    getPolicyContext(ruleId: string): PolicyContext | null {
        const policySpec = this.loadPolicySpec(ruleId);
        if (!policySpec) {
            return null;
        }

        const variationSet = this.loadVariationSet(ruleId);
        const variations = variationSet?.examples || [];

        // TODO: Load definitions from GraphRAG or definitions file
        const definitions: Array<{ term: string; definition: string }> = [];

        return {
            policySpec,
            variations,
            definitions,
        };
    }

    /**
     * Get few-shot examples for a specific label
     */
    getExamplesByLabel(ruleId: string, labels: string[], limit: number = 3): VariationExample[] {
        const variationSet = this.loadVariationSet(ruleId);
        if (!variationSet) {
            return [];
        }

        return variationSet.examples
            .filter(ex => labels.includes(ex.label))
            .slice(0, limit);
    }

    /**
     * List all available rule IDs
     */
    listRuleIds(): string[] {
        if (!fs.existsSync(this.rulesDir)) {
            return [];
        }

        return fs.readdirSync(this.rulesDir)
            .filter(f => f.endsWith('.yaml'))
            .map(f => f.replace('.yaml', ''));
    }

    /**
     * Reload a specific rule (clear cache)
     */
    reloadRule(ruleId: string): void {
        this.cache.delete(ruleId);
        this.variationsCache.delete(ruleId);
    }

    /**
     * Clear all caches
     */
    clearCache(): void {
        this.cache.clear();
        this.variationsCache.clear();
    }
}

// Default export for convenience
export const policyLoader = new PolicySpecLoader();

// CLI usage
if (require.main === module) {
    const loader = new PolicySpecLoader();

    console.log('Available rules:', loader.listRuleIds());

    const ruleId = process.argv[2] || 'termination';
    console.log(`\nLoading PolicySpec for: ${ruleId}`);

    const context = loader.getPolicyContext(ruleId);
    if (context) {
        console.log('\nPolicySpec:', JSON.stringify(context.policySpec, null, 2));
        console.log('\nVariations count:', context.variations.length);
        console.log('\nStandard examples:');
        loader.getExamplesByLabel(ruleId, ['STANDARD']).forEach(ex => {
            console.log(`  - ${ex.text.substring(0, 80)}...`);
        });
    } else {
        console.log('PolicySpec not found');
    }
}
