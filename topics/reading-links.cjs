'use strict';
// WeDevote's own resource pages use wdbible://bible/eph.1.6 and
// wdbible://bible/act.2.24-act.2.25. Build links only for supported books;
// do not turn an unknown reference into a guessed destination.
const books={
  '创世记':['gen','genesis',50],'申命记':['deu','deuteronomy',34],
  '约伯记':['job','job',42],'诗篇':['psa','psalms',150],'箴言':['pro','proverbs',31],
  '传道书':['ecc','ecclesiastes',12],'哈巴谷书':['hab','habakkuk',3],
  '马太福音':['mat','matthew',28],'马可福音':['mrk','mark',16],'路加福音':['luk','luke',24],
  '使徒行传':['act','acts',28],'罗马书':['rom','romans',16],
  '哥林多前书':['1co','1_corinthians',16],'哥林多后书':['2co','2_corinthians',13],
  '加拉太书':['gal','galatians',6],'以弗所书':['eph','ephesians',6],
  '腓立比书':['php','philippians',4],'歌罗西书':['col','colossians',4],
  '提摩太前书':['1ti','1_timothy',6],'提摩太后书':['2ti','2_timothy',4],
  '希伯来书':['heb','hebrews',13],'雅各书':['jas','james',5]
};
const names=Object.keys(books).sort((a,b)=>b.length-a.length);
function parseScripture(scripture,existingRefs=[]){
  if(typeof scripture!=='string'||!scripture.trim())return [];
  const text=scripture.replace(/[：]/g,':').replace(/[–—~～]/g,'-').replace(/[，、]/g,',');
  const result=[];let book=null,chapter=null,verseMode=false;
  for(const group of text.split(/[;；+＋]/)){
    if(!group.trim())return [];
    let first=true;
    for(let token of group.split(',')){
      token=token.trim();if(!token)return [];
      const name=names.find(name=>token.startsWith(name));
      if(name){book=name;token=token.slice(name.length).trim();chapter=null;verseMode=false;}
      if(!book)return [];
      let verseSpec=null;
      const explicit=/^(\d+)\s*:\s*(.+)$/.exec(token);
      if(explicit){chapter=Number(explicit[1]);verseSpec=explicit[2];verseMode=true;}
      else if(!first&&verseMode){verseSpec=token;}
      else {if(!/^\d+$/.test(token))return [];chapter=Number(token);verseMode=false;}
      const [code,slug,maxChapter]=books[book];
      if(!Number.isInteger(chapter)||chapter<1||chapter>maxChapter)return [];
      let start=1,end=null,endChapter=chapter;
      if(verseSpec!==null){
        const range=/^(\d+)(?:\s*-\s*(?:(\d+)\s*:\s*)?(\d+))?$/.exec(verseSpec);
        if(!range)return [];
        start=Number(range[1]);if(range[3]){end=Number(range[3]);endChapter=range[2]?Number(range[2]):chapter;}
        if(start<1||start>176||end!==null&&(end<1||end>176||endChapter<chapter||endChapter>maxChapter||endChapter===chapter&&end<start))return [];
      }
      const suffix=verseSpec===null?'':':'+start+(end===null?'':'-'+(endChapter===chapter?'':endChapter+':')+end);
      const label=book+' '+chapter+suffix,webUrl='https://cnbible.com/cus/'+slug+'/'+chapter+'.htm';
      // Reuse the existing chapter reader where available. App and web links
      // remain separate, so an absent app never triggers a timed redirect.
      const source=Array.isArray(existingRefs)?existingRefs.find(ref=>ref.url===webUrl):null;
      const appUrl='wdbible://bible/'+code+'.'+chapter+'.'+start+(end===null?'':'-'+code+'.'+endChapter+'.'+end);
      result.push({label,webUrl:source?.url||webUrl,appUrl});first=false;
    }
  }
  return result;
}
module.exports={parseScripture};
