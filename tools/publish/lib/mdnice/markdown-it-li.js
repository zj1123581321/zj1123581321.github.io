/*
 * 移植自 mdnice/markdown-nice（GPL-3.0）
 * https://github.com/mdnice/markdown-nice/blob/master/src/utils/markdown-it-li.js
 * 逻辑未改。
 */
function makeRule(md) {
  return function replaceListItem() {
    md.renderer.rules.list_item_open = function replaceOpen() {
      return "<li><section>";
    };
    md.renderer.rules.list_item_close = function replaceClose() {
      return "</section></li>";
    };
  };
}

export default (md) => {
  md.core.ruler.push("replace-li", makeRule(md));
};
