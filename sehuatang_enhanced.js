/*
 * 98堂 / 色花堂 (sehuatang.net) 增强脚本
 * 功能：去广告、提取资源链接、图片代理、去登录提示、版块页一键导出磁力
 * 适用: Quantumult X / Loon / Surge
 */

(function () {
  'use strict';

  var HOST = 'sehuatang.net';
  var isQX = (typeof $task !== 'undefined');
  var isLoon = (typeof $loon !== 'undefined');
  var isSurge = (typeof $httpClient !== 'undefined');

  function log(msg) {
    console.log('[98tang] ' + msg);
  }

  // 资源链接正则
  var RESOURCE_REGEX = /(magnet:\?xt=urn:btih:[a-zA-Z0-9]+|ed2k:\/\/[^'"\s<>]+|https?:\/\/[^'"\s<>]*(?:115\.com|pan\.baidu\.com|lanzou[lx]\.com|alipan\.com|quark\.cn|ctfile\.com|123pan\.com)[^'"\s<>]*|\.torrent)/gi;

  // 提取页面所有资源链接
  function extractResources(text) {
    var matches = text.match(RESOURCE_REGEX);
    return matches ? [...new Set(matches)] : [];
  }

  // 在页面注入资源提取面板
  function injectResourcePanel() {
    if (document.getElementById('sehuatang-resource-panel')) return;
    var panel = document.createElement('div');
    panel.id = 'sehuatang-resource-panel';
    panel.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;background:#1a1a2e;padding:12px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);font-family:system-ui;font-size:12px;color:#eee;max-width:320px;max-height:60vh;overflow:auto;border:1px solid #e94560;';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><strong style="color:#e94560;">🧲 98堂资源提取</strong><button id="close-panel" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:16px;">×</button></div><div id="resource-list" style="line-height:1.6;"></div><div style="margin-top:8px;display:flex;gap:6px;"><button id="copy-all" style="flex:1;background:#e94560;border:none;color:#fff;padding:6px;border-radius:4px;cursor:pointer;">复制全部</button><button id="export-txt" style="flex:1;background:#0f3460;border:none;color:#fff;padding:6px;border-radius:4px;cursor:pointer;">导出TXT</button></div>';
    document.body.appendChild(panel);

    var resources = extractResources(document.body.innerText);
    var listEl = document.getElementById('resource-list');
    if (resources.length) {
      listEl.innerHTML = resources.map(function(r) {
        var type = r.startsWith('magnet') ? '🧲 磁力' : r.startsWith('ed2k') ? '🔗 ED2K' : r.includes('.torrent') ? '📦 种子' : '📁 网盘';
        return '<div style="margin:4px 0;padding:6px;background:#16213e;border-radius:4px;word-break:break-all;"><span style="color:#e94560;">' + type + ' </span><span>' + r.replace(/</g,'<').replace(/>/g,'>') + '</span></div>';
      }).join('');
    } else {
      listEl.innerHTML = '<div style="color:#888;text-align:center;padding:10px;">未检测到资源链接</div>';
    }

    document.getElementById('close-panel').onclick = function() { panel.remove(); };
    document.getElementById('copy-all').onclick = function() {
      navigator.clipboard.writeText(resources.join('\n')).then(function() {
        alert('已复制 ' + resources.length + ' 个链接');
      });
    };
    document.getElementById('export-txt').onclick = function() {
      var blob = new Blob([resources.join('\n')], {type: 'text/plain'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'sehuatang-resources-' + Date.now() + '.txt';
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  // 去广告
  function removeAds() {
    var adSelectors = [
      'td[id^="ad_"]', 'div[id^="ad_"]', 'iframe[src*="casino"]', 'iframe[src*="ad"]',
      'a[href*="yabo"]', 'a[href*="fadafa"]', 'a[href*="bfguoji"]', 'a[href*="aomen"]',
      'a[href*="xinpj"]', 'a[href*="PGdianzi"]', 'a[href*="fenghuang"]', 'a[href*="jinsha"]',
      'img[src*="banner"]', 'div[class*="banner"]', 'table[width="100%"] > tbody > tr > td[align="center"] > a[target="_blank"]'
    ];
    adSelectors.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) { el.style.display = 'none'; });
    });
    // 隐藏"鲍鱼盒子"等内联广告
    var allText = document.body.innerText;
    if (allText.includes('鲍鱼盒子') || allText.includes('全网高清直播')) {
      var ads = document.querySelectorAll('td, div, p');
      ads.forEach(function(el) {
        if (el.innerText.includes('鲍鱼盒子') || el.innerText.includes('邀请好友送现金')) {
          el.style.display = 'none';
        }
      });
    }
  }

  // 图片代理/修复懒加载
  function fixImages() {
    document.querySelectorAll('img[file], img[zoomfile], img[src*="attach"], img[src*="avatar"]').forEach(function(img) {
      var src = img.getAttribute('file') || img.getAttribute('zoomfile') || img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        img.src = 'https://' + HOST + '/' + src.replace(/^\//, '');
      }
      if (img.hasAttribute('file')) img.removeAttribute('file');
      if (img.hasAttribute('zoomfile')) img.removeAttribute('zoomfile');
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    });
    // 修复"看不到图请挂代理"提示
    var texts = document.evaluate('//text()[contains(.,"看不到图请挂代理")]', document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < texts.snapshotLength; i++) {
      texts.snapshotItem(i).parentNode.style.display = 'none';
    }
  }

  // 去登录提示、显示回复框
  function fixLoginPrompts() {
    // 隐藏"您需要登录后才可以回帖"
    var loginTexts = document.evaluate('//text()[contains(.,"您需要登录后才可以回帖") or contains(.,"登录 后使用快捷导航") or contains(.,"请 登录 后")]', document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < loginTexts.snapshotLength; i++) {
      var node = loginTexts.snapshotItem(i);
      if (node.parentNode) node.parentNode.style.display = 'none';
    }
    // 显示快速回复框（如果被隐藏）
    var fastpost = document.getElementById('fastpost');
    if (fastpost) fastpost.style.display = 'block';
  }

  // 版块页：一键导出当前页所有帖子磁力链
  function injectBatchExport() {
    if (location.href.includes('forum-') && !location.href.includes('thread-')) {
      if (document.getElementById('sehuatang-batch-export')) return;
      var btn = document.createElement('button');
      btn.id = 'sehuatang-batch-export';
      btn.textContent = '📥 导出本页磁力链';
      btn.style.cssText = 'position:fixed;top:80px;right:20px;z-index:9998;background:#0f3460;color:#fff;border:none;padding:10px 14px;border-radius:6px;cursor:pointer;font-size:13px;box-shadow:0 2px 10px rgba(0,0,0,0.3);';
      btn.onclick = function() {
        var links = [];
        document.querySelectorAll('a[href*="thread-"]').forEach(function(a) {
          var href = a.href;
          if (href && href.includes('thread-') && href.endsWith('.html')) {
            links.push(href);
          }
        });
        var unique = [...new Set(links)];
        // 并发抓取每个帖子的磁力链（简化版：只在当前页DOM里找）
        var pageText = document.body.innerText;
        var magnets = pageText.match(/magnet:\?xt=urn:btih:[a-zA-Z0-9]+/gi) || [];
        var ed2ks = pageText.match(/ed2k:\/\/[^'"\s<>]+/gi) || [];
        var all = [...new Set([...magnets, ...ed2ks])];
        if (all.length) {
          navigator.clipboard.writeText(all.join('\n')).then(function() {
            alert('已复制 ' + all.length + ' 个资源链接到剪贴板');
          });
        } else {
          alert('本页未检测到磁力/ED2K链接');
        }
      };
      document.body.appendChild(btn);
    }
  }

  // 主入口
  function init() {
    removeAds();
    fixImages();
    fixLoginPrompts();
    injectResourcePanel();
    injectBatchExport();
    // 动态内容观察
    var observer = new MutationObserver(function() {
      removeAds();
      fixImages();
      fixLoginPrompts();
    });
    observer.observe(document.body, {childList: true, subtree: true});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
