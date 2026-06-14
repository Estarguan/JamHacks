import { View } from 'react-native'
import { Colors } from '../constants/colors'

// Matches the SVG exactly (viewBox 0 0 19 19)
const OUTER_CIRCLES = [
  { x: 9.28, y: 2.74 },   // top
  { x: 2.74, y: 9.28 },   // left
  { x: 5.63, y: 15.96 },  // bottom-left
  { x: 12.97, y: 15.96 }, // bottom-right
  { x: 15.83, y: 9.28 },  // right
]
const CENTER = { x: 9.28, y: 9.28 }

function Line({ x1, y1, x2, y2 }) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  return (
    <View style={{
      position: 'absolute',
      width: length,
      height: 1.5,
      backgroundColor: Colors.blue,
      left: (x1 + x2) / 2 - length / 2,
      top: (y1 + y2) / 2 - 0.75,
      transform: [{ rotate: `${angle}deg` }],
    }} />
  )
}

export default function LogoMark({ size = 240 }) {
  const sc = size / 19
  const cx = CENTER.x * sc
  const cy = CENTER.y * sc
  const centerR = 2.45 * sc
  const outerR = 2.60 * sc

  const scaled = OUTER_CIRCLES.map(c => ({ x: c.x * sc, y: c.y * sc }))

  return (
    <View style={{ width: size, height: size }}>
      {scaled.map((c, i) => (
        <Line key={i} x1={cx} y1={cy} x2={c.x} y2={c.y} />
      ))}
      {scaled.map((c, i) => (
        <View key={i} style={{
          position: 'absolute',
          width: outerR * 2,
          height: outerR * 2,
          borderRadius: outerR,
          borderWidth: Math.max(1, sc * 0.28),
          borderColor: Colors.blue,
          backgroundColor: Colors.white,
          left: c.x - outerR,
          top: c.y - outerR,
        }} />
      ))}
      <View style={{
        position: 'absolute',
        width: centerR * 2,
        height: centerR * 2,
        borderRadius: centerR,
        backgroundColor: Colors.blue,
        left: cx - centerR,
        top: cy - centerR,
      }} />
    </View>
  )
}
