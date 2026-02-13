/**
 * Sangati AI — Rules Engine
 *
 * Public API for the rules engine prototype.
 */

export { RulesEngine } from './engine';
export { DEFAULT_RULES } from './rules';
export type { Rule, RuleCondition, RuleAction, SuppressionConfig } from './rules';
export type {
  Severity,
  RecipientRole,
  ZoneState,
  AlertDefinition,
  Zone,
  ZoneSnapshot,
  RestaurantState,
  Alert,
} from './taxonomy';
export { SEVERITY_ORDER } from './taxonomy';
