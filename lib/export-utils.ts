import { ExportFormat } from '@/components/admin/ExportButton'

export interface ExportData {
  headers?: string[]
  rows: any[]
  filename?: string
  title?: string
  metadata?: Record<string, any>
}

export const exportToCSV = (data: ExportData): void => {
  const { headers, rows, filename = 'export' } = data

  let csvContent = ''

  if (headers && headers.length > 0) {
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n'
  } else if (rows.length > 0) {
    csvContent += Object.keys(rows[0]).map(k => `"${k}"`).join(',') + '\n'
  }

  rows.forEach(row => {
    const values = headers
      ? headers.map(h => {
          const value = row[h] ?? ''
          return typeof value === 'string' && value.includes(',')
            ? `"${value.replace(/"/g, '""')}"`
            : value
        })
      : Object.values(row).map(value => {
          const val = value ?? ''
          return typeof val === 'string' && val.includes(',')
            ? `"${val.replace(/"/g, '""')}"`
            : val
        })
    csvContent += values.join(',') + '\n'
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToJSON = (data: ExportData): void => {
  const { rows, filename = 'export', metadata } = data

  const exportObject = metadata
    ? { metadata, data: rows }
    : rows

  const jsonString = JSON.stringify(exportObject, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.json`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToExcel = async (data: ExportData): Promise<void> => {
  const { headers, rows, filename = 'export', title } = data

  try {
    const xlsx = await import('xlsx')

    const worksheet = headers
      ? xlsx.utils.json_to_sheet(rows, { header: headers })
      : xlsx.utils.json_to_sheet(rows)

    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, title || 'Sheet1')

    xlsx.writeFile(workbook, `${filename}.xlsx`)
  } catch (error) {
    console.error('Failed to export to Excel. xlsx library may not be installed:', error)
    exportToCSV(data)
  }
}

export const exportToPDF = async (data: ExportData): Promise<void> => {
  const { headers, rows, filename = 'export', title, metadata } = data

  try {
    const jsPDF = (await import('jspdf')).default
    await import('jspdf-autotable')

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    if (title) {
      doc.setFontSize(18)
      doc.text(title, pageWidth / 2, 20, { align: 'center' })
    }

    if (metadata) {
      let yPosition = title ? 35 : 20
      doc.setFontSize(10)
      Object.entries(metadata).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 14, yPosition)
        yPosition += 6
      })
    }

    const tableHeaders = headers || (rows.length > 0 ? Object.keys(rows[0]) : [])
    const tableRows = rows.map(row =>
      headers
        ? headers.map(h => row[h] ?? '')
        : Object.values(row).map(v => v ?? '')
    )

    ;(doc as any).autoTable({
      head: [tableHeaders],
      body: tableRows,
      startY: title ? (metadata ? 50 : 35) : (metadata ? 35 : 20),
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    })

    doc.save(`${filename}.pdf`)
  } catch (error) {
    console.error('Failed to export to PDF. jspdf library may not be installed:', error)
    exportToCSV(data)
  }
}

export const downloadData = async (
  format: ExportFormat,
  data: ExportData
): Promise<void> => {
  switch (format) {
    case 'csv':
      exportToCSV(data)
      break
    case 'json':
      exportToJSON(data)
      break
    case 'xlsx':
      await exportToExcel(data)
      break
    case 'pdf':
      await exportToPDF(data)
      break
    default:
      console.error(`Unsupported export format: ${format}`)
  }
}

export const prepareTableData = (
  data: any[],
  columns?: Array<{ key: string; label: string }>
): ExportData => {
  if (!columns || columns.length === 0) {
    return {
      headers: data.length > 0 ? Object.keys(data[0]) : [],
      rows: data
    }
  }

  const headers = columns.map(col => col.label)
  const rows = data.map(item => {
    const row: any = {}
    columns.forEach(col => {
      row[col.label] = item[col.key] ?? ''
    })
    return row
  })

  return { headers, rows }
}

export const formatDate = (date: Date | string, format: string = 'yyyy-MM-dd'): string => {
  const d = typeof date === 'string' ? new Date(date) : date

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export const formatNumber = (
  value: number,
  options?: {
    decimals?: number
    prefix?: string
    suffix?: string
    thousandsSeparator?: string
  }
): string => {
  const {
    decimals = 0,
    prefix = '',
    suffix = '',
    thousandsSeparator = ','
  } = options || {}

  const fixed = value.toFixed(decimals)
  const parts = fixed.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)

  return `${prefix}${parts.join('.')}${suffix}`
}