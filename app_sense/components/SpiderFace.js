import { useEffect, useRef } from 'react'
import { View, Animated, Easing } from 'react-native'

const LINE_COLORS = [
  'rgba(10,10,10,0.60)',
  'rgba(130,130,130,0.38)',
  'rgba(235,235,235,0.20)',
]

function WebLine({ cx, cy, angleDeg, radius }) {
  const cosA = Math.cos((angleDeg * Math.PI) / 180)
  const sinA = Math.sin((angleDeg * Math.PI) / 180)
  const segLen = radius / 3
  return (
    <>
      {LINE_COLORS.map((color, k) => {
        const midR = (k + 0.5) * segLen
        return (
          <View key={k} style={{
            position: 'absolute',
            width: segLen, height: 1,
            backgroundColor: color,
            left: cx + cosA * midR - segLen / 2,
            top: cy + sinA * midR,
            transform: [{ rotate: `${angleDeg}deg` }],
          }} />
        )
      })}
    </>
  )
}

function WebArc({ cx, cy, r, color }) {
  return (
    <View style={{
      position: 'absolute',
      width: r * 2, height: r * 2,
      borderRadius: r,
      borderWidth: 1,
      borderColor: color,
      left: cx - r, top: cy - r,
      backgroundColor: 'transparent',
    }} />
  )
}

// Spider-Man eye — inner corner is sharp (top-right of untransformed shape),
// outer corner is rounded (top-left). scaleX: -1 mirrors for right eye.
function Eye({ left, lensOpacity, w, h }) {
  return (
    <View style={{ width: w, height: h, transform: [{ scaleX: left ? 1 : -1 }, { scaleY: -1 }, { rotate: '-22deg' }] }}>
      <View style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'black',
        borderTopLeftRadius: h * 0.9,
        borderTopRightRadius: h * 0.08,
        borderBottomLeftRadius: h * 0.08,
        borderBottomRightRadius: h * 0.9,
      }} />
      <Animated.View style={{
        position: 'absolute',
        top: h * 0.14, left: w * 0.13, right: w * 0.08, bottom: h * 0.14,
        backgroundColor: 'white',
        opacity: lensOpacity,
        borderTopLeftRadius: h * 0.72,
        borderTopRightRadius: h * 0.06,
        borderBottomLeftRadius: h * 0.06,
        borderBottomRightRadius: h * 0.72,
      }} />
    </View>
  )
}

export default function SpiderFace({ size = 260 }) {
  const lensOpacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1100),
        Animated.timing(lensOpacity, { toValue: 0, duration: 350, easing: Easing.ease, useNativeDriver: true }),
        Animated.delay(100),
        Animated.timing(lensOpacity, { toValue: 1, duration: 450, easing: Easing.ease, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  const faceW = size
  const faceH = size * 1.05
  const eyeW = size * 0.38
  const eyeH = size * 0.22
  const eyeGap = faceW * 0.03
  const webCX = faceW / 2
  const webCY = faceH * 0.65
  const eyeTop = webCY - eyeH / 2 - 8

  return (
    <View style={{ width: faceW, height: faceH, alignSelf: 'center', marginBottom: 20 }}>

      {/* Web pattern — no background, clipped to face oval */}
      <View style={{
        position: 'absolute', inset: 0,
        borderTopLeftRadius: faceW * 0.50,
        borderTopRightRadius: faceW * 0.50,
        borderBottomLeftRadius: faceW * 0.46,
        borderBottomRightRadius: faceW * 0.46,
        overflow: 'hidden',
      }}>
        {[0.18, 0.36, 0.54, 0.72, 0.90].map((f, i) => {
          const c = Math.round(i * 57)
          const a = (0.60 - i * 0.10).toFixed(2)
          return <WebArc key={f} cx={webCX} cy={webCY} r={faceH * 0.52 * f} color={`rgba(${c},${c},${c},${a})`} />
        })}
        {[-90, -65, -40, -18, 0, 18, 40, 65, 90, 115, 140, 165, 180, 205, 230, 255].map(a => (
          <WebLine key={a} cx={webCX} cy={webCY} angleDeg={a} radius={faceH * 0.72} />
        ))}
      </View>

      {/* Left eye */}
      <View style={{ position: 'absolute', left: faceW / 2 - eyeGap / 2 - eyeW, top: eyeTop }}>
        <Eye left lensOpacity={lensOpacity} w={eyeW} h={eyeH} />
      </View>

      {/* Right eye */}
      <View style={{ position: 'absolute', left: faceW / 2 + eyeGap / 2, top: eyeTop }}>
        <Eye left={false} lensOpacity={lensOpacity} w={eyeW} h={eyeH} />
      </View>
    </View>
  )
}
