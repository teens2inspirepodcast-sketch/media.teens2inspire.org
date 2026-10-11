import fs from "node:fs";
import path from "node:path";
const root=process.cwd(), app=path.join(root,"app"), routes=new Set(), misses=new Set();
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name==="page.tsx"){const rel=path.relative(app,path.dirname(p)).split(path.sep).join("/");routes.add("/"+(rel==="."?"":rel));}}}
walk(app);
function exists(h){const target=h.split("/").filter(Boolean);for(const route of routes){const pattern=route.split("/").filter(Boolean);if(pattern.length!==target.length)continue;let ok=true;for(let i=0;i<pattern.length;i++){if(pattern[i].startsWith("[")&&pattern[i].endsWith("]"))continue;if(pattern[i]!==target[i]){ok=false;break;}}if(ok)return true;}return false;}
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())scan(p);else if(/\.(tsx|ts)$/.test(e.name)){const s=fs.readFileSync(p,"utf8");for(const m of s.matchAll(/(?:href|redirect|router\.push)\s*(?:=|\()\s*["'](\/[^"'?#]*)/g)){const h=m[1];if(h.startsWith("/api/")||h.startsWith("/_next"))continue;if(!exists(h))misses.add(`${path.relative(root,p)} -> ${h}`);}}}}
scan(root);
console.log("Routes:",[...routes].sort().join(", "));
if(misses.size){console.error("Missing local routes:\n"+[...misses].join("\n"));process.exitCode=1;}else console.log("No missing literal local routes found; dynamic route segments are recognized.");
