# World

## World Structure

The game world is a discrete 3-dimensional grid composed of Cells.

The grid size is approximately 20 × 20 × 20 Cells (this can be configurable).

Each Cell has integer coordinates: (x, y, z)

Cells represent regions of space containing:
* Asteroid fields
* Stations (rare)
* Empty space

Only one special structure may exist per Cell.

## Cell Types

Each Cell belongs to one of the following categories:

1. Empty Cell
 * Has nothing inside.
2. Normal Mining Cell
 * Produces 2–3 types of asteroids.
 * Asteroids regenerate on each scan.
 * Resource distribution depends on distance from special structures.
3. Power Station Cell (Fueling Depot)
 * Rare.
 * Used to buy energy.
 * Cells within a defined radius around a Power Station:
  * Produce only small asteroids.
  * Intended as beginner-safe mining zones.
4. Market Cell
 * Rare.
 * Used to sell mined resources.
 * Cells within a defined radius around a Market:
 * Do not produce asteroids.
 * Intended to create safe but economically focused zones.

## Placement Rules

To maintain balance:
* Power Stations and Markets are:
 * Placed far from each other.
 * Distributed sparsely across the grid.

Suggested constraints:
* Minimum Manhattan or Euclidean distance between:
 * Power Station ↔ Market
 * Power Station ↔ Power Station
 * Market ↔ Market

This prevents clustering and forces travel planning.

## Asteroid Generation

Each mining Cell Has:
* Asteroid types it can produce
* Asteroid size it can produce

Modifiers:
* Near Power Station: small only
* Near Market: no asteroids

Cell (0,0,0): Produces only small asteroids.

## Ship Mechanics

Ship start at (0,0,0), full enery, 0 credits, cargo empty.

## Movement

Ships move between Cells, not within continuous space.
Movement cost: 20 per move.
Movement rules: one move = transition to any adjacent Cell.
If ship energy < 20: Movement is blocked.
For every 50 units of cargo in the hold, movement cost for energy increases by 10% of the base cost.
Final movement cost: `finalMoveCost = BASE_MOVE_COST × cargoMultiplier`

## Energy Economy

Energy can be purchased only at Power Stations.

Energy price depends on distance from nearest Power Station:

```
Energy price = base_price + (distance_to_nearest_power_station × 10 credits)
```

Where:
* Distance is measured in number of Cells (Manhattan distance recommended for grid logic).

This creates:
* Expensive energy in remote regions.
* Strategic importance of planning routes.
