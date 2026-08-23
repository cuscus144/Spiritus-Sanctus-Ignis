(function(){
'use strict';
var root=document.documentElement;
var c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
var mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
var constrained=!!(c&&c.saveData)||(navigator.deviceMemory&&navigator.deviceMemory<=4)||
  (navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4);
if(mobile) root.classList.add('di-mobile-performance');
if(constrained) root.classList.add('di-constrained-device');
if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  root.classList.add('di-reduced-motion');

document.addEventListener('visibilitychange',function(){
  root.classList.toggle('di-page-hidden',document.hidden);
},{passive:true});

var timer;
window.addEventListener('scroll',function(){
  root.classList.add('di-is-scrolling');
  clearTimeout(timer);
  timer=setTimeout(function(){root.classList.remove('di-is-scrolling')},120);
},{passive:true});

function lazyImages(){
  document.querySelectorAll('img:not([loading])').forEach(function(img){
    if(!img.closest('header,.hero,#hero,[data-hero]')){
      img.loading='lazy'; img.decoding='async';
    }
  });
}
if('requestIdleCallback' in window) requestIdleCallback(lazyImages,{timeout:1500});
else setTimeout(lazyImages,500);
})();