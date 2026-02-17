/**
 * Sangati — Rules Engine
 *
 * Public API. Exports Core (standalone) and Intelligence (optional Pro modules).
 *
 * Core-only usage:
 *   import { RulesEngine, DEFAULT_RULES } from '@sangati/rules-engine';
 *
 * Core + Intelligence usage:
 *   import { RulesEngine, DEFAULT_RULES } from '@sangati/rules-engine';
 *   import { createIntelligenceProviders, INTELLIGENCE_FLAGS } from '@sangati/rules-engine/intelligence';
 */

// --- Core (always available) ---

export {
  // Engine
  RulesEngine,
  // Rules
  DEFAULT_RULES,
  // Feature flags
  FeatureFlagManager,
  // Constants
  SEVERITY_ORDER,
} from './core';

export type {
  // Engine config
  EngineConfig,
  // Types
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
  // Rule types
  Rule,
  RuleCondition,
  RuleAction,
  SuppressionConfig,
  // Provider interfaces (for Intelligence implementors)
  Providers,
  ThresholdProvider,
  AnomalyScoringProvider,
  SuppressionProvider,
  PatternProvider,
  PatternMatch,
  // Feature flag types
  FeatureFlags,
} from './core';
