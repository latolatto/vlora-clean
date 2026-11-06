/* Vlora Clean — reviews carousel + before/after slider */
(function(){
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  /* ---------- Reviews carousel ---------- */
  var track=document.getElementById('reviewTrack');
  if(track){
    var slides=[].slice.call(track.children),dots=document.getElementById('reviewDots');
    var prev=document.querySelector('.review-prev'),next=document.querySelector('.review-next');
    var last=slides.length-1,drag=null,moved=false;
    function maxScroll(){return track.scrollWidth-track.clientWidth;}
    function calc(){var m=maxScroll();last=slides.length-1;
      if(m<=2){last=0;return;}
      for(var i=0;i<slides.length;i++){if(slides[i].offsetLeft-2>=m-2){last=i;break;}}}
    function nearest(){var x=track.scrollLeft,m=maxScroll();if(m>2&&x>=m-2)return last;
      var best=0,d=1e9;slides.forEach(function(s,i){var k=Math.abs(s.offsetLeft-2-x);if(k<d){d=k;best=i;}});return Math.min(best,last);}
    function buildDots(){calc();dots.innerHTML='';
      for(var i=0;i<=last;i++){(function(i){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Vlerësimi '+(i+1));b.addEventListener('click',function(){go(i);});dots.appendChild(b);})(i);}
      dots.style.display=last===0?'none':'';update();}
    function go(i){i=Math.max(0,Math.min(last,i));
      track.scrollTo({left:i>=last&&maxScroll()>2?maxScroll():slides[i].offsetLeft-2,behavior:reduce?'auto':'smooth'});}
    function update(){var i=nearest();
      [].forEach.call(dots.children,function(b,j){b.setAttribute('aria-current',j===i?'true':'false');});
      prev.disabled=i<=0;next.disabled=i>=last;
      slides.forEach(function(s,j){s.classList.toggle('is-active',j===i);});}
    prev.addEventListener('click',function(){go(nearest()-1);});
    next.addEventListener('click',function(){go(nearest()+1);});
    var tick=false;
    track.addEventListener('scroll',function(){if(tick)return;tick=true;requestAnimationFrame(function(){tick=false;update();});},{passive:true});
    track.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();go(nearest()+1);}if(e.key==='ArrowLeft'){e.preventDefault();go(nearest()-1);}});
    /* mouse drag (touch swipes natively) */
    track.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'||e.button!==0)return;
      drag={x:e.clientX,s:track.scrollLeft};moved=false;track.classList.add('dragging');});
    window.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x;if(Math.abs(dx)>4)moved=true;track.scrollLeft=drag.s-dx;});
    window.addEventListener('pointerup',function(){if(!drag)return;drag=null;track.classList.remove('dragging');go(nearest());});
    track.addEventListener('dragstart',function(e){e.preventDefault();});
    var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(buildDots,120);});
    if('ResizeObserver' in window)new ResizeObserver(function(){buildDots();}).observe(track);
    buildDots();
  }
  /* ---------- Before / after ---------- */
  var ba=document.getElementById('ba'),range=document.getElementById('baRange');
  if(ba&&range){
    function set(v){v=Math.max(0,Math.min(100,v));range.value=v;ba.style.setProperty('--s',v+'%');}
    function fromX(x){var r=ba.getBoundingClientRect();set((x-r.left)/r.width*100);}
    var down=false;
    ba.addEventListener('pointerdown',function(e){down=true;try{ba.setPointerCapture(e.pointerId);}catch(_){}ba.classList.add('is-drag');fromX(e.clientX);});
    ba.addEventListener('pointermove',function(e){if(down)fromX(e.clientX);});
    function end(){down=false;ba.classList.remove('is-drag');}
    ba.addEventListener('pointerup',end);ba.addEventListener('pointercancel',end);
    range.addEventListener('input',function(){set(+range.value);});
    set(50);
    /* gentle first-view hint */
    if(!reduce&&'IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;io.disconnect();
      var t0=null;(function step(t){if(down)return;if(!t0)t0=t;var p=(t-t0)/1400;if(p>=1){set(50);return;}set(50+Math.sin(p*Math.PI*2)*14);requestAnimationFrame(step);})(performance.now());});},{threshold:.6});io.observe(ba);}
  }
})();
