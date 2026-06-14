const RECORD_SECONDS = 10

export default function useSuspiciousMode() {
  async function analyze(streamRef, onCountdown) {
    return new Promise((resolve, reject) => {
      const stream = streamRef.current
      if (!stream) return reject(new Error('No camera stream available'))

      const mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      const chunks = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = reader.result.replace(/^data:.*;base64,/, '')
          try {
            const res = await fetch('http://localhost:3001/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ videoBase64: base64, mimeType }),
            })
            resolve(await res.json())
          } catch (err) {
            reject(err)
          }
        }
        reader.readAsDataURL(blob)
      }

      recorder.start()

      let remaining = RECORD_SECONDS
      onCountdown(remaining)

      const interval = setInterval(() => {
        remaining--
        onCountdown(remaining)
        if (remaining <= 0) {
          clearInterval(interval)
          recorder.stop()
        }
      }, 1000)
    })
  }

  return { analyze }
}
