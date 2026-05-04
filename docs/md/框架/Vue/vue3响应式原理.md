# Vue 3 响应式原理

Vue 3 的响应式系统是基于 **Proxy** API 实现的。Vue 2 中使用的是 **Object.defineProperty** 来实现响应式，而 Vue 3 使用 **Proxy** 来进行更高效、灵活的响应式处理。下面详细解释 Vue 3 响应式的原理。

## 1. 响应式系统的基本概念

Vue 的响应式系统允许开发者在数据发生变化时，自动更新界面。Vue 会通过 **数据代理** 和 **依赖收集** 来实现这一功能。Vue 3 使用 **Proxy** 来拦截对对象属性的操作，然后触发相应的副作用（如重新渲染组件）。

### 主要功能

- **数据代理**：Vue 会将数据对象的属性代理到 Vue 实例中，通过代理实现对数据的访问和修改。
- **依赖收集**：当某个属性的值被访问时，Vue 会记录这个属性与当前组件的依赖关系，确保数据变化时能够触发视图更新。
- **变更通知**：当数据发生变化时，Vue 会通知相关依赖进行更新。

## 2. Proxy 的基本用法

Vue 3 使用 **Proxy** 对象来代理原始数据对象。Proxy 是 ES6 引入的一种新技术，它允许开发者定义自定义行为来拦截对对象的各种操作，如访问、修改、删除等。

### Proxy 的基本语法

```javascript
const handler = {
  get(target, prop, receiver) {
    // 拦截获取属性操作
    console.log(`访问属性 ${prop}`);
    return prop in target ? target[prop] : undefined;
  },
  set(target, prop, value, receiver) {
    // 拦截设置属性操作
    console.log(`设置属性 ${prop} 为 ${value}`);
    target[prop] = value;
    return true;
  }
};

const target = {
  message: 'Hello'
};

const proxy = new Proxy(target, handler);
console.log(proxy.message);  // 输出 "访问属性 message" 和 "Hello"
proxy.message = 'Hello, Vue3';  // 输出 "设置属性 message 为 Hello, Vue3"
```

在 Vue 3 中，handler 中的 get 和 set 方法被用来拦截对对象属性的访问和修改。Vue 3 使用 Proxy 实现了对数据的代理，从而能够在数据变化时通知视图更新。

## 3. Vue 3 响应式原理

### 3.1 创建响应式对象

Vue 3 提供了 reactive 函数来创建响应式对象。reactive 函数使用 Proxy 来拦截对对象的访问和修改，并在适当的时候触发视图更新。

```javascript
import { reactive } from 'vue';

const state = reactive({
  count: 0
});

console.log(state.count);  // 访问响应式对象，触发 get
state.count = 1;           // 修改响应式对象，触发 set

```

### 3.2 数据劫持与依赖收集

- **数据劫持**：通过 Proxy 拦截对数据对象的访问和修改，Vue 能够监控数据变化。
- **依赖收集**：当组件访问某个响应式数据时，Vue 会记录这个组件与该数据的依赖关系。每当该数据发生变化时，相关的组件会被通知并重新渲染。

依赖收集的过程：

1. 当组件渲染时，它会访问响应式数据。
2. 在 get 拦截器中，Vue 会收集当前正在渲染的组件（通常是一个副作用函数）与该数据的依赖关系。
3. 当数据发生变化时，Vue 会通过依赖关系通知相应的组件进行重新渲染。

```javascript
依赖收集的过程：
import { reactive, effect } from 'vue';

const state = reactive({
  count: 0
});

// effect 会在组件渲染时自动收集依赖
effect(() => {
  console.log(state.count);  // 会触发 getter，自动收集依赖
});

state.count = 1;  // 会触发 setter，更新 count

```

### 3.3 getter 和 setter 的作用

- **getter**：每当访问响应式对象的属性时，get 拦截器被触发。在 get 中，Vue 会收集依赖，将当前访问的组件（副作用函数）添加到依赖队列中。
- **setter**：每当修改响应式对象的属性时，set 拦截器被触发。在 set 中，Vue 会触发通知机制，告知相关的依赖（即组件）更新。

### 3.4 深度响应式

Vue 3 的 reactive 还支持深度响应式。即使是嵌套的对象或数组，Vue 也会为其每个属性或元素创建代理，实现深度响应式。

```javascript
const state = reactive({
  user: {
    name: 'Alice',
    age: 25
  }
});

console.log(state.user.name);  // 访问嵌套对象，触发 get
state.user.name = 'Bob';       // 修改嵌套对象，触发 set
```

在这个例子中，user 对象内部的属性也会变成响应式的，Vue 会为 user 对象内部的每个属性创建代理，确保每个属性的访问和修改都会被拦截。

### 3.5 依赖更新与视图刷新

当响应式数据发生变化时，Vue 会通过通知机制将数据变化通知给依赖该数据的组件。组件会根据新的数据重新渲染视图。

### 3.6 ref 和 reactive 的区别

- reactive：适用于对象类型的数据，能为对象及其嵌套的属性提供深度响应式。
- ref：适用于原始数据类型（如字符串、数字、布尔值等），它会将数据包装成一个对象，并通过 .value 来访问和修改值。

```javascript
  import { ref, reactive } from 'vue';

const count = ref(0);  // 基本数据类型使用 ref
const state = reactive({
  count: 0
});  // 对象使用 reactive

console.log(count.value);  // 获取 ref 的值
count.value = 1;  // 设置 ref 的值

```

### 3.7 computed 与响应式系统

Vue 3 还提供了 computed（计算属性）功能，计算属性基于响应式数据并且只有在其依赖的数据变化时才会重新计算。它本质上是依赖收集的一个特殊形式，适用于性能优化。

```javascript
import { reactive, computed } from 'vue';

const state = reactive({
  count: 0
});

const doubleCount = computed(() => state.count * 2);

console.log(doubleCount.value);  // 自动根据 count 变化计算值
state.count = 2;
console.log(doubleCount.value);  // 更新后的值

```

## 4. 总结

Vue 3 的响应式原理基于 Proxy API，通过代理原始数据并拦截对数据的操作来实现响应式。它采用了 依赖收集 的策略，将组件与数据的依赖关系进行绑定，当数据发生变化时，通知依赖组件重新渲染。相对于 Vue 2，Vue 3 的响应式系统更加灵活和高效，特别是在性能和内存优化方面有显著提升。

### 核心特性

- Proxy 作为数据代理，提供更强大的功能；
- 依赖收集 确保数据变化时只更新需要的部分；
- 深度响应式 使得嵌套对象也能响应式；
- ref 与 reactive 适配不同类型的数据；
- computed 用于优化计算属性的更新。
