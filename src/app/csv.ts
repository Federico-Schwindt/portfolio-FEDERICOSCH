/** Keep customer text literal when a spreadsheet opens the file. */
function csvCell(value: string) {
  const literal = /^\s*[=+@-]|^[\t\r\n]/.test(value) ? "'" + value : value
  return '"' + literal.replaceAll('"', '""') + '"'
}

export const csvLine = (cells: string[]) => cells.map(csvCell).join(',') + '\r\n'

export function downloadCsv(filename: string, lines: string[]) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', ...lines], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
