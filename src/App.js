import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'
const getRMS = (spectrum = this.spectrum) => {
  let rms = 0
  for (let i = spectrum.length - 1; i > 0; i--) {
    rms += spectrum[i] * spectrum[i]
  }
  rms /= spectrum.length
  rms = Math.sqrt(rms)
  return rms
}
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
class Microphone {
  constructor() {
    this.spectrum = []
    this.volume = 0
    this.context = new AudioContext()
    this.fftSize = 1024
    this.listeners = []

    this.init()
    this.init = this.init.bind(this)
    this.getRMS = this.getRMS.bind(this)
    this.onSound = this.onSound.bind(this)
    this.onError = this.onError.bind(this)
  }

  init = () => {
    navigator.getUserMedia({ audio: true }, this.onSound, this.onError)
  }

  getRMS = (spectrum = this.spectrum) => {
    let rms = 0
    for (let i = spectrum.length - 1; i > 0; i--) {
      rms += spectrum[i] * spectrum[i]
    }
    rms /= spectrum.length
    rms = Math.sqrt(rms)
    return rms
  }

  onSound = stream => {
    const analyser = this.context.createAnalyser()
    analyser.smoothingTimeConstant = 0.4
    analyser.fftSize = this.fftSize

    const node = this.context.createScriptProcessor(this.fftSize * 2, 1, 1)

    node.onaudioprocess = () => {
      this.spectrum = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(this.spectrum)

      this.volume = this.getRMS(this.spectrum)

      if (this.volume > this.peakVolume) {
        this.peakVolume = this.volume
      }
      this.listeners.forEach(listener =>
        listener({ spectrum: this.spectrum, volume: this.volume })
      )
    }

    const input = this.context.createMediaStreamSource(stream)
    input.connect(analyser)
    node.connect(this.context.destination)
  }

  onError = err => {
    console.log('err', err)
  }

  addListener = func => {
    this.listeners.push(func)
  }
}

class App extends Component {
  componentWillMount() {
    this.mic = new Microphone()
    this.count = 0
  }

  componentDidMount() {
    this.mic.addListener(({ volume, spectrum }) =>
      window.requestAnimationFrame(() => this.paint(volume, spectrum))
    )
  }

  paint =  (volume, spectrum) => {
    const context = this.canvas.getContext('2d')
    const spectrumSize = Math.floor(spectrum.length / 3)
    const spectrum1 = spectrum.slice(0, spectrumSize)
    const spectrum2 = spectrum.slice(spectrumSize, spectrumSize * 2)
    const spectrum3 = spectrum.slice(spectrumSize * 2, spectrum.length)

    const volume1 = getRMS(spectrum1)
    const volume2 = getRMS(spectrum2)
    const volume3 = getRMS(spectrum3)

    context.lineWidth = 10
    if (volume < 45) {
      context.clearRect(0, 0, 1000, 1000)
    }

    const lowFreqLine = (coords) => {
      context.beginPath()
      context.strokeStyle = (this.count % 2 === 0) ? "black" : "red"
      context.ellipse(coords[0], coords[1], volume1 * 2, volume1 * 2, 0, 0, 2  * Math.PI)
      context.stroke()
    }

    const midFreqLine = (coords) => {
      context.beginPath()
      context.strokeStyle = (this.count % 2 === 0) ? "black" : "white"
      context.ellipse(coords[0], coords[1], volume2 * 2, volume2 * 2, 0, 0, 2  * Math.PI)
      context.stroke()
    }

    const highFreqLine = (coords) => {
      context.beginPath()
      context.strokeStyle = (this.count % 2 === 0) ? "black" : "blue"
      context.ellipse(coords[0], coords[1], volume3 * 2, volume3 * 2, 0, 0, 2  * Math.PI)
      context.stroke()
    }

    for (let i = 0; i < 2; i++) {
      midFreqLine([getRandomInt(0, 1000), getRandomInt(0, 1000)])
    }

    lowFreqLine([500, 250])

    midFreqLine([250, 250])

    highFreqLine([750, 250])



    this.count ++
  }

  clearCanvas = () => {
    const context = this.canvas.getContext('2d')
    context.clearRect(0, 0, 1000, 1000)
  }

  render() {
    return (
      <div className="App">
        <button onClick={this.clearCanvas}>Clear</button>
        <canvas ref={node => this.canvas = node} width={1000} height={1000} />
      </div>
    )
  }
}

export default App
