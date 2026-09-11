const fs = require('fs')
const path = require('path')

const pngPath = path.join(__dirname, '../build/icon.png')
const icoPath = path.join(__dirname, '../build/icon.ico')

if (fs.existsSync(pngPath)) {
  const pngBuffer = fs.readFileSync(pngPath)
  const header = Buffer.alloc(22)

  // ICO Header
  header.writeUInt16LE(0, 0) // Reserved
  header.writeUInt16LE(1, 2) // Type 1 = ICO
  header.writeUInt16LE(1, 4) // Count 1 image

  // Icon Directory Entry
  header.writeUInt8(0, 6) // Width 256 (0 means 256)
  header.writeUInt8(0, 7) // Height 256 (0 means 256)
  header.writeUInt8(0, 8) // Palette
  header.writeUInt8(0, 9) // Reserved
  header.writeUInt16LE(1, 10) // Color planes
  header.writeUInt16LE(32, 12) // Bits per pixel
  header.writeUInt32LE(pngBuffer.length, 14) // Size of PNG data
  header.writeUInt32LE(22, 18) // Offset of PNG data

  const icoBuffer = Buffer.concat([header, pngBuffer])
  fs.writeFileSync(icoPath, icoBuffer)
  console.log('Successfully generated build/icon.ico from PNG! Size:', icoBuffer.length)
} else {
  console.error('PNG not found at:', pngPath)
}
