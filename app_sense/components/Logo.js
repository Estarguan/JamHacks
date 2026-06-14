import { View, Text, StyleSheet } from 'react-native'
import LogoMark from './LogoMark'
import { Colors } from '../constants/colors'
import { Type } from '../constants/typography'

export default function Logo({ title }) {
  return (
    <View style={styles.row}>
      <LogoMark size={28} />
      {title ? <Text style={styles.title}>{title}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...Type.semiheader, color: Colors.black },
})
