/** Copy a production build and intercept snapshot backlog for the Firefox UI test. */
import {cpSync,readFileSync,writeFileSync} from 'node:fs';

const destination=process.argv[2];
if(!destination)throw Error('Aufruf: bun tools/instrument-firefox-backlog.mjs <neues-zielverzeichnis>');
cpSync('dist',destination,{recursive:true,errorOnExist:true,force:false});
const index=`${destination}/index.html`,html=readFileSync(index,'utf8');
if(!html.includes('<head>'))throw Error('Produktions-HTML ohne head');
const hook='<script>window.__wfBacklogHook=true;{const Original=window.Worker;window.Worker=class extends Original{constructor(...args){super(...args);this.addEventListener("message",event=>{if(event.data?.type==="snapshot"&&typeof window.__wfBacklog==="number")event.data.backlog=window.__wfBacklog;});}};}</script>';
writeFileSync(index,html.replace('<head>','<head>'+hook));
