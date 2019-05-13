import express = require('express');
const app = express();
import { exists as _exists, createReadStream, createWriteStream } from 'fs';
import { types } from 'util';
import bodyParser = require('body-parser');
const concat = require('concat-stream');

app.use(bodyParser.raw({ type: '*/*' ,limit:'512mb'}));
app.use(bodyParser.urlencoded({ limit: '512mb', extended: true }));
app.use(bodyParser.json({ limit: '512mb'}));

app.set('view engine', 'pug')
app.get('/', function (req, res) {
  res.render('index', {
    title: 'PROJECT TALOS WEB PANEL',
    message: 'PROJECT TALOS WEB PANEL',
  })
})


app.get('/match/:token/:fragment_number/:frametype', function (req, res) {
  var p:any = "";
  console.log(req.params.fragment_number)
  //res.setHeader('Content-Type', 'application/octet-stream')
  switch (req.params.frametype) {
    case 'delta':
      p = fragdata[req.params.token].fragbody![req.params.fragment_number];
      console.log('DELTA')
      break;
    case 'full':
      p = fragdata[req.params.token].fragbody![req.params.fragment_number];
      console.log('FULL')
      break;
    case 'start':
      p = fragdata[req.params.token].fragbody![req.params.fragment_number];
      console.log('START')
      break;
    default:
      break;
  }
  console.log(p)
  res.status(200).send(p);
})

app.get('/match/:token/sync', function (req: any, res: any) {
  console.log("match sync!")
  var token = req.params.token;
  const r = {
    tick: fragdata[req.params.token].tick,
    rtdelay: 1,
    rcvage: 1,
    //fragment: fragdata[req.params.token].latestfrag,
    fragment: 0,
    signup_fragment: fragdata[req.params.token].signup_fragment,
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
  res.send("ACK");
})

var fragdata:Ifragdata = {};
interface Ifragdata {
  [token:string]:Imatchdata
}
interface Imatchdata {
  starttick: number
  tick: number,
  fragment: number,
  signup_fragment: number,
  tps: number,
  protocol: number,
  map: string,
  fragbody?: any[],
  latestfrag: number;
}



app.post('/:token/:fragment_number/:frametype', function (req: any, res: any) {
  req.setEncoding('utf8');
  console.log(req)
  //db.get(req.params.token+'-started', function (err:any, value:any) {
  //const p = createWriteStream('datas/'+req.params.token+'_'+req.params.fragment_number+'_'+req.params.frametype);
  //req.pipe(p)
  //frags[req.params.token] = req;
  //console.dir(req.body)
  /*
  console.log('query')
  console.dir(req.query)
  console.log('params')
  console.dir(req.params)
  */
  console.log(`received ${req.params.frametype} for fragment ${req.params.fragment_number}, token ${req.params.token}`)
  if (req.params.frametype == 'start') {
    if(!fragdata[req.params.token]!){
      fragdata[req.params.token] = {starttick:0,tick:0,fragment:0,signup_fragment:0,tps:32,protocol:4,map:"de_dust2",latestfrag:0,fragbody:[]}
    }
    fragdata[req.params.token].starttick = req.query.tick;
    fragdata[req.params.token].map = req.query.map;
    fragdata[req.params.token].tps = req.query.tps;
    fragdata[req.params.token].signup_fragment = req.params.fragment_number;
    fragdata[req.params.token].protocol = req.params.protocol;
    fragdata[req.params.token].fragbody![req.params.fragment_number] = req.body as Buffer;
    fragdata[req.params.token].latestfrag = req.params.fragment_number;
    console.log("starting", req.params.token, "with fragment_number", req.params.fragment_number);
  }
  if (req.params.frametype == 'full') {
    if(!fragdata[req.params.token]!){
      fragdata[req.params.token] = {starttick:0,tick:0,fragment:0,signup_fragment:0,tps:32,protocol:4,map:"de_dust2",latestfrag:0,fragbody:[]}
    }
    else {
      /*
      if(!fragdata[req.params.token].signup_fragment){
        res.status(205);
        console.log('RESET CONTENT')
      }
      else if(fragdata[req.params.token].signup_fragment == 0){
        res.status(200).send("OK");
      }
      */
      res.status(200).send("OK");
      fragdata[req.params.token].fragbody![req.params.fragment_number] = req.body as Buffer;
      fragdata[req.params.token].tick = req.query.tick;
      fragdata[req.params.token].fragment = req.params.protocol;
      fragdata[req.params.token].fragbody![req.params.fragment_number] = req.body as Buffer;
      fragdata[req.params.token].latestfrag = req.params.fragment_number;
      console.log("full", req.params.token, "with fragment_number", req.params.fragment_number);
    }
  }
  if (req.params.frametype == 'delta') {
    if(!fragdata[req.params.token]!){
      fragdata[req.params.token] = {starttick:0,tick:0,fragment:0,signup_fragment:0,tps:32,protocol:4,map:"de_dust2",latestfrag:0,fragbody:[]}
    }
    /*
    if(!fragdata[req.params.token].signup_fragment){
      res.status(205);
      console.log('RESET CONTENT')
    }
    else {
      res.status(200).send("OK");
    }
    */
   res.status(200).send("OK");
    fragdata[req.params.token].fragbody![req.params.fragment_number] = req.body as Buffer;
    fragdata[req.params.token].latestfrag = req.params.fragment_number;
    console.log("delta", req.params.token, "with fragment_number", req.params.fragment_number);
  }
  //});
});

const port:number = 8080
app.listen(port, function () {
  console.log('CSGO broadcast server listening on port ' + port);
});
