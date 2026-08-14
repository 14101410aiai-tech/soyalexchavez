/* ============================================================
   ALEX v3 — shared site behaviour (foundation)
   Load order (end of body): gsap → ScrollTrigger → SplitText →
   lang.js → site.js.  NATIVE scroll only (no Lenis — banned).
   Everything is data-attribute driven; pages opt in declaratively:
     [data-spot]            spotlight section (scrubbed illumination)
     [data-spot="hero"]     spotlight lifts on load, not on scroll
     data-spot-start/-end   optional ScrollTrigger positions
     [data-split]           SplitText masked line rise on scroll
     [data-split="load"]    same, on page load (hero headline)
     [data-rise]            quiet fade-rise on scroll
     .reminder              automatic entrance (rise + blur resolve)
     [data-hero]            the section after which the CTA bar shows
     [data-cta-bar]         the sticky quiet CTA bar
   Modes: html.motion (GSAP active) · html.static (reduced-motion /
   no GSAP / #force-reveal harness — final CSS states, no animation).
   ============================================================ */
(function(){
  var d=document,root=d.documentElement;

  /* ---------- mobile menu (works in every mode) ---------- */
  var navBtn=d.querySelector('.nav-toggle'),menu=d.querySelector('.menu-panel');
  if(navBtn&&menu){
    var setNav=function(open){
      d.body.classList.toggle('nav-open',open);
      navBtn.setAttribute('aria-expanded',open?'true':'false');
    };
    navBtn.addEventListener('click',function(){setNav(!d.body.classList.contains('nav-open'));});
    menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){setNav(false);});});
    d.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&d.body.classList.contains('nav-open')){setNav(false);navBtn.focus();}
    });
  }

  /* ---------- mode gate ---------- */
  var forceReveal=location.hash.indexOf('force-reveal')!==-1;
  if(forceReveal){
    root.classList.add('fr');
    d.querySelectorAll('img[loading="lazy"]').forEach(function(im){im.loading='eager';});
  }
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(forceReveal||reduced||typeof gsap==='undefined'){
    root.classList.add('static');
    window.__pageMode='static';
    return; /* final states live in CSS: lit spots, visible text, shown CTA bar */
  }
  root.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger,SplitText);

  /* ---------- header scrim ---------- */
  var head=d.querySelector('.site-head');
  if(head){ScrollTrigger.create({start:80,toggleClass:{targets:head,className:'scrolled'}});}

  /* ---------- SPOTLIGHT ENGINE ----------
     Scrubs --spot 0→1 so the reader's scroll IS the light switch.
     tokens.css defaults --spot:1, so only motion mode ever darkens. */
  gsap.utils.toArray('[data-spot]').forEach(function(sec){
    if(sec.getAttribute('data-spot')==='hero'){
      gsap.fromTo(sec,{'--spot':0},{'--spot':1,duration:2.2,ease:'power2.out',delay:.3});
    }else{
      gsap.fromTo(sec,{'--spot':0},{'--spot':1,ease:'none',
        scrollTrigger:{
          trigger:sec,
          start:sec.getAttribute('data-spot-start')||'top 78%',
          end:sec.getAttribute('data-spot-end')||'top 28%',
          scrub:true
        }});
    }
  });

  /* ---------- SplitText masked line reveals ----------
     Rebuilt on language change (lang.js fires ac:langwillchange
     BEFORE swapping innerHTML, ac:langchange after). */
  var splits=[];
  function buildSplits(){
    gsap.utils.toArray('[data-split]').forEach(function(el){
      var onLoad=el.getAttribute('data-split')==='load';
      var sp=SplitText.create(el,{type:'lines',mask:'lines',autoSplit:true,
        onSplit:function(self){
          var vars={yPercent:112,duration:1.15,stagger:.09,ease:'expo.out'};
          if(onLoad){vars.delay=.35;}
          else{vars.scrollTrigger={trigger:el,start:'top 84%',once:true};}
          return gsap.from(self.lines,vars);
        }});
      splits.push(sp);
    });
  }
  d.addEventListener('ac:langwillchange',function(){
    splits.forEach(function(s){try{s.revert();}catch(e){}});
    splits=[];
  });
  d.addEventListener('ac:langchange',function(){
    buildSplits();
    ScrollTrigger.refresh();
  });

  /* ---------- reminder cards + generic rises ---------- */
  function entrances(){
    gsap.utils.toArray('.reminder').forEach(function(card){
      gsap.from(card,{y:26,autoAlpha:0,filter:'blur(7px)',duration:1.15,ease:'expo.out',
        scrollTrigger:{trigger:card,start:'top 86%',once:true}});
    });
    gsap.utils.toArray('[data-rise]').forEach(function(el){
      gsap.from(el,{y:18,autoAlpha:0,duration:.95,ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 88%',once:true}});
    });
  }

  /* ---------- sticky quiet CTA bar: show after hero ---------- */
  var bar=d.querySelector('[data-cta-bar]');
  var hero=d.querySelector('[data-hero]')||d.querySelector('main > section');
  if(bar&&hero){
    ScrollTrigger.create({
      trigger:hero,start:'bottom 65%',
      onEnter:function(){bar.classList.add('is-shown');},
      onLeaveBack:function(){bar.classList.remove('is-shown');}
    });
  }

  /* ---------- init after fonts so line-splits measure true ---------- */
  function init(){buildSplits();entrances();window.__pageMode='motion';}
  if(d.fonts&&d.fonts.ready){d.fonts.ready.then(init);}else{init();}
})();

/* Kit form wiring (pre-launch, 2026-08-14): AJAX submit to Kit, inline success.
   Forms opt in with [data-kit]; per-form success copy in data-kit-success. */
document.querySelectorAll("form[data-kit]").forEach(function(f){
  f.addEventListener("submit", function(e){
    e.preventDefault();
    var btn = f.querySelector("button[type=submit],button:not([type])");
    if (btn) { btn.disabled = true; btn.setAttribute("aria-busy","true"); }
    fetch(f.action, { method:"POST", headers:{ "Accept":"application/json" }, body:new FormData(f) })
      .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json().catch(function(){return {};}); })
      .then(function(){
        var p = document.createElement("p");
        p.className = "kit-ok";
        p.setAttribute("role","status");
        p.style.cssText = "font-size:1rem;line-height:1.6;color:inherit;";
        p.textContent = f.getAttribute("data-kit-success") || "Listo 🤍 Revisa tu correo.";
        f.replaceChildren(p);
      })
      .catch(function(){
        if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); }
        var err = f.querySelector(".kit-err");
        if (!err) {
          err = document.createElement("p");
          err.className = "kit-err";
          err.setAttribute("role","alert");
          err.style.cssText = "font-size:.85rem;margin-top:.5rem;color:#FF5364;";
          f.appendChild(err);
        }
        err.textContent = "Algo falló — inténtalo otra vez.";
      });
  });
});
