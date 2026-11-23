/*
 * 100Adults 成人工具箱增强 - v1
 * 架构: 范式A ($response.body 修改 HTML + 注入浏览器端脚本)
 * 功能: 去广告 + 数据导出/导入/备份 + 全屏/深色/游戏辅助
 * 适用: Quantumult X / Loon / Surge (http-response)
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

    // 只处理 HTML 页面（排除静态资源/API）
    var urlOk = /100adults\.(com)\//i.test(url) &&
                !/\.(js|css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|mp[34]|zip|rar|m3u8|torrent|json)(\?|$)/i.test(url) &&
                !/\/api\//i.test(url);

    var head = originalBody.substring(0, 800);
    var looksHtml = /<(!doctype|html|head|body|meta|div|table|script)/i.test(head);

    if (!urlOk || !looksHtml) { $done({ body: originalBody }); return; }

    var body = originalBody;

    // ========== 字符串级去广告 ==========
    // 1. 移除广告容器
    body = body.replace(/<[^>]*class="[^"]*(ad|sponsor|promo|banner)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, '');
    // 2. 移除姊妹站/推广链接区块（FANSZUKAN、koemimi、myfans 等）
    body = body.replace(/<[^>]*href="[^"]*(fanszukan|myfans|koemimi|chilamin)[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
    // 3. 隐藏含"广告"、"赞助"、"推广"的区块
    body = body.replace(/<[^>]*>[^<]*(广告|赞助|推广|Sponsored|Promotion)[^<]*<\/[^>]+>/gi, '');

    // ========== 注入浏览器端增强脚本 ==========
    var inject = '<script>(function(){' +
      'var ENHANCE_NS = "100adults_enhance";' +
      'var scheduled = false, runs = 0;' +

      // ===== 样式注入（深色模式、面板、全屏按钮）=====
      'var styleId = ENHANCE_NS + "_style";' +
      'function injectStyles() {' +
        'if (document.getElementById(styleId)) return;' +
        'var s = document.createElement("style"); s.id = styleId;' +
        's.textContent = `' +
          // 深色模式变量
          ':root { --bg: #0a0708; --fg: #f5f5f5; --card: #161a1e; --accent: #e94560; --muted: #888; }' +
          '[data-theme="light"] { --bg: #fafafa; --fg: #111; --card: #fff; --accent: #e94560; --muted: #666; }' +
          'html[data-theme="dark"] { background: var(--bg); color: var(--fg); }' +
          'body { background: var(--bg); color: var(--fg); transition: background .3s, color .3s; }' +
          '.card, .panel, [class*="card"], [class*="panel"] { background: var(--card) !important; border-color: #333 !important; }' +
          'a, button, [role="button"] { color: var(--accent); }' +
          // 面板样式
          '#'+ENHANCE_NS+'-panel { position:fixed; bottom:90px; right:12px; z-index:99999; background:var(--card); padding:12px; border-radius:10px; border:1px solid #333; color:var(--fg); font:13px/1.7 system-ui; max-width:320px; max-height:60vh; overflow:auto; box-shadow:0 8px 24px rgba(0,0,0,.5); display:none; }' +
          '#'+ENHANCE_NS+'-panel summary { cursor:pointer; font-weight:600; margin-bottom:8px; color:var(--accent); }' +
          '#'+ENHANCE_NS+'-panel .btn { display:inline-block; margin:4px 4px 0 0; padding:6px 12px; background:var(--accent); color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer; }' +
          '#'+ENHANCE_NS+'-panel .btn.secondary { background:#333; color:#ccc; }' +
          '#'+ENHANCE_NS+'-panel textarea { width:100%; min-height:80px; margin-top:6px; padding:8px; background:#0d0d0d; color:#eee; border:1px solid #333; border-radius:6px; font:12px monospace; resize:vertical; }' +
          // 全屏/深色/设置按钮
          '#'+ENHANCE_NS+'-fab { position:fixed; bottom:20px; right:12px; z-index:99998; display:flex; flex-direction:column; gap:8px; }' +
          '#'+ENHANCE_NS+'-fab button { width:48px; height:48px; border-radius:50%; background:var(--card); border:1px solid #333; color:var(--fg); font-size:18px; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; }' +
          '#'+ENHANCE_NS+'-fab button:hover { background:var(--accent); color:#fff; border-color:var(--accent); }' +
          // 游戏倒计时浮层
          '#'+ENHANCE_NS+'-timer { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:99999; background:rgba(10,7,8,.95); padding:30px 50px; border-radius:16px; border:2px solid var(--accent); color:#fff; font:bold 48px/1 monospace; text-align:center; box-shadow:0 0 40px rgba(233,69,96,.5); display:none; }' +
          '#'+ENHANCE_NS+'-timer .label { font:14px/1.5 system-ui; color:#ccc; margin-top:8px; display:block; }' +
        '`; document.head.appendChild(s);' +
      '}' +

      // ===== 面板创建 =====
      'function createPanel() {' +
        'if (document.getElementById(ENHANCE_NS+"-panel")) return;' +
        'var p = document.createElement("details"); p.id = ENHANCE_NS+"-panel";' +
        'p.innerHTML = `<summary>🛠 100Adults 增强面板</summary>' +
          '<button class="btn" onclick="'+ENHANCE_NS+'.exportData()">📤 导出数据 (JSON)</button>' +
          '<button class="btn" onclick="document.getElementById(\''+ENHANCE_NS+'-import\').click()">📥 导入数据</button>' +
          '<input type="file" id="'+ENHANCE_NS+'-import" accept=".json" style="display:none" onchange="'+ENHANCE_NS+'.importData(event)">'+
          '<button class="btn secondary" onclick="'+ENHANCE_NS+'.clearAll()">🗑 清空所有本地数据</button>' +
          '<hr style="margin:8px 0;border-color:#333">' +
          '<button class="btn" onclick="'+ENHANCE_NS+'.toggleFullscreen()">🖥 切换全屏</button>' +
          '<button class="btn" onclick="'+ENHANCE_NS+'.toggleTheme()">🌓 切换深色/浅色</button>' +
          '<button class="btn" onclick="'+ENHANCE_NS+'.toggleGameHelper()">🎮 游戏助手</button>' +
          '<hr style="margin:8px 0;border-color:#333">' +
          '<b>本地存储预览：</b>' +
          '<textarea id="'+ENHANCE_NS+'-preview" readonly></textarea>`;' +
        'document.body.appendChild(p);' +
        'setInterval(function(){'+
          'var ta = document.getElementById("'+ENHANCE_NS+'-preview");'+
          'if(ta){ ta.value = JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.startsWith("'+ENHANCE_NS+'_"))), null, 2); }'+
        '}, 2000);' +
      '}' +

      // ===== 数据导出/导入/清空 =====
      'window.'+ENHANCE_NS+' = window.'+ENHANCE_NS+' || {};' +
      'window.'+ENHANCE_NS+'.exportData = function() {' +
        'var data = Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.startsWith("'+ENHANCE_NS+'_")));' +
        'var blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});' +
        'var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "100adults_backup_"+Date.now()+".json"; a.click();' +
        'alert("已导出 " + Object.keys(data).length + " 项数据");' +
      '};' +
      'window.'+ENHANCE_NS+'.importData = function(e) {' +
        'var f = e.target.files[0]; if(!f) return;' +
        'var r = new FileReader(); r.onload = function(){ try{ var data = JSON.parse(r.result); Object.entries(data).forEach(([k,v])=>localStorage.setItem(k,v)); alert("导入成功，刷新生效"); location.reload(); }catch(e){ alert("导入失败: "+e.message); } }; r.readAsText(f);' +
      '};' +
      'window.'+ENHANCE_NS+'.clearAll = function() {' +
        'if(confirm("确定清空所有本地数据？（不可恢复）")){ Object.keys(localStorage).filter(k=>!k.startsWith("'+ENHANCE_NS+'_")).forEach(k=>localStorage.removeItem(k)); alert("已清空，刷新生效"); location.reload(); }'+
      '};' +

      // ===== 全屏/主题/游戏助手 =====
      'window.'+ENHANCE_NS+'.toggleFullscreen = function() {' +
        'if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(()=>{}); }' +
        'else { document.exitFullscreen(); }' +
      '};' +
      'window.'+ENHANCE_NS+'.toggleTheme = function() {' +
        'var html = document.documentElement;' +
        'var isDark = html.getAttribute("data-theme") === "dark";' +
        'html.setAttribute("data-theme", isDark ? "light" : "dark");' +
        'localStorage.setItem("'+ENHANCE_NS+'_theme", isDark ? "light" : "dark");' +
      '};' +
      'window.'+ENHANCE_NS+'.toggleGameHelper = function() {' +
        'var enabled = !window.'+ENHANCE_NS+'_gameHelper;' +
        'window.'+ENHANCE_NS+'_gameHelper = enabled;' +
        'if(enabled) '+ENHANCE_NS+'.startGameHelper(); else '+ENHANCE_NS+'.stopGameHelper();' +
        'alert(enabled ? "游戏助手已开启（空格暂停/继续，方向键调速）”) : "游戏助手已关闭");' +
      '};' +

      // ===== 游戏助手（寸止游戏：倒计时、语音提示、倍速）=====
      'window.'+ENHANCE_NS+'.startGameHelper = function() {' +
        // 创建倒计时浮层
        'var t = document.getElementById("'+ENHANCE_NS+'-timer");' +
        'if(!t){ t = document.createElement("div"); t.id = "'+ENHANCE_NS+'-timer"; document.body.appendChild(t); }' +
        // 注入键盘监听
        'document.addEventListener("keydown", '+ENHANCE_NS+'.onKeyDown);' +
        // 页面内游戏按钮自动绑定
        'setInterval(function(){'+
          'document.querySelectorAll("button, [role=button]").forEach(function(btn){'+
            'var txt = (btn.textContent||"").trim();'+
            'if(txt && (txt.includes("开始")||txt.includes("开始游戏")||txt.includes("Start")) && !btn.'+ENHANCE_NS+'_bound){'+
              'btn.'+ENHANCE_NS+'_bound = true;'+
              'btn.addEventListener("click", function(){'+ENHANCE_NS+'.showTimer(300); });'+
            '}'+
          '});'+
        '}, 1000);' +
      '};' +
      'window.'+ENHANCE_NS+'.stopGameHelper = function() {' +
        'document.removeEventListener("keydown", '+ENHANCE_NS+'.onKeyDown);' +
        'var t = document.getElementById("'+ENHANCE_NS+'-timer"); if(t) t.style.display="none";' +
      '};' +
      'window.'+ENHANCE_NS+'.onKeyDown = function(e) {' +
        'if(e.code === "Space"){ e.preventDefault(); '+ENHANCE_NS+'.togglePause(); }' +
        'else if(e.code === "ArrowUp"){ '+ENHANCE_NS+'.adjustSpeed(1.25); }' +
        'else if(e.code === "ArrowDown"){ '+ENHANCE_NS+'.adjustSpeed(0.8); }' +
      '};' +
      'window.'+ENHANCE_NS+'.showTimer = function(seconds) {' +
        'var t = document.getElementById("'+ENHANCE_NS+'-timer");' +
        'if(!t) return;' +
        't.style.display = "block";' +
        'var end = Date.now() + seconds*1000;' +
        'function tick(){'+
          'var left = Math.max(0, Math.ceil((end - Date.now())/1000));'+
          't.innerHTML = left + "秒" + "<span class=label>空格暂停/继续 · ↑↓调速</span>";'+
          'if(left > 0 && '+ENHANCE_NS+'_timerRunning) requestAnimationFrame(tick);'+
          'else if(left <= 0){ t.innerHTML = "⏰ 时间到！<span class=label>空格重置</span>"; '+ENHANCE_NS+'.playBeep(); }'+
        '}'+
        ''+ENHANCE_NS+'_timerRunning = true; tick();'+
      '};' +
      'var '+ENHANCE_NS+'_timerRunning = false, '+ENHANCE_NS+'_paused = false, '+ENHANCE_NS+'_speed = 1, '+ENHANCE_NS+'_pauseStart = 0, '+ENHANCE_NS+'_totalPaused = 0;' +
      'window.'+ENHANCE_NS+'.togglePause = function() {' +
        'if(!'+ENHANCE_NS+'_timerRunning) return;'+
        ''+ENHANCE_NS+'_paused = !'+ENHANCE_NS+'_paused;'+
        'if('+ENHANCE_NS+'_paused){ '+ENHANCE_NS+'_pauseStart = Date.now(); }'+
        'else{ '+ENHANCE_NS+'_totalPaused += Date.now() - '+ENHANCE_NS+'_pauseStart; }'+
      '};' +
      'window.'+ENHANCE_NS+'.adjustSpeed = function(mul){ '+ENHANCE_NS+'_speed = Math.max(0.25, Math.min(4, '+ENHANCE_NS+'_speed * mul)); console.log("速度: "+'+ENHANCE_NS+'_speed+"x"); };' +
      'window.'+ENHANCE_NS+'.playBeep = function(){ var ctx = new (window.AudioContext||window.webkitAudioContext)(); var o = ctx.createOscillator(); var g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = 0.1; o.start(); setTimeout(()=>o.stop(), 200); };' +

      // ===== 悬浮按钮组（全屏/主题/面板/游戏助手）=====
      'function createFAB() {' +
        'if(document.getElementById("'+ENHANCE_NS+'-fab")) return;' +
        'var f = document.createElement("div"); f.id = "'+ENHANCE_NS+'-fab";' +
        'f.innerHTML = ' +
          '`<button title="全屏 (F)" onclick="'+ENHANCE_NS+'.toggleFullscreen()">🖥</button>' +
           '<button title="深色/浅色 (T)" onclick="'+ENHANCE_NS+'.toggleTheme()">🌓</button>' +
           '<button title="面板 (P)" onclick="document.getElementById(\''+ENHANCE_NS+'-panel\').open = !document.getElementById(\''+ENHANCE_NS+'-panel\').open">🛠</button>' +
           '<button title="游戏助手 (G)" onclick="'+ENHANCE_NS+'.toggleGameHelper()">🎮</button>`;' +
        'document.body.appendChild(f);' +
      '}' +

      // ===== 初始化 =====
      'function init() {' +
        'injectStyles();' +
        'createPanel();' +
        'createFAB();' +
        // 恢复主题
        'var savedTheme = localStorage.getItem("'+ENHANCE_NS+'_theme");' +
        'if(savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);' +
        // 快捷键
        'document.addEventListener("keydown", function(e){'+
          'if(e.ctrlKey || e.metaKey || e.altKey) return;'+
          'if(e.code === "KeyF"){ e.preventDefault(); '+ENHANCE_NS+'.toggleFullscreen(); }'+
          'else if(e.code === "KeyT"){ e.preventDefault(); '+ENHANCE_NS+'.toggleTheme(); }'+
          'else if(e.code === "KeyP"){ e.preventDefault(); var p = document.getElementById("'+ENHANCE_NS+'-panel"); if(p) p.open = !p.open; }'+
          'else if(e.code === "KeyG"){ e.preventDefault(); '+ENHANCE_NS+'.toggleGameHelper(); }'+
        '});' +
      '}' +

      'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();' +
      'try{new MutationObserver(function(){if(!scheduled){scheduled=true;setTimeout(function(){scheduled=false;init();},400)}}).observe(document.body,{childList:true,subtree:true})}catch(e){}' +

    '})();</script>';

    // 注入位置
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
