/*
 * 司机社增强 v2 (sijishe_enhance_v2.js)
 * 适用：xsijishe.net, xsijishe.com, sjsvip.com, sijshe.com.cn
 * 核心功能：番号识别提取、求出处智能标记、番号查询面板
 * 不做：登录墙隐藏、图片灯箱、热搜美化（用户要求砍掉）
 * 格式：Loon/Quantumult X/Surge 通用 HTTP Response 脚本
 */

(function() {
  'use strict';

  // ==== 环境检测 ====
  var isQX = (typeof $task !== 'undefined');
  var isLoon = (typeof $loon !== 'undefined');
  var isSurge = (typeof $httpClient !== 'undefined');

  // ==== 配置 ====
  var HOSTS = ['xsijishe.net', 'xsijishe.com', 'sjsvip.com', 'sijshe.com.cn'];
  var RUNS = 0;
  var SCHEDULED = false;
  var DELAY = 500;

  // 番号识别正则（专业：含 FC2/HEYZO/无码/有码/国产等格式）
  var AV_PATTERN = /\b([A-Z]{2,5}-\d{3,5}|[A-Z]{1,5}\d{3,5}|FC2-PPV-\d{4,6}|FC2\d{4,6}|HEYZO-\d{3,5}|HEYZO\d{3,5}|[0-9]{3,5}-[A-Z]{2,5})\b/gi;
  var AV_PATTERN_FULL = /\b((?:[A-Z]{2,5}-|FC2-PPV-|HEYZO-)?\d{3,6}|[A-Z]{1,5}\d{3,5}|FC2-PPV-\d{4,6}|FC2\d{4,6}|HEYZO-\d{3,5}|HEYZO\d{3,5}|[0-9]{3,5}-[A-Z]{2,5})\b/gi;

  // 番号查询外链
  var QUERY_SITES = [
    { name: 'JavBus', url: 'https://www.javbus.com/' },
    { name: 'JavDB', url: 'https://javdb.com/' },
    { name: 'JavLibrary', url: 'https://www.javlibrary.com/' },
    { name: 'DMM', url: 'https://www.dmm.co.jp/mono/dvd/-/list/=/article=maker/id=/' },
    { name: 'AvMoo', url: 'https://avmoo.com/' },
    { name: 'JavFinder', url: 'https://javfinder.com/' }
  ];

  function log() { console.log('[司机社增强]', Array.prototype.slice.call(arguments).join(' ')); }
  function isTargetHost() { return HOSTS.some(function(h){ return location.hostname.indexOf(h) >= 0; }); }

  // ==== 功能1: 番号自动识别提取 ====
  function extractAVCodes() {
    var codes = [];
    var seen = {};
    // 收集所有文本节点中的番号
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while(walker.nextNode()) {
      var node = walker.currentNode;
      if(node.parentElement && (node.parentElement.tagName === 'SCRIPT' || node.parentElement.tagName === 'STYLE')) continue;
      var text = node.textContent;
      var m;
      AV_PATTERN.lastIndex = 0;
      while((m = AV_PATTERN.exec(text)) !== null) {
        var code = m[1].toUpperCase();
        if(!seen[code] && code.length >= 4) {
          seen[code] = true;
          codes.push(code);
        }
      }
    }
    return codes;
  }

  // ==== 功能1b: 番号高亮（只高亮番号本身） ====
  function highlightAVCodes() {
    document.querySelectorAll("div.postmessage, div.t_f, td.t_f, .t_fsz, .postcontent, .postbody, .postmessage_main").forEach(function(container){
      var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
      var nodes = [];
      while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function(node){
        if(node.parentElement && (node.parentElement.tagName === 'SCRIPT' || node.parentElement.tagName === 'STYLE')) return;
        if(node.parentElement && node.parentElement.querySelector('mark.sjs-av')) return;
        var text = node.textContent;
        if(AV_PATTERN_FULL.test(text)) {
          var span = document.createElement('span');
          span.innerHTML = text.replace(AV_PATTERN_FULL, function(match){
            return '<mark class="sjs-av" style="background:#fff3cd;color:#856404;padding:1px 4px;border-radius:3px;font-weight:bold;cursor:pointer;font-family:monospace;" data-code="' + match.toUpperCase() + '">' + match + '</mark>';
          });
          node.parentNode.replaceChild(span, node);
        }
      });
    });
    // 点击番号 → 打开查询面板
    document.querySelectorAll('mark.sjs-av').forEach(function(el){
      el.onclick = function(){ openQueryPanel(this.getAttribute('data-code')); };
    });
  }

  // ==== 功能2: 求出处帖智能标记 ====
  function enhanceSeekPosts() {
    document.querySelectorAll('tbody[id^="normalthread_"]').forEach(function(row){
      var titleEl = row.querySelector('a.xst, a.s, th.new a');
      if(!titleEl) return;
      var title = titleEl.textContent || '';
      var badgeHtml = '';
      if(/求出处|求番号|求车牌|找番号|求无码/.test(title)) {
        badgeHtml += '<span style="background:#fff3cd;color:#856404;padding:1px 5px;border-radius:3px;font-size:11px;margin-left:4px;font-weight:bold;">求出处</span>';
        row.style.background = '#fffde7';
      }
      if(/已解决|找到番号|番号已出|解决啦|搞定/.test(title)) {
        badgeHtml += '<span style="background:#c8e6c9;color:#2e7d32;padding:1px 5px;border-radius:3px;font-size:11px;margin-left:4px;font-weight:bold;">已解决</span>';
        row.style.background = '#e8f5e9';
      }
      if(badgeHtml && !titleEl.querySelector('span')) {
        titleEl.insertAdjacentHTML('beforeend', badgeHtml);
      }
    });
  }

  // ==== 功能3: 番号查询面板 ====
  function openQueryPanel(code) {
    // 移除已有面板
    var old = document.getElementById('sjs-query-panel');
    if(old) old.remove();

    var panel = document.createElement('div');
    panel.id = 'sjs-query-panel';
    panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:2px solid #856404;border-radius:12px;padding:20px;z-index:99999;box-shadow:0 8px 32px rgba(0,0,0,.3);min-width:320px;max-width:400px;font-family:Arial,sans-serif;';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><h3 style="margin:0;color:#856404;">🔍 番号查询: <code style="background:#fff3cd;padding:2px 8px;border-radius:4px;">' + code + '</code></h3><button id="sjs-close" style="background:#dc3545;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;">✕</button></div><div id="sjs-links"></div>';
    document.body.appendChild(panel);

    var linksDiv = panel.querySelector('#sjs-links');
    QUERY_SITES.forEach(function(site){
      var a = document.createElement('a');
      a.href = site.url + encodeURIComponent(code);
      a.target = '_blank';
      a.rel = 'noopener';
      a.style.cssText = 'display:block;padding:8px 12px;margin:4px 0;background:#f8f9fa;border:1px solid #dee2e6;border-radius:6px;color:#007bff;text-decoration:none;transition:.2s;';
      a.onmouseover = function(){ this.style.background='#e7f1ff'; };
      a.onmouseout = function(){ this.style.background='#f8f9fa'; };
      a.innerHTML = '🔗 ' + site.name + ' → ' + code;
      linksDiv.appendChild(a);
    });

    // 复制按钮
    var copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 复制番号';
    copyBtn.style.cssText = 'width:100%;padding:10px;margin-top:12px;background:#28a745;color:#fff;border:none;border-radius:6px;font-size:15px;cursor:pointer;';
    copyBtn.onclick = function(){
      navigator.clipboard.writeText(code).then(function(){
        copyBtn.textContent = '✅ 已复制';
        setTimeout(function(){ copyBtn.textContent = '📋 复制番号'; }, 2000);
      });
    };
    linksDiv.appendChild(copyBtn);

    // 关闭
    panel.querySelector('#sjs-close').onclick = function(){ panel.remove(); };
    // 点击外部关闭
    setTimeout(function(){
      document.addEventListener('click', function handler(e){
        if(!panel.contains(e.target)) { panel.remove(); document.removeEventListener('click', handler); }
      });
    }, 100);
  }

  // ==== 调度器 ====
  function all() {
    try {
      RUNS++;
      if(!isTargetHost()) return;
      highlightAVCodes();
      enhanceSeekPosts();
      log('Run #' + RUNS + ' done');
    } catch(e) {
      log('Error:', e);
    }
  }

  function schedule() {
    if(SCHEDULED) return;
    SCHEDULED = true;
    setTimeout(function(){ SCHEDULED = false; all(); }, DELAY);
  }

  // ==== 初始化 ====
  function init() {
    if(!isTargetHost()) return;
    log('Init on ' + location.hostname);
    all();
    try {
      new MutationObserver(schedule).observe(document.body, {childList: true, subtree: true});
    } catch(e) {}
    setInterval(all, 2000);
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
