/**
 * Re-export from core/rules for backward compatibility.
 * New code should import from './core' directly.
 */
export type { Rule, RuleCondition, RuleAction, SuppressionConfig } from './core/rules';
export { DEFAULT_RULES } from './core/rules';
