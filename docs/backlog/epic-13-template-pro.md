# Epic 13 — Template Pro-only

## Obiettivo

Differenziare il valore di Verso Pro rendendo i template Executive e Moderno esclusivi per utenti Pro. Gli utenti Free vedono i template ma non possono scaricarli — preview blurrata con lucchetto e CTA upgrade.

## Comportamento

### Template disponibili

| Template | Piano |
|----------|-------|
| Classico | Free |
| Minimal | Free |
| Executive | **Pro** |
| Moderno | **Pro** |

### StepExport — Utente Free

I 4 template sono visibili nella griglia. Executive e Moderno mostrano:
- Preview con overlay blur/opacita'
- Icona lucchetto (Lock) sopra la preview
- Label "Pro" badge accent
- Click → toast "Sblocca questo template con Verso Pro" + link a `/upgrade`

Il template selezionato di default e' Classico. Se l'utente Free tenta di selezionare un template Pro → non si seleziona, mostra toast.

### StepExport — Utente Pro

Tutti i template selezionabili. Nessun lucchetto, nessun overlay.

### Gate

Solo frontend. Il PDF viene generato nel browser, non serve un gate server-side. Ma per sicurezza futura, salvare `template_id` in `tailored_cvs` e verificare in `StepExport` che il template sia compatibile col piano.

## Flussi

1. **Free sceglie template Free** — Seleziona, scarica PDF normalmente
2. **Free clicca template Pro** — Toast + suggerimento upgrade, template non selezionato
3. **Pro sceglie qualsiasi template** — Seleziona, scarica normalmente
4. **Free diventa Pro durante sessione** — Lucchetti rimossi al refresh (useSubscription aggiorna isPro)

## Stati

| Stato | Descrizione |
|-------|-------------|
| Template Free selezionato | Border accent, scaricabile |
| Template Pro (utente Free) | Overlay blur, lucchetto, non selezionabile |
| Template Pro (utente Pro) | Selezionabile normalmente |

## Criteri di accettazione

- [ ] Executive e Moderno mostrano lucchetto + overlay per utenti Free
- [ ] Click su template Pro da Free → toast con CTA upgrade
- [ ] Template Pro non selezionabile da Free (no download)
- [ ] Utenti Pro vedono tutti i template senza restrizioni
- [ ] Badge "Pro" visibile sui template bloccati
- [ ] Template di default: Classico (Free), Classico (Pro — ma puo' cambiare)

## Stories

| ID | Story | Priorita' |
|----|-------|----------|
| 13.1 | Aggiungere overlay blur + lucchetto + badge Pro sui template Executive e Moderno per utenti Free | Must |
| 13.2 | Bloccare selezione template Pro per Free con toast e link upgrade | Must |
| 13.3 | Salvare `template_id` in `tailored_cvs` al download | Should |
