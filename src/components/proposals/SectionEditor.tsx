import { useRef, useEffect } from 'react'
import { GripVertical, Trash2, Plus } from 'lucide-react'
import { useDrag, useDrop } from 'react-dnd'
import type { ProposalSection, ProposalLineItem } from '@/types/proposal'
import { nanoid } from 'nanoid'

interface SectionEditorProps {
  section: ProposalSection
  index: number
  onUpdate: (updates: Partial<ProposalSection>) => void
  onRemove: () => void
  onMove: (dragIndex: number, hoverIndex: number) => void
}

export default function SectionEditor({
  section,
  index,
  onUpdate,
  onRemove,
  onMove,
}: SectionEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: 'section',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'section',
    hover: (item: { index: number }, monitor) => {
      if (!ref.current) return

      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) return

      const hoverBoundingRect = ref.current.getBoundingClientRect()
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return

      onMove(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })

  // Attach drag and drop refs
  useEffect(() => {
    drag(drop(ref))
  }, [drag, drop])

  const addLineItem = () => {
    onUpdate({
      items: [
        ...section.items,
        {
          id: nanoid(),
          description: '',
          quantity: 1,
          rateCents: 0,
          totalCents: 0,
        },
      ],
    })
  }

  const updateLineItem = (
    itemId: string,
    field: keyof ProposalLineItem,
    value: string | number
  ) => {
    onUpdate({
      items: section.items.map((item) => {
        if (item.id !== itemId) return item

        const updated = { ...item, [field]: value }

        if (field === 'quantity' || field === 'rateCents') {
          const qty = field === 'quantity' ? (value as number) : item.quantity
          const rate =
            field === 'rateCents' ? (value as number) : item.rateCents
          updated.totalCents = qty * rate
        }

        return updated
      }),
    })
  }

  const removeLineItem = (itemId: string) => {
    onUpdate({
      items: section.items.filter((item) => item.id !== itemId),
    })
  }

  return (
    <div
      ref={ref}
      className={`border border-gray-200 rounded-lg bg-white ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-2">
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-3">
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Section title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
          />
          <textarea
            value={section.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Section description (optional)"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />

          {/* Line Items */}
          {section.items.length > 0 && (
            <div className="space-y-2">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 bg-gray-50 p-2 rounded"
                >
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(item.id, 'description', e.target.value)
                    }
                    placeholder="Item description"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(
                        item.id,
                        'quantity',
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="Qty"
                    min="0"
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                  />
                  <span className="text-gray-500 text-sm">×</span>
                  <input
                    type="number"
                    value={item.rateCents / 100}
                    onChange={(e) =>
                      updateLineItem(
                        item.id,
                        'rateCents',
                        Math.round((parseFloat(e.target.value) || 0) * 100)
                      )
                    }
                    placeholder="Rate"
                    min="0"
                    step="0.01"
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                  />
                  <span className="text-sm font-medium text-gray-900 w-24 text-right">
                    ${(item.totalCents / 100).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeLineItem(item.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addLineItem}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Line Item
          </button>
        </div>

        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 mt-2"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
