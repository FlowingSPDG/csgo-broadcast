## Counter-Strike: Global Offensive tv_broadcast GOTV+ Server  
https://developer.valvesoftware.com/wiki/Counter-Strike:_Global_Offensive_Broadcast   
GOTV+,HTTP and dem based GOTV. Supports CDN,HLAE,Reshade and other external softwere.

# Todo

-> Save matches as a demo replay  
-> Save those replays as a file(to reboot apps)  
-> web gui for administrating old archives  

## How to run

### Installation
1. `npm i`  
2. `npm i -g typescript`  
3. `npm run build`  

### Usage
1. `npm start` to start tv_broadcast server  
2. on SRCDS Server : `tv_broadcast_url "http:localhost:3000";tv_broadcast 1"` to begin broadcasting  
3. Wait for match,replay will be available after tv_delay seconds  
4. Open http://localhost:3000/ (it can be GlobalIP or your domain) in your browser  
5. Click "Play" and Allow Steam access to enjoy delayed-playback  

NOTE : you can use `demoui` command,which is appeared by Shift+F2. So you are able to pause/resume/fasten your demo  
Also HLAE/Reshade and other tools are available

### Why?
It's technically delivering demo fragments as a HTTP server.  
So your CS:GO client doesnt need to authencate Steam/VAC.
