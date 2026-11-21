/*
 * 2048 AI短剧 (madouai.xyz / 2048ai4.com) 去广告脚本
 * 拦截 ad-v32 广告规则 API，返回 enabled=false + materials=[]
 * 同时屏蔽广告上报/统计埋点
 * 适用: Quantumult X / Loon / Surge
 */

(function () {
  'use strict';

  var isQX = (typeof $task !== 'undefined');

  function log(msg) { console.log('[2048ad] ' + msg); }

  function parseBody(body) { try { return JSON.parse(body); } catch (e) { return null; } }
  function stringifyBody(obj) { try { return JSON.stringify(obj); } catch (e) { return null; } }

  function handleAdRule(body) {
    var data = parseBody(body);
    if (!data || !data.data) return null;
    data.data.enabled = false;
    data.data.materials = [];
    return stringifyBody(data);
  }

  function isTrackingUrl(url) {
    return url.indexOf('/ad-v32/events') !== -1 ||
           url.indexOf('/short-drama-analytics/events') !== -1 ||
           url.indexOf('/track/page-view') !== -1 ||
           url.indexOf('/short-drama-analytics/follows') !== -1;
  }

  function isAdRuleUrl(url) { return url.indexOf('/ad-v32/rules/') !== -1; }

  var resp = $response;
  if (resp && resp.body) {
    if (isAdRuleUrl($request.url)) {
      var modified = handleAdRule(resp.body);
      if (modified) { log('ad rule modified'); $done({ body: modified }); return; }
    }
    if (isTrackingUrl($request.url)) {
      log('tracking blocked');
      $done({ body: '{"code":200,"message":"ok","data":{}}' });
      return;
    }
  }
  $done({});
})();
