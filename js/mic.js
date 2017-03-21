

function Mic (_fft) {

    var FFT_SIZE = _fft || 1024;
    var BUFF_SIZE = 16384;
    this.vols = [];
    this.volume = 0;
    var self = this;
    var audioContext = new AudioContext();
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

    window.addEventListener('load', init, false);

    function init () {
      try {
        record(new AudioContext());
      }
      catch (e) {
        console.error(e);
        alert('Web Audio API is not supported in this browser');
      }
    }

    function record (context) {
      navigator.getUserMedia({ audio: true }, sound, error);

      function sound (stream) {
        var analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0.2;
        analyser.fftSize = FFT_SIZE;

        var node = context.createScriptProcessor(FFT_SIZE*2, 1, 1);

        var values = 0;
        var average;
        node.onaudioprocess = function () {
          // bitcount is fftsize / 2
          var array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          self.vol = array;
          self. volume = getRMS(self.vol);
        };

        var input = context.createMediaStreamSource(stream);

        input.connect(analyser);
        analyser.connect(node);
        node.connect(context.destination);
        //input.connect(context.destination); // hello feedback
      }

      function error () {
        console.log(arguments);
      }
    }
    // SOUND UTILITIES
    this.mapVol = function(_me, _total){

      //var new_me = Math.floor(map(_me, 0, _total, 0, 256));
      // HACK TO BECAUSE HIGHER VALUES NEVER HAVE DATA
      var new_me = Math.floor(_me / _total * this.vols.length);
      //console.log(this.vol);
      return self.vols[new_me];
    }

    this.splitVol = function(_me, _total){
      if(self.vol.length>0) {
      var new_vol = [];
      var half_length = Math.ceil(self.vols.length / 2);
      var new_vol2 = self.vols.slice(half_length, self.vols.length);
      for (var i = 0; i < half_length; i++) {
        new_vol.push(self.vols[i]);
      }

      for (var i = 0; i < new_vol2.length; i++) {
        new_vol.push(self.vols[i]);
      }

        var new_me = Math.floor(_me / _total * self.vols.length);

        return new_vol[new_me];
      } else {
        return 0;
      }
    }

    //gets volume
    function getRMS(buffer) {
          var rms = 0;
          for (var i = 0; i < buffer.length; i++) {
            rms += buffer[i] * buffer[i];
          }
          rms /= buffer.length;
          rms = Math.sqrt(rms);
          return rms;
    }

    return this;

  };



var mic = new Mic();
