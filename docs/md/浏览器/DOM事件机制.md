# DOM 事件机制

## 面试回答

> 浏览器里一个 DOM 事件不是只落在目标节点上，而是会走完整链路：先从 window 往目标走捕获阶段，到达目标后再往上冒泡回 window。监听时用 `addEventListener(type, handler, options)`，第三个参数里 `capture: true` 表示在捕获阶段听，默认 false 是冒泡阶段。`stopPropagation` 阻止继续传播，`preventDefault` 阻止默认行为（如 a 跳转、表单提交），两者不要混。
>
> 事件委托是把子元素的监听挂到祖先上，利用冒泡（或捕获）在父节点根据 `event.target` 判断真正点的是谁。好处是：动态增删的列表项不用反复绑/解监听，内存和性能更好，也符合「少监听、集中处理」。注意：部分事件不冒泡（如 focus，可用 focusin），委托时要确认事件类型；React 里还有合成事件，原理仍是根上委托，但 API 和批量更新要按 React 版本理解。
>
> 社招三年岗常结合「列表点击」「动态表单项」「性能」追问：我会优先在稳定父节点委托，处理时用 `closest` 找到业务节点，并在组件卸载时 `removeEventListener`（同一函数引用）。

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
| 2 | onChild | 目标（目标上捕获/冒泡监听都在目标阶段，顺序与注册有关） |
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

### 6. 和 Vue / React

- **原生**：记得 `removeEventListener` 必须是**同一个函数引用**。
- **React**：17+ 委托到 root；handler 里的事件是合成事件包装。`e.persist` 在新版本已弱化。不要假设和原生完全同一对象。
- **Vue**：`@click` 在元素上；`@click.stop` / `.prevent` 对应上述两个 API。

### 7. 设计取舍

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

声明不调用 `preventDefault`，浏览器可更平滑滚动；触摸/wheel 常见。

### React 合成事件和原生有何关系？

仍是底层原生事件，框架在根上统一委托并包装，便于跨浏览器和与更新批处理协作；细节随版本变，面试抓「根委托 + 包装」即可。

---

## 延伸阅读

- [浏览器的渲染原理](/md/浏览器/浏览器的渲染原理.md)
- [浏览器事件循环](/md/浏览器/浏览器的事件循环.md)
- [防抖与节流](/md/基础/JavaScript/防抖与节流.md)
- [浏览器与性能速记](/md/面试准备/技术/浏览器面试速记.md)
