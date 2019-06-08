'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.raw({ type:'*/*',limit:'512mb',extended: true }));

app.get('/match/:token/:fragment_number/:frametype', function (req, res) {
  console.log('Fragment request for',req.params.fragment_number)
  res.setHeader('Content-Type', 'application/octet-stream')
  var p = Buffer.alloc(16, 0, 'binary');
  if (req.params.frametype == 'start') {
    p = matches[req.params.token].start[req.params.fragment_number]
  }
  if (req.params.frametype == 'delta') {
    p = matches[req.params.token].delta[req.params.fragment_number]
  }
  if (req.params.frametype == 'full') {
    p = matches[req.params.token].full[req.params.fragment_number]
  }
  if (!p) {
    //console.log(p)
    res.send(404);
  }
  else {
    //console.log(p)
    res.write(p, 'binary');
    res.end(null, 'binary');
  }
})

app.get('/match/:token/sync', function (req, res) {
  console.log("match sync!")
  const r = {
    tick: parseInt(matches[req.params.token].sync.tick),
    rtdelay: 1,
    rcvage: 1,
    fragment: parseInt(matches[req.params.token].sync.fragment) - 5,
    signup_fragment: matches[req.params.token].sync.signup_fragment,
    tps: matches[req.params.token].sync.tps,
    protocol: matches[req.params.token].sync.protocol
  }
  //console.log(r)
  res.send(r);
})

//  playcast "http://586f7685.ngrok.io/match/s85568392920768736t1477086968"
app.post('/reset/:token/', (req, res) => {
  res.send("ACK");
  matches[req.params.token].sync.signup_fragment = null;
})

var matches = {};
app.post('/:token/:fragment_number/:frametype', function (req, res) {
  //console.log(req.body)
  if (!
    matches[req.params.token]) {
    matches[req.params.token] = {
      sync: {
        frag: 0,
        tick: 0,
        signup_fragment: 0,
        tps: 32,
        protocol: 4
      },
      start: {},
      delta: {},
      full: {},
    }
  }
  console.log(`Fragment token : ${req.params.token}, type : ${req.params.frametype},number : ${req.params.fragment_number}, tick : ${req.query.tick}`);
  if (req.params.frametype == "start") {
    matches[req.params.token].sync.signup_fragment = req.params.fragment_number
    matches[req.params.token].start[req.params.fragment_number] = req.body
  }
  else {
    if (!matches[req.params.token].sync.signup_fragment) {
      res.status(205).send("Reset");
      console.log('reset at type :', req.params.frametype)
    }
    else {
      //if(req.params.fragment_number){
        //syncdata["fragment"] = req.params.fragment_number
      //}
      if(req.query.tick){
        matches[req.params.token].sync.tick = req.query.tick
      }
      if(req.query.tps){
        matches[req.params.token].sync.tps = req.query.tps
      }
      if (req.params.frametype == 'full') {
        matches[req.params.token].sync.fragment = req.params.fragment_number
        matches[req.params.token].full[req.params.fragment_number] = req.body
      }
      if (req.params.frametype == 'delta') {
        matches[req.params.token].delta[req.params.fragment_number] = req.body
      }
      res.status(200).send("OK");
    }
  }
})

app.listen(3000, function () {
  console.log('CSGO broadcast server listening on port 3000!');
});
