'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {parseScripture}=require('./reading-links.cjs');
let passed=0;
function check(name,run){run();passed++;console.log('PASS: '+name);}
// Independent, reviewed destinations for the actual 60 readings. Each line is
// one day; semicolons separate readings that must stay separate in the UI.
// Columns are display label | official app reference | existing web chapter.
const fixtures={money:`
马太福音 6:19-34|mat.6.19-mat.6.34|matthew/6
路加福音 12:13-34|luk.12.13-luk.12.34|luke/12
提摩太前书 6:6-19|1ti.6.6-1ti.6.19|1_timothy/6
希伯来书 13:5-6|heb.13.5-heb.13.6|hebrews/13
腓立比书 4:10-20|php.4.10-php.4.20|philippians/4
箴言 30:7-9|pro.30.7-pro.30.9|proverbs/30
诗篇 23|psa.23.1|psalms/23
箴言 21:5|pro.21.5|proverbs/21
路加福音 14:28-33|luk.14.28-luk.14.33|luke/14
箴言 15:22|pro.15.22|proverbs/15;箴言 20:18|pro.20.18|proverbs/20
箴言 11:1|pro.11.1|proverbs/11;箴言 16:8|pro.16.8|proverbs/16
箴言 22:1-9|pro.22.1-pro.22.9|proverbs/22
路加福音 16:1-13|luk.16.1-luk.16.13|luke/16
马太福音 25:14-30|mat.25.14-mat.25.30|matthew/25
创世记 39:1-6|gen.39.1-gen.39.6|genesis/39
创世记 41:33-57|gen.41.33-gen.41.57|genesis/41
箴言 6:6-11|pro.6.6-pro.6.11|proverbs/6
传道书 5:10-20|ecc.5.10-ecc.5.20|ecclesiastes/5
传道书 11:1-6|ecc.11.1-ecc.11.6|ecclesiastes/11
雅各书 4:13-17|jas.4.13-jas.4.17|james/4
约伯记 1:13-22|job.1.13-job.1.22|job/1
哈巴谷书 3:17-19|hab.3.17-hab.3.19|habakkuk/3
申命记 8|deu.8.1|deuteronomy/8
路加福音 19:1-10|luk.19.1-luk.19.10|luke/19
马可福音 10:17-31|mrk.10.17-mrk.10.31|mark/10
哥林多后书 8|2co.8.1|2_corinthians/8
哥林多后书 9|2co.9.1|2_corinthians/9
使徒行传 4:32-37|act.4.32-act.4.37|acts/4
诗篇 73|psa.73.1|psalms/73
马太福音 6:24|mat.6.24|matthew/6;诗篇 139:23-24|psa.139.23-psa.139.24|psalms/139
`,parenting:`
诗篇 127:1-5|psa.127.1-psa.127.5|psalms/127
申命记 6:4-9|deu.6.4-deu.6.9|deuteronomy/6
申命记 4:9-10|deu.4.9-deu.4.10|deuteronomy/4
提摩太前书 4:12-16|1ti.4.12-1ti.4.16|1_timothy/4
雅各书 1:22-25|jas.1.22-jas.1.25|james/1
歌罗西书 3:12-17|col.3.12-col.3.17|colossians/3
诗篇 78:1-8|psa.78.1-psa.78.8|psalms/78
申命记 6:20-25|deu.6.20-deu.6.25|deuteronomy/6
提摩太后书 3:14-17|2ti.3.14-2ti.3.17|2_timothy/3
雅各书 1:19-20|jas.1.19-jas.1.20|james/1
箴言 18:13|pro.18.13|proverbs/18;箴言 18:17|pro.18.17|proverbs/18
马可福音 10:13-16|mrk.10.13-mrk.10.16|mark/10
哥林多前书 13:4-7|1co.13.4-1co.13.7|1_corinthians/13
罗马书 12:15-18|rom.12.15-rom.12.18|romans/12
以弗所书 6:1-4|eph.6.1-eph.6.4|ephesians/6
歌罗西书 3:20-21|col.3.20-col.3.21|colossians/3
箴言 15:1-4|pro.15.1-pro.15.4|proverbs/15
加拉太书 6:1-5|gal.6.1-gal.6.5|galatians/6
马太福音 7:1-5|mat.7.1-mat.7.5|matthew/7
歌罗西书 3:12-15|col.3.12-col.3.15|colossians/3
以弗所书 4:25-32|eph.4.25-eph.4.32|ephesians/4
箴言 20:7|pro.20.7|proverbs/20
路加福音 16:10-13|luk.16.10-luk.16.13|luke/16
马可福音 10:42-45|mrk.10.42-mrk.10.45|mark/10
雅各书 2:1-9|jas.2.1-jas.2.9|james/2
提摩太前书 5:3-8|1ti.5.3-1ti.5.8|1_timothy/5
提摩太后书 1:3-7|2ti.1.3-2ti.1.7|2_timothy/1
腓立比书 4:4-9|php.4.4-php.4.9|philippians/4
雅各书 1:2-8|jas.1.2-jas.1.8|james/1
申命记 6:4-9|deu.6.4-deu.6.9|deuteronomy/6;以弗所书 6:4|eph.6.4|ephesians/6
`};
function rows(table){return table.trim().split(/\r?\n/).map(day=>day.split(';').map(item=>{
  const [label,app,web]=item.split('|');return {label,webUrl:'https://cnbible.com/cus/'+web+'.htm',appUrl:'wdbible://bible/'+app};
}));}
const topics=['money','parenting'].map(id=>JSON.parse(fs.readFileSync(path.join(__dirname,id+'-30-days.json'),'utf8')));
check('All 60 days produce exactly the reviewed 65 ordered app and web destinations',()=>{
  let count=0;
  for(const topic of topics){
    const expected=rows(fixtures[topic.id]);assert.equal(expected.length,30);assert.equal(topic.days.length,30);
    topic.days.forEach((day,i)=>{const actual=parseScripture(day.scripture,day.refs);assert.deepEqual(actual,expected[i],topic.id+' day '+(i+1));count+=actual.length;});
  }
  assert.equal(count,65);
});
check('Discontinuous verses remain two buttons and never fill the intervening verses',()=>{
  const expected=rows(fixtures.parenting)[10];
  for(const punctuation of [',','，','、'])assert.deepEqual(parseScripture('箴言 18:13'+punctuation+'17'),expected);
  assert.ok(expected.every(r=>!r.appUrl.includes('-')));
});
check('Omitted book names retain their book while explicit new chapters stay distinct',()=>{
  assert.deepEqual(parseScripture('箴言 15:22、20:18'),rows(fixtures.money)[9]);
  assert.deepEqual(parseScripture('箴言 11:1、16:8'),rows(fixtures.money)[10]);
});
check('Whole chapter labels stay chapter labels and app links start at verse one',()=>{
  const expected=rows(fixtures.money);
  for(const i of [6,22,25,26,28]){const day=topics[0].days[i],actual=parseScripture(day.scripture);assert.deepEqual(actual,expected[i]);assert.match(actual[0].appUrl,/\.1$/);assert.ok(!actual[0].label.includes(':'));}
});
check('Multi-book readings retain their display order across plus and semicolon separators',()=>{
  for(const separator of [' + ','＋','；',';'])assert.deepEqual(parseScripture('马太福音 6:24'+separator+'诗篇 139:23-24'),rows(fixtures.money)[29]);
});
check('Official app range syntax repeats both book and chapter at the end',()=>{
  assert.equal(parseScripture('以弗所书 6:1–4')[0].appUrl,'wdbible://bible/eph.6.1-eph.6.4');
  assert.equal(parseScripture('使徒行传 2:24-25')[0].appUrl,'wdbible://bible/act.2.24-act.2.25');
});
check('Existing references are not changed and unknown external destinations cannot replace Bible readers',()=>{
  const refs=[{label:'不可信内容',url:'javascript:alert(1)'},{label:'正常经文章',url:'https://cnbible.com/cus/ephesians/6.htm'}],original=JSON.stringify(refs);
  assert.deepEqual(parseScripture('以弗所书 6:1-4',refs),rows(fixtures.parenting)[14]);assert.equal(JSON.stringify(refs),original);
});
check('Unsupported books, missing book names and malformed references produce no guessed links',()=>{
  for(const input of [null,undefined,{},[],42,'',' ','6:1-4','未知书 1:1','马太福音 0:1','马太福音 29:1','马太福音 1:0','马太福音 1:177','马太福音 1:9-2','马太福音 1:1-0','马太福音 1:1-2 trailing','马太福音 6:1；未知书 1:2','马太福音 6:1 + ','马太福音 6:1,,2'])assert.deepEqual(parseScripture(input),[],String(input));
});
check('Build output enriches every day without changing the editable source data',()=>{
  const sourcePaths=topics.map(t=>path.join(__dirname,t.id+'-30-days.json'));
  const before=sourcePaths.map(file=>fs.readFileSync(file,'utf8')),built=require('./build-topics.cjs').build();
  for(const topic of built){const expected=rows(fixtures[topic.id]);topic.days.forEach((day,i)=>assert.deepEqual(day.readers,expected[i],topic.id+' build day '+(i+1)));}
  assert.deepEqual(sourcePaths.map(file=>fs.readFileSync(file,'utf8')),before);
  for(const topic of topics)assert.ok(topic.days.every(day=>!Object.hasOwn(day,'readers')));
});
console.log(`${passed} reading-link checks passed; 60 days / 65 Scripture links reviewed.`);
