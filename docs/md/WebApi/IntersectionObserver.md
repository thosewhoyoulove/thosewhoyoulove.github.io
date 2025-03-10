# IntersectionObserver 的作用

IntersectionObserver 是 浏览器提供的 API，用于检测一个元素是否进入或离开视口（viewport）。
它可以用于：

- 懒加载图片（当图片进入视口时才加载）
- 无限滚动（检测滚动到底部加载新内容）
- 触发动画（当元素出现在视口时播放动画）
- 广告曝光统计（检测广告是否被用户看到）

## IntersectionObserver 的基本用法

- 创建 IntersectionObserver 实例
- 观察目标元素
- 回调函数触发时执行操作

``` html [demo1.html]
<div id="my-sandbox"></div>
<script>
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      console.log('目标元素进入视口');
    } else {
      console.log('目标元素离开视口');
    }
  });
}, { threshold: 0.5 });

const target = document.querySelector('.target');
observer.observe(target);
</script>
```

entries 是被观察的元素列表，每个 entry 代表一个元素的可见性信息。threshold: 0.5 表示 当元素 50% 可见时触发回调。

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>懒加载图片示例</title>
  <style>
    .container {
      max-width: 600px;
      margin: auto;
    }
    .placeholder {
      width: 100%;
      height: 300px;
      background-color: #ddd;
      margin-bottom: 20px;
    }
    img {
      width: 100%;
      height: auto;
      display: block;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="placeholder">滚动查看图片加载</div>
    <img data-src="https://picsum.photos/600/400?random=1" class="lazy-load" alt="随机图片">
    <img data-src="https://picsum.photos/600/400?random=2" class="lazy-load" alt="随机图片">
    <img data-src="https://picsum.photos/600/400?random=3" class="lazy-load" alt="随机图片">
  </div>

  <script>
    const lazyImages = document.querySelectorAll('.lazy-load');

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;  // 把 data-src 赋值给 src
          observer.unobserve(img);    // 加载完后取消观察
        }
      });
    }, { threshold: 0.1 });

    lazyImages.forEach(img => observer.observe(img));
  </script>

</body>
</html>
```
