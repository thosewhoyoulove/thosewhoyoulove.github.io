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

``` js
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

<iframe src="demo.html" width="100%" height="400px"></iframe>
