/**
 * Sangati — Core Module
 *
 * The standalone rules engine. Works without Intelligence.
 * Import from '@sangati/rules-engine/core' or '@sangati/rules-engine'.
 */

// Types
export type {
  Severity,
  RecipientRole,
  ZoneState,
  ZoneType,
  AlertDefinition,
  Zone,
  ZoneSnapshot,
  RestaurantState,
  Alert,
  ZoneConfig,
} from './types';
export { SEVERITY_ORDER } from './types';

// Rules
export type { Rule, RuleCondition, RuleAction, SuppressionConfig } from './rules';
export { DEFAULT_RULES } from './rules';

// Engine
export { RulesEngine } from './engine';
export type { EngineConfig } from './engine';

// Providers (interfaces for Intelligence to implement)
export type {
  Providers,
  ThresholdProvider,
  AnomalyScoringProvider,
  SuppressionProvider,
  PatternProvider,
  PatternMatch,
} from './providers';

// Feature flags
export { FeatureFlagManager } from './features';
export type { FeatureFlags } from './features';
