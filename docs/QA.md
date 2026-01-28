# QA Checklist

## Smoke Test Checklist

### Home Screen (index.tsx)
- [ ] Sessions display correctly
- [ ] Filter by type works (Séries, Fartlek, etc.)
- [ ] Filter by date works (Aujourd'hui, Cette semaine, Ce mois-ci)
- [ ] Filter by pace range works
- [ ] Filter by spot works
- [ ] Reset filters works
- [ ] Session cards show correct information
- [ ] "INSCRIT" pill appears for joined sessions
- [ ] "Créée par toi" pill appears for custom sessions
- [ ] Tap session card navigates to detail screen
- [ ] "Créer" button navigates to create screen

### Session Detail ([id].tsx)
- [ ] Session information displays correctly
- [ ] Workout summary shows if workout linked
- [ ] Group overrides display correctly
- [ ] "Enregistrer" button saves joined session
- [ ] "Quitter cette séance" button removes joined session
- [ ] "Modifier" button appears for custom sessions
- [ ] "Modifier" button navigates to edit screen
- [ ] "Supprimer la séance" works for custom sessions
- [ ] Back button navigates correctly

### Create/Edit Session (create.tsx)
- [ ] Form fields are editable
- [ ] Spot picker works
- [ ] Date picker works
- [ ] Time picker works
- [ ] Workout picker works
- [ ] Group toggles work
- [ ] Pace pickers work for each group
- [ ] Interval settings (reps, effort, recovery) work for fartlek/series
- [ ] "Publier la séance" creates new session
- [ ] "Mettre à jour la séance" updates existing session
- [ ] Created session appears in "Mes séances"

### My Sessions (my-sessions.tsx)
- [ ] Timeline displays correctly
- [ ] Only shows custom sessions + joined sessions
- [ ] Sorted by date ascending
- [ ] "Créer" button in header works
- [ ] Empty state shows when no sessions
- [ ] Tap session navigates to detail

### Workouts (workouts.tsx)
- [ ] Workout list displays
- [ ] Search works
- [ ] Type filter works
- [ ] Workout cards show correct info
- [ ] Tap workout navigates to detail
- [ ] "Créer un workout" button works

### Profile (profile.tsx)
- [ ] Profile stats display correctly
- [ ] PR records display
- [ ] "Ajouter / mettre à jour un PR" navigates correctly
- [ ] "Voir l'historique complet" navigates correctly
- [ ] "Paramètres" navigates correctly

### Date Filtering (Critical)
- [ ] "Aujourd'hui" filter shows only today's sessions
- [ ] "Cette semaine" filter shows only this week's sessions
- [ ] "Ce mois-ci" filter shows only this month's sessions
- [ ] Date sorting works correctly

### Data Persistence
- [ ] Created sessions persist after app restart
- [ ] Joined sessions persist after app restart
- [ ] Workouts persist after app restart
- [ ] Profile data persists after app restart
- [ ] PR records persist after app restart

### Navigation
- [ ] All routes are accessible
- [ ] Back navigation works correctly
- [ ] Tab navigation works
- [ ] No dead ends or broken links

## Known Issues

- Date filtering may not work correctly until Phase 2 date migration completes
- Some sessions may not have dateISO fields (will be migrated on load)
