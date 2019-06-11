const express = require('express')
const app = express();
import * as bodyParser from 'body-parser'
import('date-utils')

const config = require('./config')

app.use(bodyParser.raw({ type: '*/*', limit: '512mb' }));
app.set('view engine', 'pug')
app.use('/public', express.static(__dirname + '/../public'));
console.log(__dirname + '/../public')

app.get('/', (req: any, res: any) => {
  res.set('Cache-Control', 'public, max-age=5'); // cache 5sec for replay frag
  res.render('plays', {
    'title': 'CSGO tv_broadcast server',
    'matches': match
  });
});


app.get('/replay/:token/sync', function (req:any, res:any) {
  console.log("replay sync!")
  res.set('Cache-Control', 'public, max-age=86400'); // cache 1day for replay sync
  var sync = match[req.params.token].sync
  var r_sync = match[req.params.token].firstsync
  const r = {
    tick: r_sync.tick,
    //rtdelay: sync.rtdelay,
    rtdelay: 2,
    //rcvage: r_sync.rcvage,
    rcvage: 2,
    fragment: r_sync.fragment,
    signup_fragment: sync.signup_fragment,
    tps: sync.tps,
    protocol: sync.protocol,
  }
  //console.log(r)
  res.send(r);
})

app.get('/replay/:token/:fragment_number/:frametype', function (req:any, res:any) {
  console.log('Fragment request for',req.params.fragment_number)
  res.set('Cache-Control', 'public, max-age=86400'); // cache 1day for replay frag
  res.setHeader('Content-Type', 'application/octet-stream')
  var p = Buffer.alloc(16, 0, 'binary');
  if (req.params.frametype == 'start') {
    p = match[req.params.token].start[req.params.fragment_number]
  }
  if (req.params.frametype == 'delta') {
    p = match[req.params.token].delta[req.params.fragment_number]
  }
  if (req.params.frametype == 'full') {
    p = match[req.params.token].full[req.params.fragment_number]
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

//  playcast "http://586f7685.ngrok.io/match/s85568392920768736t1477086968"
app.post('/reset/:token/', (req:any, res:any) => {
  res.send("ACK");
  match[req.params.token].sync.signup_fragment = -1;
})


class Matches{
  public sync: match_sync
  public firstsync: replay_sync // sync for replay
  public start:any = []
  public full:any = []
  public delta: any = []
  public token: string
  public auth: string
  public time: string
  
  constructor() {
    this.sync = new match_sync();
    this.firstsync = new replay_sync();
    this.start[-1] = Buffer.alloc(16, 0, "binary")
    this.full[-1] = Buffer.alloc(16, 0, "binary")
    this.delta[-1] = Buffer.alloc(16, 0, "binary")
    this.token = ""
    this.auth = ""
    this.time = new Date().toJSON()
  }
}

class match_sync{
  public tick: number
  //public rtdelay: number
  private _rtdelay: Date
  private _rcvage: Date
  public fragment: number
  public signup_fragment: number
  public tps: number
  public protocol : number;
  public full_received: any
  public full_received_tick: any
  
  constructor() {
    this.tick = -1
    this._rtdelay = new Date()
    //this.rtdelay = 2
    this._rcvage = new Date()
    this.fragment = -1
    this.signup_fragment = -1
    this.tps = 32
    this.protocol  = 4
    this.full_received = {};
    this.full_received_tick = {}
  }

  
  public rtdelay(i:number) {
    var now = new Date()
    //var i = this.fragment - config.frag_delay
    var selected_full = this.full_received[i];
    var sec = ((now.getTime() - selected_full.getTime()) / 1000);
    console.log(sec)
    return sec;
  }
  

  public rcvage() {
    var now = new Date()
    var i = this.fragment;
    var last_full = this.full_received[i];
    var sec = ((now.getTime() - last_full.getTime()) / 1000);
    console.log(sec)
    return sec;
  }
}

class replay_sync{
  tick: number
  fragment: number

  constructor() {
    this.tick = -1
    this.fragment = -1  }
}

var match: Imatches = {};
interface Imatches{
  [x:string]:Matches
}

app.get('/match/:token/sync', function (req:any, res:any) {
  console.log("match sync!")
  var sync = match[req.params.token].sync
  var r: any;
  res.set('Cache-Control', 'public, max-age=5'); // cache 5sec for delayed live
  if (req.query.fragment) {
    r = {
      tick: sync.full_received_tick[req.query.fragment],
      rtdelay: sync.rtdelay(req.query.fragment),
      rcvage: sync.rcvage(),
      fragment: req.query.fragment,
      signup_fragment: sync.signup_fragment,
      tps: sync.tps,
      protocol: sync.protocol,
    }
  }
  else {
    var frag = sync.fragment - config.frag_delay;
    r = {
      tick: sync.tick,
      rtdelay: sync.rtdelay(frag),
      rcvage: sync.rcvage(),
      fragment: frag,
      signup_fragment: sync.signup_fragment,
      tps: sync.tps,
      protocol: sync.protocol,
    }
  }
  
  console.log(r)
  res.send(r);
})

app.get('/match/:token/:fragment_number/:frametype', function (req:any, res:any) {
  console.log('Fragment request for',req.params.fragment_number)
  res.set('Cache-Control', 'public, max-age=86400'); // cache 1sec for delayed live
  res.setHeader('Content-Type', 'application/octet-stream')
  var p = Buffer.alloc(16, 0, 'binary');
  if (req.params.frametype == 'start') {
    p = match[req.params.token].start[req.params.fragment_number]
  }
  if (req.params.frametype == 'delta') {
    p = match[req.params.token].delta[req.params.fragment_number]
  }
  if (req.params.frametype == 'full') {
    p = match[req.params.token].full[req.params.fragment_number]
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

app.post('/:token/:fragment_number/:frametype', function (req:any, res:any) {
  //console.log(req)
  if (config.DropS1Frag && req.params.token.indexOf("s1t") != -1) {
    console.log("s1n frag detected");
    return;
  }
  if (config.EnableAuth) {
    if (req.headers["x-origin-auth"] != config.auth) {
      return;
    }
  }
  if (!match[req.params.token]) {
    match[req.params.token] = new Matches();
  }
  console.log(`Fragment token : ${req.params.token}, type : ${req.params.frametype},number : ${req.params.fragment_number}, tick : ${req.query.tick}`);
  if (req.params.frametype == "start") {
    match[req.params.token].sync.signup_fragment = req.params.fragment_number
    match[req.params.token].start[req.params.fragment_number] = req.body
    match[req.params.token].token = req.params.token
    match[req.params.token].auth = req.headers["x-origin-auth"]
  }
  else {
    if (match[req.params.token].sync.signup_fragment == -1) {
      res.status(205).send('RESET CONTENT');
      console.log('reset at type :', req.params.frametype)
    }
    else {
      //if(req.params.fragment_number){
        //syncdata["fragment"] = req.params.fragment_number
      //}
      if(req.query.tick){
        match[req.params.token].sync.tick = req.query.tick
        if (match[req.params.token].firstsync.tick == -1) {
          match[req.params.token].firstsync.tick = req.query.tick
        }
      }
      if(req.query.tps){
        match[req.params.token].sync.tps = req.query.tps
      }
      if (req.params.frametype == 'full') {
        res.status(200).send("OK");
        match[req.params.token].sync.fragment = req.params.fragment_number
        match[req.params.token].full[req.params.fragment_number] = req.body
        match[req.params.token].sync.full_received[req.params.fragment_number] = new Date()
        match[req.params.token].sync.full_received_tick[req.params.fragment_number] = req.query.tick
        if (match[req.params.token].firstsync.fragment == -1) {
          match[req.params.token].firstsync.fragment = req.params.fragment_number
        }
      }
      if (req.params.frametype == 'delta') {
        res.status(200).send("OK");
        match[req.params.token].delta[req.params.fragment_number] = req.body
      }
    }
  }
})

app.listen(config.port, function () {
  console.log(`CSGO broadcast server listening on port ${config.port}!`);
});
