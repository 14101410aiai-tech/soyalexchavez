/* ============================================================
   ALEX v3.1 — AMAZEMENT LAYER motion engine (additive)
   Load order (end of body): gsap → ScrollTrigger → SplitText →
   [CustomEase] → [DrawSVGPlugin] → [lenis] → lang.js → site.js → v31.js
   Bracketed plugins are OPTIONAL (soft-required since the v3.1 fix lane):
   a weight-critical page (empieza-aqui) may drop them — the engine
   feature-detects and falls back (stock ease / flourish rests drawn /
   native scroll).
   site.js decides the mode (html.motion / html.static) — this file
   respects that decision and adds the v3.1 pattern modules only.
   Every pattern is data-attribute / class driven; pages opt in:
     [data-v31-kinetic]           kinetic VF headline (="load" for hero)
     [data-v31-assembly]          scroll-scrubbed word assembly
     [data-v31-blurpair]          blur→focus paired statement (q + a children)
     .v31-room                    spotlight room (pinned scrub showcase)
     .v31-scrap                   scrapbook collage (+ .v31-sig DrawSVG flourish)
     .v31-fan                     card fan (entrance; hover is pure CSS)
     .v31-flip                    polarity flip (html.v31-light nav inversion)
     [data-v31-num]               giant-numeral odometer
     [data-v31-loader]            loader-as-signature (body attr; session-gated)
   THE HOUSE EASING: 'alexEase' — soft, warm, ~2.5% overshoot.
   Every module uses it. Durations: AlexV31.D  (xs .35 · s .65 · m 1.05 · l 1.6)
   ============================================================ */
(function(){
  var d=document,root=d.documentElement;
  if(typeof gsap==='undefined'||!root.classList.contains('motion'))return; /* site.js chose static */

  /* Optional plugins are SOFT-REQUIRED (v3.1 fix lane, Gate C #1): a page may
     ship only gsap + ScrollTrigger + SplitText. CustomEase → fall back to a
     stock warm ease; DrawSVG → flourish rests at its final CSS state (drawn);
     Lenis → native scroll. Core plugins stay hard requirements. */
  var HAS_CE=typeof CustomEase!=='undefined',
      HAS_DRAW=typeof DrawSVGPlugin!=='undefined';
  var plugins=[ScrollTrigger,SplitText];
  if(HAS_CE)plugins.push(CustomEase);
  if(HAS_DRAW)plugins.push(DrawSVGPlugin);
  gsap.registerPlugin.apply(gsap,plugins);

  /* ---------- the house curve + standard durations ---------- */
  if(HAS_CE){CustomEase.create('alexEase','M0,0 C0.19,0.53 0.31,1.025 0.54,1.025 0.77,1.025 0.86,1 1,1');}
  var EASE=HAS_CE?'alexEase':'power2.out';   /* fallback: soft warm arrival, no overshoot */
  var D={xs:.35,s:.65,m:1.05,l:1.6};
  gsap.defaults({ease:EASE,duration:D.m});

  /* ---------- #14 damped luxury scroll (fine pointers only; native on touch) ---------- */
  var lenis=null;
  if(typeof Lenis!=='undefined'&&window.matchMedia('(pointer:fine)').matches&&!('ontouchstart' in window)){
    lenis=new Lenis({autoRaf:false,lerp:.11});
    lenis.on('scroll',ScrollTrigger.update);
    gsap.ticker.add(function(t){lenis.raf(t*1000);});
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- #10 loader-as-signature (once per session, ≤1.6s, never a fake delay) ----------
     CHOREOGRAPHY (fix lane, Gate A #1): on the ONE visit where the loader plays,
     the kinetic hero entrance must wait for the loader's onComplete instead of
     playing hidden behind the overlay. loaderGate resolves at overlay lift;
     it is null when no loader plays (kinetics use the normal .4s delay). */
  var loaderGate=null;
  (function loader(){
    var phrase=d.body.getAttribute('data-v31-loader');
    if(!phrase)return;
    var seen=false;
    try{seen=sessionStorage.getItem('v31_loader')==='1';}catch(e){}
    if(seen&&location.hash.indexOf('loader')===-1)return;
    try{sessionStorage.setItem('v31_loader','1');}catch(e){}
    var gateResolve=null;
    loaderGate=new Promise(function(res){gateResolve=res;});
    var o=d.createElement('div');o.className='v31-loader';o.setAttribute('aria-hidden','true');
    o.innerHTML='<svg viewBox="0 0 220 220"><defs><path id="v31lp" d="M110,110 m-84,0 a84,84 0 1,1 168,0 a84,84 0 1,1 -168,0"/></defs>'+
      '<text><textPath href="#v31lp" textLength="526" lengthAdjust="spacing">'+(phrase+' · ').repeat(2)+'</textPath></text></svg>'+
      '<span class="v31-loader__mark">A.</span>';
    d.body.appendChild(o);
    var ring=o.querySelector('svg');
    gsap.set(ring,{transformOrigin:'50% 50%'});
    var spin=gsap.to(ring,{rotation:120,duration:2.6,ease:'none'});
    gsap.timeline({onComplete:function(){spin.kill();o.remove();gateResolve();}})
      .from(ring,{scale:.86,autoAlpha:0,duration:D.s})
      .from('.v31-loader__mark',{autoAlpha:0,y:8,duration:D.s},'<.1')
      .to(o,{autoAlpha:0,duration:D.xs,delay:.55,onStart:function(){gateResolve();}}); /* hero starts as the veil lifts */
  })();

  /* ---------- #3 kinetic VF headline (squash-stretch on the width axis) ----------
     TYPE-REST RULE (2026-07-30): extremes are transient — chars fly in from
     extended-light (wdth 150 / wght 260) and SETTLE at the readable rest state
     (wdth 97 / wght 700, matching the CSS defaults). Never rest condensed.
     MUST be a fromTo with EXPLICIT end values: gsap.from() cannot parse the
     current value of these CSS vars (reads 0) — the old from-tween therefore
     settled at wdth 0/wght 0, clamped by the font to 50/100 = the unreadable
     hairline Conrad screenshotted. Probed + proven 2026-07-30. */
  var kineticSplits=[];
  function kinetics(){
    gsap.utils.toArray('[data-v31-kinetic]').forEach(function(el){
      var onLoad=el.getAttribute('data-v31-kinetic')==='load';
      var sp=SplitText.create(el,{type:'words,chars',charsClass:'v31-k',aria:'auto'});
      kineticSplits.push(sp);
      var fromVars={'--kd':150,'--kw':260,yPercent:46,scaleY:.62,autoAlpha:0},
          toVars={
            '--kd':97,'--kw':700,yPercent:0,scaleY:1,autoAlpha:1,
            duration:D.m,stagger:{each:.028,from:'start'},
            immediateRender:true
          };
      if(onLoad){
        if(loaderGate){toVars.paused=true;toVars.delay=.05;} /* wait for the loader's lift (Gate A #1) */
        else{toVars.delay=.4;}
      }
      else{toVars.scrollTrigger={trigger:el,start:'top 82%',once:true};}
      var tw=gsap.fromTo(sp.chars,fromVars,toVars);
      if(onLoad&&loaderGate){loaderGate.then(function(){tw.play();});}
    });
  }

  /* ---------- #2 scroll-scrubbed word assembly (the manifesto under the thumb) ---------- */
  var assemblySplits=[];
  function assemblies(){
    gsap.utils.toArray('[data-v31-assembly]').forEach(function(el){
      var sp=SplitText.create(el,{type:'words',wordsClass:'v31-w',aria:'auto'});
      assemblySplits.push(sp);
      gsap.from(sp.words,{
        x:function(){return gsap.utils.random(-90,90);},
        y:function(){return gsap.utils.random(-110,150);},
        rotation:function(){return gsap.utils.random(-26,26);},
        autoAlpha:.08,
        ease:EASE,
        stagger:{each:.02,from:'random'},
        scrollTrigger:{trigger:el,start:'top 86%',end:'top 30%',scrub:1}
      });
    });
  }

  /* ---------- #4 blur→focus paired statement (recordatorio device) ---------- */
  function blurpairs(){
    gsap.utils.toArray('[data-v31-blurpair]').forEach(function(el){
      var q=el.querySelector('.v31-blurpair__q'),a=el.querySelector('.v31-blurpair__a');
      if(!q||!a)return;
      gsap.timeline({scrollTrigger:{trigger:el,start:'top 78%',end:'top 26%',scrub:.6}})
        .fromTo(q,{filter:'blur(0px)',opacity:1},{filter:'blur(5px)',opacity:.32,ease:'none'},0)
        .fromTo(a,{filter:'blur(9px)',opacity:.18},{filter:'blur(0px)',opacity:1,ease:'none'},.12);
    });
  }

  /* ---------- #1 spotlight room (pinned scrub; one item in the light) ---------- */
  function rooms(){
    gsap.utils.toArray('.v31-room').forEach(function(room){
      var items=gsap.utils.toArray(room.querySelectorAll('.v31-room__item'));
      if(items.length<2)return;
      room.classList.add('is-live');
      var counter=room.querySelector('[data-v31-room-counter]');
      gsap.set(items[0],{autoAlpha:1});
      var tl=gsap.timeline({scrollTrigger:{
        trigger:room,start:'top top',end:'+='+(items.length*85)+'%',
        pin:true,scrub:.6,
        onUpdate:function(self){
          if(!counter)return;
          var i=Math.min(items.length-1,Math.round(self.progress*(items.length-1)));
          counter.textContent=(i+1)+'/'+items.length;
        }
      }});
      items.forEach(function(it,i){
        if(i===0)return;
        tl.to(items[i-1],{autoAlpha:0,scale:.94,filter:'blur(6px)',duration:1},'+=.35')
          .fromTo(it,{autoAlpha:0,scale:1.06,filter:'blur(7px)'},
                     {autoAlpha:1,scale:1,filter:'blur(0px)',duration:1},'<.2');
      });
    });
  }

  /* ---------- #5 scrapbook entrances + DrawSVG flourish ---------- */
  function scrapbooks(){
    gsap.utils.toArray('.v31-scrap__item').forEach(function(it,i){
      gsap.from(it,{y:34,autoAlpha:0,rotation:0,duration:D.m,delay:(i%3)*.08,
        scrollTrigger:{trigger:it,start:'top 88%',once:true}});
    });
    if(HAS_DRAW){   /* soft-required: without DrawSVG the flourish rests drawn (final CSS state) */
      gsap.utils.toArray('.v31-sig path').forEach(function(p){
        gsap.from(p,{drawSVG:0,duration:D.l,
          scrollTrigger:{trigger:p.closest('svg'),start:'top 85%',once:true}});
      });
    }
  }

  /* ---------- #7 card fan entrance (hover lift is pure CSS) ---------- */
  function fans(){
    gsap.utils.toArray('.v31-fan').forEach(function(fan){
      var cards=fan.querySelectorAll('.v31-fan__card');
      gsap.from(cards,{
        '--fx':'0px','--fr':'0deg',y:44,autoAlpha:0,
        duration:D.l,stagger:{each:.07,from:'center'},
        scrollTrigger:{trigger:fan,start:'top 80%',once:true}
      });
    });
  }

  /* ---------- #8 polarity flip → nav inversion ----------
     Band widened (fix lane, Gate A #6): the old top/bottom 12% window meant the
     dark nav floated over the light chapter through most of its dwell. */
  function flips(){
    gsap.utils.toArray('.v31-flip').forEach(function(sec){
      ScrollTrigger.create({trigger:sec,start:'top 60%',end:'bottom 40%',
        onToggle:function(self){root.classList.toggle('v31-light',self.isActive);}});
    });
  }

  /* ---------- #13 giant-numeral odometer (hand-rolled digit columns) ---------- */
  function numerals(){
    gsap.utils.toArray('[data-v31-num]').forEach(function(el){
      var target=(el.getAttribute('data-v31-num')||el.textContent).trim();
      el.setAttribute('aria-label',target);
      el.textContent='';
      var strips=[];
      target.split('').forEach(function(ch){
        if(!/\d/.test(ch)){
          var s=d.createElement('span');s.className='v31-num__sep';
          s.setAttribute('aria-hidden','true');s.textContent=ch;el.appendChild(s);return;
        }
        var col=d.createElement('span');col.className='v31-num__col';col.setAttribute('aria-hidden','true');
        var strip=d.createElement('span');strip.className='v31-num__strip';
        for(var i=0;i<=9;i++){var g=d.createElement('span');g.textContent=i;strip.appendChild(g);}
        strip.dataset.digit=ch;col.appendChild(strip);el.appendChild(col);strips.push(strip);
      });
      gsap.fromTo(strips,{yPercent:0},{
        yPercent:function(i,t){return -10*parseInt(t.dataset.digit,10);},
        duration:D.l,stagger:.12,
        scrollTrigger:{trigger:el,start:'top 85%',once:true}
      });
    });
  }

  /* ---------- language change: rebuild text splits (mirrors site.js) ---------- */
  d.addEventListener('ac:langwillchange',function(){
    kineticSplits.concat(assemblySplits).forEach(function(s){try{s.revert();}catch(e){}});
    kineticSplits=[];assemblySplits=[];
  });
  d.addEventListener('ac:langchange',function(){
    kinetics();assemblies();ScrollTrigger.refresh();
  });

  /* ---------- init after fonts so splits + VF axes measure true ---------- */
  function init(){
    kinetics();assemblies();blurpairs();rooms();scrapbooks();fans();flips();numerals();
    ScrollTrigger.refresh();
    window.__v31Mode='motion';
  }
  if(d.fonts&&d.fonts.ready){d.fonts.ready.then(init);}else{init();}

  /* ---------- page-builder API ---------- */
  window.AlexV31={ease:'alexEase',D:D,lenis:lenis};
})();
