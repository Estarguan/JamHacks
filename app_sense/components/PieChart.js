import { View } from 'react-native'
import { Colors } from '../constants/colors'

export default function PieChart({ high = 0, medium = 0, low = 0, size = 220 }) {
  const total = high + medium + low

  if (total === 0) {
    return <View style={{ width: size, height: 20, borderRadius: 10, backgroundColor: Colors.border }} />
  }

  return (
    <View style={{ width: size, height: 20, borderRadius: 10, flexDirection: 'row', overflow: 'hidden' }}>
      {high   > 0 && <View style={{ flex: high,   backgroundColor: Colors.high }} />}
      {medium > 0 && <View style={{ flex: medium, backgroundColor: Colors.medium }} />}
      {low    > 0 && <View style={{ flex: low,    backgroundColor: Colors.low }} />}
    </View>
  )
}
