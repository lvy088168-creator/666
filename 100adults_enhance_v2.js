/*
 * 100Adults 成人工具箱增强 - v2 (bugfix)
 * 修复: ①生成端未定义 ENHANCE_NS ②window.100a 数字开头非法标识符
 * 架构: 范式A ($response.body 修改 HTML + 注入浏览器端脚本)
 */

(function () {
  'use strict';

  var res = $response;
  var originalBody = (res && res.body) || null;

  function fallback() {
    try { $done(originalBody ? { body: originalBody } : {}); } catch (e) { $done({}); }
  }

  if (!originalBody) { $done({}); return; }

  try {
    var url = ($request && $request.url) || '';

    var urlOk = /100adults\.com\//i.test(url) &&
                !/\.(js|css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|mp[34]|zip|rar|m3u8|torrent|json)(\?|$)/i.test(url) &&
                !/\/api\//i.test(url);

    var head = originalBody.substring(0, 800);
    var looksHtml = /<(!doctype|html|head|body|meta|div|table|script)/i.test(head);

    if (!urlOk || !looksHtml) { $done({ body: originalBody }); return; }

    var body = originalBody;

    // ===== 字符串级去广告 =====
    body = body.replace(/<[^>]*class="[^"]*(ad|sponsor|promo|banner)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, '');
    body = body.replace(/<[^>]*href="[^"]*(fanszukan|myfans|koemimi|chilamin)[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
    body = body.replace(/<[^>]*>[^<]*(广告|赞助|推广|Sponsored|Promotion)[^<]*<\/[^>]+>/gi, '');

    // ===== 生成端变量（修复点1：必须先定义）=====
    var NS = 'enhance100a';  // 合法标识符（修复点2：数字开头改字母开头）

    // ===== 注入浏览器端脚本 =====
    var inject = '<script>(function(){' +
      'var NS = "' + NS + '";' +
      'var scheduled = false;' +

      // 样式
      'function injectStyles(){' +
        'if(document.getElementById(NS+"_style"))return;' +
        'var s=document.createElement("style");s.id=NS+"_style";' +
        's.textContent = `:root{--bg:#0a0708;--fg:#f5f5f5;--card:#161a1e;--accent:#e94560;--muted:#888}' +
        'html[data-theme=light]{--bg:#fafafa;--fg:#111;--card:#fff}' +
        'html[data-theme=dark] body{background:var(--bg);color:var(--fg)}' +
        'body{background:var(--bg);color:var(--fg);transition:background .3s,color .3s}' +
        '#'+NS+'-panel{position:fixed;bottom:90px;right:12px;z-index:99999;background:var(--card);padding:12px;border-radius:10px;border:1px solid #333;color:var(--fg);font:13px/1.7 system-ui;max-width:320px;max-height:60vh;overflow:auto;box-shadow:0 8px 24px rgba(0,0,0,.5);display:none}' +
        '#'+NS+'-panel[open]{display:block}' +
        '#'+NS+'-panel hr{margin:8px 0;border-color:#333}' +
        '#'+NS+'-panel summary{cursor:pointer;font-weight:600;margin-bottom:8px;color:var(--accent)}' +
        '#'+NS+'-panel .btn{display:inline-block;margin:4px 4px 0 0;padding:6px 12px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer}' +
        '#'+NS+'-panel .btn.secondary{background:#333;color:#ccc}' +
        '#'+NS+'-panel textarea{width:100%;min-height:80px;margin-top:6px;padding:8px;background:#0d0d0d;color:#eee;border:1px solid #333;border-radius:6px;font:12px monospace;resize:vertical}' +
        '#'+NS+'-fab{position:fixed;bottom:20px;right:12px;z-index:99998;display:flex;flex-direction:column;gap:8px}' +
        '#'+NS+'-fab button{width:48px;height:48px;border-radius:50%;background:var(--card);border:1px solid #333;color:var(--fg);font-size:18px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center}' +
        '#'+NS+'-timer{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99999;background:rgba(10,7,8,.95);padding:30px 50px;border-radius:16px;border:2px solid var(--accent);color:#fff;font:bold 48px/1 monospace;text-align:center;box-shadow:0 0 40px rgba(233,69,96,.5);display:none}' +
        '#'+NS+'-timer .label{font:14px/1.5 system-ui;color:#ccc;margin-top:8px;display:block}`;' +
        'document.head.appendChild(s);' +
      '}' +

      // API（用 window[NS] 方括号，合法）
      'window[NS] = window[NS] || {};' +
      'window[NS].exportData = function(){' +
        'var data = Object.fromEntries(Object.entries(localStorage).filter(function(e){return e[0].indexOf(NS)!==0}));' +
        'var blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});' +
        'var a = document.createElement("a");a.href=URL.createObjectURL(blob);a.download="100adults_backup_"+Date.now()+".json";a.click();' +
        'alert("已导出 "+Object.keys(data).length+" 项数据");' +
      '};' +
      'window[NS].importData = function(e){' +
        'var f=e.target.files[0];if(!f)return;' +
        'var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);Object.keys(d).forEach(function(k){localStorage.setItem(k,d[k])});alert("导入成功，刷新生效");location.reload()}catch(err){alert("导入失败: "+err.message)}};r.readAsText(f);' +
      '};' +
      'window[NS].clearAll = function(){' +
        'if(confirm("确定清空所有本地数据？（不可恢复）")){Object.keys(localStorage).filter(function(k){return k.indexOf(NS)!==0}).forEach(function(k){localStorage.removeItem(k)});alert("已清空，刷新生效");location.reload()}' +
      '};' +
      'window[NS].toggleFullscreen = function(){' +
        'if(!document.fullscreenElement){document.documentElement.requestFullscreen().catch(function(){})}else{document.exitFullscreen()}' +
      '};' +
      'window[NS].toggleTheme = function(){' +
        'var h=document.documentElement;var dark=h.getAttribute("data-theme")==="dark";' +
        'h.setAttribute("data-theme",dark?"light":"dark");localStorage.setItem(NS+"_theme",dark?"light":"dark");' +
      '};' +
      'window[NS].toggleGameHelper = function(){' +
        'var on = !window[NS+"_gh"];window[NS+"_gh"]=on;' +
        'var t=document.getElementById(NS+"-timer");' +
        'if(on){if(!t){t=document.createElement("div");t.id=NS+"-timer";document.body.appendChild(t)}t.style.display="block";t.innerHTML="300秒<span class=label>游戏助手已开 · 空格暂停 · ↑↓调速</span>";alert("游戏助手已开启")}else{if(t)t.style.display="none";alert("游戏助手已关闭")}' +
      '};' +
      'window[NS].showTimer = function(sec){' +
        'var t=document.getElementById(NS+"-timer");if(!t){t=document.createElement("div");t.id=NS+"-timer";document.body.appendChild(t)}' +
        't.style.display="block";var end=Date.now()+sec*1000;' +
        '(function tick(){var left=Math.max(0,Math.ceil((end-Date.now())/1000));' +
        't.innerHTML=left+"秒<span class=label>空格暂停/继续 · ↑↓调速</span>";' +
        'if(left>0){requestAnimationFrame(tick)}else{t.innerHTML="⏰ 时间到！<span class=label>空格关闭</span>";window[NS].beep()}})();' +
      '};' +
      'window[NS].beep = function(){try{var c=new (window.AudioContext||window.webkitAudioContext)();var o=c.createOscillator();var g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.value=.1;o.start();setTimeout(function(){o.stop()},200)}catch(e){}};' +

      // 面板
      'function createPanel(){' +
        'if(document.getElementById(NS+"-panel"))return;' +
        'var p=document.createElement("details");p.id=NS+"-panel";' +
        'p.innerHTML="<summary>\\uD83D\\uDEE0 100Adults \\u589E\\u5F3A\\u9762\\u677F</summary>"+' +
          '"<button class=btn onclick=\\"window[\'"+NS+"\'].exportData()\\">\\uD83D\\uDCE4 \\u5BFC\\u51FA\\u6570\\u636E</button>"+' +
          '"<button class=btn onclick=\\"document.getElementById(\'"+NS+"-imp\').click()\\">\\uD83D\\uDCE5 \\u5BFC\\u5165\\u6570\\u636E</button>"+' +
          '"<input type=file id=\\""+NS+"-imp\\" accept=\\".json\\" style=\\"display:none\\" onchange=\\"window[\'"+NS+"\'].importData(event)\\">"+' +
          '"<button class=btn secondary onclick=\\"window[\'"+NS+"\'].clearAll()\\">\\uD83D\\uDDD1 \\u6E05\\u7A7A</button>"+' +
          '"<hr>" +' +
          '"<button class=btn onclick=\\"window[\'"+NS+"\'].toggleFullscreen()\\">\\uD83D\\uDDA5 \\u5168\\u5C4F</button>"+' +
          '"<button class=btn onclick=\\"window[\'"+NS+"\'].toggleTheme()\\">\\uD83C\\uDF13 \\u4E3B\\u9898</button>"+' +
          '"<button class=btn onclick=\\"window[\'"+NS+"\'].toggleGameHelper()\\">\\uD83C\\uDFAE \\u6E38\\u620F\\u52A9\\u624B</button>"+' +
          '"<hr>" +' +
          '"<b>\\u672C\\u5730\\u5B58\\u50A8\\u9884\\u89C8\\uFF1A</b>"+' +
          '"<textarea id=\\""+NS+"-pv\\" readonly></textarea>";' +
        'document.body.appendChild(p);' +
        'setInterval(function(){var ta=document.getElementById(NS+"-pv");if(ta){ta.value=JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(function(e){return e[0].indexOf(NS)!==0})),null,2)}},2000);' +
      '}' +

      // FAB
      'function createFAB(){' +
        'if(document.getElementById(NS+"-fab"))return;' +
        'var f=document.createElement("div");f.id=NS+"-fab";' +
        'f.innerHTML="<button title=\\u5168\\u5C4F onclick=\\"window[\'"+NS+"\'].toggleFullscreen()\\">\\uD83D\\uDDA5</button>"+' +
          '"<button title=\\u4E3B\\u9898 onclick=\\"window[\'"+NS+"\'].toggleTheme()\\">\\uD83C\\uDF13</button>"+' +
          '"<button title=\\u9762\\u677F onclick=\\"var p=document.getElementById(\'"+NS+"-panel\');if(p)p.open=!p.open\\">\\uD83D\\uDEE0</button>"+' +
          '"<button title=\\u6E38\\u620F onclick=\\"window[\'"+NS+"\'].toggleGameHelper()\\">\\uD83C\\uDFAE</button>";' +
        'document.body.appendChild(f);' +
      '}' +

      // 快捷键
      'function bindKeys(){' +
        'document.addEventListener("keydown",function(e){' +
          'if(e.ctrlKey||e.metaKey||e.altKey)return;' +
          'if(e.code==="KeyF"){e.preventDefault();window[NS].toggleFullscreen()}' +
          'else if(e.code==="KeyT"){e.preventDefault();window[NS].toggleTheme()}' +
          'else if(e.code==="KeyP"){e.preventDefault();var p=document.getElementById(NS+"-panel");if(p)p.open=!p.open}' +
          'else if(e.code==="KeyG"){e.preventDefault();window[NS].toggleGameHelper()}' +
        '});' +
      '}' +

      // init
      'function init(){' +
        'try{' +
          'injectStyles();createPanel();createFAB();bindKeys();' +
          'var th=localStorage.getItem(NS+"_theme");if(th)document.documentElement.setAttribute("data-theme",th);' +
        '}catch(e){}' +
      '}' +
      'if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",init)}else{init()}' +
      'try{new MutationObserver(function(){if(!scheduled){scheduled=true;setTimeout(function(){scheduled=false;init()},400)}}).observe(document.body,{childList:true,subtree:true})}catch(e){}' +
    '})();</script>';

    if (body.indexOf('</head>') >= 0) {
      body = body.replace('</head>', inject + '</head>');
    } else if (body.indexOf('</body>') >= 0) {
      body = body.replace('</body>', inject + '</body>');
    } else {
      body = body + inject;
    }

    $done({ body: body });
  } catch (e) {
    fallback();
  }
})();
