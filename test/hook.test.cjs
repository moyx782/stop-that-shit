const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {parsePrompt,isHashIntent,mutating,handle}=require('../hooks/stop-that-shit.cjs');
test('directive must start the first non-empty line',()=>{
 assert.equal(parsePrompt('hello\n$stop-that-shit review -- inspect'),null);
 assert.equal(parsePrompt('$stop-that-shit review -- inspect').mode,'review');
 assert.equal(parsePrompt('    $stop-that-shit review -- example'),null);
});
test('explicit hash and agent controls parse',()=>{
 assert.deepEqual(parsePrompt('$stop-that-shit change hash=allow agents=0 -- fix'),{mode:'change',hashAllowed:true,hashSpecified:true,agentLimit:0});
});
test('recognizes common hash and mutation signals',()=>{
 assert.equal(isHashIntent('exec_command',{command:'sha256sum release.zip'}),true);
 assert.equal(isHashIntent('Write',{content:'hello'}),false);
 assert.equal(mutating({command:'git status'}),false);
 assert.equal(mutating({command:'rm -rf build'}),true);
});
test('read-only mode denies recognized write tool',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sts-lite-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 process.env.STS_LITE_STATE_DIR=dir;
 handle({hook_event_name:'UserPromptSubmit',session_id:'s1',prompt:'$stop-that-shit review -- inspect only'});
 const r=handle({hook_event_name:'PreToolUse',session_id:'s1',tool_name:'apply_patch',tool_input:{patch:'x'}});
 assert.equal(r.hookSpecificOutput.permissionDecision,'deny');
});
test('hash=allow allows recognized checksum command',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sts-lite-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 process.env.STS_LITE_STATE_DIR=dir;
 handle({hook_event_name:'UserPromptSubmit',session_id:'s2',prompt:'$stop-that-shit change hash=allow -- release'});
 assert.equal(handle({hook_event_name:'PreToolUse',session_id:'s2',tool_name:'exec_command',tool_input:{command:'sha256sum release.zip'}}),null);
});
