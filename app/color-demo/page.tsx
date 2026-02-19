'use client'

import { useState } from 'react'
import ColorPicker, { DEFAULT_COLOR_CATEGORIES, ColorCategory } from '@/components/color-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Palette, Plus, Trash2 } from 'lucide-react'

export default function ColorDemoPage() {
  const [selectedColor, setSelectedColor] = useState('#eab308')
  const [customCategories, setCustomCategories] = useState<ColorCategory[]>([])

  const addCustomCategory = () => {
    const newCategory: ColorCategory = {
      name: `Egendefinert ${customCategories.length + 1}`,
      description: 'Min egendefinerte fargekategori',
      colors: [
        { name: 'Egen farge 1', value: '#ff6b6b' },
        { name: 'Egen farge 2', value: '#4ecdc4' },
        { name: 'Egen farge 3', value: '#45b7d1' },
      ]
    }
    setCustomCategories([...customCategories, newCategory])
  }

  const removeCustomCategory = (index: number) => {
    setCustomCategories(customCategories.filter((_, i) => i !== index))
  }

  const allCategories = [...DEFAULT_COLOR_CATEGORIES, ...customCategories]

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Palette className="h-8 w-8" />
          Fargevelger Demo
        </h1>
        <p className="text-muted-foreground">
          Test den dynamiske fargevelgeren med forhåndsdefinerte kategorier
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Color Picker */}
        <Card>
          <CardHeader>
            <CardTitle>Fargevelger</CardTitle>
            <CardDescription>
              Velg en farge fra de forhåndsdefinerte kategoriene eller legg til egendefinerte farger
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
              categories={allCategories}
            />
          </CardContent>
        </Card>

        {/* Controls and Info */}
        <div className="space-y-6">
          {/* Current Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Nåværende valg</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-lg border-2 border-border shadow-sm"
                  style={{ backgroundColor: selectedColor }}
                />
                <div>
                  <p className="font-mono text-lg font-semibold">{selectedColor.toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground">HEX fargekode</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">RGB</p>
                  <p className="font-mono text-xs">
                    {(() => {
                      const hex = selectedColor.replace('#', '')
                      const r = parseInt(hex.substr(0, 2), 16)
                      const g = parseInt(hex.substr(2, 2), 16)
                      const b = parseInt(hex.substr(4, 2), 16)
                      return `${r}, ${g}, ${b}`
                    })()}
                  </p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">HSL</p>
                  <p className="font-mono text-xs">
                    {(() => {
                      const hex = selectedColor.replace('#', '')
                      const r = parseInt(hex.substr(0, 2), 16) / 255
                      const g = parseInt(hex.substr(2, 2), 16) / 255
                      const b = parseInt(hex.substr(4, 2), 16) / 255
                      
                      const max = Math.max(r, g, b)
                      const min = Math.min(r, g, b)
                      let h = 0, s = 0, l = (max + min) / 2

                      if (max !== min) {
                        const d = max - min
                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
                        switch (max) {
                          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                          case g: h = ((b - r) / d + 2) / 6; break
                          case b: h = ((r - g) / d + 4) / 6; break
                        }
                      }

                      return `${Math.round(h * 360)}°, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`
                    })()}
                  </p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">CSS</p>
                  <p className="font-mono text-xs">{selectedColor}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Categories */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Egendefinerte kategorier</CardTitle>
                  <CardDescription>
                    Legg til dine egne fargekategorier
                  </CardDescription>
                </div>
                <Button onClick={addCustomCategory} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Legg til
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ingen egendefinerte kategorier ennå. Klikk "Legg til" for å opprette en.
                </p>
              ) : (
                <div className="space-y-2">
                  {customCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.colors.length} farger
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomCategory(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories Info */}
          <Card>
            <CardHeader>
              <CardTitle>Tilgjengelige kategorier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {allCategories.map((category, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.colors.length} farger
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
