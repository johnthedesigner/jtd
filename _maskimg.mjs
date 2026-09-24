import sharp from 'sharp'
import { buildWoodMask } from './components/nba-court/wood-detect.js'
import t from './public/nba-courts/template.json' with { type: 'json' }
const W=504,H=248
const region={x0:t.court.uv.u0,x1:t.court.uv.u1,y0:t.court.uv.v0,y1:t.court.uv.v1}
const names=process.argv.slice(3)
const tiles=[]
for(const n of names){
  const {data}=await sharp(`public/nba-courts/${n}.webp`).resize(W,H,{fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  const {mask,cluster}=buildWoodMask(data,W,H,{region})
  let opaque=0; for(let i=3;i<data.length;i+=4) if(data[i]>=200) opaque++
  console.log(`  ${n.padEnd(15)} ${(mask.reduce((s,v)=>s+v,0)/opaque*100).toFixed(1).padStart(5)}%  hue ${cluster?cluster.hue.toFixed(0):'-'} sat ${cluster?cluster.sat.toFixed(2):'-'}`)
  tiles.push(await sharp(Buffer.from(Uint8Array.from(mask.map(v=>Math.round(v*255)))),{raw:{width:W,height:H,channels:1}}).png().toBuffer())
}
await sharp({create:{width:W*2,height:H*2,channels:3,background:{r:20,g:20,b:30}}})
  .composite(tiles.map((b,i)=>({input:b,left:(i%2)*W,top:Math.floor(i/2)*H})))
  .png().toFile(process.argv[2])
