

# Miglioramento qualità visiva ClassicoTemplate e MinimalTemplate

## Problemi attuali

Entrambi i template soffrono degli stessi difetti tipografici e di layout:

- **Spaziature troppo strette**: padding sidebar 16px, padding main 28px, marginBottom troppo piccoli tra sezioni (6-8px)
- **Gerarchia tipografica debole**: nome 20px e section title 9px creano un salto eccessivo senza livelli intermedi; ruolo (11px) e meta (9px) quasi indistinguibili
- **Sidebar compressa**: il nome è duplicato sia in sidebar che nel main body, sprecando spazio
- **Bullet points piatti**: paddingLeft 10px con "•" testuale, nessun rientro professionale
- **Sezione titoli generici**: uppercase + letterSpacing uniforme su tutto, nessuna variazione visiva tra sidebar headers e main headers
- **Colori monotoni**: il Classico usa un sidebar quasi nero (#141518) che è denso e pesante; il Minimal usa un grigio (#F5F5F5) troppo neutro

## Modifiche proposte

### ClassicoTemplate — Raffinamento "premium dark sidebar"

**Colori**:
- Sidebar BG: da #141518 a #1C1F26 (leggermente più caldo, meno oppressivo)
- Accent: da #5DBBFF a #60A5FA (blue-400, più elegante)
- Section border sidebar: da #2A2D35 a #333842

**Tipografia e spaziature**:
- Sidebar padding: 16→20px orizzontale, 24→32px verticale
- Main padding: 28→36px orizzontale, 24→32px verticale
- Nome main: 20→22px, aggiungere letterSpacing 0.5
- Rimuovere nome duplicato dalla sidebar (lasciare solo nel main); in sidebar mostrare solo la foto
- Section title main: 9→10px, aggiungere marginTop 18 (da 14), accent line colorata (2px borderBottom in accent color) al posto della linea grigia
- Ruolo esperienza: 11→11px ma aggiungere company su riga separata in 500 weight
- Bullet: fontSize 9→9.5, paddingLeft 10→14, marginBottom 1→2.5
- Skill chip sidebar: aggiungere marginBottom 3 (da 2), lineHeight 1.5
- Summary: lineHeight 1.5→1.6
- Sidebar section headers: marginTop 14→18

**Layout**:
- Proporzioni sidebar/main: 30/70→28/72 (più spazio al contenuto)

### MinimalTemplate — Raffinamento "clean editorial"

**Colori**:
- Rimuovere sidebar background (#F5F5F5→bianco, nessuno sfondo)
- Aggiungere una sottile linea verticale di separazione tra sidebar e main (borderRight 0.5px #E0E0E0)
- Link color: da #3366cc a #2563EB (blue-600, più moderno)
- Section title: da #333 a #111 (più contrasto)

**Tipografia e spaziature**:
- Sidebar padding: 14→18px orizzontale, 24→32px verticale
- Main padding: 28→36px orizzontale, 24→32px verticale
- Nome main: 20→24px, fontWeight 700, letterSpacing -0.3 (stile editoriale)
- Rimuovere nome duplicato dalla sidebar
- Divider: da borderBottom grigia a marginVertical 14 con linea più sottile (0.3px)
- Section title: 9→10px, non uppercase, fontWeight 700, nessun letterSpacing (stile Notion)
- Ruolo esperienza: 10.5→11px
- Bullet: marginBottom 1→2.5, paddingLeft 10→14
- Contact subtitle sotto il nome: fontSize 9→8.5, letterSpacing 0.5, uppercase
- eduBlock marginBottom: 6→10
- Summary lineHeight: 1.5→1.6

**Layout**:
- Proporzioni sidebar/main: 30/70→26/74 (sidebar più snella, contenuto più ampio)
- Sidebar senza sfondo dà un feeling molto più pulito e "Notion-like"

## File da modificare

| File | Tipo modifica |
|------|--------------|
| `src/components/cv-templates/ClassicoTemplate.tsx` | Stili: colori, spaziature, tipografia, rimozione nome duplicato |
| `src/components/cv-templates/MinimalTemplate.tsx` | Stili: rimozione sfondo sidebar, spaziature, tipografia, rimozione nome duplicato |

Nessuna modifica a props, struttura dati, `template-utils.ts` o `index.ts`.

