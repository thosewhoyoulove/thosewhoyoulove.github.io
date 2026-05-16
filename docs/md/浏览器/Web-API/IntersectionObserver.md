# IntersectionObserver

## 面试定位

IntersectionObserver 常用于图片懒加载、曝光统计、无限滚动和滚动动画。面试重点是：它比监听 `scroll` 好在哪里、核心参数是什么、回调什么时候触发、有什么注意事项。

## 核心原理

IntersectionObserver 是浏览器提供的异步观察 API，用来监听目标元素和某个根容器的交叉状态。

它不需要在每次滚动时手动计算元素位置，浏览器会统一调度观察逻辑，性能通常比频繁监听 `scroll` 后调用 `getBoundingClientRect()` 更好。

常见场景：

- 图片懒加载。
- 列表无限滚动。
- 广告曝光统计。
- 内容进入视口后触发动画。
- 埋点曝光。

## 基本用法

```javascript
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                console.log("进入视口", entry.target);
            }
        });
    },
    {
        root: null,
        rootMargin: "0px",
        threshold: 0.5,
    }
);

const target = document.querySelector(".target");
observer.observe(target);
```

参数含义：

- `root`：观察的根容器，默认是浏览器视口。
- `rootMargin`：根容器的外边距，可以提前或延后触发。
- `threshold`：交叉比例阈值，可以是数字或数组。

`threshold: 0.5` 表示目标元素可见比例达到 50% 附近时触发回调。

## 图片懒加载

```html
<img data-src="/banner.webp" class="lazy" alt="" />
```

```javascript
const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const img = entry.target;
        img.src = img.dataset.src;
        observer.unobserve(img);
    });
});

document.querySelectorAll(".lazy").forEach((img) => {
    observer.observe(img);
});
```

加载完成后取消观察，避免不必要的回调。

## 无限滚动

列表底部放一个哨兵元素，当它进入视口时加载下一页。

```javascript
const sentinel = document.querySelector(".sentinel");

const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        loadNextPage();
    }
});

observer.observe(sentinel);
```

实际项目里要处理加载中状态、无更多数据、防重复请求。

## 和 scroll 监听对比

传统方式：

```javascript
window.addEventListener("scroll", () => {
    const rect = target.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
        // 进入视口
    }
});
```

问题：

- 滚动事件触发频繁，需要节流。
- 每次读取布局信息可能触发额外计算。
- 多个元素监听时代码复杂。

IntersectionObserver 由浏览器统一调度，回调异步触发，通常更适合可见性观察。

## 注意事项

- 回调不是像素级实时触发，不适合需要精确滚动位置的场景。
- 旧浏览器可能需要 polyfill。
- 观察大量元素时仍要及时 `unobserve` 或 `disconnect`。
- 曝光统计要结合可见时长，不能只看进入视口瞬间。

```javascript
observer.disconnect();
```

## 面试回答

可以这样答：

> IntersectionObserver 用来监听元素和视口或滚动容器的交叉状态，常用于懒加载、无限滚动和曝光统计。相比直接监听 `scroll`，它不需要每次滚动都手动调用 `getBoundingClientRect()` 计算位置，而是由浏览器统一调度，性能和代码可维护性更好。核心参数有 `root`、`rootMargin` 和 `threshold`。实际使用时，图片加载完成后要取消观察，曝光统计要考虑可见比例和可见时长，不能只在进入视口时就算有效曝光。

## 高频追问

### `threshold` 是什么？

`threshold` 是交叉比例阈值。比如 `0.5` 表示元素可见比例达到 50% 附近时触发回调，也可以传数组监听多个比例变化。

### `rootMargin` 有什么用？

可以扩大或缩小观察区域。图片懒加载时常用正值提前加载，避免用户滚到图片位置才开始请求。

### 它能完全替代 scroll 吗？

不能。它适合可见性观察，不适合需要连续滚动位置、滚动进度条、复杂视差动画这类需要高频精确位置的场景。

## 相关链接

- [加快首屏加载速度](/md/浏览器/加快首屏加载速度.md)
- [浏览器的渲染原理](/md/浏览器/浏览器的渲染原理.md)
