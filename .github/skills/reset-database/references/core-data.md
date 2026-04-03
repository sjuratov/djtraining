# Core Data Seed

The reset script preserves schema and `_migrations`, then rebuilds this local baseline:

## Package definitions

- 15 package definitions copied from `src/api/src/db/migrations/004-packages.sql`
- Categories covered: `personal`, `gruppe`, `ernaehrung`
- Includes the current Personal / HIIT / Vibration / Group / Nutrition commercial packages

## Training types

1. `Personal Training`
   - category: `personal`
   - duration: 60 minutes
   - capacity: 1
   - single price: CHF 100.00
2. `Gruppentraining`
   - category: `gruppe`
   - duration: 60 minutes
   - capacity: 5
   - single price: CHF 25.00
3. `Ernährungscoaching`
   - category: `ernaehrung`
   - duration: 60 minutes
   - capacity: 1
   - single price: CHF 100.00

## Schedule templates

### Personal Training

- Monday to Friday
- Start times: `09:00`, `10:00`, `11:00`, `16:00`, `17:00`, `18:00`, `19:00`, `20:00`
- Derived from the current `/trainingszeiten` page (`9:00–12:00` and `16:00–21:00`)

### Gruppentraining

- Monday `18:00`
- Monday `19:15`
- Thursday `18:00`
- Thursday `19:15`

### Ernährungscoaching

- No recurring templates by default
- Leave this manual because the public schedule still describes the service as `nach Vereinbarung`

## Generated slots

- Horizon: today through one month ahead
- Slot status: `available`
- Personal and group templates generate bookable slots automatically
- Nutrition remains type-only until an admin adds ad-hoc or recurring appointments
