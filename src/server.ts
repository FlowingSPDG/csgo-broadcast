import express = require('express');
const app = express();
import { exists as _exists, createReadStream, createWriteStream } from 'fs';
import { types } from 'util';
import bodyParser = require('body-parser');
const concat = require('concat-stream');

app.use(bodyParser.raw({ type: '*/*', limit: '512mb' }));
//app.use(bodyParser.urlencoded({ limit: '512mb', extended: true }));
//app.use(bodyParser.json({ limit: '512mb'}));

app.set('view engine', 'pug')
app.get('/', function (req, res) {
  res.render('index', {
    title: 'PROJECT TALOS WEB PANEL',
    message: 'PROJECT TALOS WEB PANEL',
  })
})


app.get('/match/:token/:fragment_number/:frametype', function (req, res) {
  console.log(`/match/${req.params.token}/${req.params.fragment_number}/${req.params.frametype}`)
  res.setHeader('Content-Type', 'application/octet-stream')
  var p: Buffer = fragdata[req.params.token].full![req.params.fragment_number]
  console.log(p)
  if (typeof(p) == 'undefined') {
    res.status(404)
    console.log('404!')
  }
  else {
    console.log('200!')
    res.write(p, 'binary');
    //res.status(200).end(null, 'binary');
    res.end(null, 'binary');
  }
})

app.get('/match/:token/sync', function (req: any, res: any) {
  console.log("match sync!")
  var token = req.params.token;
  const r = {
    tick: fragdata[req.params.token].tick,
    rtdelay: 4, // 選択されたFULLフラグメントが受信されてからの秒数
    rcvage: rcvage, // サーバが最新のFULLフラグメントを受信して​​からの秒数
    fragment: fragdata[req.params.token].fragment-10,
    //fragment: fragdata[req.params.token].signup_fragment,
    signup_fragment: fragdata[req.params.token].signup_fragment,
    //signup_fragment: fragdata[req.params.token].fragment,
    tps: fragdata[req.params.token].tps,
    protocol: fragdata[req.params.token].protocol
  }
  res.send(r);
  console.log(r)
})

//  playcast "http://586f7685.ngrok.io/match/s85568392920768736t1477086968"
app.post('/reset/:token/', (req, res) => {
  //db.del(req.params.token+'-started')
  //startfrag??
  delete fragdata[req.params.token].signup_fragment
  res.send("ACK");
  console.log('RESET')
})

var fragdata: Ifragdata = {};
interface Ifragdata {
  [token: string]: Imatchdata
}
interface Imatchdata {
  starttick: number
  tick: number,
  fragment: number,
  signup_fragment: number,
  tps: number,
  protocol: number,
  map: string,
  full?: any[],
  delta?: any[],
  latestfrag: number;
}


var rcvage_start:Date = new Date();;
var rcvage_stop:Date = new Date();
var rcvage:number;
app.post('/:token/:fragment_number/:frametype', function (req, res) {
  req.setEncoding('utf8');
  //console.log(req)
  console.log(`received ${req.params.frametype} for fragment ${req.params.fragment_number}, token ${req.params.token}`)
  if (req.params.frametype == 'start') {
    if (!fragdata[req.params.token]!) {
      fragdata[req.params.token] = { starttick: 0, tick: 0, fragment: 0, signup_fragment: -1, tps: 32, protocol: 4, map: "de_dust2", latestfrag: 0, full: [], delta: [] }
    }
    fragdata[req.params.token].starttick = req.query.tick;
    fragdata[req.params.token].map = req.query.map;
    fragdata[req.params.token].tps = req.query.tps;
    fragdata[req.params.token].signup_fragment = req.params.fragment_number;
    fragdata[req.params.token].fragment = req.params.fragment_number;
    fragdata[req.params.token].protocol = req.params.protocol;
    fragdata[req.params.token].full![req.params.fragment_number] = req.body;
    fragdata[req.params.token].latestfrag = req.params.fragment_number;
    //console.log("starting", req.params.token, "with fragment_number", req.params.fragment_number);
  }
  if (req.params.frametype == 'full') {
    if (!fragdata[req.params.token]!) {
      fragdata[req.params.token] = { starttick: 0, tick: 0, fragment: 0, signup_fragment: 0, tps: 32, protocol: 4, map: "de_dust2", latestfrag: 0, full: [], delta: [] }
    }
    else {
      if (!fragdata[req.params.token].signup_fragment || fragdata[req.params.token].signup_fragment == -1) {
        res.status(205).send("reset");
        console.log('RESET CONTENT')
      }
      else {
        rcvage_stop = new Date()
        rcvage = (rcvage_stop.getTime() - rcvage_start.getTime()) / 1000;
        rcvage_start = new Date();
        res.status(200).send("OK");
        fragdata[req.params.token].full![req.params.fragment_number] = req.body;
        fragdata[req.params.token].tick = req.query.tick;
        fragdata[req.params.token].latestfrag = req.params.fragment_number;
        fragdata[req.params.token].fragment = req.params.fragment_number;
        //console.log("full", req.params.token, "with fragment_number", req.params.fragment_number);
      }
    }
  }
  if (req.params.frametype == 'delta') {
    if (!fragdata[req.params.token]!) {
      fragdata[req.params.token] = { starttick: 0, tick: 0, fragment: 0, signup_fragment: 0, tps: 32, protocol: 4, map: "de_dust2", latestfrag: 0, full: [], delta: [] }
    }
    /*
    if(!fragdata[req.params.token].signup_fragment){
      res.status(205).send("reset");
      console.log('RESET CONTENT')
    }
    else {
      res.status(200).send("OK");
    }
    */
    res.status(200).send("OK");
    fragdata[req.params.token].delta![req.params.fragment_number] = req.body;
    fragdata[req.params.token].latestfrag = req.params.fragment_number;
    fragdata[req.params.token].fragment = req.params.fragment_number;
    //console.log("delta", req.params.token, "with fragment_number", req.params.fragment_number);
  }
  //});
});

const port: number = 8080
app.listen(port, function () {
  console.log('CSGO broadcast server listening on port ' + port);
});
