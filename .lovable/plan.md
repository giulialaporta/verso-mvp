

## Fix: Status change not reflected in Candidature list

### Root cause

`CandidaturaDetail.tsx` line 97-110: `handleStatusChange` calls `supabase.update()` successfully but never invalidates the `["applications"]` query cache. When the user navigates back to `/app/candidature`, React Query serves stale data.

### Fix

Add `useQueryClient` to `CandidaturaDetail.tsx` and call `queryClient.invalidateQueries({ queryKey: ["applications"] })` after a successful status update (and after notes blur save too).

### Also: update states to new model

While fixing, update `STATUSES` array to the approved new model:
- Replace `follow-up` with `colloquio`
- Add `offerta`
- Update `STATUS_STYLES` with progressive colors

### Files

| File | Change |
|------|--------|
| `CandidaturaDetail.tsx` | Add `useQueryClient`, invalidate `["applications"]` on status change and notes save |
| `StatusChip.tsx` | New progressive color palette, add `colloquio` + `offerta`, remove `follow-up` |
| `DetailContent.tsx` | Update `STATUSES` array |
| `Candidature.tsx` | Update `STATUS_ORDER` and `STATUS_LABELS` |
| `Home.tsx` | Update any `follow-up` references |

