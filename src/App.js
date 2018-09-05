import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'

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
  }

  componentDidMount() {
    this.mic.addListener(({ volume, spectrum }) =>
      window.requestAnimationFrame(() => this.paint(volume, spectrum))
    )
  }

  paint =  (volume, spectrum) => {
    const context = this.canvas.getContext('2d')
    context.clearRect(0, 0, 500, 500)
    context.beginPath()
    context.fillStyle = "red"
    context.ellipse(250, 250, volume * 2, volume * 2, 0, 0, 2  * Math.PI)
    context.stroke()
  }

  clearCanvas = () => {
    const context = this.canvas.getContext('2d')
    context.clearRect(0, 0, 500, 500)
  }

  render() {
    return (
      <div className="App">
        <button onClick={this.clearCanvas}>Clear</button>
        <canvas ref={node => this.canvas = node} width={500} height={500} />
      </div>
    )
  }
}

export default App
