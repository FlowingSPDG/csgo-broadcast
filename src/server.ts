import express = require('express');
const app = express();
import { exists as _exists, createReadStream, createWriteStream } from 'fs';
import { types } from 'util';
import bodyParser = require('body-parser');
const concat = require('concat-stream');

app.use(bodyParser.raw({ type: '*/*', limit: '512mb' }));
//app.use(bodyParser.urlencoded({ limit: '512mb', extended: true }));
//app.use(bodyParser.json({ limit: '512mb'}));

var matches:number[];
app.set('view engine', 'pug')
app.get('/', function (req, res) {
  res.render('index', {
    title: 'CSGO BROADCAST WEB PANEL',
    message: 'CSGO BROADCAST WEB PANEL',
    matches: matches,
  })
})


app.get('/match/:token/:fragment_number/:frametype', function (req, res) {
  console.log(`/match/${req.params.token}/${req.params.fragment_number}/${req.params.frametype}`)
  res.setHeader('Content-Type', 'application/octet-stream')
  var p:Buffer = Buffer.alloc(16, 0);
  switch(req.params.frametype){
    case "full" : 
      p = fragdata[req.params.token].full![req.params.fragment_number]
      console.log('send full')
      break;
    case "delta":
      p = fragdata[req.params.token].delta![req.params.fragment_number]
      console.log('send delta')
      break;
    case "start":
      p = fragdata[req.params.token].start![req.params.fragment_number]
      console.log('send start')
      break;
  }
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

// 各full frag名オブジェクトのタイマーを作成し時間参照できるようにする
// 4fragが収集されるまで .starttime がundefinedなので、その間の回避策を考えないといけない

app.get('/match/:token/sync', function (req: any, res: any) {
  console.log("match sync!")
  var now:Date = new Date()
  var fragment = fragdata[req.params.token].fragment-4
  var rcvage:any = Math.trunc(( now.getTime() - since_latest_full[req.params.token].getTime()) / 1000);
  var rtdelay = Math.trunc(( now.getTime() - delay[req.params.token][fragment].starttime.getTime()) / 1000);
  const r = {
    tick: fragdata[req.params.token].tick,
    rtdelay: rtdelay, // 選択されたFULLフラグメントが受信されてからの秒数?
    //rtdelay: 30, // 選択されたFULLフラグメントが受信されてからの秒数?
    rcvage: parseInt(rcvage), // サーバが最新のFULLフラグメントを受信して​​からの秒数
    //rcvage: 30, // サーバが最新のFULLフラグメントを受信して​​からの秒数
    fragment: fragment,
    signup_fragment: fragdata[req.params.token].signup_fragment,
    //tps: Math.trunc(parseInt(fragdata[req.params.token].tps)),
	tps: Math.trunc(fragdata[req.params.token].tps),
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
  start?: any[],
  latestfrag: number;
}

interface Idelaydata{
  //[token: string]: IdelayDate
  [key: string]: IdelayDate
}
interface IdelayDate{
  [key: string]: IdelayBracket
}
interface IdelayBracket{
  //stoptime:any,
  starttime:any
}

var delay:Idelaydata = {};
var since_latest_full:any = {};
app.post('/:token/:fragment_number/:frametype', function (req, res) {
  req.setEncoding('utf8');
  //console.log(req)
  console.log(`received ${req.params.frametype} for fragment ${req.params.fragment_number}, token ${req.params.token}`)
  switch(req.params.frametype)
  {
	  case 'start':
    if (!fragdata[req.params.token]!) {
      fragdata[req.params.token] = { starttick: 0, tick: 0, fragment: 0, signup_fragment: -1, tps: 32, protocol: 4, map: "de_dust2", latestfrag: 0, full: [], start: [], delta: [] }
    }
    fragdata[req.params.token].starttick = req.query.tick;
    fragdata[req.params.token].map = req.query.map;
    fragdata[req.params.token].tps = req.query.tps;
    fragdata[req.params.token].signup_fragment = req.params.fragment_number;
    //fragdata[req.params.token].fragment = req.params.fragment_number;
    fragdata[req.params.token].protocol = req.query.protocol;
    fragdata[req.params.token].start![req.params.fragment_number] = req.body;
    fragdata[req.params.token].latestfrag = req.params.fragment_number;
    //console.log("starting", req.params.token, "with fragment_number", req.params.fragment_number);
	matches.push(req.params.token);
	break;
	case "full":
	  if (!fragdata[req.params.token]!) {
      fragdata[req.params.token] = { starttick: 0, tick: 0, fragment: 0, signup_fragment: -1, tps: 32, protocol: 4, map: "de_dust2", latestfrag: 0, full: [], start: [], delta: [] }
    }
    else {
      if (!fragdata[req.params.token].signup_fragment || fragdata[req.params.token].signup_fragment == -1) {
        res.status(205).send("reset");
        console.log('RESET CONTENT')
      }
      else {
        if(!delay[req.params.token]){
          delay[req.params.token] = {}
        }
        delay[req.params.token][req.params.fragment_number] = {starttime:new Date()};
        since_latest_full[req.params.token] = new Date()
        //delay[req.params.token][req.params.fragment_number].stoptime = new Date()
        //rcvage = (rcvage_stop.getTime() - rcvage_start.getTime()) / 1000;
        //rcvage_start = new Date();
        res.status(200).send("OK");
        fragdata[req.params.token].full![req.params.fragment_number] = req.body;
        fragdata[req.params.token].tick = req.query.tick;
        fragdata[req.params.token].latestfrag = req.params.fragment_number;
        fragdata[req.params.token].fragment = req.params.fragment_number;
        //console.log("full", req.params.token, "with fragment_number", req.params.fragment_number);
      }
    }
	break;

  case 'delta':
    if (!fragdata[req.params.token]!) {
      fragdata[req.params.token] = { starttick: 0, tick: 0, fragment: 0, signup_fragment: -1, tps: 32, protocol: 4, map: "de_dust2", latestfrag: 0, full: [], start: [], delta: [] }
    }
    res.status(200).send("OK");
    fragdata[req.params.token].delta![req.params.fragment_number] = req.body;
    //fragdata[req.params.token].latestfrag = req.params.fragment_number;
    //fragdata[req.params.token].fragment = req.params.fragment_number;
    //console.log("delta", req.params.token, "with fragment_number", req.params.fragment_number);
  //});
  break;
}

});

const port: number = 8080
app.listen(port, function () {
  console.log('CSGO broadcast server listening on port ' + port);
});
