const openers = new Map();
document.querySelectorAll('[data-open]').forEach(button => {
  button.addEventListener('click', () => {
    const dialog = document.getElementById(button.dataset.open);
    openers.set(dialog, button);
    dialog.showModal();
  });
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialog.querySelectorAll('video').forEach(video => video.pause());
    openers.get(dialog)?.focus({preventScroll:true});
  });
});

// Illustrative values only; no accounts, storage or network requests.
const sampleWeeks = [
 {week:'Week 1',math:7,reading:5}, {week:'Week 2',math:9,reading:6},
 {week:'Week 3',math:10,reading:7}, {week:'Week 4',math:13,reading:8},
 {week:'Week 5',math:14,reading:10}, {week:'Week 6',math:16,reading:11}
];
const sampleSummary = {all:{answered:35,correct:27},math:{answered:20,correct:16},reading:{answered:15,correct:11}};
const chart = document.getElementById('progress-chart');
const table = document.getElementById('chart-table');
if (chart && table) {
sampleWeeks.forEach(row=>{
 const tr=document.createElement('tr');
 [row.week,row.math,row.reading,row.math+row.reading].forEach((value,index)=>{const cell=document.createElement(index?'td':'th');if(!index)cell.scope='row';cell.textContent=value;tr.append(cell)});
 table.append(tr);
});
function showSampleSubject(subject) {
 const stats=sampleSummary[subject];
 document.getElementById('sample-attempted').textContent=stats.answered;
 document.getElementById('sample-correct').textContent=stats.correct;
 document.getElementById('sample-accuracy').textContent=Math.round(stats.correct/stats.answered*100)+'%';
 document.querySelectorAll('[data-subject]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.subject===subject)));
 chart.replaceChildren();
 sampleWeeks.forEach(row=>{
  const math=subject==='reading'?0:row.math, reading=subject==='math'?0:row.reading, total=math+reading;
  const column=document.createElement('div');column.className='week-column';column.setAttribute('aria-hidden','true');
  const stack=document.createElement('div');stack.className='bar-stack';stack.style.height=(total/30*100)+'%';
  const value=document.createElement('b');value.className='bar-value';value.textContent=total;
  const m=document.createElement('span');m.className='math-bar';m.style.height=(math/total*100)+'%';
  const r=document.createElement('span');r.className='reading-bar';r.style.height=(reading/total*100)+'%';
  const label=document.createElement('span');label.className='week-label';label.textContent=row.week;
  stack.append(m,r,value);column.append(stack,label);chart.append(column);
 });
 chart.setAttribute('aria-label', 'Fictional '+(subject==='all'?'math and reading':subject)+' correct answers: '+sampleWeeks.map(row=>row.week+' '+(subject==='all'?row.math+row.reading:row[subject])).join(', ')+'. Full sample values are in the table below.');
 document.querySelectorAll('[data-skill]').forEach(row=>row.hidden=subject!=='all'&&row.dataset.skill!==subject);
 document.querySelector('.math-key').hidden=subject==='reading';
 document.querySelector('.reading-key').hidden=subject==='math';
}
document.querySelectorAll('[data-subject]').forEach(button=>button.addEventListener('click',()=>showSampleSubject(button.dataset.subject)));
showSampleSubject('all');

}
