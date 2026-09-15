# DOM 事件机制

## 面试回答

> 浏览器里一个 DOM 事件不是只落在目标节点上，而是会走完整链路：先从 window 往目标走捕获阶段，到达目标后再往上冒泡回 window。监听时用 `addEventListener(type, handler, options)`，第三个参数里 `capture: true` 表示在捕获阶段听，默认 false 是冒泡阶段。`stopPropagation` 阻止继续传播，`preventDefault` 阻止默认行为（如 a 跳转、表单提交），两者不要混。
>
> 事件委托是把子元素的监听挂到祖先上，利用冒泡（或捕获）在父节点根据 `event.target` 判断真正点的是谁。它的主要价值是统一管理动态子节点，减少重复绑定和清理；是否更快仍取决于事件频率、匹配逻辑和节点规模。注意：部分事件不冒泡（如 focus，可用 focusin），委托时要确认事件类型；React 里还有合成事件，原理仍是根上委托，但 API 和批量更新要按 React 版本理解。
>
> 委托时还要区分 `target` 和 `currentTarget`：前者是事件路径的原始目标，后者是当前正在执行监听器的节点。普通 DOM 树用 `closest` 很方便；跨 Shadow DOM 时事件可能 retarget，需要结合 `composed` 和 `composedPath()` 看真实传播路径。清理监听除了保留同一函数引用，也可以用 `AbortSignal` 统一取消。

**一句话总结：**

> 捕获下行 → 目标 → 冒泡上行 → addEventListener 选阶段 → 委托用 target/closest → stopPropagation ≠ preventDefault。

---

## 核心原理

### 1. 为什么需要这套模型

页面节点是树。若只支持「绑在谁身上谁收」，动态子节点和统一拦截会很难。捕获/冒泡让祖先能统一观察子树；委托把大量子监听收成少量父监听。

### 2. 整体执行链路

```text
用户操作（点击等）
  → 捕获：window → ... → 父 → 目标
  → 目标阶段
  → 冒泡：目标 → 父 → ... → window
  → 各阶段上已注册的 listener 按序执行
```

示意图：

```text
window
  └── document
        └── html
              └── body
                    └── ul          ← 常把 click 委托在这里
                          └── li    ← event.target 可能在这里或更内层
                                └── button
```

### 3. addEventListener 与阶段

```js
parent.addEventListener("click", onParentCapture, true);  // 捕获
parent.addEventListener("click", onParentBubble);         // 冒泡（默认）
child.addEventListener("click", onChild);
```

点击 child 时典型顺序：

| 顺序 | 监听 | 阶段 |
| ---: | --- | --- |
| 1 | onParentCapture | 捕获 |
| 2 | onChild | 目标（目标上的捕获监听先于冒泡监听） |
| 3 | onParentBubble | 冒泡 |

`options` 还可：`once`、`passive`（告诉浏览器不 `preventDefault`，利滚轮性能）、`signal`（AbortSignal 统一取消）。

### 4. 事件委托 Trace

需求：动态列表点击某一行高亮。

```js
ul.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li || !ul.contains(li)) return;
  // 处理这一行
});
```

| 步骤 | 值 | 含义 |
| --- | --- | --- |
| 用户点到 li 内 span | `e.target` = span | 实际触发节点 |
| `closest("li")` | 找到外层 li | 业务节点 |
| 监听在 ul | 不必给每个 li 绑监听 | 新增 li 自动生效 |

### 5. stopPropagation vs preventDefault

| API | 作用 | 典型场景 |
| --- | --- | --- |
| `stopPropagation` | 不再向后传播（后续阶段/节点收不到） | 内层点击不要触发外层菜单关闭 |
| `stopImmediatePropagation` | 同元素上后续监听也不跑 | 少用，难排查 |
| `preventDefault` | 取消浏览器默认行为 | 阻止链接跳转、表单提交 |

`preventDefault()` 只有在事件可取消（`cancelable`）且监听器不是 passive 时才有效。`passive: true` 是在向浏览器承诺不会阻止默认滚动，不是让回调自动变快。

### 6. `target`、`currentTarget` 与 Shadow DOM

| 属性/API | 含义 |
| --- | --- |
| `event.target` | 事件目标；跨 Shadow DOM 边界时可能被 retarget |
| `event.currentTarget` | 当前正在执行监听器的节点，离开回调后通常不应继续依赖 |
| `event.composedPath()` | 返回本次事件经过的传播路径 |
| `event.composed` | 是否允许事件越过 Shadow DOM 边界传播 |

多数 UI 事件会跨开放的 Shadow 边界传播，但不是所有自定义事件都会。组件库使用 Web Components 时，仅靠 `target.closest()` 可能无法覆盖完整路径。

### 7. 和 Vue / React

- **原生**：记得 `removeEventListener` 必须是**同一个函数引用**。
- **React**：17+ 委托到 root；handler 里的事件是合成事件包装。`e.persist` 在新版本已弱化。不要假设和原生完全同一对象。
- **Vue**：`@click` 在元素上；`@click.stop` / `.prevent` 对应上述两个 API。

### 8. 设计取舍

委托提升动态列表性能，但调试链路更长；过度在 document 上委托所有事件会让无关点击都进同一回调，要用类型和 `closest` 收窄。

---

## 常见误区

### ❌ 事件就是目标元素上执行一下

### ✅ 更准确的说法

多数事件有捕获和冒泡完整路径，祖先也能监听到。

### 为什么？

说不清阶段，就解释不了委托和 `capture: true`。

---

### ❌ stopPropagation 和 preventDefault 一样

### ✅ 更准确的说法

一个管传播，一个管默认行为，可同时用，职责不同。

### 为什么？

混用会导致「跳转没了但外层还关了面板」或反过来，排查困难。

---

### ❌ 所有事件都能委托

### ✅ 更准确的说法

不冒泡的事件（经典如 focus，可用 focusin）委托方式要换；滚动等要确认目标。

### 为什么？

否则父节点永远收不到。

---

## 高频追问

### 捕获和冒泡顺序是什么？

先捕获到目标，再冒泡回去。监听默认在冒泡阶段。

### 什么是事件委托？有什么好处？

祖先监听 + `target`/`closest` 识别子元素。动态节点友好、监听更少。

### 如何阻止事件传播 / 默认行为？

`stopPropagation` / `preventDefault`。

### passive 监听有什么用？

声明不会调用 `preventDefault`，浏览器可以不必等待监听器确认是否取消滚动；触摸/wheel 常见。它不会缩短回调本身的执行时间。

### `target` 和 `currentTarget` 有什么区别？

`target` 是事件目标，`currentTarget` 是当前监听器所在节点。事件委托通常在 `currentTarget` 上监听，再根据 `target` 或传播路径定位业务节点。

### React 合成事件和原生有何关系？

仍是底层原生事件，框架在根上统一委托并包装，便于跨浏览器和与更新批处理协作；细节随版本变，面试抓「根委托 + 包装」即可。

---

## 延伸阅读

- [浏览器的渲染原理](/md/浏览器/浏览器的渲染原理.md)
- [浏览器事件循环](/md/浏览器/浏览器的事件循环.md)
- [防抖与节流](/md/基础/JavaScript/防抖与节流.md)
- [浏览器与性能速记](/md/面试准备/技术/浏览器面试速记.md)
