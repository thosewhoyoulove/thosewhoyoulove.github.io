# React 核心原理面试题

## 面试定位

这篇用于 React 核心原理的第一轮复习，先覆盖两类最常被问到的问题：**React 基础思想**和**组件与渲染**。回答时不要只背 API 定义，要先给出能口述的结论，再补充背后的更新模型、数据流、状态不可变、key 与 diff 等原理。

---

## 问题导航

### React 基础思想

- [React 是什么？](#react-是什么)
- [React 的核心思想是什么？](#react-的核心思想是什么)
- [React 为什么是声明式 UI？](#react-为什么是声明式-ui)
- [React 单向数据流是什么？](#react-单向数据流是什么)
- [React 和 Vue 有什么区别？](#react-和-vue-有什么区别)
- [JSX 是什么？](#jsx-是什么)

### 组件与渲染

- [函数组件和类组件的区别？](#函数组件和类组件的区别)
- [React 组件什么时候会重新渲染？](#react-组件什么时候会重新渲染)
- [父组件更新，子组件一定会更新吗？](#父组件更新子组件一定会更新吗)
- [setState 是同步还是异步？](#setstate-是同步还是异步)
- [React 为什么不能直接修改 state？](#react-为什么不能直接修改-state)
- [key 的作用是什么？](#key-的作用是什么)
- [为什么列表渲染不推荐用 index 作为 key？](#为什么列表渲染不推荐用-index-作为-key)

---

## 1. React 基础思想

<a id="react-是什么"></a>

### React 是什么？

#### 面试回答

可以这样答：

> React 是一个用于构建用户界面的 JavaScript 库，核心职责是把组件状态映射成 UI。开发者用组件、JSX 和 state 描述页面在某个状态下应该长什么样；当状态变化时，React 会重新计算组件输出，通过调和过程找出需要更新的部分，再把变化提交到真实 DOM。它不强制完整应用架构，所以路由、状态管理、请求方案通常由生态组合完成。面试里我会强调 React 不是简单的 DOM 操作工具，而是一套状态驱动 UI 的组件化模型。

一句话总结：

> React = 用组件描述 UI，用状态驱动更新，用调和机制把变化同步到页面。

#### 核心原理

React 关注的是 UI 层，它把 UI 拆成组件，再把组件渲染结果组织成一棵树。状态变化后，React 不要求开发者手动找 DOM 节点、改 DOM 属性，而是重新执行组件，得到新的 UI 描述，再和旧结果对比。

```text
state / props 变化
  → 重新执行组件
  → 得到新的 React Element
  → reconciliation 对比新旧结果
  → commit 阶段更新真实 DOM
```

所以 React 的价值不只是“封装 DOM”，而是让 UI 更新进入统一的组件、状态和调度模型。

---

<a id="react-的核心思想是什么"></a>

### React 的核心思想是什么？

#### 面试回答

可以这样答：

> React 的核心思想可以概括为组件化、声明式 UI、状态驱动和单向数据流。组件化让页面可以按功能拆分和复用；声明式 UI 让我们描述“状态对应什么界面”，而不是一步步操作 DOM；状态驱动意味着 UI 来源于 props 和 state；单向数据流让数据从父到子传递，子组件通过回调通知父组件更新。它们组合起来，使复杂页面的更新路径更清晰，也更容易定位问题。

一句话总结：

> React 核心思想 = 组件化拆分 + 声明式表达 + 状态驱动渲染 + 单向数据流管理。

#### 核心原理

React 的思想不是孤立概念，而是一条完整链路：

```text
组件负责拆分 UI
  → props / state 描述数据
  → render 返回 UI 描述
  → React 负责计算和提交变化
```

这背后的关键取舍是：开发者少写命令式 DOM 操作，把“什么时候更新、怎么最小化更新、如何批处理更新”交给框架。代价是必须遵守 React 的约束，例如 state 不可直接修改、render 保持纯净、列表 key 必须稳定。

---

<a id="react-为什么是声明式-ui"></a>

### React 为什么是声明式 UI？

#### 面试回答

可以这样答：

> React 是声明式 UI，因为我们写组件时主要描述某个状态下页面应该是什么结果，而不是写一连串 DOM 操作步骤。比如 `isLogin` 为 true 时显示用户信息，为 false 时显示登录按钮；状态改变后，React 负责重新执行组件、对比前后结果并更新 DOM。这样代码更接近业务规则，状态和视图的关系更直接，也减少了手动操作 DOM 带来的遗漏和不一致。

一句话总结：

> 声明式 UI 是描述“状态对应的界面结果”，命令式 UI 是描述“怎么一步步改界面”。

#### 核心原理

命令式写法强调过程：

```js
button.style.display = isLogin ? 'none' : 'block'
userPanel.textContent = user.name
```

React 写法强调结果：

```jsx
function Header({ isLogin, user }) {
  return isLogin ? <UserPanel user={user} /> : <LoginButton />
}
```

React 能这样做，是因为 JSX 会变成 React Element，React 每次更新都能拿到一份新的 UI 描述，然后通过 diff 找出真实 DOM 需要变化的部分。

---

<a id="react-单向数据流是什么"></a>

### React 单向数据流是什么？

#### 面试回答

可以这样答：

> React 的单向数据流是指数据通常从父组件通过 props 传给子组件，子组件不能直接修改父组件的数据。如果子组件需要改变数据，要通过父组件传下来的回调函数通知父组件，由父组件更新 state 后再把新的 props 传下来。这样做的好处是数据来源更清晰，出了问题可以沿着“父 state → 子 props → 事件回调”的链路排查。

一句话总结：

> 单向数据流 = 父组件传数据，子组件发事件，真正的数据修改回到拥有 state 的组件完成。

#### 核心原理

React 组件的输入主要是 props，组件内部状态是 state。props 对子组件来说应该是只读的，因为 props 属于父组件的渲染结果。

```jsx
function Parent() {
  const [count, setCount] = useState(0)

  return <Counter count={count} onChange={setCount} />
}

function Counter({ count, onChange }) {
  return <button onClick={() => onChange(count + 1)}>{count}</button>
}
```

这个模型让状态所有权明确：谁拥有 state，谁负责修改；谁只拿到 props，谁只负责消费和通知。

---

<a id="react-和-vue-有什么区别"></a>

### React 和 Vue 有什么区别？

#### 面试回答

可以这样答：

> React 和 Vue 都是组件化 UI 框架，都通过状态变化驱动视图更新。核心区别在更新模型和开发约束：Vue 更偏响应式依赖追踪，数据被读取时收集依赖，数据变化时能较精确地触发相关更新；React 更偏显式状态更新，调用 setState 后重新执行组件函数，再通过虚拟 DOM、Fiber 和 diff 找出需要提交的变化。写法上 Vue 使用模板、指令和单文件组件约定，React 使用 JSX，把 UI 和逻辑都放在 JavaScript 表达能力里。项目选型时我会看团队熟悉度、生态要求、业务复杂度和长期维护成本，而不是简单说谁更好。

一句话总结：

> Vue 偏响应式依赖追踪和模板约定，React 偏显式状态更新和函数式组合。

#### 核心原理

可以从三个角度对比：

| 维度 | React | Vue |
| --- | --- | --- |
| 更新模型 | state 变化后重新执行组件，再调和差异 | 响应式系统追踪依赖，数据变化后触发相关 effect |
| UI 表达 | JSX，JavaScript 表达能力强 | 模板 + 指令，约定更明确 |
| 逻辑组织 | Hooks 和函数组合 | Composition API / Options API |

React 的优势是模型统一、生态灵活；Vue 的优势是上手更快、响应式粒度更直观。面试里不要停留在“React 灵活、Vue 简单”，要说清楚它们背后的更新机制差异。

---

<a id="jsx-是什么"></a>

### JSX 是什么？

#### 面试回答

可以这样答：

> JSX 是 JavaScript 的语法扩展，用类似 HTML 的写法描述 React UI。它本身不是浏览器原生语法，需要经过 Babel 或构建工具编译，最终会变成创建 React Element 的 JavaScript 调用。JSX 的价值是让 UI 结构、组件引用和 JavaScript 表达式放在一起，既保留声明式结构，又能使用 JS 的变量、条件和数组映射能力。它不是模板字符串，也不会直接生成真实 DOM。

一句话总结：

> JSX = 用类似 HTML 的语法写 UI，编译后得到 React Element 描述对象。

#### 核心原理

以 React 17+ 的新 JSX transform 为例：

```jsx
const element = <h1 className="title">Hello</h1>
```

大致会被编译成：

```js
import { jsx } from 'react/jsx-runtime'

const element = jsx('h1', {
  className: 'title',
  children: 'Hello'
})
```

React Element 是普通对象，用来描述节点类型、props 和 children。React 后续会根据这些描述对象构建 Fiber，并在 commit 阶段更新真实 DOM。

---

## 2. 组件与渲染

<a id="函数组件和类组件的区别"></a>

### 函数组件和类组件的区别？

#### 面试回答

可以这样答：

> 函数组件本质是接收 props、返回 UI 的函数，配合 Hooks 管理状态、副作用和复用逻辑；类组件通过继承 `React.Component`，用 `this.state`、`this.setState` 和生命周期方法组织逻辑。现在 React 推荐优先使用函数组件，因为 Hooks 让逻辑复用更自然，也避免了 class 中 `this`、生命周期拆散逻辑等问题。但类组件仍然存在于老项目和 Error Boundary 场景里，所以面试时不能说类组件完全不能用了。

一句话总结：

> 函数组件用 Hooks 组织状态和副作用，类组件用实例、state 和生命周期组织逻辑。

#### 核心原理

两者的主要区别：

| 维度 | 函数组件 | 类组件 |
| --- | --- | --- |
| 状态 | `useState`、`useReducer` | `this.state` |
| 副作用 | `useEffect`、`useLayoutEffect` | `componentDidMount`、`componentDidUpdate`、`componentWillUnmount` |
| 逻辑复用 | 自定义 Hook | HOC、Render Props |
| this | 无需关注 `this` | 需要处理 `this` 绑定 |

函数组件每次渲染都会重新执行函数，Hooks 状态由 React 按调用顺序挂在对应 Fiber 上。因此 Hooks 不能写在条件语句或循环里，否则状态对应关系会错乱。

---

<a id="react-组件什么时候会重新渲染"></a>

### React 组件什么时候会重新渲染？

#### 面试回答

可以这样答：

> React 组件重新渲染通常来自四类情况：自身 state 更新、父组件重新渲染导致它被重新执行、消费的 Context value 变化、外部 store 订阅的数据变化。重新渲染不等于真实 DOM 一定变化，React 只是重新计算组件输出，后续还要经过 diff 判断是否需要提交 DOM 更新。排查性能问题时，我会先区分“组件 render 了”和“DOM 真的改了”，再用 React DevTools Profiler 看是哪类更新触发的。

一句话总结：

> 组件重新渲染 = React 重新执行组件计算 UI，不一定等于真实 DOM 更新。

#### 核心原理

常见触发源：

```text
setState / dispatch
  → 当前组件重新渲染

父组件重新渲染
  → 默认会继续计算子组件

Context value 变化
  → 消费该 Context 的组件重新渲染

外部 store 变更
  → 订阅该数据的组件重新渲染
```

render 阶段只是计算新结果。只有当新旧结果经过 reconciliation 后存在需要插入、更新或删除的节点，commit 阶段才会修改真实 DOM。

---

<a id="父组件更新子组件一定会更新吗"></a>

### 父组件更新，子组件一定会更新吗？

#### 面试回答

可以这样答：

> 默认情况下，父组件重新渲染时，React 会继续执行它返回的子组件，所以子组件通常也会重新渲染。但这不代表子组件的真实 DOM 一定会变化，因为 React 还会 diff。也不代表一定无法跳过，如果子组件被 `React.memo` 包裹，并且 props 浅比较没有变化，React 可以跳过这个子组件的重新渲染。类组件里也可以用 `PureComponent` 或 `shouldComponentUpdate` 做类似控制。

一句话总结：

> 父组件更新时子组件默认会重新计算，但可通过 memo / PureComponent / shouldComponentUpdate 跳过。

#### 核心原理

React 的默认策略偏保守：父组件 render 后，会得到新的子元素描述，React 需要继续判断子树是否变化。

```jsx
const Child = React.memo(function Child({ name }) {
  return <div>{name}</div>
})
```

`React.memo` 做的是 props 浅比较。如果父组件每次都传入新的对象或函数，即使内容一样，浅比较也会认为变了：

```jsx
// 每次 render 都是新对象，memo 容易失效
<Child options={{ theme: 'dark' }} />
```

所以优化子组件渲染时，常常需要配合 `useMemo` 或 `useCallback` 稳定引用，但前提是确实存在性能问题。

---

<a id="setstate-是同步还是异步"></a>

### setState 是同步还是异步？

#### 面试回答

可以这样答：

> 更准确地说，`setState` 本身是同步调用的，但 React 对状态更新和渲染提交通常会做批处理，所以你不能假设调用 `setState` 后下一行代码就能读到最新 state。在 React 18 中，事件、Promise、setTimeout、原生事件等场景里的多次状态更新默认都会自动批处理，最后合并成较少的渲染。如果确实需要基于上一次状态更新，应该使用函数式写法；如果确实要同步刷新 DOM，可以用 `flushSync`，但要谨慎。

一句话总结：

> setState 调用是同步的，状态生效和 DOM 提交通常被 React 批处理，不应依赖立即读取最新值。

#### 核心原理

错误理解：

```jsx
setCount(count + 1)
console.log(count) // 这里通常还是本次 render 闭包里的旧值
```

更稳妥的写法：

```jsx
setCount(prev => prev + 1)
setCount(prev => prev + 1)
```

React 会把更新放入队列，再根据当前优先级和批处理策略安排渲染。函数式更新拿到的是队列中上一次计算后的值，适合连续更新依赖前值的场景。

---

<a id="react-为什么不能直接修改-state"></a>

### React 为什么不能直接修改 state？

#### 面试回答

可以这样答：

> React 不建议直接修改 state，因为 React 需要通过状态引用变化来判断是否应该更新，并且不可变数据能让前后两次状态更容易比较。如果直接修改原对象再传回去，引用可能没变，React 可能认为没有变化；即使触发了渲染，也容易破坏历史快照、memo 比较和调试追踪。正确做法是创建新对象或新数组，用 `setState` 把新引用交给 React。

一句话总结：

> state 要不可变更新，因为 React 依赖新旧引用和更新队列来判断变化、调度渲染和做性能优化。

#### 核心原理

错误写法：

```jsx
user.name = 'Tom'
setUser(user)
```

正确写法：

```jsx
setUser(prev => ({
  ...prev,
  name: 'Tom'
}))
```

对数组也是一样：

```jsx
setList(prev => prev.filter(item => item.id !== id))
```

不可变更新的核心收益是让变化边界清晰：旧状态仍然代表上一轮渲染快照，新状态代表下一轮渲染输入，React 和开发者都能更容易比较和追踪。

---

<a id="key-的作用是什么"></a>

### key 的作用是什么？

#### 面试回答

可以这样答：

> `key` 的作用是帮助 React 在同一层级的列表 diff 中识别哪些节点是同一个。列表顺序变化、插入、删除时，如果 key 稳定，React 就能复用正确的 DOM 和组件实例，只移动或更新必要节点；如果 key 不稳定，React 可能错误复用节点，导致输入框内容、组件本地状态或动画状态错位。key 只需要在同一层兄弟节点中唯一，不需要全局唯一。

一句话总结：

> key 是列表节点的稳定身份标识，用来帮助 React 正确复用、移动或删除同层节点。

#### 核心原理

React diff 列表时会结合 `type` 和 `key` 判断节点身份：

```jsx
items.map(item => <TodoItem key={item.id} item={item} />)
```

如果 `type` 相同且 `key` 相同，React 倾向于复用旧 Fiber 和 DOM；如果 key 变了，React 会把它当成新的节点。这里的复用不仅影响 DOM，也影响组件内部 state 是否保留。

---

<a id="为什么列表渲染不推荐用-index-作为-key"></a>

### 为什么列表渲染不推荐用 index 作为 key？

#### 面试回答

可以这样答：

> 不推荐用 index 作为 key，是因为 index 描述的是当前位置，不是数据身份。只要列表发生头部插入、删除、排序，后面元素的 index 都会变化，React 可能把 A 的组件实例复用给 B，导致本地状态、输入框内容或选中状态错位。如果列表完全静态、不排序、不插入删除，用 index 问题不大；但动态列表应该优先使用后端 id 或业务上稳定的唯一字段。

一句话总结：

> index key 最大问题是位置会变，数据身份不稳定，动态列表容易出现错误复用和状态错位。

#### 核心原理

假设原列表是：

```text
0: A
1: B
2: C
```

头部插入 X 后变成：

```text
0: X
1: A
2: B
3: C
```

如果用 index 作为 key，React 会认为 key 为 0 的节点还是“同一个”，于是可能把原来 A 的 DOM 或组件状态复用到 X 上。稳定 id 则不会有这个问题：

```jsx
items.map(item => <TodoItem key={item.id} item={item} />)
```

---

## 延伸阅读

- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React & Vue](/md/面试准备/技术/React%20%26%20Vue.md)
