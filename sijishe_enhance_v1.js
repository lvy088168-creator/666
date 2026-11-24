/*
 * 司机社增强 v1 (sijishe_enhance_v1.js)
 * 适用：xsijishe.net, xsijishe.com, sjsvip.com, sijshe.com.cn
 * 功能：登录墙隐藏、番号高亮、图片灯箱、求出处增强、热搜美化
 * 格式：Loon/Quantumult X/Surge 通用 HTTP Response 脚本
 */

(function() {
  'use strict';

  // ==== 环境检测 ====
  var isQX = (typeof $task !== 'undefined');
  var isLoon = (typeof $loon !== 'undefined');
  var isSurge = (typeof $httpClient !== 'undefined');
  var TOOL = isQX ? 'Quantumult X' : (isLoon ? 'Loon' : (isSurge ? 'Surge' : 'Unknown'));

  // ==== 配置 ====
  var HOSTS = ['xsijishe.net', 'xsijishe.com', 'sjsvip.com', 'sijshe.com.cn'];
  var RUNS = 0;
  var SCHEDULED = false;
  var DELAY = 500;

  // ==== 通用工具 ====
  function log() { console.log('[司机社增强]', Array.prototype.slice.call(arguments).join(' ')); }
  function isTargetHost() { return HOSTS.some(function(h){ return location.hostname.indexOf(h) >= 0; }); }

  // ==== 核心功能 ====
  // 1. 登录墙/注册提示隐藏
  function hideLoginWall() {
    var KW = [
      "请 登录 后使用快捷导航",
      "没有账号？立即注册",
      "您需要登录",
      "游客可见",
      "登录后查看",
      "注册后可见"
    ];
    document.querySelectorAll("div,td,p,span,a,strong,font,section,article,aside,header,footer,main,nav,li,dt,dd").forEach(function(e){
      if(e.children && e.children.length > 3) return;
      var t = (e.innerText || "").trim();
      if(t && t.length < 100 && KW.some(function(k){ return t.indexOf(k) >= 0; })){
        e.style.display = "none";
        e.style.visibility = "hidden";
        e.style.opacity = "0";
        e.style.height = "0";
        e.style.overflow = "hidden";
      }
    });
    // iframe 穿透
    document.querySelectorAll("iframe").forEach(function(f){
      try {
        var doc = f.contentDocument || f.contentWindow.document;
        if(doc) {
          doc.querySelectorAll("div,td,p,span,a,strong,font").forEach(function(e){
            var t = (e.innerText || "").trim();
            if(t && t.length < 100 && KW.some(function(k){ return t.indexOf(k) >= 0; })){
              e.style.display = "none"; e.style.visibility = "hidden"; e.style.opacity = "0"; e.style.height = "0"; e.style.overflow = "hidden";
            }
          });
        }
      } catch(e) {}
    });
  }

  // 2. 番号高亮（格式：xxx-xxx, xxxx-xxx 等）
  function highlightAVCode() {
    var pattern = /\b([A-Z]{2,5}-\d{3,5}|[A-Z]{1,5}\d{3,5})\b/g;
    document.querySelectorAll("div.postmessage, div.t_f, td.t_f, .t_fsz, .postcontent, .threadlist, .postbody").forEach(function(container){
      var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
      var nodes = [];
      while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function(node){
        if(node.parentElement && (node.parentElement.tagName === 'SCRIPT' || node.parentElement.tagName === 'STYLE')) return;
        var text = node.textContent;
        if(pattern.test(text)) {
          var span = document.createElement('span');
          span.innerHTML = text.replace(pattern, '<mark style="background:#fff3cd;color:#856404;padding:1px 3px;border-radius:3px;font-weight:bold;">$&</mark>');
          node.parentNode.replaceChild(span, node);
        }
      });
    });
  }

  // 3. 图片灯箱/放大
  function enhanceImages() {
    var style = document.createElement('style');
    style.textContent = '.sjs-img-zoom{cursor:zoom-in;transition:transform .2s}.sjs-img-zoom:hover{transform:scale(1.05)}.sjs-lightbox{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out}.sjs-lightbox img{max-width:90%;max-height:90%;box-shadow:0 0 30px #fff3cd}';
    document.head.appendChild(style);
    document.querySelectorAll('img[zoomfile], img[file], .postmessage img, .t_f img, .postcontent img').forEach(function(img){
      if(img.classList.contains('sjs-img-zoom')) return;
      img.classList.add('sjs-img-zoom');
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function(e){
        e.preventDefault();
        var lb = document.createElement('div');
        lb.className = 'sjs-lightbox';
        var big = document.createElement('img');
        big.src = img.getAttribute('zoomfile') || img.getAttribute('file') || img.src;
        lb.appendChild(big);
        lb.onclick = function(){ document.body.removeChild(lb); };
        document.body.appendChild(lb);
      });
    });
  }

  // 4. 求出处帖子增强（显示回复数、标记已解决）
  function enhanceSeekPosts() {
    document.querySelectorAll('tbody[id^="normalthread_"]').forEach(function(row){
      var titleEl = row.querySelector('a.xst, a.s, th.new a');
      if(!titleEl) return;
      var title = titleEl.textContent || '';
      if(/求出处|求番号|求车牌|找番号/.test(title)) {
        row.style.background = '#fffde7';
        var badge = document.createElement('span');
        badge.textContent = ' 求出处';
        badge.style.cssText = 'background:#fff3cd;color:#856404;padding:1px 5px;border-radius:3px;font-size:12px;margin-left:5px;';
        titleEl.appendChild(badge);
      }
      if(/已解决|找到番号|番号已出/.test(title)) {
        row.style.background = '#e8f5e9';
        var badge = document.createElement('span');
        badge.textContent = ' 已解决';
        badge.style.cssText = 'background:#c8e6c9;color:#2e7d32;padding:1px 5px;border-radius:3px;font-size:12px;margin-left:5px;';
        titleEl.appendChild(badge);
      }
    });
  }

  // 5. 热搜/排行榜美化
  function enhanceHotSearch() {
    var hot = document.querySelector('.hotsearch, .hot_search, #hot_search, .hot-search, .rank_list, .ranking');
    if(hot) {
      hot.style.cssText += ';border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);padding:10px;background:#fffaf0;';
      hot.querySelectorAll('a').forEach(function(a){
        a.style.cssText = 'display:inline-block;margin:2px 5px;padding:2px 8px;background:#fff3cd;color:#856404;border-radius:12px;font-size:13px;text-decoration:none;transition:.2s';
        a.onmouseover = function(){ this.style.background='#ffe082'; };
        a.onmouseout = function(){ this.style.background='#fff3cd'; };
      });
    }
  }

  // ==== 调度器 ====
  function all() {
    try {
      RUNS++;
      if(!isTargetHost()) return;
      hideLoginWall();
      highlightAVCode();
      enhanceImages();
      enhanceSeekPosts();
      enhanceHotSearch();
      log('Run #' + RUNS + ' done');
    } catch(e) {
      log('Error:', e);
    }
  }

  function schedule() {
    if(SCHEDULED) return;
    SCHEDULED = true;
    setTimeout(function(){
      SCHEDULED = false;
      all();
    }, DELAY);
  }

  // ==== 初始化 ====
  function init() {
    if(!isTargetHost()) return;
    log('Init on ' + location.hostname);
    all();
    // MutationObserver 监听动态内容
    try {
      new MutationObserver(schedule).observe(document.body, {childList: true, subtree: true});
    } catch(e) {}
    // 定时轮询兜底
    setInterval(all, 2000);
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==== 响应式导出（Loon/QX/Surge 通用）====
  if(isLoon || isQX || isSurge) {
    // 脚本作为 HTTP Response 注入
    // 匹配规则: ^https?://(?:xsijishe\.(?:net|com)|sjsvip\.com|sijshe\.com\.cn)/.*$
  }
})();
