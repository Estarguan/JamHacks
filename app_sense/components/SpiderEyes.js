import { useEffect, useState } from 'react'
import { View } from 'react-native'

function Eye({ flip, eyeColor }) {
  return (
    <View style={{
      width: 100,
      height: 66,
      transform: [{ scaleX: flip ? -1 : 1 }, { rotate: '-28deg' }],
    }}>
      <View style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'black',
        borderTopLeftRadius: 60,
        borderTopRightRadius: 14,
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 60,
      }} />
      <View style={{
        position: 'absolute',
        top: 10,
        left: 16,
        right: 10,
        bottom: 10,
        backgroundColor: eyeColor,
        borderTopLeftRadius: 44,
        borderTopRightRadius: 10,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 44,
      }} />
    </View>
  )
}

export default function SpiderEyes({ width = 280 }) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setOpen(o => !o), 400)
    return () => clearInterval(id)
  }, [])

  return (
    <View style={{ width, height: 80, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 28, transform: [{ scaleY: -1 }] }}>
      <Eye flip={false} eyeColor={open ? 'white' : 'black'} />
      <Eye flip={true}  eyeColor={open ? 'white' : 'black'} />
    </View>
  )
}
