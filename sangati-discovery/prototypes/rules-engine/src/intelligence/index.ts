/**
 * Sangati — Intelligence Module
 *
 * Pro features that plug INTO Core. Core never imports this module.
 * Intelligence depends on Core, not the other way around.
 *
 * Usage:
 *   import { RulesEngine, DEFAULT_RULES } from './core';
 *   import { createIntelligenceProviders, INTELLIGENCE_FLAGS } from './intelligence';
 *
 *   const engine = new RulesEngine({
 *     rules: DEFAULT_RULES,
 *     zoneConfigs: [...],
 *     providers: createIntelligenceProviders(),
 *     featureFlags: INTELLIGENCE_FLAGS,
 *   });
 */

import type { Providers } from '../core/providers';
import type { FeatureFlags } from '../core/features';
import { AdaptiveThresholdProvider } from './adaptive-thresholds';
import { AnomalyScoringProvider_ } from './anomaly-scorer';
import { SmartSuppressionProvider } from './smart-suppression';
import { PatternDetectorProvider } from './pattern-detector';

/** Feature flags that enable all Intelligence modules. */
export const INTELLIGENCE_FLAGS: FeatureFlags = {
  'intelligence.adaptiveThresholds': true,
  'intelligence.anomalyScoring': true,
  'intelligence.smartSuppression': true,
  'intelligence.patternDetection': true,
};

/** Create a selective set of flags — enable only specific modules. */
export function createFlags(
  modules: {
    adaptiveThresholds?: boolean;
    anomalyScoring?: boolean;
    smartSuppression?: boolean;
    patternDetection?: boolean;
  },
): FeatureFlags {
  return {
    'intelligence.adaptiveThresholds': modules.adaptiveThresholds ?? false,
    'intelligence.anomalyScoring': modules.anomalyScoring ?? false,
    'intelligence.smartSuppression': modules.smartSuppression ?? false,
    'intelligence.patternDetection': modules.patternDetection ?? false,
  };
}

/**
 * Wire up all Intelligence providers.
 * Returns provider instances that can be passed to RulesEngine config.
 * Also returns individual references for feeding data back (e.g., recordOutcome).
 */
export function createIntelligenceProviders(): {
  providers: Providers;
  adaptiveThresholds: AdaptiveThresholdProvider;
  anomalyScorer: AnomalyScoringProvider_;
  smartSuppression: SmartSuppressionProvider;
  patternDetector: PatternDetectorProvider;
} {
  const adaptiveThresholds = new AdaptiveThresholdProvider();
  const anomalyScorer = new AnomalyScoringProvider_();
  const smartSuppression = new SmartSuppressionProvider();
  const patternDetector = new PatternDetectorProvider();

  return {
    providers: {
      threshold: adaptiveThresholds,
      anomalyScoring: anomalyScorer,
      suppression: smartSuppression,
      pattern: patternDetector,
    },
    adaptiveThresholds,
    anomalyScorer,
    smartSuppression,
    patternDetector,
  };
}

// Re-export individual providers for direct use
export { AdaptiveThresholdProvider } from './adaptive-thresholds';
export { AnomalyScoringProvider_ } from './anomaly-scorer';
export { SmartSuppressionProvider } from './smart-suppression';
export { PatternDetectorProvider } from './pattern-detector';
