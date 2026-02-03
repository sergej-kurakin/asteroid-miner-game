# Power System Documentation

## Overview

The power system is an energy management mechanic that restricts mining operations and allows players to purchase additional power capacity using credits. Power serves as a progression gating mechanism—more powerful ships have larger power cells, and mining consumes power per operation.

## System Architecture

### Core Components

**PowerController** (`src/power/controller.ts`)
- Implements `IPowerController` interface
- Manages power transactions (buying power) and queries
- Validates business rules (sufficient credits, power not full)

**State Management**
- `power: number` - Current power level (0 to power_capacity)
- `power_capacity: number` - Maximum power available (ship-dependent)

**Mining Integration** (`src/mining/controller.ts`)
- Consumes power before mining starts
- Validates sufficient power before allowing mine operation

**Ship Progression** (`src/ships/controller.ts`)
- Each ship tier has a `powerCell` property determining max power_capacity
- Upgrades cap existing power to new ship's capacity (prevents overflow)

## Constants

### Power Economics

| Constant | Value | Purpose |
|----------|-------|---------|
| `POWER_COST` | 100 credits | Cost to purchase one power unit |
| `POWER_GAIN` | 50 | Power restored per purchase transaction |
| `MINE_POWER_COST` | 10 | Power consumed per mining operation |

**Calculations:**
- Cost per power unit: 100 ÷ 50 = 2 credits per power
- Mining cycle cost: 10 power units (equivalent to 20 credits)

## Mechanics

### Buying Power

**Method:** `PowerController.buyPower(): BuyPowerResult`

Validation:
1. Player has ≥100 credits
2. Current power < power_capacity (not full)

Success: Deduct 100 credits, add 50 power (capped at power_capacity)

Result:
```typescript
interface BuyPowerResult {
    success: boolean;
    newPower?: number;      // Updated power level on success
    error?: 'insufficient_credits' | 'power_full';
}
```

### Mining Power Consumption

**When:** At the start of a mining operation

**Amount:** 10 power units deducted before `mining_progress` begins

**Failure Condition:**
- `MiningController.startMining()` fails with event: `mining_failed` with reason `insufficient_power`
- Mining does not start if power < 10

**UI Impact:**
- SCAN button disabled if power < 5
- MINE button disabled if power < 10 (prevents stranded state)

### Power and Ship Upgrades

**On ship upgrade:**
1. New power_capacity set to next ship's `powerCell` property
2. Current power capped to new capacity: `power = min(current_power, nextShip.powerCell)`
3. Prevents overflow; excess power is effectively "lost" but ship gains larger capacity

Example:
```
Scout (power_capacity: 100) with 80 power
  → Upgrade to Prospector (powerCell: 200)
  → New power: 80, New capacity: 200
```

## State Persistence

Power is saved to localStorage on every state change via `saveGameState()`.

**SaveData fields:**
- `power: number`
- `power_capacity: number`

**Default on new game:**
- Initial power: 100
- Initial power_capacity: 100 (Scout ship)

## UI Components

### Power Display

**Location:** Left panel (ship info area)
- Current power: `#power-current` (e.g., "80")
- Maximum power: `#power-max` (e.g., "100")
- Display updates when power or power_capacity changes

### Buy Power Button

**Element:** `#btn-buy-power`

**States:**
- **Enabled (affordable class)**: Can afford power and power < capacity
- **Disabled (unaffordable class)**: Insufficient credits OR power is at capacity

**Interaction:** Click → `handleBuyPower()` → PowerController deducts credits, adds power

### Gauge Visualization

Power is rendered as a gauge in the left panel:
- Filled percentage: `current_power / power_capacity`
- Color: Primary accent (`#00ff88`)
- Updates reactively when power/capacity changes

## Event Flow

### Mining Initiation

```
User clicks MINE
  ↓
MiningController.startMining()
  ├─ Check: power >= MINE_POWER_COST (10)
  ├─ FAIL → emit 'mining_failed' event (insufficient_power)
  └─ SUCCESS:
      ├─ Deduct 10 power
      ├─ Set is_mining = true
      └─ emit 'mining_started' event
```

### Power Purchase

```
User clicks BUY POWER
  ↓
handleBuyPower()
  ↓
PowerController.buyPower()
  ├─ Validate: credits >= 100, power < capacity
  ├─ FAIL → UI shows error (handled by renderPowerButton)
  └─ SUCCESS:
      ├─ Deduct 100 credits
      ├─ Add 50 power (capped at capacity)
      └─ State subscribers update UI
```

## Integration Checklist

- ✅ Power state fields added to `GameState` interface
- ✅ Power constants and costs defined
- ✅ PowerController implemented with buy/query methods
- ✅ Mining checks power before starting
- ✅ Ship upgrades cap/update power capacity
- ✅ Persistence saves/loads power fields
- ✅ UI displays power gauge and buy button
- ✅ Button state reflects affordable/unaffordable status
- ✅ State subscriptions trigger relevant re-renders

## Testing

**PowerController unit tests** (`src/power/controller.test.ts`)
- Buying power with sufficient credits
- Buying power with insufficient credits
- Buying power when already at capacity
- Power capacity validation

**MiningController tests** (`src/mining/controller.test.ts`)
- Mining fails with insufficient power
- Mining deducts correct power amount

**ShipController tests** (`src/ships/controller.test.ts`)
- Power capped on ship upgrade

## Balance Tuning

Current values are provisional. To adjust:

1. **Make power more precious:** Increase `MINE_POWER_COST` or decrease `POWER_GAIN`
2. **Make power cheaper:** Decrease `POWER_COST` or increase `POWER_GAIN`
3. **Slower progression:** Increase power costs for ship upgrades (ship `powerCell` values)

Modify constants in:
- `src/power/constants.ts` - Buy/gain rates
- `src/mining/constants.ts` - Mining consumption
- `src/ships/ships.ts` - Ship powerCell values

## Future Extensions

Possible mechanics to implement:
- **Passive power regeneration** over time
- **Tool effects** that reduce power consumption
- **Rare asteroids** that require more power
- **Power upgrades** independent of ship tiers
- **Battery mechanic** (store excess power)
