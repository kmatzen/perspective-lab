/* Browser-local edge extraction and robust projective direction fitting. */
export function detect(data,w,h){
 const n=w*h,g=new Float32Array(n),mag=new Float32Array(n),ang=new Float32Array(n);
 for(let i=0;i<n;i++)g[i]=.299*data[4*i]+.587*data[4*i+1]+.114*data[4*i+2];
 let sum=0,count=0;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let i=y*w+x;let dx=-g[i-w-1]+g[i-w+1]-2*g[i-1]+2*g[i+1]-g[i+w-1]+g[i+w+1],dy=-g[i-w-1]-2*g[i-w]-g[i-w+1]+g[i+w-1]+2*g[i+w]+g[i+w+1];mag[i]=Math.hypot(dx,dy);ang[i]=Math.atan2(dy,dx);sum+=mag[i];count++;}
 const threshold=Math.max(45,sum/count*2.4),R=Math.ceil(Math.hypot(w,h)),bins=180,stride=R*2+1,acc=new Uint32Array(bins*stride),cs=[],sn=[],points=[];
 for(let t=0;t<bins;t++){cs[t]=Math.cos(t*Math.PI/bins);sn[t]=Math.sin(t*Math.PI/bins);}
 for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){let i=y*w+x;if(mag[i]<threshold)continue;let a=ang[i],sx=Math.round(Math.cos(a)),sy=Math.round(Math.sin(a));if(mag[i]<mag[i+sy*w+sx]||mag[i]<mag[i-sy*w-sx])continue;points.push([x,y]);let t0=((Math.round(a*180/Math.PI)%180)+180)%180;for(let d=-2;d<=2;d++){let t=(t0+d+180)%180,r=Math.round(x*cs[t]+y*sn[t])+R;acc[t*stride+r]++;}}
 let peaks=[];for(let t=0;t<bins;t++)for(let r=0;r<stride;r++)if(acc[t*stride+r]>=Math.max(18,Math.min(w,h)*.045))peaks.push({t,r:r-R,v:acc[t*stride+r]});peaks.sort((a,b)=>b.v-a.v);
 let chosen=[],lines=[];
 for(const p of peaks){if(chosen.some(q=>Math.abs(q.t-p.t)<4&&Math.abs(q.r-p.r)<7))continue;chosen.push(p);let c=cs[p.t],s=sn[p.t];let along=points.filter(([x,y])=>Math.abs(x*c+y*s-p.r)<1.8).map(([x,y])=>-x*s+y*c).sort((a,b)=>a-b);let start=0;
 for(let j=1;j<=along.length;j++){if(j<along.length&&along[j]-along[j-1]<9)continue;let a=along[start],b=along[j-1];if(b-a>Math.max(26,Math.min(w,h)*.065))lines.push({x1:p.r*c-a*s,y1:p.r*s+a*c,x2:p.r*c-b*s,y2:p.r*s+b*c,len:b-a});start=j;}if(chosen.length>=160)break;}
 lines.sort((a,b)=>b.len-a.len);return lines.filter((l,i,ls)=>!ls.slice(0,i).some(q=>Math.hypot((l.x1+l.x2-q.x1-q.x2)/2,(l.y1+l.y2-q.y1-q.y2)/2)<10&&Math.abs(Math.sin(Math.atan2(l.y2-l.y1,l.x2-l.x1)-Math.atan2(q.y2-q.y1,q.x2-q.x1)))<.06)).slice(0,160);
}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
export function residual(l,v){let mx=(l.x1+l.x2)/2,my=(l.y1+l.y2)/2,dx=v[0]-mx*v[2],dy=v[1]-my*v[2];return Math.asin(Math.min(1,Math.abs((l.x2-l.x1)*dy-(l.y2-l.y1)*dx)/(l.len*Math.hypot(dx,dy)||1)))*180/Math.PI;}
export function fit(lines,tolerance=3){
 let remaining=lines.map((l,i)=>i),groups=[];
 for(let k=0;k<3;k++){let best=null,bestScore=0;
 for(let a=0;a<remaining.length;a++)for(let b=a+1;b<remaining.length;b++){let l=lines[remaining[a]],m=lines[remaining[b]],v=cross([l.y1-l.y2,l.x2-l.x1,l.x1*l.y2-l.y1*l.x2],[m.y1-m.y2,m.x2-m.x1,m.x1*m.y2-m.y1*m.x2]);let norm=Math.hypot(...v);if(norm<1e-6)continue;v=v.map(x=>x/norm);let score=0,ids=[];for(const i of remaining){let r=residual(lines[i],v);if(r<tolerance){score+=lines[i].len*(1-(r/tolerance)**2);ids.push(i);}}if(ids.length>=3&&score>bestScore){bestScore=score;best={v,ids};}}
 if(!best)break;groups.push(best);remaining=remaining.filter(i=>!best.ids.includes(i));}
 let assignments=lines.map(l=>{let ds=groups.map(g=>residual(l,g.v)),d=Math.min(...ds);return{group:d<tolerance?ds.indexOf(d):-1,error:d};});groups.forEach((g,k)=>g.ids=assignments.flatMap((a,i)=>a.group===k?[i]:[]));
 const total=lines.reduce((s,l)=>s+l.len,0),support=lines.reduce((s,l,i)=>s+(assignments[i].group>=0?l.len:0),0)/(total||1),errors=assignments.filter(a=>a.group>=0).map(a=>a.error).sort((a,b)=>a-b);
 return{groups,assignments,support,median:errors.length?errors[Math.floor(errors.length/2)]:null};
}
