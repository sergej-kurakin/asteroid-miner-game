// src/ui/index.ts
// Public API for UI components

export type { UIComponent, GaugeType, GaugeConfig } from './interfaces';
export { BaseComponent } from './base-component';
export { formatNumber, formatCredits } from './utils';

// Components
export { GaugeComponent } from './components/gauge';
export { CreditsDisplay } from './components/credits-display';
export { InventoryList } from './components/inventory-list';
export { CompositionGrid } from './components/composition-grid';
export { ShipInfo } from './components/ship-info';
export { PowerButton } from './components/power-button';
export { StatusDisplay } from './components/status-display';
export { DiscoveryAlert } from './components/discovery-alert';
export { ControlButtons, type ControlHandlers } from './components/control-buttons';
export { AsteroidView } from './components/asteroid-view';
export { ToolPanel, type ToolPanelHandlers } from './components/tool-panel';
