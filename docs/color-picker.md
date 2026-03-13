# Color Picker Komponent

En dynamisk og gjenbrukbar fargevelger for React/Next.js applikasjoner.

## Funksjoner

- **Forhåndsdefinerte fargekategorier** - Organiserte farger i logiske grupper
- **Egendefinerte farger** - Mulighet for å velge hvilken som helst farge via color picker
- **Utvidbar** - Legg til dine egne fargekategorier og farger
- **Responsivt design** - Fungerer på alle skjermstørrelser
- **Tilgjengelighet** - Fullt tilgjengelig med keyboard navigation
- **TypeScript** - Fullt typet med TypeScript

## Bruk

### Basic bruk

```tsx
import ColorPicker, { DEFAULT_COLOR_CATEGORIES } from '@/components/color-picker'

function MyComponent() {
  const [color, setColor] = useState('#eab308')

  return (
    <ColorPicker
      value={color}
      onChange={setColor}
      categories={DEFAULT_COLOR_CATEGORIES}
    />
  )
}
```

### Egendefinerte kategorier

```tsx
const customCategories = [
  {
    name: 'Merkevarefarger',
    description: 'Våre offisielle merkevarefarger',
    colors: [
      { name: 'Primær', value: '#1e40af' },
      { name: 'Sekundær', value: '#10b981' },
      { name: 'Aksent', value: '#f59e0b' },
    ]
  },
  ...DEFAULT_COLOR_CATEGORIES
]

<ColorPicker
  value={color}
  onChange={setColor}
  categories={customCategories}
/>
```

### Uten egendefinerte farger

```tsx
<ColorPicker
  value={color}
  onChange={setColor}
  allowCustom={false}
/>
```

## Standard kategorier

Komponenten kommer med 6 forhåndsdefinerte kategorier:

### Standard
- Gul (#eab308)
- Hvit (#ffffff)
- Svart (#000000)

### Blåtoner
- Himmelblå (#0ea5e9)
- Kongeblå (#2563eb)
- Marineblå (#1e3a8a)
- Turkis (#14b8a6)

### Grønntoner
- Lime (#84cc16)
- Skoggrønn (#16a34a)
- Mørkegrønn (#14532d)
- Mint (#10b981)

### Rødtone
- Korallrød (#f43f5e)
- Rød (#ef4444)
- Burgunder (#881337)
- Oransje (#f97316)

### Lilla & Rosa
- Lilla (#a855f7)
- Magenta (#d946ef)
- Rose (#f43f5e)
- Indigo (#6366f1)

### Nøytrale
- Grå (#6b7280)
- Sølv (#9ca3af)
- Beige (#d4a574)
- Koksgrå (#374151)

## Props

| Prop | Type | Default | Beskrivelse |
|------|------|---------|-------------|
| `value` | `string` | - | Nåværende valgt farge (hex format) |
| `onChange` | `(color: string) => void` | - | Callback når farge endres |
| `categories` | `ColorCategory[]` | `DEFAULT_COLOR_CATEGORIES` | Liste med fargekategorier |
| `allowCustom` | `boolean` | `true` | Vis/skjul egendefinert fargevelger |
| `className` | `string` | `""` | Ekstra CSS klasser |

## Typer

```tsx
interface ColorOption {
  name: string
  value: string
  description?: string
}

interface ColorCategory {
  name: string
  description: string
  colors: ColorOption[]
}
```

## Demo

Besøk `/color-demo` for å se en interaktiv demo av fargevelgeren.

## Integration i eksisterende system

Fargevelgeren er integrert i admin-panelet under `Appearance > Style & Position`. Den erstatter den enkle fargevelgeren med en mer avansert og brukervennlig løsning.

### Slik integreres i chatbot-config

Fargen lagres i `primary_color` feltet i `chatbot_configs` tabellen:

```sql
UPDATE chatbot_configs 
SET primary_color = '#2563eb' 
WHERE admin_id = 'user_id';
```

## Tilpasning

### Legge til nye standardfarger

For å legge til nye standardfarger, rediger `DEFAULT_COLOR_CATEGORIES` i `components/color-picker.tsx`:

```tsx
export const DEFAULT_COLOR_CATEGORIES: ColorCategory[] = [
  // ... eksisterende kategorier
  {
    name: 'Min Kategori',
    description: 'Beskrivelse av kategorien',
    colors: [
      { name: 'Min Farge', value: '#ff0000', description: 'Beskrivelse' },
      // flere farger...
    ]
  }
]
```

### Styling

Komponenten bruker Tailwind CSS og kan tilpasses med standard Tailwind klasser. Alle farger er definert med hex-koder for maksimal kompatibilitet.

## Tilgjengelighet

- Full keyboard navigation
- Screen reader support med ARIA labels
- Høy kontrast for alle fargevalg
- Focus states for alle interaktive elementer

## Browser støtte

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Avhengigheter

- React 18+
- Radix UI components
- Lucide React icons
- Tailwind CSS
