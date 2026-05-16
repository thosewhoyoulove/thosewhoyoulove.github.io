# Flexbox 和 Grid

## 面试定位

Flex 和 Grid 是 CSS 布局高频题。面试重点是：Flex 适合一维布局，Grid 适合二维布局；能说出常用属性、适用场景和选择原则。

## 核心原理

Flexbox 和 Grid 都是现代 CSS 布局方案。

- Flexbox：沿主轴排列，适合一行或一列的一维布局。
- Grid：同时控制行和列，适合二维网格布局。

## Flexbox

开启 Flex：

```css
.container {
    display: flex;
}
```

核心概念：

- 主轴：由 `flex-direction` 决定。
- 交叉轴：与主轴垂直。
- 容器控制整体排列，子项控制自身伸缩。

常用容器属性：

```css
.container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
}
```

常用子项属性：

```css
.item {
    flex: 1;
    align-self: flex-start;
}
```

`flex: 1` 通常等价于允许元素伸缩并占据剩余空间。

## Grid

开启 Grid：

```css
.container {
    display: grid;
    grid-template-columns: 200px 1fr 1fr;
    grid-template-rows: auto 1fr;
    gap: 16px;
}
```

Grid 可以直接定义二维结构：

```css
.layout {
    display: grid;
    grid-template-areas:
        "header header"
        "sidebar main"
        "footer footer";
    grid-template-columns: 240px 1fr;
}

.header {
    grid-area: header;
}
```

## 怎么选择

适合 Flex：

- 导航栏。
- 按钮组。
- 水平/垂直居中。
- 卡片一行排列。
- 表单 label 和 input 对齐。

适合 Grid：

- 页面整体布局。
- 仪表盘。
- 九宫格。
- 多行多列卡片。
- 复杂区域布局。

## 面试回答

可以这样答：

> Flexbox 适合一维布局，主要处理一行或一列里元素如何分布、对齐和伸缩，比如导航栏、按钮组、居中。它通过主轴和交叉轴控制布局。Grid 适合二维布局，可以同时控制行和列，比如页面整体布局、仪表盘、复杂卡片网格。选择时，如果只是单方向排列，我用 Flex；如果需要同时控制行列和区域，我用 Grid。两者可以组合使用，比如页面大结构用 Grid，局部元素对齐用 Flex。

## 高频追问

### Flex 怎么实现水平垂直居中？

```css
.box {
    display: flex;
    justify-content: center;
    align-items: center;
}
```

### flex: 1 是什么意思？

常见理解是子项可以伸缩并平分剩余空间。完整写法通常可理解为 `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`。

### Grid 能替代 Flex 吗？

不能完全替代。Grid 适合二维结构，Flex 适合内容驱动的一维排列。实际项目经常一起用。

## 相关链接

- [Position](/md/基础/CSS/Position.md)
- [样式兼容性](/md/基础/CSS/样式兼容性.md)
