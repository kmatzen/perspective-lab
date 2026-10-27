import {detect,fit} from './engine.js';
self.onmessage=({data:d})=>{try{const lines=d.lines||detect(d.pixels,d.w,d.h);postMessage({id:d.id,lines,result:fit(lines,d.tolerance)});}catch(e){postMessage({id:d.id,error:e.message});}};
