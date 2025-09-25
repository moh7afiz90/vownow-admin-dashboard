'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Save, Star, Trash2, Edit3, Plus, BookOpen, Clock } from 'lucide-react'

export interface FilterPreset {
  id: string
  name: string
  description?: string
  filters: Record<string, any>
  isDefault?: boolean
  isFavorite?: boolean
  createdAt?: Date
  lastUsed?: Date
  useCount?: number
  category?: string
}

export interface FilterPresetsProps {
  presets: FilterPreset[]
  currentFilters: Record<string, any>
  onApplyPreset: (preset: FilterPreset) => void
  onSavePreset?: (name: string, description?: string, category?: string) => void
  onUpdatePreset?: (preset: FilterPreset) => void
  onDeletePreset?: (presetId: string) => void
  onToggleFavorite?: (presetId: string) => void
  canSave?: boolean
  canEdit?: boolean
  canDelete?: boolean
  showUsageStats?: boolean
  groupByCategory?: boolean
  maxPresets?: number
  className?: string
}

export const FilterPresets: React.FC<FilterPresetsProps> = ({
  presets,
  currentFilters,
  onApplyPreset,
  onSavePreset,
  onUpdatePreset,
  onDeletePreset,
  onToggleFavorite,
  canSave = true,
  canEdit = true,
  canDelete = true,
  showUsageStats = true,
  groupByCategory = true,
  maxPresets,
  className = ''
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [editingPreset, setEditingPreset] = useState<FilterPreset | null>(null)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetDescription, setNewPresetDescription] = useState('')
  const [newPresetCategory, setNewPresetCategory] = useState('')

  // Check if current filters match any preset
  const matchingPreset = useMemo(() => {
    return presets.find(preset =>
      JSON.stringify(preset.filters) === JSON.stringify(currentFilters)
    )
  }, [presets, currentFilters])

  // Group presets by category
  const groupedPresets = useMemo(() => {
    if (!groupByCategory) {
      return { 'All Presets': presets }
    }

    const groups: Record<string, FilterPreset[]> = {}

    // Add favorites first if they exist
    const favorites = presets.filter(p => p.isFavorite)
    if (favorites.length > 0) {
      groups['Favorites'] = favorites
    }

    // Add default presets
    const defaults = presets.filter(p => p.isDefault && !p.isFavorite)
    if (defaults.length > 0) {
      groups['Default'] = defaults
    }

    // Group by category
    presets.forEach(preset => {
      if (preset.isFavorite || preset.isDefault) return // Already handled above

      const category = preset.category || 'Custom'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(preset)
    })

    return groups
  }, [presets, groupByCategory])

  // Sort presets within groups
  const sortedGroups = useMemo(() => {
    const sorted: Record<string, FilterPreset[]> = {}

    Object.entries(groupedPresets).forEach(([category, presetList]) => {
      sorted[category] = presetList.sort((a, b) => {
        // Sort by usage count (descending) then by last used (most recent first)
        if (showUsageStats && a.useCount !== b.useCount) {
          return (b.useCount || 0) - (a.useCount || 0)
        }

        if (a.lastUsed && b.lastUsed) {
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        }

        return a.name.localeCompare(b.name)
      })
    })

    return sorted
  }, [groupedPresets, showUsageStats])

  const handleSavePreset = useCallback(() => {
    if (!onSavePreset || !newPresetName.trim()) return

    onSavePreset(newPresetName.trim(), newPresetDescription.trim() || undefined, newPresetCategory.trim() || undefined)
    setNewPresetName('')
    setNewPresetDescription('')
    setNewPresetCategory('')
    setShowSaveModal(false)
  }, [onSavePreset, newPresetName, newPresetDescription, newPresetCategory])

  const handleUpdatePreset = useCallback(() => {
    if (!onUpdatePreset || !editingPreset) return

    const updatedPreset = {
      ...editingPreset,
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
      category: newPresetCategory.trim() || undefined
    }

    onUpdatePreset(updatedPreset)
    setEditingPreset(null)
    setNewPresetName('')
    setNewPresetDescription('')
    setNewPresetCategory('')
  }, [onUpdatePreset, editingPreset, newPresetName, newPresetDescription, newPresetCategory])

  const startEdit = useCallback((preset: FilterPreset) => {
    setEditingPreset(preset)
    setNewPresetName(preset.name)
    setNewPresetDescription(preset.description || '')
    setNewPresetCategory(preset.category || '')
  }, [])

  const hasActiveFilters = useMemo(() => {
    return Object.keys(currentFilters).some(key => {
      const value = currentFilters[key]
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && value !== null && value !== ''
    })
  }, [currentFilters])

  const canSaveCurrentFilters = canSave && hasActiveFilters && !matchingPreset &&
    (!maxPresets || presets.length < maxPresets)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Filter Presets
          </h3>
        </div>

        {canSaveCurrentFilters && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Save Current
          </button>
        )}
      </div>

      {/* Current filter status */}
      {hasActiveFilters && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800 dark:text-blue-300">
              {matchingPreset ? (
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Using preset: <strong>{matchingPreset.name}</strong>
                </span>
              ) : (
                'Custom filters active'
              )}
            </div>

            {canSaveCurrentFilters && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preset groups */}
      <div className="space-y-4">
        {Object.keys(sortedGroups).length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No presets available</p>
            <p className="text-sm">Save your first filter combination to get started</p>
          </div>
        ) : (
          Object.entries(sortedGroups).map(([category, categoryPresets]) => (
            <div key={category}>
              {/* Category header */}
              {groupByCategory && Object.keys(sortedGroups).length > 1 && (
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                  {category}
                </h4>
              )}

              {/* Preset cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className={`
                      p-4 border rounded-lg transition-all duration-200
                      ${matchingPreset?.id === preset.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                      hover:shadow-md cursor-pointer group
                    `}
                    onClick={() => onApplyPreset(preset)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {preset.isFavorite && (
                          <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                        {preset.isDefault && (
                          <div className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded">
                            Default
                          </div>
                        )}
                        <h5 className="font-medium text-gray-900 dark:text-white truncate">
                          {preset.name}
                        </h5>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onToggleFavorite && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleFavorite(preset.id)
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            title={preset.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star className={`w-4 h-4 ${preset.isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                          </button>
                        )}

                        {canEdit && onUpdatePreset && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              startEdit(preset)
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Edit preset"
                          >
                            <Edit3 className="w-4 h-4 text-gray-400" />
                          </button>
                        )}

                        {canDelete && onDeletePreset && !preset.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeletePreset(preset.id)
                            }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete preset"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {preset.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {preset.description}
                      </p>
                    )}

                    {/* Stats */}
                    {showUsageStats && (preset.useCount || preset.lastUsed) && (
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {preset.useCount && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Used {preset.useCount} time{preset.useCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {preset.lastUsed && (
                          <span>
                            Last used: {new Date(preset.lastUsed).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save preset modal */}
      {(showSaveModal || editingPreset) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingPreset ? 'Edit Preset' : 'Save Filter Preset'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="preset-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    id="preset-name"
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Enter preset name..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="preset-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="preset-description"
                    value={newPresetDescription}
                    onChange={(e) => setNewPresetDescription(e.target.value)}
                    placeholder="Describe this filter combination..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="preset-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    id="preset-category"
                    type="text"
                    value={newPresetCategory}
                    onChange={(e) => setNewPresetCategory(e.target.value)}
                    placeholder="e.g. Reports, Analytics..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaveModal(false)
                    setEditingPreset(null)
                    setNewPresetName('')
                    setNewPresetDescription('')
                    setNewPresetCategory('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingPreset ? handleUpdatePreset : handleSavePreset}
                  disabled={!newPresetName.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingPreset ? 'Update' : 'Save'} Preset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}