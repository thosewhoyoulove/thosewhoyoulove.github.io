# Flexbox 和 Grid 布局的使用和区别

## Flexbox（弹性盒布局）

特点：

- 适合 一维布局（单行或单列）。
- 布局方向为主轴（flex-direction）和交叉轴（垂直主轴）。
- 子元素可以根据空间动态调整大小。

常用属性：

- 容器属性：
  - display: flex：启用 Flexbox。
  - flex-direction：主轴方向（row、column、row-reverse、column-reverse）。
  - justify-content：主轴方向上的对齐方式（flex-start、center、space-between 等）。
  - align-items：交叉轴方向上的对齐方式（flex-start、center、stretch 等）。
  - flex-wrap：是否允许换行（nowrap、wrap）。
- 子元素属性：
  - flex：设置子元素的伸缩比（如 flex: 1 平均分配空间）。
  - align-self：单个子元素的对齐方式。

## Grid（网格布局）

特点：

- 适合 二维布局（行和列同时控制）。
- 提供了更精确的布局控制（如网格区域、行列间距）。
常用属性：

- 容器属性：
  - display: grid：启用 Grid 布局。
  - grid-template-rows 和 grid-template-columns：定义行和列的大小。
  - gap：设置网格间距。
  - grid-template-areas：命名网格区域。
- 子元素属性：
  - grid-column 和 grid-row：定义元素在网格中的位置。
  - grid-area：直接指定子元素所在区域。
