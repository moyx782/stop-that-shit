#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const MODES = new Set(['review','answer','monitor','change']);
const STATE_DIR = () => process.env.STS_LITE_STATE_DIR || path.join(os.tmpdir(),'stop-that-shit-lite');
const WRITE_TOOLS = new Set(['apply_patch','write_file','edit_file','Write','Edit','NotebookEdit','MultiEdit','create_file','delete_file','move_file']);
const AGENTS = new Set(['spawn_agent','Agent']);
function parsePrompt(prompt) {
  const m = /^(?:[ \t]*\r?\n)* {0,3}\$stop-that-shit\b([^\r\n]*)/i.exec(String(prompt||''));
  if (!m) return null;
  const head = m[1].split('--',1)[0].trim(), tokens = head.split(/[\s,]+/).filter(Boolean);
  const mode = tokens.find(x=>MODES.has(x.toLowerCase())), a=/\bagents=(\d+)\b/i.exec(head);
  return {mode:mode?mode.toLowerCase():null, hashAllowed:/\bhash=allow\b/i.test(head), hashSpecified:/\bhash=(?:allow|deny|ask)\b/i.test(head), agentLimit:a?Math.min(Number(a[1]),1000):null};
}
function key(id){return String(id||'unknown').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,100)||'unknown'}
function load(id){try{return JSON.parse(fs.readFileSync(path.join(STATE_DIR(),key(id)+'.json'),'utf8'))}catch{return {}}}
function save(id,s){try{fs.mkdirSync(STATE_DIR(),{recursive:true,mode:0o700});const p=path.join(STATE_DIR(),key(id)+'.json'),t=p+'.tmp';fs.writeFileSync(t,JSON.stringify(s),{mode:0o600});fs.renameSync(t,p)}catch{}}
function deny(reason){return {hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'deny',permissionDecisionReason:'Stop That Shit Lite: '+reason}}}
function context(message){return {hookSpecificOutput:{hookEventName:'UserPromptSubmit',additionalContext:message}}}
function isHashIntent(name,input){
  const s=typeof input==='string'?input:JSON.stringify(input||{});
  return /\b(?:sha(?:1|256|512)sum|md5sum|shasum)\b/i.test(s)||/\b(?:createHash|createHmac|crypto\.subtle\.digest|hashlib\.sha(?:1|256|512))\s*\(/i.test(s);
}
function mutating(input){
  const s=typeof input==='string'?input:String(input?.command||'');
  return /(?:^|[;&|]\s*)(?:rm|mv|cp|mkdir|touch|tee|sed\s+-i|perl\s+-i|git\s+(?:add|commit|reset|checkout|clean|apply)|npm\s+(?:install|uninstall)|pip\s+install)\b/i.test(s)||/(?:>|>>)\s*[^=]/.test(s);
}
function handle(e){
  const id=e?.session_id||e?.conversation_id||'default',s=load(id),kind=e?.hook_event_name;
  if(kind==='UserPromptSubmit'){
    const d=parsePrompt(e.prompt);if(!d)return null;
    if(d.mode)s.mode=d.mode;
    if(d.agentLimit!==null)s.agentLimit=d.agentLimit;
    if(d.hashSpecified)s.hashAllowed=d.hashAllowed;
    s.agentsStarted=0;save(id,s);
    return context(\`STS Lite: mode=\${s.mode||'unconfirmed'}; hash=\${s.hashAllowed?'allow':'deny'}; agents=\${s.agentLimit??'unlimited'}. This is a limited guard, not a sandbox.\`);
  }
  const name=String(e?.tool_name||''),input=e?.tool_input||{};
  if(kind==='PostToolUse'&&AGENTS.has(name)){s.agentsStarted=(s.agentsStarted||0)+1;save(id,s);return null}
  if(kind!=='PreToolUse')return null;
  if(['review','answer','monitor'].includes(s.mode)&&(WRITE_TOOLS.has(name)||(['exec_command','shell_command','Bash'].includes(name)&&mutating(input))))return deny(\`mode=\${s.mode} is read-only; detected \${name}.\`);
  if(s.mode==='change'&&AGENTS.has(name)&&s.agentLimit!==undefined&&(s.agentsStarted||0)>=s.agentLimit)return deny(\`agent budget exhausted (\${s.agentLimit}).\`);
  if(s.mode==='change'&&!s.hashAllowed&&isHashIntent(name,input))return deny('recognized hash/checksum action requires hash=allow.');
  return null;
}
if(require.main===module){let b='';process.stdin.setEncoding('utf8');process.stdin.on('data',c=>b+=c);process.stdin.on('end',()=>{try{const r=handle(JSON.parse(b||'{}'));if(r)process.stdout.write(JSON.stringify(r)+'\n')}catch(err){process.stderr.write('STS Lite hook error: '+(err?.name||'Error')+'\n')}})}
module.exports={parsePrompt,isHashIntent,mutating,handle};
