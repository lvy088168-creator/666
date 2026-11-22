/*
 * 98堂/色花堂 (sehuatang.net) 去广告+增强 - v6 全URL覆盖版
 * 架构: 范式A ($response.body 修改 HTML + 注入浏览器端脚本)
 * v6: 移动版 Discuz 用 forum.php?mod=viewthread 风格 URL，改排除法规则
 *      只排除 年龄门(/) + 静态资源(static/) + 门户(portal.php)，其余全增强
 * 安全: 全程 try/catch 兜底；规则层已排除关键JS，不再拦截
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

    // 排除法：非静态资源、非门户即可（年龄门/静态已在规则层排除，这里双保险）
    var isPage = /sehuatang\.(net|org)\//i.test(url) &&
                 !/\.(js|css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|mp[34]|zip|rar)(\?|$)/i.test(url) &&
                 !/^https?:\/\/(www\.)?sehuatang\.(net|org)\/(portal\.php)?(\?|$)/i.test(url) &&
                 !/^https?:\/\/(www\.)?sehuatang\.(net|org)\/static\//i.test(url);

    if (!isPage) { $done({ body: originalBody }); return; }

    var body = originalBody;

    body = body.replace(/您需要登录后才可以回帖/g, '<span style="display:none">您需要登录后才可以回帖</span>');
    body = body.replace(/看不到图请挂代理[^<]*/g, '');

    var inject = '<script>(function(){' +
      'var scheduled=false, runs=0;' +
      'function rmAds(){' +
        'var sels=["td[id^=ad_]","div[id^=ad_]","iframe[src*=casino]","a[href*=yabo]","a[href*=fadafa]","a[href*=bfguoji]","a[href*=aomen]","a[href*=xinpj]","a[href*=PGdianzi]","a[href*=fenghuang]","a[href*=jinsha]","img[src*=banner]","div[class*=banner]"];' +
        'sels.forEach(function(s){document.querySelectorAll(s).forEach(function(e){e.style.display="none"})});' +
        'document.querySelectorAll("td,div,p").forEach(function(e){if(e.innerText&&(e.innerText.indexOf("鲍鱼盒子")>=0||e.innerText.indexOf("邀请好友送现金")>=0))e.style.display="none"});' +
      '}' +
      'function fixImg(){' +
        'document.querySelectorAll("img[file],img[zoomfile]").forEach(function(i){' +
          'var s=i.getAttribute("file")||i.getAttribute("zoomfile");' +
          'if(s&&!/^https?:/.test(s)&&!/^data:/.test(s))i.src="https://sehuatang.net/"+s.replace(/^\\//,"");' +
          'i.removeAttribute("file");i.removeAttribute("zoomfile");' +
          'i.style.maxWidth="100%";i.style.height="auto";' +
        '});' +
      '}' +
      'function panel(){' +
        'if(document.getElementById("sht-panel"))return;' +
        'var RE=/(magnet:\\?xt=urn:btih:[a-zA-Z0-9]+|ed2k:\\/\\/[^\\s"\'<>]+|https?:\\/\\/[^\\s"\'<>]*(?:115\\.com|pan\\.baidu\\.com|lanzou[lx]\\.com|alipan\\.com|quark\\.cn|ctfile\\.com)[^\\s"\'<>]*)/gi;' +
        'var txt=document.body.innerText||"";var m=txt.match(RE)||[];m=[...new Set(m)];' +
        'var p=document.createElement("div");p.id="sht-panel";' +
        'p.style.cssText="position:fixed;bottom:20px;right:20px;z-index:99999;background:#1a1a2e;padding:10px;border-radius:8px;border:1px solid #e94560;color:#eee;font:12px/1.6 system-ui;max-width:300px;max-height:50vh;overflow:auto;box-shadow:0 4px 16px rgba(0,0,0,.4)";' +
        'var h="<b style=\\"color:#e94560\\">\\uD83E\\uDDF2 \\u8D44\\u6E90\\u63D0\\u53D6 ("+m.length+")</b>";' +
        'if(m.length){h+="<div style=\\"margin-top:6px\\">"+m.map(function(x){return "<div style=\\"padding:4px;background:#16213e;border-radius:4px;word-break:break-all;margin:3px 0\\">"+x+"</div>"}).join("")+"</div>";' +
          'h+="<button id=\\"sht-copy\\" style=\\"margin-top:6px;background:#e94560;border:0;color:#fff;padding:5px 10px;border-radius:4px;width:100%\\">\\u590D\\u5236\\u5168\\u90E8</button>";' +
        '}else{h+="<div style=\\"color:#888;text-align:center\\">\\u672A\\u68C0\\u6D4B\\u5230</div>"}' +
        'p.innerHTML=h;document.body.appendChild(p);' +
        'var b=document.getElementById("sht-copy");if(b)b.onclick=function(){navigator.clipboard.writeText(m.join("\\n")).then(function(){alert("\\u5DF2\\u590D\\u5236 "+m.length+" \\u4E2A")})};' +
      '}' +
      'function expBtn(){' +
        'var u=location.href;' +
        'if(!/forum-|forumdisplay/.test(u)||/thread-|viewthread/.test(u)||document.getElementById("sht-exp"))return;' +
        'var b=document.createElement("button");b.id="sht-exp";b.textContent="\\uD83D\\uDCC5 \\u5BFC\\u51FA\\u672C\\u9875\\u78C1\\u529B";' +
        'b.style.cssText="position:fixed;top:80px;right:16px;z-index:9999;background:#0f3460;color:#fff;border:0;padding:9px 13px;border-radius:6px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.3)";' +
        'b.onclick=function(){var t=document.body.innerText;var g=t.match(/magnet:\\?xt=urn:btih:[a-zA-Z0-9]+/gi)||[];var e=t.match(/ed2k:\\/\\/[^\\s"\'<>]+/gi)||[];var a=[...new Set(g.concat(e))];' +
          'if(a.length){navigator.clipboard.writeText(a.join("\\n")).then(function(){alert("\\u5DF2\\u590D\\u5236 "+a.length+" \\u4E2A")})}else alert("\\u672C\\u9875\\u65E0\\u78C1\\u529F/ED2K")};' +
        'document.body.appendChild(b);' +
      '}' +
      'function all(){try{runs++;rmAds();fixImg();panel();expBtn()}catch(e){}}' +
      'function schedule(){' +
        'if(scheduled)return;scheduled=true;' +
        'var delay=runs<25?400:1500;' +
        'setTimeout(function(){scheduled=false;all()},delay);' +
      '}' +
      'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",all);else all();' +
      'try{new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})}catch(e){}' +
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
