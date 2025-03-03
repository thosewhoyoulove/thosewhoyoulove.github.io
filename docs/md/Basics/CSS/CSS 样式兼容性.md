# CSS 样式兼容性

CSS 样式兼容性是指不同浏览器对 CSS 属性和功能的支持程度。由于不同浏览器的渲染引擎和版本差异，某些 CSS 属性可能在某些浏览器中表现不同或不被支持。以下是一些常见的 CSS 属性及其兼容性注意事项。

## 1. Flexbox

- **支持情况**：
  - 大多数现代浏览器（Chrome, Firefox, Safari, Edge）均支持 Flexbox。
  - 旧版 IE（如 IE 10 和 IE 11）对 Flexbox 的支持有限。

## 2. Grid Layout

- **支持情况**：
  - 大多数现代浏览器（Chrome, Firefox, Safari, Edge）均支持 CSS Grid。
  - IE 11 对 Grid 的支持不完全，某些功能可能无法使用。

## 3. CSS Variables

- **支持情况**：
  - 大多数现代浏览器（Chrome, Firefox, Safari, Edge）均支持 CSS 变量。
  - IE 不支持 CSS 变量。

## 4. Transitions 和 Animations

- **支持情况**：
  - 大多数现代浏览器均支持 CSS 过渡和动画。
  - 旧版浏览器可能需要使用前缀（如 `-webkit-`）来实现兼容性。

## 5. 媒体查询

- **支持情况**：
  - 大多数现代浏览器均支持媒体查询。
  - 旧版浏览器（如 IE 8 及更早版本）对媒体查询的支持有限。

## 结论

在开发过程中，建议使用 CSS 兼容性表（如 [Can I use](https://caniuse.com/)）来检查特定 CSS 属性的浏览器支持情况。此外，使用前缀和渐进增强的策略可以提高样式在不同浏览器中的兼容性。
