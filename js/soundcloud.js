var Sound;

var soundCloud = function(_fft_size) {

  // setup the player
  var body = document.querySelector('body');
  var client_id = "a02d202ac1397c777070cd10fbe015c5"; // to get an ID go to http://developers.soundcloud.com/


  var audioCtx;
  var audioElement;
  this.analyser;
  this.source;
  this.streamData;
  this.sound = {};
  this.freqs = [];
  this.fft_size = _fft_size || 256;
  var self = this;
  var player;

  // UI stuff

  var audioplayer, trackImageLink, trackImage, trackInfo, artistInfo, container, playButton, timeline, playhead, playtime, soundcloudLogo;

  loadScript('http://connect.soundcloud.com/sdk.js', init)

  var genres = ["slomo", "deeptechno", "ebm", "disco", "deepdisco", "indiedisco", "slomodisco", "slomohouse", "downtempotechno", "downtempo", "deepness", "pixies", "lowmotion", "plastikman", "minimalhouse", "acidhouse", "cosmic", "cosmicdisco", "ambient", "vapourwave"];

  // SETUP AUDICONTEXT INSTANCE
  function init(){
    player = createAudioElement('player', self.fft_size);
  }

  function createAudioElement(audio_name, _fft_size){

    audioElement = document.createElement('audio');
    audioElement.setAttribute("id", audio_name);
    body.appendChild(audioElement);
    audioElement.width = window.innerWidth;
    audioElement.height = window.innerHeight;

    setupPlayer(audioElement, _fft_size);
    createPlayerUI(audioElement);
    return audioElement;

  }

  function setupPlayer(audioElement, _fft_size){

    var audioCtxCheck = window.AudioContext || window.webkitAudioContext;

    if (!audioCtxCheck) {
      alert("Audio context error");
    } else {
      var song_type = getGenre();
      audioCtx = new (window.AudioContext || window.webkitAudioContext);
      analyser = audioCtx.createAnalyser();
      console.log("FFT Size:" + _fft_size);
      analyser.fftSize = _fft_size;
      analyser.smoothingTimeConstant = 0.3;
      source = audioCtx.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      streamData = new Uint8Array(analyser.frequencyBinCount);
      audioLooper();

    }

  }

  function audioLooper(){
    window.requestAnimationFrame(audioLooper);
    analyser.getByteFrequencyData(streamData);
    //console.log(streamData.length);
    self.freqs = streamData.slice(0,streamData.length/2);
  }

  function playStream(streamUrl) {
      // Get the input stream from the audio element
      player.addEventListener('ended', function(){
            console.log('end track.')
      });
      player.crossOrigin = 'anonymous';
      player.setAttribute('src', streamUrl);
      player.play();
  }

  // update the track and artist into in the controlPanel
  function populateUI() {

      artistLink = document.createElement('a');
      artistLink.setAttribute('href', this.sound.user.permalink_url);
      artistLink.innerHTML = this.sound.user.username;
      trackLink = document.createElement('a');
      trackLink.setAttribute('href', this.sound.permalink_url);

      if(this.sound.kind=="playlist"){
          trackLink.innerHTML = "<p>" + this.sound.tracks[loader.streamPlaylistIndex].title + "</p>" + "<p>"+loader.sound.title+"</p>";
      } else {
        trackLink.innerHTML = this.sound.title;
      }

      //console.log(this.sound);
      // if no track artwork, use user's avatar.
      var image = this.sound.artwork_url ? this.sound.artwork_url :this.sound.user.avatar_url;
        trackImage.setAttribute('src', image);
        trackImageLink.setAttribute('href', this.sound.permalink_url);
        artistInfo.innerHTML = '';
        artistInfo.appendChild(artistLink);

        trackInfo.innerHTML = '';
        trackInfo.appendChild(trackLink);

        // add a hash to the URL so it can be shared or saved
        var trackToken = this.sound.permalink_url.substr(22);

    };

  function loadAndUpdate(genre) {
      loadStream(genre,
        function() {
          playStream(self.streamUrl());
          populateUI();
        }, function(){});
  };

  function createPlayerUI(audioElement) {

      audioplayer = document.createElement('div');
      audioplayer.setAttribute("id", "audioplayer");
      audioplayer.setAttribute("class", "wrapper");

      trackImageLink = document.createElement('a');
      trackImageLink.setAttribute("id", "trackImageLink");
      audioplayer.appendChild(trackImageLink);

      trackImage = document.createElement('img');
      trackImage.setAttribute("id", "trackImage");
      trackImageLink.appendChild(trackImage);

      trackInfo = document.createElement('div');
      trackInfo.setAttribute("id", "trackInfo");
      audioplayer.appendChild(trackInfo);

      artistInfo = document.createElement('div');
      artistInfo.setAttribute("id", "artistInfo");
      audioplayer.appendChild(artistInfo);

      container = document.createElement('div');
      container.setAttribute("id", "audiocontainer");
      audioplayer.appendChild(container);

      playButton = document.createElement('div');
      playButton.setAttribute("id", "playButton");
      playButton.setAttribute("class", "pause");
      container.appendChild(playButton);

      timeline = document.createElement('div');
      timeline.setAttribute("id", "timeline");
      container.appendChild(timeline);

      playhead = document.createElement('div');
      playhead.setAttribute("id", "playhead");
      timeline.appendChild(playhead);

      playtime = document.createElement('span');
      playtime.setAttribute("id", "playtime");
      timeline.appendChild(playtime);

      soundcloudLogo = document.createElement('img');
      soundcloudLogo.setAttribute("id", "soundcloudLogo");
      soundcloudLogo.setAttribute("src", "http://developers.soundcloud.com/assets/logo_black.png");
      audioplayer.appendChild(soundcloudLogo);

      body.appendChild(audioplayer);

      playButton.addEventListener("click", playStop);
      timelineWidth = timeline.offsetWidth - playhead.offsetWidth;

      // Gets audio file duration
      audioElement.addEventListener("canplaythrough",
        function () {
        duration = audioElement.duration;
        audioElement.addEventListener("timeupdate", timeUpdate, false);
      }, false);

      //Makes timeline clickable
      timeline.addEventListener("click", function (event) {
        moveplayhead(event);
        player.currentTime = audioElement.duration * clickPercent(event);
      }, false);

      function playStop() {

        if (audioElement.paused) {
          console.log("play");
          audioElement.play();
          playButton.className = "";
          playButton.className = "pause";
        } else {
          console.log("pause");
          audioElement.pause();
          playButton.className = "";
          playButton.className = "play";
        }

      }

      function timeUpdate() {
        var playPercent = 100 * (player.currentTime / audioElement.duration);
        playhead.style.marginLeft = playPercent + "%";
        playtime.innerHTML = convertTime(Math.floor(player.currentTime)) + "/" + convertTime(Math.floor(audioElement.duration));
      }

      // PLAYER UTILITIES
      function clickPercent(e) {
        return (e.pageX - this.timeline.offsetLeft) / timelineWidth;
      }

      function moveplayhead(e) {
          var newMargLeft = e.pageX - this.timeline.offsetLeft;
          if (newMargLeft >= 0 && newMargLeft <= timelineWidth) {
              playhead.style.marginLeft = newMargLeft + "px";
          }
          if (newMargLeft < 0) {
              playhead.style.marginLeft = "0px";
          }
          if (newMargLeft > timelineWidth) {
              playhead.style.marginLeft = timelineWidth + "px";
          }
      }

      function convertTime(totalSec){
        var hours = parseInt( totalSec / 3600 ) % 24;
        var minutes = parseInt( totalSec / 60 ) % 60;
        var seconds = totalSec % 60;
        return (hours > 0 ? (hours < 10 ? "0" + hours : hours)+ ":" : "") + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);
      }

      return this;

  } // createPlayerUI

  function loadStream(genre, successCallback, errorCallback) {

      if (SC != undefined) {

        SC.initialize({ client_id: client_id });

        // load a specific track
        if (genre.charAt(0) == "!") {

            song_type = genre.substring(1);
            var call = { track: genre }
            console.log("track: " + genre);

            SC.get('/tracks/', {genres: genre} , function(tracks) {

            console.log("tracks: " + tracks);

            if (tracks.errors) {

              this.errorMessage = "";

              for (var i = 0; i < tracks.errors.length; i++) {
                  this.errorMessage += tracks.errors[i].error_message + '<br>';
              }

              this.errorMessage += 'Make sure the URL has the correct format: https://soundcloud.com/user/title-of-the-track';
                errorCallback();

            } else {

              sound = tracks;
              this.sound = sound;
              this.streamUrl = function(){ return sound.stream_url + '?client_id=' + this.client_id; };
              successCallback();

            }

          }); // END GENRE CALL

        // load tags
        } else {

          console.log("Genre: " + genre);
          var call = {genres: genre }

          // get tracks from soundcloud
          SC.get('/tracks', { genres: genre, limit: 100 }, function(tracks) {

            if (tracks.errors) {
                self.errorMessage = "";
                for (var i = 0; i < tracks.errors.length; i++) {
                    self.errorMessage += tracks.errors[i].error_message + '<br>';
                }
                self.errorMessage += 'Make sure the URL has the correct format: https://soundcloud.com/user/title-of-the-track';
                errorCallback();

            } else {
                randomTrack = Math.floor(Math.random()*(tracks.length-1));
                console.log("Play track: " + randomTrack + "/"+ tracks.length);
                sound = tracks[randomTrack];
                //console.log(sound);
                self.sound = sound;
                self.streamUrl = function(){ return sound.stream_url + '?client_id=' + client_id; };
                successCallback();
            }

          }); // end track get

        }

      }

    };

  // SOUND UTILITIES

  this.mapSound = function(_me, _total){
        //console.log(self.freqs.length);
        //var new_me = Math.floor(map(_me, 0, _total, 0, 256));
        // HACK TO BECAUSE HIGHER VALUES NEVER HAVE DATA
        var new_me = Math.floor(_me / _total * self.freqs.length);
        return self.freqs[new_me];
      }

  this.getVolume = function () {
    return this.getRMS(self.freqs);
  }

  this.getRMS = function (freq) {
        var rms = 0;
        for (var i = 0; i < freq.length; i++) {
          rms += freq[i] * freq[i];
        }
        rms /= freq.length;
        rms = Math.sqrt(rms);
        return rms;
  }

  //highs: 0 - 1/3
  //mids: 1/3 - 2/3
  //bass: 2/3 - 1

  this.highsFFT = function(){
        var start = 0;
        var end = Math.round(self.freqs.length/3);
        var highs = self.freqs.slice(start, end);
        return highs;
  }

  this.midsFFT = function(){
        var start =  Math.round(self.freqs.length/3);
        var end = Math.round(self.freqs.length * 2/3);
        var mids = self.freqs.slice(start, end);
        return mids;
  }

  this.bassFFT = function(){
        var start =  Math.round(self.freqs.length * 2/3);
        var end = self.freqs.length;
        var bass = self.freqs.slice(start, end);
        return bass;
  }


  this.getBass = function(){
        var bass =  this.bassFFT();
        return this.getRMS(bass);
      }

  this.getMids = function(){
        var mids =  this.midsFFT();
        return this.getRMS(mids);
  }

  this.getHighs = function(){
        var highs =  this.highsFFT();
        return this.getRMS(highs);
  }


  // On load, check to see if there is a track name/genre in the URL

  function getGenre(){

        if (window.location.hash) {
          var genre = window.location.hash.substr(1);
          loadAndUpdate(genre);
        } else {
          var genre = genres[randomInt(genres.length-1)];
          location.hash = "#" + genre;
          loadAndUpdate(genre);
        }

      }

  return this;

} // END SOUNDCLOUD


// loadscript utility

function loadScript(url, callback)
{
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}

window.addEventListener('load', init, false )
// autorun

function init(){
  sound = new soundCloud();
}
