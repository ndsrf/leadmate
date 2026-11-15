# In Stages with Scent Spots the Dog follows the Handler's heading, not the Pathway

Everywhere else the Dog's Goal Drive steers toward the next waypoint, so the Dog effectively knows the route and leads the Handler along it. In a Stage with Scent Spots, the Goal Drive aims ahead along the Handler's current heading and is blended with the scent pull, and the waypoints only mark the route and the end for the Handler. A Dog that knows the route makes every planned turn predictable to it, which defeats the whole point of an Unpredictable Walk. That was the reason the first World 6 Stage felt flat.

## Considered Options

- **Keep the waypoint but lower its weight:** any weight leaks the route to the Dog, and turns at waypoints still line up with what it wants.
- **Switch every Stage to heading-following:** this would change how Worlds 3-5 play and invalidate their tuning. It is left for a later decision based on playtests.

## Consequences

Scent Stages and older Stages have Dogs that steer differently. The switch is the presence of Scent Spots in the scenario, so a scent-free scenario behaves exactly as before for the same seed and inputs.
