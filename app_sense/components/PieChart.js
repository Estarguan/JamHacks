import { View } from 'react-native'
import { Colors } from '../constants/colors'

// Draws each segment as many thin radial spokes (pure RN, no SVG needed)
export default function PieChart({ high = 0, medium = 0, low = 0, size = 220 }) {
  const total = high + medium + low

  if (total === 0) {
    return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E5E7EB' }} />
  }

  const r = size / 2
  const cy = r
  const spokeWidth = 4  // px height of each radial spoke
  const step = 2        // degrees per spoke

  const segments = [
    { color: Colors.high, count: high },
    { color: Colors.medium, count: medium },
    { color: Colors.low, count: low },
  ]

  const spokes = []
  let angle = -90 // start from top

  for (const seg of segments) {
    if (seg.count === 0) continue
    const sweep = (seg.count / total) * 360
    for (let a = angle; a < angle + sweep; a += step) {
      spokes.push({ color: seg.color, angle: a })
    }
    angle += sweep
  }

  return (
    <View style={{ width: size, height: size, borderRadius: r, overflow: 'hidden' }}>
      {spokes.map((s, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: spokeWidth,
            left: 0,
            top: cy - spokeWidth / 2,
            transform: [{ rotate: `${s.angle}deg` }],
          }}
        >
          <View style={{
            position: 'absolute',
            right: 0,
            width: r,
            height: spokeWidth,
            backgroundColor: s.color,
          }} />
        </View>
      ))}
    </View>
  )
}
