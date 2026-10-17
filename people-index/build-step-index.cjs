/*
 * Extract only identifiers, English index names and explicit reference lists from TIPNR.
 * No descriptions, inferred family relationships or AI-authored article fields are read.
 * Source: STEPBible / Tyndale House Cambridge, CC BY 4.0. See SOURCE.md.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const SOURCE_BLOB = '01c6ea0ca3098f53783f1994106d7e4b06566a4c';
const SOURCE_FILE = 'TIPNR - Translators Individualised Proper Names with all References - STEPBible.org CC BY.txt';
const sourceUrl = 'https://github.com/STEPBible/STEPBible-Data/blob/master/Proper%20Nouns/' + encodeURIComponent(SOURCE_FILE);
const inputPath = process.argv[2] || path.join(__dirname, '../output/person-index-source/TIPNR.txt');
const source = fs.readFileSync(inputPath);
const blob = crypto.createHash('sha1').update(Buffer.from('blob ' + source.length + '\0')).update(source).digest('hex');
if (blob !== SOURCE_BLOB) throw new Error('TIPNR source differs from reviewed blob: ' + blob);
const rawBooks = [
 ['Gen','创世记','genesis',50],['Exo','出埃及记','exodus',40],['Lev','利未记','leviticus',27],['Num','民数记','numbers',36],['Deu','申命记','deuteronomy',34],
 ['Jos','约书亚记','joshua',24],['Jdg','士师记','judges',21],['Rut','路得记','ruth',4],['1Sa','撒母耳记上','1_samuel',31],['2Sa','撒母耳记下','2_samuel',24],
 ['1Ki','列王纪上','1_kings',22],['2Ki','列王纪下','2_kings',25],['1Ch','历代志上','1_chronicles',29],['2Ch','历代志下','2_chronicles',36],['Ezr','以斯拉记','ezra',10],
 ['Neh','尼希米记','nehemiah',13],['Est','以斯帖记','esther',10],['Job','约伯记','job',42],['Psa','诗篇','psalms',150],['Pro','箴言','proverbs',31],
 ['Ecc','传道书','ecclesiastes',12],['Sng','雅歌','songs',8],['Isa','以赛亚书','isaiah',66],['Jer','耶利米书','jeremiah',52],['Lam','耶利米哀歌','lamentations',5],
 ['Ezk','以西结书','ezekiel',48],['Dan','但以理书','daniel',12],['Hos','何西阿书','hosea',14],['Jol','约珥书','joel',3],['Amo','阿摩司书','amos',9],
 ['Oba','俄巴底亚书','obadiah',1],['Jon','约拿书','jonah',4],['Mic','弥迦书','micah',7],['Nam','那鸿书','nahum',3],['Hab','哈巴谷书','habakkuk',3],
 ['Zep','西番雅书','zephaniah',3],['Hag','哈该书','haggai',2],['Zec','撒迦利亚书','zechariah',14],['Mal','玛拉基书','malachi',4],
 ['Mat','马太福音','matthew',28],['Mrk','马可福音','mark',16],['Luk','路加福音','luke',24],['Jhn','约翰福音','john',21],['Act','使徒行传','acts',28],
 ['Rom','罗马书','romans',16],['1Co','哥林多前书','1_corinthians',16],['2Co','哥林多后书','2_corinthians',13],['Gal','加拉太书','galatians',6],['Eph','以弗所书','ephesians',6],
 ['Php','腓立比书','philippians',4],['Col','歌罗西书','colossians',4],['1Th','帖撒罗尼迦前书','1_thessalonians',5],['2Th','帖撒罗尼迦后书','2_thessalonians',3],['1Ti','提摩太前书','1_timothy',6],
 ['2Ti','提摩太后书','2_timothy',4],['Tit','提多书','titus',3],['Phm','腓利门书','philemon',1],['Heb','希伯来书','hebrews',13],['Jas','雅各书','james',5],
 ['1Pe','彼得前书','1_peter',5],['2Pe','彼得后书','2_peter',3],['1Jn','约翰一书','1_john',5],['2Jn','约翰二书','2_john',1],['3Jn','约翰三书','3_john',1],['Jud','犹大书','jude',1],['Rev','启示录','revelation',22]
];
const books = rawBooks.map(([code,name,slug,chapters],index)=>({code,name,slug,chapters,testament:index<39?'旧约':'新约',order:index}));
const byBook = new Map(books.map(b=>[b.code,b]));
const namedForm = /^– (Named|Name combined|Greek|Aramaic|Spelled|Spelled combined|Aramaic combined|\(same.*)/;
const blocks = source.toString('utf8').split(/\n\$=+/).map(x=>({category:x.split(/\r?\n/)[0].trim(),lines:x.split(/\r?\n/).slice(1)}));
const excluded = [];
const records = [];
const excludedCategories = {};
const discarded = {groupForms:0,lxxRefs:0,wordOccurrencesCollapsed:0};
let sourcePersonRecords = 0, sourceHumanRecords = 0;
for(const block of blocks) {
 const head=(block.lines[0]||'').split('\t');
 if(!head[0]?.includes('@'))continue;
 if(block.category !== 'PERSON(s)') {
  const category=block.category+' / '+String(head[8]||'').trim();
  excludedCategories[category]=(excludedCategories[category]||0)+1;
  excluded.push({sourceKey:head[0],category:block.category,type:String(head[8]||'').trim(),reason:block.category==='PLACE+PERSON'?'place-person-identity-ambiguous':'outside-human-person-category'});
  continue;
 }
 sourcePersonRecords++;
 if(!['Male','Female'].includes(head[8])) { excluded.push({sourceKey:head[0],reason:'group-category'});continue; }
 sourceHumanRecords++;
 // One source record is marked Named despite being an explicitly invented,
 // anonymous connector used to pad the Matthew genealogy. Never import it.
 if(/^Unnamed#/.test(head[0])||/=[HG]0000(?:$|\s)/.test(head[0])) {
  excluded.push({sourceKey:head[0],reason:'anonymous-or-hypothetical-zero-identifier'});continue;
 }
 const forms=block.lines.filter(l=>namedForm.test(l)).map(l=>l.split('\t'));
 if(!forms.length) {excluded.push({sourceKey:head[0],reason:'no-named-form-outside-LXX-or-anonymous'});continue;}
 const [sourceKey,uStrong]=head[0].split('=');
 const englishName=sourceKey.split('@')[0];
 const aliases=new Set([englishName]);
 const refs=new Map();
 let hasVariants=false;
 for(const columns of forms) {
  const significance=columns[0];
  if(/Variant|alt\. meaning|alt Tags/.test(significance))hasVariants=true;
  const formName=columns[1].split('@')[0].split('|')[0];
  if(formName&&!/[<>]/.test(formName))aliases.add(formName);
  // Reference field 5 is authoritative; Total rows use abbreviated refs and are excluded.
  for(const token of (columns[4]||'').split(';').map(x=>x.trim()).filter(Boolean)) {
   if(token.startsWith('LXX.')) {discarded.lxxRefs++;continue;}
   const match=/^([1-3]?[A-Za-z]{2,3})\.(\d+)\.([\d,a-z]+)$/.exec(token);
   if(!match||!byBook.has(match[1]))throw new Error('Unparsed / noncanonical reference: '+head[0]+' '+token);
   const book=byBook.get(match[1]),chapter=Number(match[2]);
   if(chapter<1||chapter>book.chapters)throw new Error('Chapter outside canon: '+token);
   for(const versePart of match[3].split(',')) {
    const verseMatch=/^(\d+)([a-z])?$/.exec(versePart);
    if(!verseMatch)throw new Error('Unparsed verse: '+token);
    const verse=Number(verseMatch[1]);
    if(verse<0||verse>176||(verse===0&&book.code!=='Psa'))throw new Error('Verse outside basic bounds: '+token);
    const ref={book:book.code,chapter,verse};
    const key=book.code+'.'+chapter+'.'+verse;
    if(refs.has(key))discarded.wordOccurrencesCollapsed++;
    refs.set(key,ref);
   }
  }
 }
 if(!refs.size){excluded.push({sourceKey:head[0],reason:'no-canonical-reference'});continue;}
 const refList=[...refs.values()].sort((a,b)=>byBook.get(a.book).order-byBook.get(b.book).order||a.chapter-b.chapter||a.verse-b.verse);
 const testaments=[...new Set(refList.map(r=>byBook.get(r.book).testament))];
 const record={id:'step-'+uStrong,name:englishName,englishName,aliases:[...aliases],type:'person',gender:head[8]==='Male'?'male':'female',refs:refList,sourceKey,uStrong,source:'STEPBible TIPNR',hasVariants,testaments};
 if(uStrong==='G1216')record.identityNote='来源把《使徒行传》19:24、38的银匠底米丢与《约翰三书》12节的低米丢归为一条记录；圣经未明说他们是同一人。本站中文导读分别保留，不据此合并身份。';
 records.push(record);
 discarded.groupForms+=block.lines.filter(l=>l.startsWith('– Group')).length;
}
if(new Set(records.map(r=>r.id)).size!==records.length)throw new Error('Duplicate source individual IDs');
const referenceCount=records.reduce((n,r)=>n+r.refs.length,0);
const metadata={
 title:'圣经人物英文经文索引',
 source:'STEPBible TIPNR',author:'STEPBible / Tyndale House Cambridge',sourceUrl,sourceApiUrl:'https://api.github.com/repos/STEPBible/STEPBible-Data/git/blobs/'+SOURCE_BLOB,sourceBlob:SOURCE_BLOB,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),
 license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',retrieved:'2026-10-17',
 scope:'以66卷圣经为范围，提取源索引 PERSON(s) 中 Male/Female 且具有具名、译名或称谓形式及经文引用的记录。英文索引名沿用来源；中文译名尚未逐人映射。',
 limits:'这不是所有中文人物传记已完成的声明。源索引的同一人物归并与译本取舍属于编者判断；未具名角色没有系统收录（少数源标作称谓者保留），民族/班次、神与灵体称号、地点与人物不明条目、只见于七十士译本的条目不计入。中文简介及家谱人物另列，数量不可直接相加。',
 changes:'仅抽取标识、英文名称/别名、性别分类和明列经文；不导入父母、配偶、后裔、Description、Summary、Brief、Short、Article 等字段。不导入 Group/Mentioned/LXX addition 形式；明确排除 Unnamed# 与 Strong 0000 的匿名或假设连接人。合并同节单词出现序号 a/b；展开 Num.13.8,16 为两个节号；丢弃 LXX 前缀引用。诗篇 verse=0 保留为题注。经文沿用源索引的标准英文章节编号，和合本译名与题注编号可能有差别。对 Demetrius/G1216 添加人工核查警注：源归并不等于圣经已确认同一身份。',
 count:records.length,referenceCount,sourcePersonRecords,sourceHumanRecords,excludedHumanRecords:sourceHumanRecords-records.length,excludedGroups:sourcePersonRecords-sourceHumanRecords,
 byTestament:{旧约:records.filter(r=>r.testaments.includes('旧约')).length,新约:records.filter(r=>r.testaments.includes('新约')).length,两约均见:records.filter(r=>r.testaments.length===2).length},
 discarded,excludedCategories
};
const result={metadata,books,records};
fs.writeFileSync(path.join(__dirname,'stepbible-data.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'data.js'),'/* STEPBible / Tyndale House Cambridge, CC BY 4.0. See SOURCE.md. */\nwindow.BIBLE_PERSON_INDEX='+JSON.stringify(result).replace(/</g,'\\u003c')+';\n');
fs.writeFileSync(path.join(__dirname,'stepbible-exclusions.json'),JSON.stringify({metadata:{sourceBlob:SOURCE_BLOB,reason:'Excluded entries are retained only in audit output, not counted in the person index.'},excluded},null,2)+'\n');
console.log(JSON.stringify(metadata,null,2));
