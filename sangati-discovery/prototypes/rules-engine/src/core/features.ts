/**
 * Sangati — Feature Flag System
 *
 * Controls which modules are active at runtime.
 * Core features are always ON. Intelligence features default to OFF.
 * Flags are set at construction time and can be toggled at runtime.
 *
 * Naming convention: 'module.feature' (e.g., 'intelligence.adaptiveThresholds')
 */

export interface FeatureFlags {
  [key: string]: boolean;
}

/** Core features — always enabled, cannot be disabled */
const CORE_FLAGS: ReadonlySet<string> = new Set([
  'core.rulesEngine',
  'core.suppression',
  'core.escalation',
  'core.modeFiltering',
  'core.zoneMuting',
]);

/** Default Intelligence flags — all disabled */
const DEFAULT_INTELLIGENCE_FLAGS: FeatureFlags = {
  'intelligence.adaptiveThresholds': false,
  'intelligence.anomalyScoring': false,
  'intelligence.smartSuppression': false,
  'intelligence.patternDetection': false,
};

export class FeatureFlagManager {
  private flags: Map<string, boolean>;
  private listeners: Map<string, Array<(enabled: boolean) => void>> = new Map();

  constructor(overrides?: FeatureFlags) {
    this.flags = new Map();

    // Core flags: always on
    for (const flag of CORE_FLAGS) {
      this.flags.set(flag, true);
    }

    // Intelligence flags: default off
    for (const [key, value] of Object.entries(DEFAULT_INTELLIGENCE_FLAGS)) {
      this.flags.set(key, value);
    }

    // Apply overrides (cannot override core flags)
    if (overrides) {
      for (const [key, value] of Object.entries(overrides)) {
        if (CORE_FLAGS.has(key)) continue; // Core flags are locked
        this.flags.set(key, value);
      }
    }
  }

  /** Check if a feature is enabled. Unknown flags return false. */
  isEnabled(flag: string): boolean {
    return this.flags.get(flag) ?? false;
  }

  /** Enable a feature at runtime. Core flags cannot be changed. */
  enable(flag: string): void {
    if (CORE_FLAGS.has(flag)) return;
    this.flags.set(flag, true);
    this.notify(flag, true);
  }

  /** Disable a feature at runtime. Core flags cannot be changed. */
  disable(flag: string): void {
    if (CORE_FLAGS.has(flag)) return;
    this.flags.set(flag, false);
    this.notify(flag, false);
  }

  /** Register a listener for flag changes. */
  onToggle(flag: string, callback: (enabled: boolean) => void): void {
    const existing = this.listeners.get(flag) ?? [];
    existing.push(callback);
    this.listeners.set(flag, existing);
  }

  /** Get all flags as a plain object (for diagnostics). */
  getAll(): FeatureFlags {
    const result: FeatureFlags = {};
    for (const [key, value] of this.flags) {
      result[key] = value;
    }
    return result;
  }

  /** Get only intelligence flags. */
  getIntelligenceFlags(): FeatureFlags {
    const result: FeatureFlags = {};
    for (const [key, value] of this.flags) {
      if (key.startsWith('intelligence.')) {
        result[key] = value;
      }
    }
    return result;
  }

  private notify(flag: string, enabled: boolean): void {
    const callbacks = this.listeners.get(flag) ?? [];
    for (const cb of callbacks) {
      cb(enabled);
    }
  }
}
