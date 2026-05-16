# CSS Position

## 面试定位

`position` 是 CSS 布局基础题。面试重点是定位参照物、是否脱离文档流、`absolute` 找谁定位、`fixed` 和 `sticky` 的区别。

## 核心原理

`position` 决定元素如何参与文档流，以及 `top/right/bottom/left` 这些偏移属性相对谁生效。

常见值：

- `static`
- `relative`
- `absolute`
- `fixed`
- `sticky`

## static

默认值。元素按正常文档流排列，`top/right/bottom/left` 不生效。

```css
.box {
    position: static;
}
```

## relative

相对定位。元素仍占据原来的文档流位置，偏移是相对于自身原位置。

```css
.box {
    position: relative;
    top: 10px;
}
```

常用于给子元素的 `absolute` 提供定位上下文。

## absolute

绝对定位。元素脱离文档流，不再占据原空间。

定位参照物是最近的“非 static 定位祖先”。如果没有，则相对于初始包含块。

```css
.parent {
    position: relative;
}

.child {
    position: absolute;
    right: 0;
    top: 0;
}
```

## fixed

固定定位。元素脱离文档流，通常相对于视口定位，滚动页面时位置不变。

```css
.back-top {
    position: fixed;
    right: 24px;
    bottom: 24px;
}
```

注意：某些情况下，祖先元素的 `transform`、`filter`、`perspective` 可能影响 fixed 的包含块。

## sticky

粘性定位。它在正常文档流中占位，滚动到阈值后像 fixed 一样粘住。

```css
.nav {
    position: sticky;
    top: 0;
}
```

生效条件：

- 必须设置 `top`、`bottom`、`left` 或 `right` 之一。
- 父容器不能不合理地裁剪滚动区域。
- 粘性范围受父容器边界限制。

## 面试回答

可以这样答：

> `position` 决定元素的定位方式。`static` 是默认文档流定位，偏移不生效；`relative` 相对自身原位置偏移，但仍占位；`absolute` 脱离文档流，相对于最近的非 static 祖先定位；`fixed` 通常相对于视口定位，滚动时固定；`sticky` 是相对定位和固定定位的结合，元素先正常占位，滚动到阈值后粘住。实际项目里，父元素 `relative` + 子元素 `absolute` 是最常见的局部定位组合。

## 高频追问

### absolute 一定相对于父元素吗？

不一定。它相对于最近的非 `static` 定位祖先。如果父元素没有设置定位，会继续向上找。

### relative 会脱离文档流吗？

不会。它偏移后，原来的空间仍然保留。

### sticky 为什么不生效？

常见原因是没有设置 `top` 等阈值，或者父容器滚动/高度/overflow 设置导致粘性范围不符合预期。

## 相关链接

- [Flexbox 和 Grid](/md/基础/CSS/Flexbox%20和%20Grid.md)
- [块级元素和行内元素](/md/基础/HTML/块级元素和行内元素.md)
