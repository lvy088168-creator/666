/*
 * 皮影卷图片批量收集 v1
 * 功能：收集当前页所有 img.piyingjuan.com 直链 → 右下角按钮一键导出 txt
 * 验证：直链 200（232KB 大图）、无需 Referer、不带 Referer 也 200
 * 代理端：HTML 嗅探 + 注入；浏览器端：收集 + 导出
 */
(function() {
  'use strict';
  var res = $response;
  var originalBody = (res && res.body) || null;

  function fallback() {
    try { $done(originalBody ? { body: originalBody } : {}); } catch (e) { $done({}); }
  }

  if (!originalBody) { $done({}); return; }

  try {
    var url = ($request && $request.url) || '';

    var urlOk = /piyingjuan\.com/i.test(url) &&
                !/\.(js|css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|mp[34]|zip|rar|m3u8|torrent|json)(\?|$)/i.test(url);

    var head = originalBody.substring(0, 800);
    var looksHtml = /<(!doctype|html|head|body|meta|div|table|script)/i.test(head);

    if (!urlOk || !looksHtml) { $done({ body: originalBody }); return; }

    var body = originalBody;
    var NS = 'pyj_collect_v1';

    var inject = '<script>(function(){' +
      'var NS = "' + NS + '";' +
      'var scheduled = false; var runs = 0;' +
      'function collect(){' +
      '  var set = {};' +
      '  var nodes = document.querySelectorAll("img");' +
      '  for (var i=0;i<nodes.length;i++){' +
      '    var s = nodes[i].src || nodes[i].getAttribute("data-src") || "";' +
      '    if (/img\\.piyingjuan\\.com/.test(s)) set[s.split("?")[0]] = 1;' +
      '  }' +
      '  var html = document.documentElement.innerHTML;' +
      '  var re = new RegExp("https?://img\\\\.piyingjuan\\\\.com/[^\\\\s<>\\"\\u0027)]+", "g"), m;' +
      '  while ((m = re.exec(html))) set[m[0].split("?")[0]] = 1;' +
      '  var list = Object.keys(set).sort();' +
      '  var el = document.getElementById(NS + "_count");' +
      '  if (el) el.textContent = list.length;' +
      '  window[NS] = list;' +
      '}' +
      'function exportTxt(){' +
      '  collect();' +
      '  var list = window[NS] || [];' +
      '  if (!list.length) { alert("未收集到图片"); return; }' +
      '  var txt = list.join("\\n");' +
      '  var blob = new Blob([txt], {type: "text/plain"});' +
      '  var a = document.createElement("a");' +
      '  a.href = URL.createObjectURL(blob);' +
      '  var t = (document.title || "piyingjuan").replace(/[\\\\/:*?"<>|]/g, "_").substring(0,50);' +
      '  a.download = t + "_imgs.txt";' +
      '  document.body.appendChild(a); a.click(); a.remove();' +
      '}' +
      'function btn(){' +
      '  if (document.getElementById(NS + "_btn")) return;' +
      '  var b = document.createElement("button");' +
      '  b.id = NS + "_btn";' +
      '  b.textContent = "收集图片 (";' +
      '  var c = document.createElement("span"); c.id = NS + "_count"; c.textContent = "0";' +
      '  b.appendChild(c); b.appendChild(document.createTextNode(") 导出"));' +
      '  b.style.cssText = "position:fixed;right:12px;bottom:80px;z-index:99999;background:#07c160;color:#fff;border:none;border-radius:20px;padding:9px 16px;font-size:14px;font-weight:600;box-shadow:0 3px 10px rgba(0,0,0,.3);cursor:pointer;";' +
      '  b.onclick = exportTxt;' +
      '  document.body.appendChild(b);' +
      '  collect();' +
      '  var el = document.getElementById(NS + "_count");' +
      '  if (el) el.textContent = (window[NS]||[]).length;' +
      '}' +
      'function all(){ runs++; btn(); collect(); }' +
      'function schedule(){ if (scheduled) return; scheduled = true; setTimeout(function(){ scheduled=false; all(); }, 500); }' +
      'function init(){ all(); if (document.body) { new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true}); } setInterval(all, 3000); }' +
      'if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();' +
      '})();</script>';

    var before = '</body>';
    var i = body.toLowerCase().lastIndexOf(before);
    if (i >= 0) body = body.slice(0, i) + inject + body.slice(i);
    else body += inject;

    $done({ body: body });
    return;
  } catch (e) {
    fallback();
  }
})();
