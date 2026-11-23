(function(){
  var page=document.body.getAttribute('data-page')||'home';
  var $=function(id){return document.getElementById(id);};
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var paras=function(t){return String(t||'').split(/\n\s*\n/).filter(Boolean).map(function(p){return '<p>'+esc(p).replace(/\n/g,'<br>')+'</p>';}).join('');};
  var money=function(n){n=Number(n);return n>0?'£'+n.toLocaleString('en-GB'):'';};
  var slug=function(s){return String(s||'work').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'work';};
  var thumb=function(src){return /^\/img\/[^\/]+$/.test(src||'')?src.replace('/img/','/img/sm/'):src;};
  var getJSON=function(u){return fetch(u,{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error(u);return r.json();});};
  var SITE={};

  /* ---------- Works registry and lightbox ---------- */
  var groups={}, ids={}, used={};
  function register(group,list){
    groups[group]=list;
    list.forEach(function(w,i){
      var base='w-'+slug(w.title), id=base, n=2;
      while(used[id]){id=base+'-'+(n++);}
      used[id]=1; w._id=id; ids[id]=[group,i];
    });
  }
  function withInches(sz){
    sz=String(sz||'');if(!sz||/\bin\b|"|inch/i.test(sz))return sz;
    var m=sz.match(/(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*cm/);if(!m)return sz;
    var f=function(c){var v=c/2.54;return (Math.round(v*2)/2).toString().replace(/\.0$/,'');};
    return sz+' ('+f(parseFloat(m[1]))+' × '+f(parseFloat(m[2]))+' in)';
  }
  function caption(w){return [w.medium,withInches(w.size)].filter(Boolean).join(', ')+(w.year?(w.medium||w.size?' · ':'')+w.year:'');}
  function card(w,group,i,sell){
    if(!w||!w.image) return '';
    var right='';
    if(sell){ right=w.sold?'<span class="pr dot">Sold</span>':(w.price?'<span class="pr">'+money(w.price)+'</span>':''); }
    else if(w.sold){ right='<span class="pr">'+esc(w.note||'')+'</span>'; }
    return '<div class="work" data-sold="'+(w.sold?1:0)+'"><a href="#'+w._id+'" data-open="'+w._id+'"><img src="'+esc(thumb(w.image))+'" data-full="'+esc(w.image)+'" onerror="if(this.src.indexOf(this.dataset.full)<0){this.src=this.dataset.full}" alt="'+esc(w.title)+'" loading="lazy"></a><div class="cap"><b>'+esc(w.title)+'</b>'+right+'</div></div>';
  }

  var lb, cur=null, choice='unframed', sellGroups={paintings:1,drawings:1};
  var trackGroup=null, dragging=false, dragDX=0, moved=false;
  function buildLB(){
    lb=document.createElement('div');lb.className='lbx';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
    lb.innerHTML='<div class="stage"><span class="count"></span><div class="track"></div><button class="arrow prev" aria-label="Previous painting">&#8592;</button><button class="arrow next" aria-label="Next painting">&#8594;</button><div class="roomview"></div></div><div class="side"></div><button class="x" aria-label="Close">Close</button>';
    document.body.appendChild(lb);
    lb.querySelector('.prev').onclick=function(e){if(moved){e.preventDefault();return;}step(-1);};
    lb.querySelector('.next').onclick=function(e){if(moved){e.preventDefault();return;}step(1);};
    lb.querySelector('.x').onclick=close;
    var st=lb.querySelector('.stage'), sx=0, sy=0, axis=null;
    st.addEventListener('pointerdown',function(e){if(e.button!==0)return;dragging=true;moved=false;axis=null;sx=e.clientX;sy=e.clientY;dragDX=0;});
    window.addEventListener('pointermove',function(e){
      if(!dragging)return;var dx=e.clientX-sx,dy=e.clientY-sy;
      if(axis===null&&(Math.abs(dx)>6||Math.abs(dy)>6)){axis=Math.abs(dx)>Math.abs(dy)?'x':'y';}
      if(axis!=='x')return;
      moved=true;dragDX=dx;place(false);
    });
    window.addEventListener('pointerup',function(){
      if(!dragging)return;dragging=false;
      var w=slideW(),dx=dragDX;dragDX=0;
      if(moved&&Math.abs(dx)>Math.min(80,w*0.15)) step(dx<0?1:-1); else place(true);
      setTimeout(function(){moved=false;},0);
    });
    window.addEventListener('resize',function(){if(lb.classList.contains('open'))place(false);});
    document.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape'){if(roomOpen)setRoom(false);else close();return;}if(roomOpen)return;if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);});
  }
  function slideW(){var s=lb.querySelector('.stage');var f=window.innerWidth<=900?0.84:0.7;return s.clientWidth*f;}
  function buildTrack(){
    var g=groups[cur[0]],tr=lb.querySelector('.track');trackGroup=cur[0];
    tr.innerHTML=g.map(function(w,i){return '<div class="slide" data-i="'+i+'"><img data-src="'+esc(w.image)+'" alt="'+esc(w.title||'')+'" draggable="false"></div>';}).join('');
  }
  function loadNear(){
    var g=groups[cur[0]],sl=lb.querySelectorAll('.slide');
    for(var k=-2;k<=2;k++){var i=(cur[1]+k+g.length)%g.length,im=sl[i]&&sl[i].querySelector('img');if(im&&!im.getAttribute('src'))im.src=im.getAttribute('data-src');}
    Array.prototype.forEach.call(sl,function(s,i){s.classList.toggle('on',i===cur[1]);});
  }
  function place(anim){
    var tr=lb.querySelector('.track'),s=lb.querySelector('.stage'),w=slideW();
    Array.prototype.forEach.call(tr.children,function(c){c.style.width=w+'px';});
    var x=s.clientWidth/2-(cur[1]+0.5)*w+dragDX;
    tr.style.transition=anim?'transform .55s cubic-bezier(.2,.7,.2,1)':'none';
    tr.style.transform='translate3d('+x.toFixed(1)+'px,0,0)';
  }
  function enquireHref(w){
    var opt='';
    if(w.price&&!w.sold){
      if(w.framed_price){opt=choice==='framed'?' framed ('+money(w.framed_price)+')':' unframed ('+money(w.price)+')';}
      else opt=' ('+money(w.price)+')';
    }
    var desc=caption(w);
    var body='Hello Richard,\n\nI am interested in "'+w.title+'"'+(desc?', '+desc:'')+','+(opt?opt:'')+'.\n\nMy delivery postcode or country is: \n\nThank you,\n';
    return 'mailto:'+(SITE.email||'')+'?subject='+encodeURIComponent('Enquiry: '+w.title)+'&body='+encodeURIComponent(body.replace(',.','.'));
  }
  /* ---------- View in a room ---------- */
  var roomOpen=false, roomKind=null;
  function sizeCm(w){
    var m=String(w.size||'').match(/(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*(cm|in|ins|inches|")?/);
    if(!m) return null;
    var a=parseFloat(m[1]),b=parseFloat(m[2]),k=/in|"/.test(m[3]||'')?2.54:1;a*=k;b*=k;
    if(!(a>3&&b>3&&a<400&&b<400)) return null;
    var hi=Math.max(a,b),lo=Math.min(a,b),im=lb&&lb.querySelector('.slide.on img'),land=null;
    if(im&&im.naturalWidth) land=im.naturalWidth>=im.naturalHeight;
    if(land===null) return {h:a,w:b};
    return land?{w:hi,h:lo}:{w:lo,h:hi};
  }
  /* Real room photographs (Unsplash licence). Calibrated in photo pixels:
     ppc = pixels per cm on the wall plane, cx = centre line, base = y of the
     painting's lowest allowed edge, floor/eye = optional eye-level hanging. */
  var ROOMS={
    bedroom:{label:'Bedroom',img:'/img/rooms/chest.jpg',W:1460,H:975,ppc:5.7,cx:456,base:366,ref:'The chest of drawers is about 80 cm high.'},
    living:{label:'Living room',img:'/img/rooms/mantel.jpg',W:1460,H:1800,ppc:8.0,cx:736,base:1170,front:{img:'/img/rooms/mantel-front.png',x:876,y:604,w:511,h:868},ref:'The mantelpiece is about 1.5 m wide.'},
    studio:{label:'Studio wall',img:'/img/rooms/studio.jpg',W:1460,H:974,ppc:2.58,cx:545,floor:707,ref:'The stool is about 1 m high.'}
  };
  var BIG=100; /* studio wall only for very large pieces (longest side over 1 m) */
  function autoRoom(s){var m=Math.max(s.w,s.h);return m<=40?'bedroom':m<=BIG?'living':'studio';}
  function roomList(s){return Object.keys(ROOMS).filter(function(k){return k!=='studio'||Math.max(s.w,s.h)>BIG;});}
  function roomScene(w,kind,framed){
    var s=sizeCm(w); if(!s) return '';
    var R=ROOMS[kind], fr=framed?5:0, ow=(s.w+fr*2)*R.ppc, oh=(s.h+fr*2)*R.ppc, top;
    if(R.floor!=null){var c=Math.max(150,110+(s.h+fr*2)/2);top=R.floor-c*R.ppc-oh/2;}
    else top=R.base-oh;
    var left=R.cx-ow/2, pc=function(v,t){return (v/t*100).toFixed(3)+'%';};
    var sh=Math.max(1,R.ppc*0.5);
    return '<div class="rv-ph" data-w="'+R.W+'" data-h="'+R.H+'"><img src="'+R.img+'" alt="">'+
      '<div class="rv-art'+(fr?' fr':'')+'" style="left:'+pc(left,R.W)+';top:'+pc(top,R.H)+';width:'+pc(ow,R.W)+';height:'+pc(oh,R.H)+';padding:'+pc(fr*R.ppc,R.W)+';box-shadow:0 '+(sh*1.2).toFixed(1)+'px '+(sh*3).toFixed(1)+'px rgba(0,0,0,.28),0 '+(sh*.3).toFixed(1)+'px '+(sh*.6).toFixed(1)+'px rgba(0,0,0,.22)">'+
      '<img src="'+esc(w.image)+'" alt="'+esc(w.title)+' on the wall"></div>'+
      (R.front?'<img class="rv-front" src="'+R.front.img+'" alt="" style="left:'+pc(R.front.x,R.W)+';top:'+pc(R.front.y,R.H)+';width:'+pc(R.front.w,R.W)+';height:'+pc(R.front.h,R.H)+'">':'')+'</div>';
  }
  function fitRoom(){
    if(!lb) return; var sc=lb.querySelector('.rv-scene'),ph=lb.querySelector('.rv-ph'); if(!sc||!ph) return;
    var W=+ph.getAttribute('data-w'),H=+ph.getAttribute('data-h'),bw=sc.clientWidth,bh=sc.clientHeight-32,k=Math.min(bw/W,bh/H);
    ph.style.width=Math.round(W*k)+'px'; ph.style.height=Math.round(H*k)+'px';
  }
  window.addEventListener('resize',function(){if(roomOpen)fitRoom();});
  function renderRoom(){
    var g=groups[cur[0]], w=g[cur[1]], rv=lb.querySelector('.roomview'), s=sizeCm(w);
    var framed=!!(w.framed_price&&choice==='framed');
    var list=roomList(s); if(!roomKind||list.indexOf(roomKind)<0) roomKind=autoRoom(s);
    var R=ROOMS[roomKind];
    rv.innerHTML='<div class="rv-bar"><div class="rv-tabs" role="group" aria-label="Room">'+list.map(function(k){return '<button data-r="'+k+'" aria-pressed="'+(roomKind===k)+'">'+ROOMS[k].label+'</button>';}).join('')+'</div><button class="rv-back">Back to painting</button></div>'+
      '<div class="rv-scene">'+roomScene(w,roomKind,framed)+'</div><p class="rv-note">'+esc(w.title)+(w.size?', '+esc(withInches(w.size)):'')+(framed?', framed':'')+', shown approximately to scale. '+R.ref+'</p>';
    Array.prototype.forEach.call(rv.querySelectorAll('.rv-tabs button'),function(b){b.onclick=function(){roomKind=b.getAttribute('data-r');renderRoom();};});
    rv.querySelector('.rv-back').onclick=function(){setRoom(false);};
    fitRoom();
  }
  function setRoom(on){
    roomOpen=on; lb.classList.toggle('room',on);
    if(on) renderRoom();
    renderSide();
  }
  function renderSide(){
    var g=groups[cur[0]], w=g[cur[1]], sell=!!sellGroups[cur[0]];
    var h='<div><h2>'+esc(w.title)+'</h2></div>';
    var m=caption(w); if(m) h+='<p class="meta">'+esc(m)+'</p>';
    if(w.note&&sell) h+='<p class="note">'+esc(w.note)+'</p>';
    if(!sell&&w.note) h+='<p class="meta">'+esc(w.note)+'</p>';
    if(sell){
      if(w.sold){ h+='<p class="dot">Sold</p><p class="small">Similar work may be available. Please get in touch.</p>'; }
      else if(w.price&&w.framed_price){
        h+='<div class="opts" role="group" aria-label="Framing"><button data-c="unframed" aria-pressed="'+(choice==='unframed')+'"><small>Unframed</small><span>'+money(w.price)+'</span></button><button data-c="framed" aria-pressed="'+(choice==='framed')+'"><small>Framed</small><span>'+money(w.framed_price)+'</span></button></div>';
      } else if(w.price){ h+='<p class="price">'+money(w.price)+'</p>'; }
      if(sizeCm(w)) h+='<button class="btn ghost" data-room>'+(roomOpen?'Back to painting':'View in a room')+'</button>';
      h+='<a class="btn" href="'+esc(enquireHref(w))+'">'+(w.sold?'Get in touch':'Enquire about this painting')+'</a>';
      var tel=String(SITE.phone||'');
      h+='<p class="small">'+(tel?'Or call '+esc(tel)+'. ':'')+esc(SITE.delivery_note||'')+'</p>';
      if(w.framed_price&&!w.sold&&SITE.framing_note) h+='<p class="small">'+esc(SITE.framing_note)+'</p>';
    }
    var side=lb.querySelector('.side'); side.innerHTML=h;
    Array.prototype.forEach.call(side.querySelectorAll('.opts button'),function(b){b.onclick=function(){choice=b.getAttribute('data-c');renderSide();if(roomOpen)renderRoom();};});
    var rb=side.querySelector('[data-room]'); if(rb) rb.onclick=function(){setRoom(!roomOpen);};
  }
  function show(anim){
    var g=groups[cur[0]], w=g[cur[1]];
    if(trackGroup!==cur[0]) buildTrack();
    loadNear(); place(!!anim);
    var ci=lb.querySelector('.slide.on img'); if(ci&&!ci.complete) ci.onload=function(){if(groups[cur[0]][cur[1]]===w)renderSide();};
    lb.querySelector('.count').textContent=g.length>1?(cur[1]+1)+' / '+g.length:'';
    lb.querySelector('.prev').style.visibility=lb.querySelector('.next').style.visibility=g.length>1?'visible':'hidden';
    renderSide();
    if(location.hash!=='#'+w._id) history.replaceState(null,'','#'+w._id);
  }
  function open(id){
    var r=ids[id]; if(!r) return;
    if(!lb) buildLB();
    cur=r.slice(); choice='unframed'; roomKind=null;
    lb.classList.add('open'); document.body.classList.add('lbx-open');
    show(); lb.querySelector('.x').focus({preventScroll:true});
  }
  function step(d){roomKind=null;if(roomOpen){roomOpen=false;lb.classList.remove('room');}var g=groups[cur[0]],n=cur[1]+d,wrap=n<0||n>=g.length;cur[1]=(n+g.length)%g.length;choice='unframed';show(!wrap);}
  function close(){
    if(!lb) return;
    if(roomOpen){roomOpen=false;lb.classList.remove('room');}
    var w=groups[cur[0]][cur[1]];
    lb.classList.remove('open'); document.body.classList.remove('lbx-open');
    history.replaceState(null,'',location.pathname+location.search);
    var a=document.querySelector('[data-open="'+w._id+'"]'); if(a) a.scrollIntoView({block:'center'});
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('[data-open]'); if(!a) return;
    e.preventDefault(); open(a.getAttribute('data-open'));
  });
  window.addEventListener('hashchange',function(){var h=location.hash.slice(1);if(ids[h])open(h);});
  function openFromHash(){var h=location.hash.slice(1);if(ids[h])open(h);}

  /* ---------- Shared bits ---------- */
  function footer(){
    var f=$('foot-email'); if(f&&SITE.email){f.href='mailto:'+SITE.email;f.textContent=SITE.email;}
  }
  function archiveNav(ar){
    var has=(ar.series||[]).some(function(s){return (s.works||[]).some(function(w){return w&&w.image;});});
    var l=$('nav-archive'); if(l) l.style.display=has?'':'none';
    return has;
  }

  /* ---------- Home ---------- */
  function initHero(d){
    var bleed=$('hero');
    if(!(d.hero&&d.hero.image)){bleed.style.display='none';return;}
    register('hero',[d.hero]);
    var hi=$('hero-img');hi.src=d.hero.image;hi.alt=d.hero.title||'';
    var hc=$('hero-credit');hc.textContent=d.hero.title||'';hc.href='#'+d.hero._id;hc.setAttribute('data-open',d.hero._id);
    var h=$('headline'),words=(d.headline||'').trim().split(/\s+/);
    h.innerHTML=words.map(function(w,i){return '<span class="wd"><span style="--d:'+i+'">'+esc(w)+'</span></span>';}).join(' ');
    $('intro').textContent=d.intro||'';
    var glide=bleed.querySelector('.glide'),img=hi;
    var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    var K=1,EASE=0.07,D=0,c=null,raf=0;
    function measure(){
      glide.style.transform='none';
      var vh=window.innerHeight,top=bleed.getBoundingClientRect().top+window.scrollY;
      var B=Math.min(96,Math.max(40,window.innerWidth*0.07));
      var restBottom=glide.getBoundingClientRect().bottom+window.scrollY-top;
      D=Math.max(0,restBottom-(vh-B));
      var sEnd=top+img.offsetHeight-vh; K=sEnd>1?D/sEnd:1;
    }
    function frame(){
      var t=-(D-Math.min(D,window.scrollY*K));
      if(c===null||reduce){c=t;}else{c+=(t-c)*EASE;}
      glide.style.transform='translate3d(0,'+c.toFixed(2)+'px,0)';
      raf=Math.abs(t-c)>0.1?requestAnimationFrame(frame):0;
    }
    function reset(){measure();c=null;frame();}
    function start(){reset();bleed.classList.add('ready');}
    if(img.complete&&img.naturalWidth)start();else{img.addEventListener('load',start);img.addEventListener('error',start);}
    window.addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(frame);},{passive:true});
    window.addEventListener('resize',reset);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(reset);
  }
  function initWelcome(d){
    var wp=d.welcome_photo||{};
    if(wp.image){$('w-img').src=wp.image;$('w-cap').innerHTML=wp.caption?'<span>'+esc(wp.caption)+'</span>':'';}
    else{document.querySelector('.w-photo').style.display='none';}
    $('w-body').innerHTML=paras(d.welcome_text);
  }
  function initHome(d){
    initHero(d);
    initWelcome(d);
    var news=(d.news||[]).filter(function(n){return n&&n.title;});
    if(news.length){
      $('news').style.display='';
      $('news-list').innerHTML=news.map(function(n){return '<article>'+(n.date?'<time>'+esc(n.date)+'</time>':'')+'<h3>'+esc(n.title)+'</h3>'+(n.text?'<p>'+esc(n.text)+'</p>':'')+(n.link?'<a class="go" href="'+esc(n.link)+'">Find out more</a>':'')+'</article>';}).join('');
    }
    $('paintings-heading').textContent=d.paintings_heading||'';
    $('paintings-intro').textContent=d.paintings_intro||'';
    var list=(d.paintings||[]).filter(function(w){return w&&w.image;});
    register('paintings',list);
    var grid=$('paintings-grid');
    grid.innerHTML=list.map(function(w,i){return card(w,'paintings',i,true);}).join('');
    var sold=list.filter(function(w){return w.sold;}).length;
    if(sold){
      var f=$('filter'); f.style.display='';
      f.innerHTML='<button data-f="all" aria-pressed="true">All '+list.length+'</button><button data-f="avail" aria-pressed="false">Available '+(list.length-sold)+'</button><button data-f="sold" aria-pressed="false">Sold '+sold+'</button>';
      f.onclick=function(e){var b=e.target.closest('button');if(!b)return;var v=b.getAttribute('data-f');
        Array.prototype.forEach.call(f.children,function(x){x.setAttribute('aria-pressed',x===b);});
        Array.prototype.forEach.call(grid.children,function(c){var s=c.getAttribute('data-sold')==='1';c.style.display=(v==='all'||(v==='sold'&&s)||(v==='avail'&&!s))?'':'none';});};
    }
    var dr=(d.drawings||[]).filter(function(w){return w&&w.image;});
    if(dr.length){register('drawings',dr);$('drawings').style.display='';$('drawings-intro').textContent=d.drawings_intro||'';
      $('drawings-grid').innerHTML=dr.map(function(w,i){return card(w,'drawings',i,true);}).join('');}
    var tel=String(d.phone||'').replace(/\(0\)/g,'').replace(/[^0-9+]/g,'').replace(/^0/,'+44');
    $('contact-line').innerHTML='To buy a painting or arrange a studio visit, call <a href="tel:'+esc(tel)+'">'+esc(d.phone)+'</a> or email <a href="mailto:'+esc(d.email)+'">'+esc(d.email)+'</a>';
    $('address').innerHTML=esc(d.address).replace(/\n/g,'<br>');
  }

  /* ---------- About ---------- */
  function list(items){return (items||[]).map(function(x){return '<li>'+esc(x.name)+(x.note?' <span>'+esc(x.note)+'</span>':'')+'</li>';}).join('');}
  function initAbout(d,ex){
    $('about-lede').textContent=d.about_lede||'';
    $('about-text').innerHTML=paras(d.about_text);
    $('societies').innerHTML=list(d.societies);
    $('collections').innerHTML=list(d.collections);
    var shows=(ex.shows||[]).slice(0,5).map(function(s){return {name:s.venue,note:[s.year,s.solo?'solo':''].filter(Boolean).join(', ')};});
    $('recent').innerHTML=list(shows);
    var films=(d.films||[]).filter(function(f){return f&&f.title;});
    if(!films.length) $('film').style.display='none';
    $('films').innerHTML=films.map(function(f){return '<a href="'+esc(f.url)+'" target="_blank" rel="noopener"><h3>'+esc(f.title)+'</h3><p>'+esc(f.text)+'</p><span class="go">Watch on YouTube ↗</span></a>';}).join('');
  }

  /* ---------- Exhibitions ---------- */
  function initExhibitions(ex){
    $('ex-intro').textContent=ex.intro||'';
    $('regular').innerHTML=list(ex.regular);
    $('shows').innerHTML=(ex.shows||[]).filter(function(s){return s&&(s.venue||s.title);}).map(function(s){
      var t=(s.title?'<em>'+esc(s.title)+'</em>, ':'')+esc(s.venue||'');
      if(s.link) t='<a href="'+esc(s.link)+'">'+t+'</a>';
      return '<div class="exrow"><span class="y">'+esc(s.year||'')+'</span><span class="t">'+t+'</span><span class="tag">'+(s.solo?'Solo':'')+'</span></div>';
    }).join('');
  }

  /* ---------- Archive ---------- */
  function initArchive(ar){
    $('ar-intro').textContent=ar.intro||'';
    var out='';
    (ar.series||[]).forEach(function(s,k){
      var works=(s.works||[]).filter(function(w){return w&&w.image;});
      register('s'+k,works);
      out+='<div class="series" id="'+esc(slug(s.title))+'"><div class="head"><div class="label">'+esc(s.years||'')+'</div><div><h2>'+esc(s.title)+'</h2>'+(s.intro?'<p class="intro">'+esc(s.intro)+'</p>':'')+'</div></div>'+
        (works.length?'<div class="gallery">'+works.map(function(w,i){return card(w,'s'+k,i,false);}).join('')+'</div>':'<p class="empty">Images of this work are being added.</p>')+'</div>';
    });
    $('series').innerHTML=out;
  }

  /* ---------- Boot ---------- */
  var need=[getJSON('/data/site.json'),getJSON('/data/archive.json').catch(function(){return {};})];
  if(page==='about'||page==='exhibitions') need.push(getJSON('/data/exhibitions.json').catch(function(){return {};}));
  Promise.all(need).then(function(r){
    SITE=r[0]; var ar=r[1]||{}; var ex=r[2]||{};
    archiveNav(ar); footer();
    var nd=$('nav-drawings'); if(nd&&(SITE.drawings||[]).some(function(w){return w&&w.image;})) nd.style.display='';
    if(page==='home') initHome(SITE);
    if(page==='about') initAbout(SITE,ex);
    if(page==='exhibitions') initExhibitions(ex);
    if(page==='archive') initArchive(ar);
    openFromHash();
  }).catch(function(){var m=$('load-error');if(m)m.style.display='';});
})();
