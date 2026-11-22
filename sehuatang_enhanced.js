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
      var blob = new Blob([resources.jroin('\n'], {type: 'text/plain'});
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
        if (el.innerText.includes('鲍鱼盒子') || el.innerText.includes('+XZ�{����k�^y�Ni*�r����V��7G��R�F�7���v���Rs��Тғ��Т��Y��x�~K�>yb�K��ZH�hy.X���ТgV�7F���f����vW2����F�7V�V�B�VW'�6V�V7F�$�v��u�f��U����u�����f��U����u�7&2��&GF6�%����u�7&2��&fF"%�r��f�$V6��gV�7F��↖�r���f"7&2���r�vWDGG&�'WFR�vf��Rr�����r�vWDGG&�'WFR�w����f��Rr�����r�vWDGG&�'WFR�w7&2r����b�7&2bb7&2�7F'G5v�F��v�GGr�bb7&2�7F'G5v�F��vFF�r������r�7&2�v�GG3���r���5B�r�r�7&2�&W�6R�������rr���Т�b���r�4GG&�'WFR�vf��Rr����r�&V��fTGG&�'WFR�vf��Rr����b���r�4GG&�'WFR�w����f��Rr����r�&V��fTGG&�'WFR�w����f��Rr�����r�7G��R���v�GF��sRs����r�7G��R�V�v�B�vWF�s��ғ�������x�.�(ޛ�y�.Z�.z؞Xh^�N[��Y��f"FW�G2�F�7V�V�B�Wf�VFR�r��FW�B���6��F��2���.yȾK��X�Y���~h�.K�>yb"��r�F�7V�V�B��V����F�&W7V�B�T��$DU$TE���DU�4�4��E�E�R��V���f�"�f"�����FW�G2�6�6��D�V�wF��������FW�G2�6�6��D�FV҆���&V�D��FR�7G��R�F�7���v���Rs��ТР���X�y��[�^h�zK�8i��zK�Y��ZH�j`�gV�7F���f����v��&��G2���������x�.h*����hy��[�^Y�h��X��K�^Y��[�b 
    var loginTexts = document.evaluate('//text)([ontains(.,"朸我剿全浄饗术同国吊)]', document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < loginTexts.snapshotLength; i++) {
      var node = loginTexts.snapshotItem(i);
      if (node.parentNode) node.parentNode.style.display = 'none';
    }
    // 显示快速回复框（如果被隐藏）��\��\���H��[Y[���][[Y[��RY
	٘\���	�NY�
�\���
H�\�����[K�\�^HH	؛����B����9..�aiyc��[��[ۈ[��X��]�^ܝ

HY�
��][ۋ��Y��[��Y\�	ٛܝ[K��H	����][ۋ��Y��[��Y\�	��XYI�JHY�
��[Y[���][[Y[��RY
	��ZX][��X�]�Y^ܝ	�JH�]\���\���H��[Y[��ܙX]Q[[Y[�
	؝]ۉ�N���YH	��ZX][��X�]�Y^ܝ	����^�۝[�H	�'��H9k�9a+:hmy��yb��d������[K����^H	���][ێ��^Y���ܚY���ދZ[�^�NNNؘX��ܛ�[�����
����܎�ٙ��؛ܙ\���ۙN�Y[�ΌLM؛ܙ\�\�Y]\΍���\��܎��[�\�ٛ۝\�^�N�L�؛�\�Y�Ό�L�ؘJ��N�����ۘ�X��H�[��[ۊ
H�\�[���H�N��[Y[��]Y\�T�[X�ܐ[
	�V��Y��H��XYH�I�K��ܑXX�
�[��[ۊJH�\��Y�HK��Y�Y�
�Y�	���Y��[��Y\�	��XYI�H	���Y��[���]
	˚[	�JH[��˜\�
�Y�NB�JN�\�[�\]YHHˋ���]��]
[���WN��9nm�c�y���c幫��.*�n%�kd9�9��yb��d��"9�9c%��b;�&�c�g*9od�bczhmQ�za�9�o��"B��\�Y�U^H��[Y[����K�[��\�^�\�XYۙ]�HY�U^�X]�
�XYۙ]��]\����Z��K^�KV�NWJ���JH�N�\�Y���HY�U^�X]�
�Y�Η��׉ȗ��J���JH�N�\�[Hˋ���]��]
ˋ��XYۙ]����Y���JWNY�
[�[��
H�]�Y�]܋��\��\��ܚ]U^
[���[�	���JK�[��[��[ۊ
H[\�
	�m�i#yb-�	�
�[�[��
�	�9.*�-a9��:d﹣�yb,9bj�--9�o��NJNH[�H[\�
	��+:hmy�*���9�b�b,9��yb���Q��d﹣�I�NB�N��[Y[����K�\[��[
��NB�B����9..�aiyc��[��[ۈ[�]

H�[[ݙPY�
N�^[XY�\�
N�^��[���\�
N[��X��\��\��T[�[

N[��X��]�^ܝ

N��9b�9� ya�yk�z)�k��\�؜�\��\�H�]�]]][ۓ؜�\��\��[��[ۊ
H�[[ݙPY�
N�^[XY�\�
N�^��[���\�
NJN؜�\��\��؜�\��J��[Y[����K��[\���YK�X��YN��Y_JNB��Y�
��[Y[���XYT�]HOOH	��Y[���H��[Y[��Y]�[�\�[�\�	��P�۝[��YY	�[�]
NH[�H[�]

NB�JJN˚[��Y\�	�`�:+��ioyc��` y�:a�I�JH[��[K�\�^HH	ۛۙI�B�JNB�B����9f��a�.���!��/�i#y��b�:/oB��[��[ۈ�^[XY�\�
H��[Y[��]Y\�T�[X�ܐ[
	�[Y�ٚ[WK[Y�ޛ��Y�[WK[Y��ܘʏH�]X��K[Y��ܘʏH�]�]\��I�K��ܑXX�
