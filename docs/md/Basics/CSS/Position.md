# CSS 的 position 属性

CSS 的 `position` 属性用于指定元素的定位方式。它有以下几种常见的值，每种值的作用如下：

## 1. static

- **默认值**。元素按照正常的文档流进行定位，不受 `top`、`right`、`bottom` 和 `left` 属性的影响。

## 2. relative

- **相对定位**。元素相对于其正常位置进行定位。使用 `top`、`right`、`bottom` 和 `left` 属性可以调整元素的位置，但仍然保留其在文档流中的位置。

## 3. absolute

- **绝对定位**。元素相对于最近的已定位祖先元素（即 `position` 不为 `static` 的元素）进行定位。如果没有已定位的祖先，则相对于初始包含块（通常是 `<html>` 或 `<body>`）进行定位。元素不再占据文档流中的空间。

## 4. fixed

- **固定定位**。元素相对于浏览器窗口进行定位，即使页面滚动，元素也会保持在指定位置。它不占据文档流中的空间。

## 5. sticky

- **粘性定位**。元素在跨越特定的阈值时会在相对定位和固定定位之间切换。它在滚动到特定位置时会“粘住”在视口中。

## 示例

```css

.element-static {
position: static; /* 默认定位 */
}

.element-relative {
position: relative; /* 相对定位 */
top: 10px; /* 向下移动 10 像素 */
}

.element-absolute {
position: absolute; /* 绝对定位 */
top: 20px; /* 相对于最近的已定位祖先向下移动 20 像素 */
}

.element-fixed {
position: fixed; /* 固定定位 */
top: 0; /* 固定在视口顶部 */
}

.element-sticky {
position: sticky; /* 粘性定位 */
top: 0; /* 当滚动到顶部时粘住 */
}

```

通过使用不同的 `position` 值，可以实现各种布局效果和交互效果。
