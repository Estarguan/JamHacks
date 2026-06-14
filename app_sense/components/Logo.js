import { View, Text, StyleSheet } from 'react-native'
import LogoMark from './LogoMark'
import { Colors } from '../constants/colors'

export default function Logo({ title }) {
  return (
    <View style={styles.row}>
      <LogoMark size={28} />
      {title ? <Text style={styles.title}>{title}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.black,
  },
})
