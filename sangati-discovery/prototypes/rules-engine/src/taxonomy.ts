/**
 * Re-export from core/types for backward compatibility.
 * New code should import from './core' directly.
 */
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
} from './core/types';
export { SEVERITY_ORDER } from './core/types';
