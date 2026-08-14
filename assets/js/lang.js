/* ============================================================
   ALEX v3 — ES/EN language engine (foundation)
   Mechanism carried over from v2 app.js (persisted toggle, aria
   states) but upgraded to a data-i18n KEY system:

   1. Each page embeds its dictionary BEFORE the scripts:
        <script type="application/json" id="i18n">
        {"hero.h1":{"es":"…","en":"…"}, …}
        </script>
      Every key holds BOTH languages. The JSON is the copy source
      of truth; the ES text in the HTML is the no-JS fallback and
      MUST match the "es" value of its key.
   2. Elements opt in:  <h1 data-i18n="hero.h1">…es text…</h1>
      Values may contain inline markup (e.g. <span class="qo">¿</span>).
   3. Attributes:  data-i18n-attr="placeholder:form.ph;aria-label:form.al"
   4. Toggle buttons: <button data-lang-btn="es|en"> (lang-pill).
   5. Persistence: localStorage "ac_lang" (v2 key kept). Default: es.
   6. Events on document: "ac:langwillchange" (before DOM swap) and
      "ac:langchange" (after) — site.js uses them to rebuild SplitText.
   7. Test hooks: window.__setLang('en') / window.__getLang().
   MUST load AFTER the i18n JSON and BEFORE site.js.
   ============================================================ */
(function(){
  var d=document,root=d.documentElement;
  var STORE='ac_lang';
  var dict={};
  var holder=d.getElementById('i18n');
  if(holder){try{dict=JSON.parse(holder.textContent);}catch(e){dict={};}}

  var saved=null;
  try{saved=localStorage.getItem(STORE);}catch(e){}
  var lang=(saved==='en'||saved==='es')?saved:'es';

  function t(key,l){
    var entry=dict[key];
    return (entry&&typeof entry[l]==='string')?entry[l]:null;
  }

  function apply(l){
    d.querySelectorAll('[data-i18n]').forEach(function(node){
      var v=t(node.getAttribute('data-i18n'),l);
      if(v!==null){node.innerHTML=v;}
    });
    d.querySelectorAll('[data-i18n-attr]').forEach(function(node){
      node.getAttribute('data-i18n-attr').split(';').forEach(function(pair){
        var i=pair.indexOf(':');
        if(i<1){return;}
        var attr=pair.slice(0,i).trim(),key=pair.slice(i+1).trim();
        var v=t(key,l);
        if(v!==null){node.setAttribute(attr,v);}
      });
    });
  }

  function setLang(l,fireEvents){
    if(l!=='es'&&l!=='en'){return;}
    var fire=fireEvents!==false;
    if(fire){d.dispatchEvent(new CustomEvent('ac:langwillchange',{detail:{lang:l}}));}
    lang=l;
    root.setAttribute('lang',l);
    root.setAttribute('data-lang',l);
    try{localStorage.setItem(STORE,l);}catch(e){}
    d.querySelectorAll('[data-lang-btn]').forEach(function(b){
      var on=b.getAttribute('data-lang-btn')===l;
      b.classList.toggle('is-on',on);
      b.setAttribute('aria-pressed',on?'true':'false');
    });
    apply(l);
    if(fire){d.dispatchEvent(new CustomEvent('ac:langchange',{detail:{lang:l}}));}
  }

  d.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-lang-btn]');
    if(b){setLang(b.getAttribute('data-lang-btn'));}
  });

  window.__setLang=setLang;
  window.__getLang=function(){return lang;};

  /* init: apply persisted language, no events (site.js loads after) */
  setLang(lang,false);
})();
