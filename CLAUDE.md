# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Asteroid Miner** is a 2D space mining idle/incremental game built with vanilla JavaScript and HTML5 Canvas. Players pilot mining spaceships, scan asteroids, mine resources, and upgrade equipment.

- **Tech Stack**: Single HTML file with embedded CSS and JavaScript (no build tools, no dependencies)
- **Storage**: LocalStorage for save/load
- **Visual Style**: Retro-futuristic sci-fi (1980s CRT terminal aesthetic, green-on-black)

## Architecture

### Game State Model
The central `gameState` object tracks all player progress:
- `credits` - Currency for upgrades
- `current_ship_level` - 1-5 (Scout → Titan)
- `discovered_elements` - Array of element symbols found
- `equipped_tools` - Array of tool objects with slot assignments
- `tools_owned` - Object tracking purchased tools
- `asteroid` - Current asteroid being mined (type, size, composition)
- `inventory` - Object mapping element symbols to amounts
- `hold_capacity`, `hold_used` - Cargo limits
- `power`, `is_mining`, `mining_progress` - Mining state

### Core Systems

**Ship Progression (5 tiers)**:
- Scout (free) → Prospector (2k) → Harvester (8k) → Industrial (25k) → Titan (75k)
- Each tier increases: hold capacity, mining speed, tool slots, asteroid size access

**Tool System**:
- Tools purchased and equipped in slots (1-4 slots based on ship)
- Effects stack: yield bonuses, rare element bonuses, power costs
- Three tiers: Basic (500-800₹), Mid (2000-3000₹), Endgame (8000-12000₹)

**Asteroid System**:
- 6 sizes: Tiny → Small → Medium → Large → Massive → Colossal
- 4 types with different compositions: Iron-Nickel (40%), Carbonaceous (35%), Rare-Earth (20%), Olivine (5%)
- Ship class gates which asteroid sizes are accessible

**Element Economy**:
- 9 elements: Fe, O, Si, Ni, Mg, S, Co (rare), Cr (rare), Mn (rare)
- Discovery system triggers alerts for first-time finds

### UI Structure (3-Panel Cockpit)
- **Left Panel**: Mining controls, gauges (power, laser, hold), SCAN/MINE buttons
- **Center Panel**: Asteroid display, composition info, mining progress
- **Right Panel**: Credits, inventory list, upgrades section, SELL button

## Implementation Priorities

Current development order per PROJECT_BRIEF.md:
1. Ship upgrade system
2. Tool equipping system
3. Asteroid type/size variety
4. Power management system
5. Polish and balancing

## Design References

- `PROJECT_BRIEF.md` - Complete game spec, data models, UI layout
- `ship_progression_design.md` - Ship tiers, tool stats, power system
- `asteroid_system_design.md` - Asteroid types, sizes, compositions, spawn rates

## Color Palette

| Use | Hex |
|-----|-----|
| Primary (borders, gauges, text) | #00ff88 |
| Secondary (inventory, accents) | #0099ff |
| Accent (mining, warnings) | #ff8800 |
| Gold (discovery, rare) | #ffc800 |
| Background | #0a0e27 |
