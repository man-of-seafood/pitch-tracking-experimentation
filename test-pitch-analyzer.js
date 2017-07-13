const Promise = require('bluebird');
const fs = require('fs');
Promise.promisifyAll(fs);
const WavDecoder = require('wav-decoder');
const Pitchfinder = require('pitchfinder');

const yinDetector = new Pitchfinder.YIN(); // looks like it creates a new pitch-detecting function (use yin for now)
const amdfDetector = new Pitchfinder.AMDF();

const detectors = [yinDetector, amdfDetector];

const detectionConfig = {
  tempo: 1200,
  quantization: 8
};

fs.readFileAsync('./short-sound-im-amy.wav')
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
    console.log('total length:', frequencies.length);
    console.log('non-null', nonNull);
    console.log('ratio:', nonNull/frequencies.length);
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
/*
General idea for smoothing: Make a note of the last known coordinate, then run until there's another valid coordinate, calcuate the pitch change/time change,
yielding the number of hz that each node in between should be incremented by.

make a note of the start and end points of null runs 
then iterate over those portions specifically
however -- if the start is a null run or the end is a null run, then you're going to want to make all of those coords have the same value since nothing can be inferred
unless you look at the slope of a series of the next 3/4 coords, but then you're basically starting to make your own smoothing algo

another consideration: nulls could just be from silence -- see if the ranges map up

or 
remove all the coordinates up until the point we have a minimum of X consecutive non-null entries (like we know we're on the right track)
*/