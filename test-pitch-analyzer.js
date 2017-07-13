const fs = require('fs');
const Promise = require('bluebird');
Promise.promisifyAll(fs);
const WavDecoder = require('wav-decoder');
const Pitchfinder = require('pitchfinder');

const yinDetector = new Pitchfinder.YIN(); // looks like it creates a new pitch-detecting function (use yin for now)
const amdfDetector = new Pitchfinder.AMDF();

const detectors = [yinDetector, amdfDetector];

const detectionConfig = {
  tempo: 120,
  quantization: 8
};

fs.readFileAsync('./amy.wav')
  .then(buffer => {
    return WavDecoder.decode(buffer)
  })
  .then(audioData => {
    const float32Array = audioData.channelData[0];
    const frequencies = Pitchfinder.frequencies(amdfDetector, float32Array, detectionConfig); //returns about 158 frequency readings
    const nonNull = frequencies.reduce((acc, curr) => {
      console.log(curr);
      return acc + (curr === null ? 0 : 1);
    }, 0);
    console.log(nonNull)
    //now write the function that maps each of pitch readings to an object with x and y vals (x = time, y = frequency)
    //we also need to know the time between pitch readings -- bpm/60 * quantization
    const deltaT = 1/((detectionConfig.tempo/60) * detectionConfig.quantization);
    const coords = frequencies.map((currFrequency, index) => {
      return {
        x: index * deltaT,
        y: currFrequency
      }
    });
    console.log(coords);
  })
  .catch(err => console.error('err', err));

