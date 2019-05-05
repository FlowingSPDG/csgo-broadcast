import express = require('express');
const app = express();
import { exists as _exists, createReadStream, createWriteStream } from 'fs';
import { types } from 'util';
import bodyParser = require('body-parser');
const concat = require('concat-stream');

interface Itoken{
  [frag: string]: any;
}
interface anything{
  [x:string]: any;
}
//var frags: Itoken = {};

var frags_delta:Itoken = {};
var frags_full:Itoken = {};
var frags_start:Itoken = {};

app.use(bodyParser.raw({ type:'*/*' }));
app.set('view engine', 'pug')
app.get('/', function (req, res) {
	res.render('index', {
		title: 'PROJECT TALOS WEB PANEL',
		message: 'PROJECT TALOS WEB PANEL' ,
	})
})


app.get('/match/:token/:fragment_number/:frametype', function (req, res) {
  var p:any = "";
  res.setHeader('Content-Type', 'application/octet-stream')
  switch(req.params.frametype){
    case 'delta':
      p = frags_full[req.params.fragment_number];
      console.log('DELTA')
      break;
    case 'full':
    p = frags_full[req.params.fragment_number];
      console.log('FULL')
      break;
    case 'start':
    p = frags_start[req.params.fragment_number];
    // res.send(new Buffer('wahoo'));
      console.log('START')
      break;
    default:
      break;
  }
  console.log(p)
  res.send(new Buffer(p["body"],'binary'));
})

app.get('/match/:token/sync', function (req:any, res:any) {
  console.log("match sync!")
  const r = {
    tick: latestfrag.tick,
    rtdelay: 1,
    rcvage: 1,
    fragment: latestfrag.fragment,
    signup_fragment: latestfrag.signup_fragment,
    tps: latestfrag.tps,
    protocol: latestfrag.protocol
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

interface latest{
  starttick:number;
  tick:number,
  fragment:number,
  signup_fragment:number,
  tps:number,
  protocol:number,
  map:string
}
var latestfrag:latest = {
  starttick : 0,
  tick : 0,
  fragment : 0,
  signup_fragment : 0,
  tps : 0,
  protocol : 4,
  map : "de_dust2",
};

app.post('/:token/:fragment_number/:frametype', function (req:any, res:any) {
  req.setEncoding('utf8');
  //db.get(req.params.token+'-started', function (err:any, value:any) {
    if (!latestfrag.signup_fragment) {
      //return res.status(205).send("reset");
    }
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
        latestfrag.starttick = req.query.tick;
        latestfrag.map = req.query.map;
        latestfrag.tps = req.query.tps;
        latestfrag.signup_fragment =  req.params.fragment_number;
        latestfrag.protocol =  req.params.protocol;

        if(req.body){
          frags_start[req.params.fragment_number] = new Buffer(req.body.toString('binary'),'binary');;
        }
        
         //set_started(req.params.token, req.params.fragment_number, req.headers['x-origin-auth']);
         console.log("starting", req.params.token, "with fragment_number", req.params.fragment_number);
       }
       if (req.params.frametype == 'full') {
        if(req.body){
          frags_full[req.params.fragment_number] = new Buffer(req.body.toString('binary'),'binary');;
        }
        if(req.query.tick){
          latestfrag.tick = req.query.tick
        }
        if(req.params.fragment_number){
          frags_full[req.params.fragment_number] = req 
        }
       }
       if (req.params.frametype == 'delta') {
        if(req.body){
          frags_delta[req.params.fragment_number] = new Buffer(req.body.toString('binary'),'binary');;
        }
      }
        if(req.query.endtick){
          latestfrag.tick = req.query.endtick
        }
        if(req.params.fragment_number){
          latestfrag.fragment = req.params.fragment_number;
        }
       
     res.status(200).send("OK");
   //});
});

const port:number = 8080
app.listen(port, function () {
  console.log('CSGO broadcast server listening on port ' + port);
});
