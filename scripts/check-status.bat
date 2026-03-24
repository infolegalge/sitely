@echo off
chcp 437 >nul
node -e "const fs=require('fs'),p=require('path');const d='public/images/projects/portfolio';const all=fs.readdirSync(d).filter(f=>f.endsWith('.webp')).map(f=>({name:f,size:fs.statSync(p.join(d,f)).size}));const broken=all.filter(x=>x.size<12000);const good=all.filter(x=>x.size>=12000);fs.writeFileSync('scripts/img-status.txt','GOOD: '+good.length+' BROKEN: '+broken.length+'\nBroken:\n'+broken.map(x=>x.name+' '+x.size+'B').join('\n'));console.log('Status written')"
