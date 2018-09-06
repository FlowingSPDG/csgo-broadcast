const express = require('express');
const app = express();
const fs = require('fs');
const swig  = require('swig');

const levelup = require('level');

let db = levelup('./csgo', {valueEncoding: 'json'});

db.get('shows', (err, shows) => {
  if (err) {
    db.put('shows', {shows:[]});
  }
});

function frame_buffer_put(token, fragment_number, tick) {
  db.get(token+'-framebuffer', (err, framebuffer) => {
    if (err) {
      framebuffer = [];
    }
    framebuffer.push({fragment_number: fragment_number, tick: tick});
    if (framebuffer.length >= 5) {
      framebuffer.shift()
    }
    console.log(framebuffer);
    db.put(token+'-framebuffer', framebuffer);
  })
}


app.get('/', function (req, res) {
  const t = swig.compileFile(__dirname+'/views/plays.html');
  db.get('shows', (err, shows) => {
    res.send(t(shows))
  });
});

function set_started (token, start_fragment, auth) {
  db.get('shows', (err, shows) => {
      let s = shows.shows;
      s.push({token: token, timestamp: (new Date().toJSON()), auth: auth})
      db.put('shows', {shows: s});
  });
  db.put(token+'-started', start_fragment)
}

function set_fullpoint (token, cb) {
  db.get(token+'-framebuffer', (err, framebuffer) => {
    if (err) return cb();
    const frame = framebuffer[0];
    db.put(token+'-state', {fragment: frame.fragment_number, tick: frame.tick}, cb);
  })
}


app.get('/match/:token/:fragment_number/:frametype', function (req, res) {
  const p = 'datas/'+req.params.token+'_'+req.params.fragment_number+'_'+req.params.frametype;
  fs.exists(p, (exists) => {
    if (!exists) return res.status(404).send("not found");
    console.log("match play", req.params.token, req.params.fragment_number, req.params.frametype);
    res.setHeader('Content-Type', 'application/octet-stream')
    fs.createReadStream(p)
    .pipe(res)
  })
});

app.get('/match/:token/sync', function (req, res) {
  console.log("match sync!")
  set_fullpoint(req.params.token, () => {

  db.get(req.params.token+'-state', (err, state) => {
    if (err) return res.status(404).send("not found");
    console.log(state)
    db.get(req.params.token+'-started', (err, start) => {
      if (err) return res.status(404).send("not found");
      console.log(start)
      const r = {tick: parseInt(state.tick),
                rtdelay: 1,
                rcvage: 1,
                fragment: parseInt(state.fragment),
                signup_fragment: parseInt(start),
                tps: 32,
                protocol: 4};
      console.log(r)
      res.send(r);
      })
    });
  })
});


//  playcast "http://586f7685.ngrok.io/match/s85568392920768736t1477086968"
app.post('/reset/:token/', (req, res) => {
  db.del(req.params.token+'-started')
  res.send("ACK");
})

app.post('/:token/:fragment_number/:frametype', function (req, res) {
   db.get(req.params.token+'-started', function (err, value) {
     if (err && req.params.frametype != 'start') {
       return res.status(205).send("reset");
     }
     if (req.params.frametype == 'start') {
       console.log("starting", req.params.token, "with fragment_number", req.params.fragment_number);
       set_started(req.params.token, req.params.fragment_number, req.headers['x-origin-auth']);
     }
     const p = fs.createWriteStream('datas/'+req.params.token+'_'+req.params.fragment_number+'_'+req.params.frametype);
     req.pipe(p)
     if (req.params.frametype == 'full') {
       //setTimeout(() => {
         frame_buffer_put(req.params.token, req.params.fragment_number, req.query.tick);
         console.log("Fragment", req.params.fragment_number, "for tick", req.query.tick);
       //}, 5000);
     }
     res.status(200).send("OK");
   });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
