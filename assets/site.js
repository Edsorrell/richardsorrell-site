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
  function caption(w){return [w.medium,w.size].filter(Boolean).join(', ')+(w.year?(w.medium||w.size?' · ':'')+w.year:'');}
  function card(w,group,i,sell){
    if(!w||!w.image) return '';
    var right='';
    if(sell){ right=w.sold?'<span class="pr dot">Sold</span>':(w.price?'<span class="pr">'+money(w.price)+'</span>':''); }
    else if(w.sold){ right='<span class="pr">'+esc(w.note||'')+'</span>'; }
    return '<div class="work" data-sold="'+(w.sold?1:0)+'"><a href="#'+w._id+'" data-open="'+w._id+'"><img src="'+esc(thumb(w.image))+'" data-full="'+esc(w.image)+'" onerror="if(this.src.indexOf(this.dataset.full)<0){this.src=this.dataset.full}" alt="'+esc(w.title)+'" loading="lazy"></a><div class="cap"><b>'+esc(w.title)+'</b>'+right+'</div></div>';
  }

  var lb, cur=null, choice='unframed', sellGroups={paintings:1,drawings:1};
  function buildLB(){
    lb=document.createElement('div');lb.className='lbx';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
    lb.innerHTML='<div class="stage"><span class="count"></span><button class="arrow prev" aria-label="Previous painting">&#8592;</button><img alt=""><button class="arrow next" aria-label="Next painting">&#8594;</button></div><div class="side"></div><button class="x" aria-label="Close">Close</button>';
    document.body.appendChild(lb);
    lb.querySelector('.prev').onclick=function(){step(-1);};
    lb.querySelector('.next').onclick=function(){step(1);};
    lb.querySelector('.x').onclick=close;
    var sx=null;
    var st=lb.querySelector('.stage');
    st.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
    st.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)step(dx<0?1:-1);sx=null;});
    document.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);});
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
      h+='<a class="btn" href="'+esc(enquireHref(w))+'">'+(w.sold?'Get in touch':'Enquire about this painting')+'</a>';
      var tel=String(SITE.phone||'');
      h+='<p class="small">'+(tel?'Or call '+esc(tel)+'. ':'')+esc(SITE.delivery_note||'')+'</p>';
      if(w.framed_price&&!w.sold&&SITE.framing_note) h+='<p class="small">'+esc(SITE.framing_note)+'</p>';
    }
    var side=lb.querySelector('.side'); side.innerHTML=h;
    Array.prototype.forEach.call(side.querySelectorAll('.opts button'),function(b){b.onclick=function(){choice=b.getAttribute('data-c');renderSide();};});
  }
  function show(){
    var g=groups[cur[0]], w=g[cur[1]];
    var img=lb.querySelector('.stage img'); img.src=w.image; img.alt=w.title||'';
    lb.querySelector('.count').textContent=g.length>1?(cur[1]+1)+' / '+g.length:'';
    lb.querySelector('.prev').style.visibility=lb.querySelector('.next').style.visibility=g.length>1?'visible':'hidden';
    renderSide();
    if(location.hash!=='#'+w._id) history.replaceState(null,'','#'+w._id);
    var n=g[(cur[1]+1)%g.length]; if(n){var pre=new Image();pre.src=n.image;}
  }
  function open(id){
    var r=ids[id]; if(!r) return;
    if(!lb) buildLB();
    cur=r.slice(); choice='unframed';
    lb.classList.add('open'); document.body.classList.add('lbx-open');
    show(); lb.querySelector('.x').focus({preventScroll:true});
  }
  function step(d){var g=groups[cur[0]];cur[1]=(cur[1]+d+g.length)%g.length;choice='unframed';show();}
  function close(){
    if(!lb) return;
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
