# nextTick

## 1. 什么是 nextTick

nextTick 是 Vue 提供的一个全局 API，用于延迟执行一个回调函数。

## 2. 为什么需要 nextTick

Vue 是异步更新 DOM 的 —— 当你修改响应式数据时，Vue 不会立即更新 DOM，而是把这些更新放在一个“任务队列”里，等到当前同步任务执行完，再统一去更新 DOM。

但是有时候，你可能需要在数据更新后，立即获取 DOM 的最新状态，比如：

```vue
<template>
  <div ref="box">{{ message }}</div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const message = ref('Hello')

function updateMessage() {
  message.value = 'World'
  // 此时 DOM 还没更新
  console.log(document.querySelector('div').textContent) // 可能还是 "Hello"

  nextTick(() => {
    // 现在 DOM 已经更新完
    console.log(document.querySelector('div').textContent) // "World"
  })
}
</script>

```

## 3.实际应用场景

- 修改数据后立即进行 DOM 操作（如获取某元素尺寸、滚动、聚焦等）
- 使用动画库时，等待 DOM 更新后再执行动画
- 单元测试中等待 DOM 更新完成
