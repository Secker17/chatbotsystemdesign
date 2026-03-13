'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, Palette } from 'lucide-react'

export interface ColorOption {
  name: string
  value: string
  description?: string
}

export interface ColorCategory {
  name: string
  description: string
  colors: ColorOption[]
}

export const DEFAULT_COLOR_CATEGORIES: ColorCategory[] = [
  {
    name: 'Standard',
    description: 'Klassiske fargevalg',
    colors: [
      { name: 'Gul', value: '#eab308', description: 'Standard gul farge' },
      { name: 'Hvit', value: '#ffffff', description: 'Ren hvit' },
      { name: 'Svart', value: '#000000', description: 'Dyp svart' },
    ]
  },
  {
    name: 'Blåtoner',
    description: 'Profesjonelle blå farger',
    colors: [
      { name: 'Himmelblå', value: '#0ea5e9', description: 'Lys og frisk' },
      { name: 'Kongeblå', value: '#2563eb', description: 'Klassisk profesjonell' },
      { name: 'Marineblå', value: '#1e3a8a', description: 'Dyp og seriøs' },
      { name: 'Turkis', value: '#14b8a6', description: 'Moderne og frisk' },
    ]
  },
  {
    name: 'Grønntoner',
    description: 'Naturinspirerte grønne farger',
    colors: [
      { name: 'Lime', value: '#84cc16', description: 'Frisk og energisk' },
      { name: 'Skoggrønn', value: '#16a34a', description: 'Naturlig og balansert' },
      { name: 'Mørkegrønn', value: '#14532d', description: 'Dyp og elegant' },
      { name: 'Mint', value: '#10b981', description: 'Lett og moderne' },
    ]
  },
  {
    name: 'Rødtone',
    description: 'Varme og oppmerksomhetsvekkende farger',
    colors: [
      { name: 'Korallrød', value: '#f43f5e', description: 'Varm og innbydende' },
      { name: 'Rød', value: '#ef4444', description: 'Sterk og tydelig' },
      { name: 'Burgunder', value: '#881337', description: 'Elegant og dyp' },
      { name: 'Oransje', value: '#f97316', description: 'Energisk og positiv' },
    ]
  },
  {
    name: 'Lilla & Rosa',
    description: 'Kreative og moderne farger',
    colors: [
      { name: 'Lilla', value: '#a855f7', description: 'Kreativ og unik' },
      { name: 'Magenta', value: '#d946ef', description: 'Moderne og dristig' },
      { name: 'Rose', value: '#f43f5e', description: 'Myk og feminin' },
      { name: 'Indigo', value: '#6366f1', description: 'Dyp og profesjonell' },
    ]
  },
  {
    name: 'Nøytrale',
    description: 'Tidsriktige og allsidige farger',
    colors: [
      { name: 'Grå', value: '#6b7280', description: 'Klassisk og nøytral' },
      { name: 'Sølv', value: '#9ca3af', description: 'Moderne og elegant' },
      { name: 'Beige', value: '#d4a574', description: 'Varm og naturlig' },
      { name: 'Koksgrå', value: '#374151', description: 'Mørk og sofistikert' },
    ]
  }
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  categories?: ColorCategory[]
  allowCustom?: boolean
  className?: string
}

export default function ColorPicker({ 
  value, 
  onChange, 
  categories = DEFAULT_COLOR_CATEGORIES,
  allowCustom = true,
  className = ""
}: ColorPickerProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Standard'])
  const [customColor, setCustomColor] = useState(value)

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    )
  }

  const handleColorSelect = (color: string) => {
    onChange(color)
    setCustomColor(color)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    onChange(color)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Custom color input */}
      {allowCustom && (
        <div className="space-y-2">
          <Label htmlFor="custom-color" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Egendefinert farge
          </Label>
          <div className="flex gap-3">
            <Input
              id="custom-color"
              type="color"
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="h-10 w-16 cursor-pointer p-1"
            />
            <Input
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              placeholder="#14b8a6"
              className="flex-1 font-mono"
            />
          </div>
        </div>
      )}

      {/* Color categories */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Forhåndsdefinerte farger</Label>
        {categories.map((category) => (
          <Card key={category.name} className="border-border">
            <Collapsible 
              open={expandedCategories.includes(category.name)}
              onOpenChange={() => toggleCategory(category.name)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{category.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {category.description}
                      </CardDescription>
                    </div>
                    {expandedCategories.includes(category.name) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {category.colors.map((color) => (
                      <Button
                        key={color.value}
                        variant={value === color.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleColorSelect(color.value)}
                        className="h-auto p-2 justify-start gap-2"
                      >
                        <div
                          className="w-4 h-4 rounded border border-border flex-shrink-0"
                          style={{ backgroundColor: color.value }}
                        />
                        <div className="text-left">
                          <div className="text-xs font-medium">{color.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {color.value}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Current selection */}
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
        <Label className="text-xs font-medium text-muted-foreground">Nåværende valg:</Label>
        <div
          className="w-4 h-4 rounded border border-border"
          style={{ backgroundColor: value }}
        />
        <Badge variant="secondary" className="font-mono text-xs">
          {value.toUpperCase()}
        </Badge>
      </div>
    </div>
  )
}
