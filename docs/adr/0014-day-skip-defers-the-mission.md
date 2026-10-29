# A Day Skip defers a Mission's check-in; it does not remove it

Waiting a real day at every Mission (ADR 0013) stops motivated users at the moment they are most engaged. LeadMate Plus members can therefore use a Day Skip on a started, waiting Mission. The Stops after the Mission open at once, but the Mission becomes an Owed Mission: it keeps its target, its later-day check-in and its Fixes, and the World is not complete until every Owed Mission is passed. That keeps ADR 0013's point that progress through a World is tied to real walks. The walks can now happen later and in a batch, instead of blocking each Stretch in turn.

## Considered options

- **Open the check-in now:** the user could answer "¡Conseguido!" minutes after starting, and the real-world step would become a formality. Rejected.
- **Pass the Mission without a check-in:** paying would buy a way round the real walk, and it would undercut the free experience's main idea. Rejected.
- **A limited number of free Day Skips (e.g. three in a row):** we considered it, but the Day Skip is a clear reason to try Plus, and free users already have a working path. Rejected: free users get none.

## Consequences

- A World's last Mission cannot be skipped, because skipping it would open nothing. The user closes the World's debts there, after a real day.
- When Plus ends, Owed Missions stay owed and the trail they opened stays open. Only new Day Skips need Plus. The one exception is a Plus World: it locks again when Plus ends, and the Owed Missions inside it lock with it.
- A Day Skip changes no Learning Attribute, Star or Streak, and adds no Walk Diary entry. The Diary shows it, and a skip on its own is not an Active Day.
- On sync, a Mission is owed if either copy skipped it, and a pass still wins.
