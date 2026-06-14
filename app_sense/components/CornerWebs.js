import { View } from 'react-native'

const SIZE = 160
const MAX_R = SIZE * 1.1
const OPACITY = 0.07
const SEGS = 4
const SEG_LEN = MAX_R / SEGS

function WebLine({ cx, cy, angleDeg }) {
  const cosA = Math.cos(angleDeg * Math.PI / 180)
  const sinA = Math.sin(angleDeg * Math.PI / 180)
  return (
    <>
      {Array.from({ length: SEGS }, (_, k) => {
        const midR = (k + 0.5) * SEG_LEN
        return (
          <View key={k} style={{
            position: 'absolute',
            width: SEG_LEN,
            height: 1,
            backgroundColor: '#000',
            left: cx + cosA * midR - SEG_LEN / 2,
            top:  cy + sinA * midR,
            transform: [{ rotate: `${angleDeg}deg` }],
          }} />
        )
      })}
    </>
  )
}

function WebArc({ cx, cy, r }) {
  return (
    <View style={{
      position: 'absolute',
      width: r * 2, height: r * 2,
      borderRadius: r,
      borderWidth: 1,
      borderColor: '#000',
      left: cx - r, top: cy - r,
      backgroundColor: 'transparent',
    }} />
  )
}

const ARCS = [0.22, 0.44, 0.66, 0.88, 1.10].map(f => MAX_R * f)

const CORNERS = [
  { key: 'tl', pos: { top: 0,    left: 0    }, cx: 0,    cy: 0,    angles: [0, 15, 30, 45, 60, 75, 90] },
  { key: 'tr', pos: { top: 0,    right: 0   }, cx: SIZE, cy: 0,    angles: [90, 105, 120, 135, 150, 165, 180] },
  { key: 'bl', pos: { bottom: 0, left: 0    }, cx: 0,    cy: SIZE, angles: [-90, -75, -60, -45, -30, -15, 0] },
  { key: 'br', pos: { bottom: 0, right: 0   }, cx: SIZE, cy: SIZE, angles: [180, 195, 210, 225, 240, 255, 270] },
]

export default function CornerWebs() {
  return (
    <>
      {CORNERS.map(({ key, pos, cx, cy, angles }) => (
        <View
          key={key}
          pointerEvents="none"
          style={{ position: 'absolute', width: SIZE, height: SIZE, overflow: 'hidden', opacity: OPACITY, ...pos }}
        >
          {ARCS.map(r => <WebArc key={r} cx={cx} cy={cy} r={r} />)}
          {angles.map(a => <WebLine key={a} cx={cx} cy={cy} angleDeg={a} />)}
        </View>
      ))}
    </>
  )
}
