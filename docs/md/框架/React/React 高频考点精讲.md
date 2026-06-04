# React 核心原理面试题

## 面试定位

这篇用于 React 核心原理的第一轮复习，覆盖八类最常被问到的问题：**React 基础思想**、**组件与渲染**、**Hooks 高频**、**useEffect 必考**、**React 原理高频**、**Diff 算法高频**、**合成事件高频**和**性能优化高频**。回答时不要只背 API 定义，要先给出能口述的结论，再补充背后的更新模型、数据流、状态不可变、Hook 调用顺序、effect 生命周期、Fiber、Diff、事件系统和性能取舍。

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

### Hooks 高频

- [useState 原理是什么？](#usestate-原理是什么)
- [React Hooks 的底层原理是什么？](#react-hooks-的底层原理是什么)
- [Hooks 和类组件在底层存储上有什么根本区别？](#hooks-和类组件在底层存储上有什么根本区别)
- [useEffect 是什么？什么时候执行？](#useeffect-是什么什么时候执行)
- [useEffect 和 useLayoutEffect 区别？](#useeffect-和-uselayouteffect-区别)
- [useMemo 和 useCallback 区别？](#usememo-和-usecallback-区别)
- [useRef 有什么用？](#useref-有什么用)
- [useReducer 适合什么场景？](#usereducer-适合什么场景)
- [useContext 有什么问题？](#usecontext-有什么问题)
- [为什么 Hook 不能写在 if 里面？](#为什么-hook-不能写在-if-里面)
- [自定义 Hook 是什么？](#自定义-hook-是什么)

### useEffect 必考

- [useEffect 第二个参数是什么意思？](#useeffect-第二个参数是什么意思)
- [useEffect 不传依赖数组会怎样？](#useeffect-不传依赖数组会怎样)
- [传空数组会怎样？](#传空数组会怎样)
- [依赖项变化会怎样？](#依赖项变化会怎样)
- [useEffect 为什么会出现闭包陷阱？](#useeffect-为什么会出现闭包陷阱)
- [useEffect 怎么清除副作用？](#useeffect-怎么清除副作用)

### React 原理高频

- [React 渲染流程是什么？](#react-渲染流程是什么)
- [React Element 是什么？](#react-element-是什么)
- [Virtual DOM 是什么？](#virtual-dom-是什么)
- [React Element 和 Fiber 是什么关系？](#react-element-和-fiber-是什么关系)
- [React 的双缓存树是什么？](#react-的双缓存树是什么)
- [Fiber 是什么？](#fiber-是什么)
- [Fiber 架构如何解决同步渲染导致的页面卡顿？](#fiber-架构如何解决同步渲染导致的页面卡顿)
- [React diff 算法是什么？](#react-diff-算法是什么)
- [React reconciliation 是什么？](#react-reconciliation-是什么)
- [React 15 和 React 16 之后有什么区别？](#react-15-和-react-16-之后有什么区别)
- [React 为什么能中断渲染？](#react-为什么能中断渲染)
- [React 的可中断渲染和时间切片是怎么实现的？](#react-的可中断渲染和时间切片是怎么实现的)
- [React 时间切片使用 requestIdleCallback 吗？](#react-时间切片使用-requestidlecallback-吗)

### Diff 算法高频

- [React diff 怎么做的？](#react-diff-怎么做的)
- [为什么 React diff 是 O(n)？](#为什么-react-diff-是-on)
- [key 在 diff 中有什么作用？](#key-在-diff-中有什么作用)
- [同层比较是什么意思？](#同层比较是什么意思)
- [不同类型节点 React 怎么处理？](#不同类型节点-react-怎么处理)

### 合成事件高频

- [React 合成事件是什么？](#react-合成事件是什么)
- [为什么要有合成事件？](#为什么要有合成事件)
- [React 事件和原生事件有什么区别？](#react-事件和原生事件有什么区别)
- [React 事件绑定在哪里？](#react-事件绑定在哪里)
- [React 17 事件机制有什么变化？](#react-17-事件机制有什么变化)
- [e.target 和 e.currentTarget 区别？](#etarget-和-ecurrenttarget-区别)

### 性能优化高频

- [React 项目怎么做性能优化？](#react-项目怎么做性能优化)
- [React.memo 有什么用？](#reactmemo-有什么用)
- [useMemo 有什么用？](#usememo-有什么用)
- [useCallback 有什么用？](#usecallback-有什么用)
- [怎么避免子组件无意义渲染？](#怎么避免子组件无意义渲染)
- [大列表怎么优化？](#大列表怎么优化)
- [首屏加载怎么优化？](#首屏加载怎么优化)

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

## 3. Hooks 高频

<a id="usestate-原理是什么"></a>

### useState 原理是什么？

#### 面试回答

可以这样答：

> `useState` 是函数组件里保存状态的 Hook。它不是把状态存在函数局部变量里，而是由 React 挂在当前组件对应的 Fiber 上；每次组件渲染时，React 按 Hook 的调用顺序找到对应的状态。调用 `setState` 时，React 会创建一次状态更新，放入更新队列，再调度组件重新渲染。重新渲染时 React 会按队列计算出新 state，并用新的 state 执行组件函数。所以 `useState` 的关键不是“函数里有变量”，而是 Fiber 上有 Hook 链表和更新队列。

一句话总结：

> `useState` = Fiber 保存 Hook 状态，`setState` 入队更新，下一次 render 按顺序取出并计算新状态。

#### 核心原理

函数组件每次渲染都会重新执行，普通局部变量会重新创建：

```jsx
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

React 能记住 `count`，是因为 Hook 状态挂在 Fiber 上，而不是挂在函数调用栈里。大致链路是：

```text
首次 render
  → 创建 Hook 节点
  → 保存初始 state
  → 返回 [state, dispatch]

调用 dispatch
  → 创建 update
  → 放入 Hook 的 update queue
  → 调度当前 Fiber 更新

下次 render
  → 按 Hook 顺序找到旧 Hook
  → 计算 update queue
  → 得到新 state
```

如果新状态依赖旧状态，优先用函数式更新：

```jsx
setCount(prev => prev + 1)
```

---

<a id="react-hooks-的底层原理是什么"></a>

### React Hooks 的底层原理是什么？

#### 面试回答

可以这样答：

> Hooks 的底层核心是：函数组件每次 render 都会重新执行，但 Hook 状态不是存在函数局部变量里，而是挂在当前组件对应的 Fiber 节点上。React 在 Fiber 的 `memoizedState` 上维护一条 Hook 链表，每次调用 `useState`、`useEffect` 这类 Hook 时，都会按调用顺序读取或创建对应的 Hook 节点。更新时，`setState` 会把 update 放到 Hook 的更新队列里，下一次 render 再按队列计算新状态。所以 Hooks 能工作，依赖的是 Fiber 保存状态、Hook 链表保存顺序、更新队列保存变化。

一句话总结：

> Hooks = Fiber 上的 Hook 链表 + 固定调用顺序 + update queue。

#### 核心原理

函数组件重新执行时，React 通过“当前正在渲染的 Fiber”和“当前 Hook 指针”定位状态：

```text
FunctionComponent Fiber.memoizedState
  → Hook(useState)
  → Hook(useEffect)
  → Hook(useMemo)
```

每个 Hook 节点会保存自己的信息：

```text
memoizedState：当前 Hook 的状态或 effect 信息
queue：状态更新队列
next：下一个 Hook
```

这也是 Hook 不能写在条件语句里的根本原因：React 不是根据变量名找状态，而是根据 Hook 调用顺序找链表节点。顺序一变，后面的状态就会错位。

---

<a id="hooks-和类组件在底层存储上有什么根本区别"></a>

### Hooks 和类组件在底层存储上有什么根本区别？

#### 面试回答

可以这样答：

> 类组件的状态主要存在组件实例上，也就是 `this.state`，生命周期方法也挂在实例原型或实例方法上；而函数组件没有实例，每次 render 都只是重新执行函数，所以 Hooks 的状态必须存在 Fiber 的 Hook 链表里。类组件通过实例字段保存状态，React 调用 `instance.render()`；函数组件通过 Fiber 保存一串 Hook 节点，React 重新调用函数并按顺序取出 Hook 状态。这就是两者底层存储的根本区别。

一句话总结：

> 类组件状态存在实例上，函数组件 Hook 状态存在 Fiber 的 Hook 链表上。

#### 核心原理

| 维度 | 类组件 | 函数组件 + Hooks |
| --- | --- | --- |
| 是否有组件实例 | 有 | 没有组件实例 |
| 状态存储 | `this.state` | Fiber `memoizedState` Hook 链表 |
| 更新队列 | 类组件 Fiber 的 updateQueue | 每个 Hook 自己的 queue |
| 定位状态方式 | 实例字段 | Hook 调用顺序 |
| 复用逻辑方式 | HOC / Render Props | 自定义 Hook |

可以这样理解：

```text
类组件：Fiber.stateNode → class instance → this.state
函数组件：Fiber.memoizedState → Hook 链表 → 每个 Hook 的状态
```

所以函数组件不是“没有状态”，而是状态不在函数本身，存到了 React 运行时的 Fiber 结构里。

---

<a id="useeffect-是什么什么时候执行"></a>

### useEffect 是什么？什么时候执行？

#### 面试回答

可以这样答：

> `useEffect` 是函数组件处理副作用的 Hook，比如请求数据、订阅事件、操作定时器、写日志等。它不会在 render 阶段执行，而是在组件结果提交到 DOM 之后执行；通常可以理解为浏览器完成绘制后再执行 passive effect。这样设计是为了让 render 保持纯净，不把请求、订阅、DOM 外部操作混在 UI 计算里。依赖数组决定 effect 是否需要重新执行，返回函数用于清理上一次副作用。

一句话总结：

> `useEffect` 用来处理渲染后的副作用，执行时机在 commit 之后，依赖数组决定是否重跑。

#### 核心原理

React 更新分为 render 和 commit。`useEffect` 属于 passive effect，不在 render 阶段执行：

```text
render 阶段
  → 计算 UI，不执行 useEffect
commit 阶段
  → 更新 DOM
  → 浏览器绘制
  → 执行 useEffect
```

常见写法：

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    refresh()
  }, 1000)

  return () => clearInterval(timer)
}, [refresh])
```

如果把副作用写在组件函数体里，并发渲染或重复 render 时可能造成多次请求、重复订阅等问题。

---

<a id="useeffect-和-uselayouteffect-区别"></a>

### useEffect 和 useLayoutEffect 区别？

#### 面试回答

可以这样答：

> `useEffect` 和 `useLayoutEffect` 都是在 commit 阶段处理副作用，但时机不同。`useLayoutEffect` 会在 DOM 更新后、浏览器绘制前同步执行，适合读取布局并立即修改样式，避免用户看到闪烁；`useEffect` 通常在浏览器绘制后异步执行，适合请求、订阅、日志、定时器这类不影响首帧布局的副作用。实际开发里优先用 `useEffect`，只有必须在用户看到画面前完成 DOM 测量或同步修正时才用 `useLayoutEffect`。

一句话总结：

> `useLayoutEffect` 阻塞绘制，适合布局读写；`useEffect` 不阻塞绘制，适合普通副作用。

#### 核心原理

| 维度 | useEffect | useLayoutEffect |
| --- | --- | --- |
| 执行时机 | DOM 提交后，通常在 paint 后 | DOM 提交后、paint 前同步执行 |
| 是否阻塞绘制 | 不阻塞 | 阻塞 |
| 典型场景 | 请求、订阅、日志、定时器 | 测量 DOM、修正布局、防闪烁 |

示例场景：弹层需要先测量按钮位置再定位。如果用 `useEffect`，用户可能看到弹层先出现在默认位置再跳动；用 `useLayoutEffect` 可以在绘制前完成修正。

---

<a id="usememo-和-usecallback-区别"></a>

### useMemo 和 useCallback 区别？

#### 面试回答

可以这样答：

> `useMemo` 缓存的是计算结果，`useCallback` 缓存的是函数引用。它们都依赖依赖数组，依赖不变时复用上一次结果。`useMemo` 适合缓存昂贵计算或稳定对象引用，`useCallback` 适合把回调传给被 `React.memo` 包裹的子组件，避免子组件因为函数引用每次变化而重新渲染。它们不是默认性能优化开关，只有计算成本明显、引用稳定有价值，或者 Profiler 证明有无效渲染时才值得使用。

一句话总结：

> `useMemo(fn, deps)` 缓存 `fn()` 的结果，`useCallback(fn, deps)` 缓存 `fn` 本身。

#### 核心原理

二者可以这样理解：

```jsx
const value = useMemo(() => heavyCompute(list), [list])

const handleClick = useCallback(() => {
  submit(id)
}, [id])
```

`useCallback(fn, deps)` 近似等价于：

```jsx
const handleClick = useMemo(() => fn, deps)
```

常见误区是到处包 `useMemo` 和 `useCallback`。缓存也有成本：React 需要保存上一次值、比较依赖数组，代码复杂度也会上升。

---

<a id="useref-有什么用"></a>

### useRef 有什么用？

#### 面试回答

可以这样答：

> `useRef` 有两个常见用途：一是保存 DOM 引用，比如聚焦输入框、读取元素尺寸；二是保存跨 render 持久存在但变化时不需要触发渲染的值，比如定时器 id、上一次值、某个请求标记。`ref.current` 改变不会触发组件重新渲染，这点和 state 不同。所以需要影响 UI 的数据用 state，只是想保存一个可变容器或实例引用时用 ref。

一句话总结：

> `useRef` 是跨 render 持久存在的可变容器，改 `current` 不会触发重新渲染。

#### 核心原理

访问 DOM：

```jsx
function SearchBox() {
  const inputRef = useRef(null)

  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>聚焦</button>
    </>
  )
}
```

保存可变值：

```jsx
const timerRef = useRef(null)

useEffect(() => {
  timerRef.current = setInterval(tick, 1000)
  return () => clearInterval(timerRef.current)
}, [tick])
```

`useRef` 返回的对象在组件生命周期内通常保持同一个引用，因此适合保存不参与渲染的数据。

---

<a id="usereducer-适合什么场景"></a>

### useReducer 适合什么场景？

#### 面试回答

可以这样答：

> `useReducer` 适合状态结构比较复杂、更新分支多、下一状态依赖当前状态和 action 的场景。比如表单编辑器、筛选条件、购物车、复杂弹窗流程。相比多个 `useState` 分散更新，`useReducer` 可以把状态变化集中到 reducer 里，让每种 action 对应一种明确的状态迁移。它不是替代所有 `useState`，简单开关、输入框值、局部计数器用 `useState` 更直接。

一句话总结：

> 状态简单用 `useState`，状态迁移复杂且分支多时用 `useReducer`。

#### 核心原理

典型结构：

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'keyword/change':
      return { ...state, keyword: action.keyword, page: 1 }
    case 'page/change':
      return { ...state, page: action.page }
    default:
      return state
  }
}

const [state, dispatch] = useReducer(reducer, {
  keyword: '',
  page: 1
})
```

`reducer` 应该保持纯函数：同样的 `state` 和 `action` 返回同样的新状态，不在里面请求接口或修改外部变量。

---

<a id="usecontext-有什么问题"></a>

### useContext 有什么问题？

#### 面试回答

可以这样答：

> `useContext` 的问题主要是更新粒度容易过粗。只要 Provider 的 `value` 引用变化，消费这个 Context 的组件就会重新渲染，即使组件只用到了 value 里的一个字段。如果把 user、theme、locale、notifications 都塞进一个 Context，一个高频变化字段可能带着很多无关组件一起更新。优化思路是拆分 Context、用 `useMemo` 稳定 value 引用，或者把高频、细粒度状态交给外部 store。

一句话总结：

> `useContext` 方便跨层传值，但 Provider value 变化会影响所有消费者，容易造成无关重渲染。

#### 核心原理

反模式：

```jsx
<AppContext.Provider value={{ user, theme, notifications }}>
  {children}
</AppContext.Provider>
```

每次父组件 render 都创建新的 value 对象，消费者可能被带着更新。更稳妥的做法：

```jsx
const value = useMemo(() => ({ user, login, logout }), [user])

<AuthContext.Provider value={value}>
  {children}
</AuthContext.Provider>
```

对于变化频率不同的数据，优先拆 Context：

```jsx
<ThemeContext.Provider value={theme}>
  <UserContext.Provider value={user}>{children}</UserContext.Provider>
</ThemeContext.Provider>
```

---

<a id="为什么-hook-不能写在-if-里面"></a>

### 为什么 Hook 不能写在 if 里面？

#### 面试回答

可以这样答：

> Hook 不能写在 `if`、循环或嵌套函数里，是因为 React 依赖 Hook 的调用顺序来对应每个 Hook 的状态。函数组件每次 render 都会重新执行，React 并不是通过变量名找 `useState`，而是按“第几个 Hook”找到 Fiber 上对应的 Hook 节点。如果某次渲染因为条件分支少调用了一个 Hook，后面的 Hook 顺序就会错位，状态和 effect 都可能对应错。

一句话总结：

> Hook 必须保持每次 render 调用顺序一致，否则 React 无法把 Hook 调用和 Fiber 上的状态一一对应。

#### 核心原理

错误写法：

```jsx
function Profile({ enabled }) {
  if (enabled) {
    useEffect(() => {
      track()
    }, [])
  }

  const [name, setName] = useState('')
}
```

正确写法是把条件放到 Hook 内部：

```jsx
useEffect(() => {
  if (!enabled) return
  track()
}, [enabled])
```

这样每次 render 都会调用同样数量、同样顺序的 Hook。

---

<a id="自定义-hook-是什么"></a>

### 自定义 Hook 是什么？

#### 面试回答

可以这样答：

> 自定义 Hook 是把组件中可复用的状态逻辑抽成一个以 `use` 开头的函数。它可以调用 React 内置 Hook，也可以组合其他自定义 Hook。它复用的是逻辑，不是状态本身；每个组件调用自定义 Hook 都会拥有自己独立的一份 Hook 状态。常见场景包括请求封装、事件监听、表单逻辑、权限判断、响应式尺寸监听等。

一句话总结：

> 自定义 Hook = 用普通函数封装可复用的 Hook 逻辑，每次调用都有独立状态。

#### 核心原理

示例：

```jsx
function useWindowSize() {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }))

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}
```

自定义 Hook 必须遵守 Hook 规则：只能在函数组件或其他 Hook 顶层调用，不能在条件分支里调用。

---

## 4. useEffect 必考

<a id="useeffect-第二个参数是什么意思"></a>

### useEffect 第二个参数是什么意思？

#### 面试回答

可以这样答：

> `useEffect` 第二个参数是依赖数组，用来告诉 React 这个 effect 依赖哪些响应式值，比如 props、state、组件内定义的变量和函数。React 会在每次提交后比较依赖项和上一次是否变化，如果变化就先清理上一次 effect，再执行新的 effect。依赖数组不是“想让它什么时候执行”的随意开关，而是描述 effect 读取了哪些外部值。

一句话总结：

> 依赖数组描述 effect 依赖的数据，React 根据依赖变化决定是否重新执行 effect。

#### 核心原理

```jsx
useEffect(() => {
  document.title = `${count}`
}, [count])
```

这里 effect 读取了 `count`，所以 `count` 应该出现在依赖数组里。漏写依赖可能导致 effect 使用旧值；乱写依赖可能导致 effect 不必要地重复执行。

---

<a id="useeffect-不传依赖数组会怎样"></a>

### useEffect 不传依赖数组会怎样？

#### 面试回答

可以这样答：

> 不传依赖数组时，`useEffect` 会在每次组件提交后执行。也就是说首次渲染后会执行，后续每次 state、props 或父组件导致的重新渲染提交后也会执行。如果 effect 里又更新 state，就要特别小心，可能造成无限渲染。这个写法适合确实每次渲染后都要同步的副作用，但大多数业务 effect 应该明确依赖数组。

一句话总结：

> 不传依赖数组 = 每次 commit 后都执行 effect。

#### 核心原理

```jsx
useEffect(() => {
  console.log('每次提交后执行')
})
```

危险写法：

```jsx
useEffect(() => {
  setCount(count + 1)
})
```

上面会导致 effect 执行后更新 state，更新后又触发 effect，容易进入无限循环。

---

<a id="传空数组会怎样"></a>

### 传空数组会怎样？

#### 面试回答

可以这样答：

> 传空数组表示这个 effect 不依赖任何会随渲染变化的值，因此通常只在组件挂载后执行一次，并在组件卸载时执行清理函数。它常用于初始化订阅、启动定时器、进入页面上报等场景。但要注意，如果 effect 内读取了 props 或 state，却依然写空数组，就会固定拿到首次渲染时的值，容易形成闭包陷阱。

一句话总结：

> 空依赖数组通常表示挂载后执行一次、卸载时清理，但不能掩盖 effect 实际读取的响应式值。

#### 核心原理

```jsx
useEffect(() => {
  subscribe()
  return () => unsubscribe()
}, [])
```

在 React 18 开发环境的 Strict Mode 下，React 可能会额外执行一次 setup + cleanup 来帮助发现副作用清理问题；生产环境不会因为 Strict Mode 这样重复执行。

---

<a id="依赖项变化会怎样"></a>

### 依赖项变化会怎样？

#### 面试回答

可以这样答：

> 当依赖项变化时，React 会在提交后重新执行 effect。重新执行前，如果上一次 effect 返回了清理函数，React 会先执行清理函数，再执行新的 effect。这样可以避免旧订阅、旧定时器、旧请求回调继续影响当前组件。这个顺序很重要：不是先执行新 effect 再清理旧 effect，而是先清理旧副作用，再建立新副作用。

一句话总结：

> 依赖变化时，React 会先清理上一次 effect，再执行下一次 effect。

#### 核心原理

```jsx
useEffect(() => {
  const connection = connect(roomId)

  return () => {
    connection.disconnect()
  }
}, [roomId])
```

当 `roomId` 从 A 变成 B 时：

```text
清理 A 房间连接
  → 建立 B 房间连接
```

这也是订阅、WebSocket、定时器必须写 cleanup 的原因。

---

<a id="useeffect-为什么会出现闭包陷阱"></a>

### useEffect 为什么会出现闭包陷阱？

#### 面试回答

可以这样答：

> `useEffect` 的闭包陷阱来自 JavaScript 闭包和 React render 机制。每次 render 都会创建一套新的 props、state 和函数，effect 捕获的是本次 render 里的值。如果依赖数组漏写了某个值，effect 后续不会重新创建，就会一直读到旧 render 的值。解决方式不是盲目清空依赖数组，而是补全依赖、使用函数式更新、把不需要触发渲染的最新值放进 ref，或者把逻辑移到事件处理函数里。

一句话总结：

> 闭包陷阱 = effect 捕获了某次 render 的旧值，但依赖没变导致它没有被重新创建。

#### 核心原理

典型问题：

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count)
  }, 1000)

  return () => clearInterval(timer)
}, [])
```

这里 `count` 没有进入依赖数组，定时器回调会一直读取首次 render 的 `count`。如果是累加状态，可以用函数式更新：

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(prev => prev + 1)
  }, 1000)

  return () => clearInterval(timer)
}, [])
```

如果只是想让异步回调读取最新值，可以用 ref 保存最新状态，但要明确它不会触发渲染。

---

<a id="useeffect-怎么清除副作用"></a>

### useEffect 怎么清除副作用？

#### 面试回答

可以这样答：

> `useEffect` 通过返回一个清理函数来清除副作用。清理函数会在组件卸载时执行，也会在依赖变化导致 effect 重新执行前执行。常见清理包括取消事件监听、清除定时器、断开 WebSocket、取消订阅、忽略或中止过期请求。原则是 effect 建立了什么外部资源，cleanup 就负责释放什么资源，避免内存泄漏和旧副作用影响新状态。

一句话总结：

> effect 返回 cleanup，依赖变化前和组件卸载时执行，用来释放上一次副作用。

#### 核心原理

```jsx
useEffect(() => {
  const handleScroll = () => {
    report(window.scrollY)
  }

  window.addEventListener('scroll', handleScroll)

  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
}, [report])
```

请求场景可以用 `AbortController`：

```jsx
useEffect(() => {
  const controller = new AbortController()

  fetch(`/api/user/${id}`, {
    signal: controller.signal
  })

  return () => {
    controller.abort()
  }
}, [id])
```

这样当 `id` 变化或组件卸载时，旧请求不会继续占用资源，也不应该再更新已经过期的界面。

---

## 5. React 原理高频

<a id="react-渲染流程是什么"></a>

### React 渲染流程是什么？

#### 面试回答

可以这样答：

> React 渲染流程可以分成触发更新、调度、render、commit 四步。组件调用 `setState`、父组件更新、Context 变化后，React 会创建 update 并标记到对应 Fiber；调度器根据优先级决定什么时候处理。render 阶段会构建 workInProgress Fiber 树，调用组件函数，生成新的 React Element，并通过 reconciliation 找出变化；这个阶段只做计算，不改真实 DOM。commit 阶段不可中断，会把变化提交到真实 DOM，并执行 ref、layout effect 和 passive effect。

一句话总结：

> React 渲染 = 更新入队 → 调度 → render 计算差异 → commit 提交 DOM 和副作用。

#### 核心原理

```text
setState / props / context
  → 创建 update
  → 标记 Fiber lane
  → scheduler 调度
  → render 阶段构建 workInProgress
  → reconciliation 生成 flags
  → commit 阶段更新 DOM
  → 执行 layout effect / passive effect
```

面试重点是区分 render 和 commit：render 可以被中断、重启或丢弃；commit 一旦开始就必须同步完成。

---

<a id="react-element-是什么"></a>

### React Element 是什么？

#### 面试回答

可以这样答：

> React Element 是 React 用来描述 UI 的普通 JavaScript 对象。JSX 编译后会得到 React Element，它包含节点类型、props、children、key 等信息。它不是 DOM，也不是组件实例，只是某次 render 的 UI 描述。React 会根据这些 Element 构建或复用 Fiber，再在 commit 阶段把最终变化同步到真实 DOM。

一句话总结：

> React Element 是不可变的 UI 描述对象，是 JSX 编译后的结果。

#### 核心原理

```jsx
const element = <div className="card">Hello</div>
```

大致等价于：

```js
const element = {
  type: 'div',
  props: {
    className: 'card',
    children: 'Hello'
  }
}
```

React Element 每次 render 生成一批新的描述对象，React 再用它们和旧 Fiber 做协调。

---

<a id="virtual-dom-是什么"></a>

### Virtual DOM 是什么？

#### 面试回答

可以这样答：

> Virtual DOM 可以理解为用 JavaScript 对象描述真实 DOM 结构的一种模型。在 React 里，开发者通过 JSX 得到 React Element，React 再基于这些描述计算 UI 变化。它的价值不是“永远比手写 DOM 快”，而是让 UI 更新从命令式 DOM 操作变成声明式描述，再由框架统一做 diff、调度和批量提交。

一句话总结：

> Virtual DOM 的核心价值是声明式 UI 和跨平台描述，不是简单等同于性能更快。

#### 核心原理

直接操作 DOM 的问题是更新路径分散，复杂页面容易出现状态和视图不一致。Virtual DOM 把更新变成：

```text
状态变化
  → 生成新的 UI 描述
  → 与旧描述 / 旧 Fiber 对比
  → 计算最小必要提交
```

React DOM、React Native 等不同渲染器可以基于同一套组件描述，提交到不同宿主环境。

---

<a id="react-element-和-fiber-是什么关系"></a>

### React Element 和 Fiber 是什么关系？

#### 面试回答

可以这样答：

> React Element 是一次 render 产生的 UI 描述，Fiber 是 React 运行时保存组件状态、更新队列、父子关系、优先级和副作用标记的工作单元。可以理解为 Element 描述“这次 UI 应该是什么样”，Fiber 负责“这个 UI 节点在运行时怎么被更新和管理”。render 阶段会根据新的 Element 和旧 Fiber 进行协调，生成新的 workInProgress Fiber 树。

一句话总结：

> Element 是静态描述，Fiber 是运行时工作单元。

#### 核心原理

| 维度 | React Element | Fiber |
| --- | --- | --- |
| 角色 | 描述 UI | 管理更新 |
| 生命周期 | 每次 render 可能新建 | 在更新中复用、克隆、替换 |
| 保存内容 | type、props、key | state、props、lanes、flags、child/sibling/return |
| 是否可调度 | 否 | 是 |

React 不是直接拿 Element 改 DOM，而是把 Element 转成 Fiber 层面的工作，再统一提交。

---

<a id="react-的双缓存树是什么"></a>

### React 的双缓存树是什么？

#### 面试回答

可以这样答：

> React 的双缓存树指的是同一时刻内存中通常有两棵 Fiber 树：一棵是当前页面已经展示出来的 `current` Fiber 树，另一棵是正在内存中构建的 `workInProgress` Fiber 树。更新发生时，React 不会直接在当前树上改，而是基于 current 克隆或创建 workInProgress，在 render 阶段计算新 UI 和副作用标记；等 commit 阶段确认结果可用后，再把 workInProgress 切换成新的 current。这样可以保证用户看到的 UI 始终是完整提交后的结果。

一句话总结：

> 双缓存树 = current 树负责当前页面，workInProgress 树负责下一次更新，commit 时完成切换。

#### 核心原理

双缓存的核心链路：

```text
current Fiber tree（当前屏幕）
  → 基于 current 创建 workInProgress
  → render 阶段在内存中计算新树
  → commit 阶段提交 DOM
  → workInProgress 变成新的 current
```

Fiber 节点之间通过 `alternate` 指针互相关联：

```text
currentFiber.alternate === workInProgressFiber
workInProgressFiber.alternate === currentFiber
```

这个机制的价值是：render 阶段可以在内存里慢慢算，算到一半被中断也不会污染当前页面；只有 commit 后，用户才会看到完整的新 UI。

---

<a id="fiber-是什么"></a>

### Fiber 是什么？

#### 面试回答

可以这样答：

> Fiber 是 React 16 引入的核心架构，可以理解为 React 更新过程里的运行时工作单元。React 15 的协调过程更接近同步递归，一旦开始遍历一棵大组件树，就很难中断，容易长时间阻塞主线程，导致输入、动画等高优先级任务延迟。Fiber 把组件树拆成一个个 Fiber 节点，每个节点对应一个组件或宿主 DOM 节点，并通过 `child`、`sibling`、`return` 指针串起来，替代原来依赖递归调用栈的一次性遍历。每个 Fiber 节点会记录 props、state、更新队列、优先级信息和副作用标记。这样 React 就能在 render 阶段把大任务拆成小任务，必要时暂停、恢复或丢弃低优先级工作，先响应用户输入。它解决了 React 15 更新不可中断的问题，也为优先级调度、并发渲染、Suspense 和 Transition 打下基础。

一句话总结：

> Fiber = 把组件树拆成可中断、可恢复、可调度的工作单元，让 React 更新不再依赖不可中断的同步递归。

#### 核心原理

React 15 的主要限制在于协调过程是同步递归的：

```text
开始遍历组件树
  → 递归处理子节点
  → 直到整棵树处理完
  → 才把主线程还给浏览器
```

如果组件树很大，这段递归会变成长任务。浏览器主线程被占住后，用户输入、动画、滚动等任务都要等待，页面就容易卡顿。

React 16 之后，Fiber 把每个组件或宿主节点表示成一个可管理的工作单元。一个 Fiber 节点通常会保存：

```text
type / key
stateNode
child / sibling / return
pendingProps / memoizedProps
memoizedState / updateQueue
lanes / flags
```

这些字段大致对应几类信息：

| 信息 | 作用 |
| --- | --- |
| `pendingProps` / `memoizedProps` | 本次和上次渲染的 props |
| `memoizedState` | 上次渲染后的 state 或 Hook 链表 |
| `updateQueue` | 待处理的状态更新 |
| `lanes` | 更新优先级，React 18 中用 lane 模型表达 |
| `flags` | 本次更新需要提交的副作用，例如插入、更新、删除 |
| `child` / `sibling` / `return` | 指向子节点、兄弟节点、父节点，形成可遍历结构 |

Fiber 的核心价值可以概括为三点：

```text
可中断：render 阶段处理到某个 Fiber 后，可以先让出主线程
可恢复：后续可以从保存的工作进度继续处理
可丢弃：低优先级或过期的 render 结果可以被放弃，重新计算更新结果
```

需要强调的是，中断发生在 render 阶段，因为这个阶段只做计算，不操作真实 DOM；commit 阶段会修改 DOM 和执行副作用，所以一旦开始就不能中断。

---

<a id="fiber-架构如何解决同步渲染导致的页面卡顿"></a>

### Fiber 架构如何解决同步渲染导致的页面卡顿？

#### 面试回答

可以这样答：

> React 15 的同步递归更新一旦开始，就会一直占用主线程直到整棵组件树协调完成。如果树很大，这个任务可能超过一帧时间，导致用户输入、动画和滚动不能及时响应。Fiber 的解决思路是把整棵树的递归工作拆成一个个 Fiber 工作单元，render 阶段每处理完一个单元就有机会判断是否应该让出主线程；如果有更高优先级任务，比如输入，就先处理高优先级任务。这样长任务被拆碎，浏览器就有机会穿插处理交互和绘制，页面不容易卡死。

一句话总结：

> Fiber 通过“拆分工作单元 + 优先级调度 + render 阶段可让出主线程”缓解同步渲染卡顿。

#### 核心原理

React 15 的同步递归像这样：

```text
递归处理整棵树
  → 期间不能暂停
  → 主线程被长任务占用
  → 输入 / 动画 / 滚动延迟
```

Fiber 架构改成工作循环：

```text
performUnitOfWork(Fiber A)
  → performUnitOfWork(Fiber B)
  → 检查是否应该让出主线程
  → 有空再继续处理 Fiber C
```

这里有两个边界要说清楚：

| 阶段 | 是否可中断 | 原因 |
| --- | --- | --- |
| render | 可以 | 只计算 Fiber，不改 DOM |
| commit | 不可以 | 会修改 DOM 和执行副作用，必须保持 UI 一致 |

因此 Fiber 解决的不是“让渲染变少”，而是“让长时间的 render 计算可以被调度”，优先保证交互响应。

---

<a id="react-diff-算法是什么"></a>

### React diff 算法是什么？

#### 面试回答

可以这样答：

> React diff 是 React 在 reconciliation 阶段比较新旧子节点，判断哪些节点需要复用、插入、移动或删除的算法。完整树 diff 理论复杂度很高，React 通过三个假设把常见 UI 对比降到 O(n)：不同类型节点直接替换、只做同层比较、用 key 标识同一层列表里的节点身份。diff 的结果不会立刻改 DOM，而是给 Fiber 打上副作用标记，等 commit 阶段统一提交。

一句话总结：

> React diff = 基于 type、层级和 key 的启发式对比，用于生成最小必要更新标记。

#### 核心原理

```text
新 React Element
  + 旧 Fiber
  → 比较 type / key / position
  → 复用或创建新 Fiber
  → 标记 Placement / Update / Deletion
```

diff 是 reconciliation 的核心步骤之一，但 reconciliation 不只包含 diff，还包括构建新 Fiber、处理更新队列和收集副作用。

---

<a id="react-reconciliation-是什么"></a>

### React reconciliation 是什么？

#### 面试回答

可以这样答：

> reconciliation 通常翻译为协调，是 React render 阶段根据新的 React Element 和旧 Fiber 树计算下一棵 Fiber 树的过程。它会调用组件函数得到新的子节点，比较新旧节点是否能复用，处理列表 diff，并给需要变化的 Fiber 打标记。协调阶段只决定“应该变什么”，真正修改 DOM 要等 commit 阶段。

一句话总结：

> reconciliation = React 在 render 阶段计算新旧 Fiber 差异并生成更新标记的过程。

#### 核心原理

```text
beginWork
  → 调用组件 / 处理子节点
  → reconcileChildren
completeWork
  → 收集 flags
  → 构建 effect 链路
commit
  → 提交 flags 对应的 DOM 操作
```

回答时要避免把 reconciliation 简单等同于真实 DOM diff，它发生在 React 的 Fiber 层。

---

<a id="react-15-和-react-16-之后有什么区别"></a>

### React 15 和 React 16 之后有什么区别？

#### 面试回答

可以这样答：

> React 15 主要使用 Stack Reconciler，更新过程更接近同步递归，一旦开始处理一棵大树就很难暂停，容易长时间占用主线程。React 16 引入 Fiber 架构，把渲染工作拆成一个个 Fiber 单元，并引入优先级和可中断的 render 阶段。这个变化不是 API 层的简单升级，而是 React 后续并发能力、错误边界、Suspense、Transition 等能力的基础。

一句话总结：

> React 15 偏同步递归更新，React 16+ 用 Fiber 把更新变成可调度工作。

#### 核心原理

| 维度 | React 15 | React 16+ |
| --- | --- | --- |
| 协调器 | Stack Reconciler | Fiber Reconciler |
| 遍历方式 | 递归调用栈 | Fiber 链表工作循环 |
| 中断能力 | 基本不可中断 | render 阶段可中断 |
| 后续能力 | 同步渲染为主 | 并发特性的基础 |

需要注意：Fiber 让 render 阶段具备可中断能力，但 commit 阶段仍然必须同步完成。

---

<a id="react-为什么能中断渲染"></a>

### React 为什么能中断渲染？

#### 面试回答

可以这样答：

> React 能中断渲染，核心原因是 Fiber 把原来的递归调用栈改造成了可保存进度的工作单元链表。render 阶段处理完一个 Fiber 后，React 可以判断当前时间片是否用完，或者是否有更高优先级任务需要先执行；如果需要让出主线程，就保存当前进度，之后再继续或重新开始。中断只发生在 render 计算阶段，commit 阶段不能中断，否则真实 DOM 会处在不一致状态。

一句话总结：

> Fiber 保存工作进度 + Scheduler 按优先级调度，让 render 阶段可以暂停、恢复或丢弃。

#### 核心原理

```text
performUnitOfWork(Fiber A)
  → performUnitOfWork(Fiber B)
  → shouldYield() 为 true
  → 暂停，把主线程还给浏览器
  → 之后继续或重启 render
```

这也是为什么 render 阶段必须纯净：它可能执行多次，但只有最终 commit 的结果才会真正影响页面。

---

<a id="react-的可中断渲染和时间切片是怎么实现的"></a>

### React 的可中断渲染和时间切片是怎么实现的？

#### 面试回答

可以这样答：

> React 的可中断渲染依赖 Fiber 工作单元和 Scheduler 调度器。Fiber 把组件树遍历拆成一个个 `performUnitOfWork`，React 在并发 render 的工作循环里处理一段 Fiber 后，会通过类似 `shouldYield()` 的判断看当前时间片是否用完。如果时间片用完，React 就暂停 render，把主线程还给浏览器处理输入、动画和绘制；等调度器再次分配执行机会后，再继续处理剩余 Fiber 或根据更高优先级更新重新计算。时间切片不是把 JS 变成多线程，而是在主线程上把长任务拆成多个小任务。

一句话总结：

> 时间切片 = Fiber 工作单元 + Scheduler 时间片 + `shouldYield` 让出主线程。

#### 核心原理

简化后的并发工作循环可以这样理解：

```text
while (nextUnitOfWork && !shouldYield()) {
  nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
}

if (nextUnitOfWork) {
  scheduleCallback(继续 render)
} else {
  commitRoot()
}
```

关键点有三个：

| 机制 | 作用 |
| --- | --- |
| Fiber 工作单元 | 保存每个节点的工作和遍历位置 |
| Scheduler | 根据优先级安排任务执行 |
| `shouldYield` | 判断当前时间片是否该让出主线程 |

优先级通常由 lane 模型表达。比如用户输入是高优先级，列表过滤、页面切换中的非紧急更新可以通过 `startTransition` 标记为低优先级。高优先级更新到来时，低优先级 render 可以被暂停、丢弃或重新计算。

---

<a id="react-时间切片使用-requestidlecallback-吗"></a>

### React 时间切片使用 requestIdleCallback 吗？

#### 面试回答

可以这样答：

> 现代 React 的时间切片不直接依赖 `requestIdleCallback`。React 有自己的 Scheduler 包来做任务调度和优先级管理，在浏览器环境里更常使用 `MessageChannel` 等机制安排任务，并用自己的时间片判断是否需要 `shouldYield`。原因是 `requestIdleCallback` 兼容性和触发时机不稳定，而且它只表示浏览器空闲，不适合 React 这种需要区分用户输入、默认更新、transition 等优先级的调度模型。所以面试里不要说 React 时间切片就是 `requestIdleCallback` 实现的。

一句话总结：

> React 时间切片主要依赖自己的 Scheduler，不是简单依赖 `requestIdleCallback`。

#### 核心原理

`requestIdleCallback` 的问题：

```text
兼容性不够稳定
空闲回调触发时机不可控
不能表达 React 内部多级优先级
后台标签页等场景表现不稳定
```

React Scheduler 更关心的是“这个任务是什么优先级、是否该让出主线程、什么时候继续执行”：

```text
scheduleCallback(priority, task)
  → MessageChannel / setTimeout 等方式安排执行
  → workLoop 中检查 shouldYield
  → 时间片用完就暂停
```

因此更准确的说法是：React 借鉴了把长任务拆分到多个帧里的思路，但调度核心由自己的 Scheduler 实现。

---

## 6. Diff 算法高频

<a id="react-diff-怎么做的"></a>

### React diff 怎么做的？

#### 面试回答

可以这样答：

> React diff 主要比较同一层级的新旧节点。先看节点类型，类型不同就直接卸载旧节点、创建新节点；类型相同则复用 Fiber 和 DOM，只更新 props。对子节点列表，React 会结合 key 判断哪些节点可以复用，哪些需要插入、移动或删除。diff 的目标不是做理论上最优的树编辑距离，而是在 UI 场景里用启发式规则快速得到足够好的更新方案。

一句话总结：

> React diff 按同层、type、key 三个维度判断复用、插入、移动和删除。

#### 核心原理

```text
比较根节点 type
  → type 不同：替换整棵子树
  → type 相同：复用并更新 props
比较 children
  → 无 key：按位置比较
  → 有 key：按 key 匹配身份
```

列表是 diff 最容易出问题的地方，所以动态列表必须保证 key 稳定。

---

<a id="为什么-react-diff-是-on"></a>

### 为什么 React diff 是 O(n)？

#### 面试回答

可以这样答：

> 完整树 diff 如果考虑任意层级移动和最优编辑距离，复杂度可能达到 O(n³)，React 不做这种通用算法。它基于 UI 的常见规律做了三个假设：不同类型节点产生不同树；跨层级移动很少，所以只做同层比较；开发者用 key 标识列表中稳定的节点身份。这样 React 基本只需要线性扫描同层节点，所以常见场景可以做到 O(n)。

一句话总结：

> React diff 的 O(n) 来自启发式假设，不是通用树 diff 的理论最优解。

#### 核心原理

三个假设：

```text
1. type 不同，直接替换
2. 只比较同一层 children
3. key 帮助识别列表节点身份
```

代价是 React 不会聪明地识别任意跨层级移动；如果把节点从很深的位置搬到另一个层级，React 更可能销毁再创建。

---

<a id="key-在-diff-中有什么作用"></a>

### key 在 diff 中有什么作用？

#### 面试回答

可以这样答：

> key 在 diff 中用来标识同一层兄弟节点的稳定身份。没有 key 时，React 更依赖节点位置做比较；列表头部插入、删除、排序时，位置变化会导致错误复用或大量无意义更新。有稳定 key 时，React 可以知道某个节点只是移动了，还是被删除或新增了，从而正确保留 DOM 和组件 state。

一句话总结：

> key 让 React 在列表 diff 中按数据身份复用节点，而不是只按位置猜测。

#### 核心原理

```jsx
items.map(item => <Row key={item.id} item={item} />)
```

React 会先看 key 是否匹配，再看 type 是否匹配。key 相同且 type 相同，才倾向于复用旧 Fiber；key 变化会让 React 把它当作新节点。

---

<a id="同层比较是什么意思"></a>

### 同层比较是什么意思？

#### 面试回答

可以这样答：

> 同层比较是指 React diff 只比较同一个父节点下的新旧 children，不会把旧树第一层的节点拿去和新树第三层的节点做匹配。这样能让算法保持简单和线性，但代价是跨层级移动通常会被当成删除旧节点、创建新节点。业务里如果希望保留组件状态，就要尽量保持组件在树中的层级和 key 稳定。

一句话总结：

> 同层比较 = React 只在同一个父节点的 children 范围内判断节点复用。

#### 核心原理

```text
旧树：A 的 children = [B, C]
新树：A 的 children = [C, B]
```

这种同层重排 React 可以借助 key 识别。但如果 B 从 A 的 children 移到另一个父节点下，React 通常不会当作同一个节点跨层复用。

---

<a id="不同类型节点-react-怎么处理"></a>

### 不同类型节点 React 怎么处理？

#### 面试回答

可以这样答：

> 如果新旧节点类型不同，React 通常会直接卸载旧节点及其子树，再创建新节点及其子树。比如从 `<div>` 变成 `<span>`，或者从 `<UserCard>` 变成 `<AdminCard>`，React 不会继续深度比较它们的子节点。这样做符合“不同类型通常代表不同结构和语义”的假设，也能降低 diff 成本。

一句话总结：

> type 不同就替换子树，type 相同才考虑复用和更新 props。

#### 核心原理

```jsx
// 旧
<UserCard user={user} />

// 新
<AdminCard user={user} />
```

即使两个组件内部返回相似 DOM，React 也会把它们当成不同类型，旧组件 state 会丢失，新组件重新挂载。

---

## 7. 合成事件高频

<a id="react-合成事件是什么"></a>

### React 合成事件是什么？

#### 面试回答

可以这样答：

> React 合成事件是 React 对浏览器原生事件做的一层封装。开发者在 JSX 里写 `onClick`、`onChange`，拿到的事件对象通常是 SyntheticEvent，它抹平了不同浏览器的事件差异，并接入 React 的事件委托、优先级调度和批处理机制。它不是完全脱离原生事件，而是在原生事件基础上做统一封装。

一句话总结：

> 合成事件 = React 基于原生事件封装出的统一事件系统。

#### 核心原理

```jsx
<button onClick={event => {
  console.log(event.target)
}}>
  保存
</button>
```

这里的 `event` 是 React 封装后的事件对象，它内部仍然可以通过 `nativeEvent` 访问原生事件。

---

<a id="为什么要有合成事件"></a>

### 为什么要有合成事件？

#### 面试回答

可以这样答：

> React 需要合成事件主要有三个原因：第一，抹平浏览器事件兼容性，让开发者用统一 API；第二，通过事件委托减少大量 DOM 节点上的事件绑定；第三，把事件接入 React 更新系统，让事件里的状态更新可以被批处理，并根据事件类型赋予不同优先级。简单说，合成事件不是为了替代原生事件，而是为了让事件和 React 渲染模型协同工作。

一句话总结：

> 合成事件让事件处理统一、可委托、可批处理、可调度。

#### 核心原理

如果每个节点都直接绑定原生事件，节点多时管理成本高。React 通过事件委托统一监听，再根据事件冒泡路径找到对应组件回调：

```text
原生事件触发
  → 冒泡到 React 监听容器
  → React 收集捕获 / 冒泡阶段回调
  → 按顺序执行合成事件回调
  → 批处理其中的状态更新
```

---

<a id="react-事件和原生事件有什么区别"></a>

### React 事件和原生事件有什么区别？

#### 面试回答

可以这样答：

> React 事件写在 JSX 上，但底层通常不是直接绑到当前 DOM 节点，而是通过 React 的事件系统做委托分发。React 事件对象是 SyntheticEvent，API 接近原生事件，但经过封装并接入批处理。原生事件是浏览器直接派发的事件，使用 `addEventListener` 绑定。两者同时存在时，要注意执行顺序、冒泡边界和 `stopPropagation` 的影响范围。

一句话总结：

> 原生事件由浏览器直接派发，React 事件由 React 统一委托、封装和分发。

#### 核心原理

| 维度 | React 事件 | 原生事件 |
| --- | --- | --- |
| 绑定方式 | JSX 属性，如 `onClick` | `addEventListener` |
| 事件对象 | SyntheticEvent | Native Event |
| 分发机制 | React 事件系统委托分发 | 浏览器事件模型 |
| 更新处理 | 接入 React 批处理和优先级 | 不天然接入 React |

需要操作第三方 DOM 库时可能会混用原生事件，但要在卸载时手动清理监听。

---

<a id="react-事件绑定在哪里"></a>

### React 事件绑定在哪里？

#### 面试回答

可以这样答：

> React 事件一般通过事件委托绑定在统一容器上，而不是给每个 DOM 节点都绑定一份监听。React 16 及之前主要委托到 `document`，React 17 开始改为委托到 React root container。组件里写的 `onClick` 会被 React 记录起来，原生事件冒泡到容器后，再由 React 根据 Fiber 和事件路径分发到对应组件回调。

一句话总结：

> React 事件通过委托集中绑定；React 17+ 主要绑定在 root container。

#### 核心原理

```text
<button onClick={handleClick} />
  → React 记录 listener
  → root container 监听原生 click
  → 事件冒泡到 root
  → React 分发给 handleClick
```

这样能减少事件监听数量，也方便 React 控制事件分发和批处理。

---

<a id="react-17-事件机制有什么变化"></a>

### React 17 事件机制有什么变化？

#### 面试回答

可以这样答：

> React 17 的重要变化是事件委托位置从 `document` 调整到了 React root container。这样做主要是为了更好支持渐进升级和多版本 React 共存，避免不同 React 根之间的事件互相影响。另一个相关变化是 React 17 不再使用旧的事件池机制，事件对象不会在回调后被清空，因此一般不再需要 `event.persist()`。

一句话总结：

> React 17 把事件委托从 document 移到 root container，并移除了旧事件池行为。

#### 核心原理

React 16 及之前：

```text
document
  → React 统一监听和分发
```

React 17+：

```text
root container
  → 当前 React 根独立监听和分发
```

这对微前端、局部升级、页面里多个 React 根的场景更友好。

---

<a id="etarget-和-ecurrenttarget-区别"></a>

### e.target 和 e.currentTarget 区别？

#### 面试回答

可以这样答：

> `e.target` 表示事件最初触发的真实元素，`e.currentTarget` 表示当前正在执行事件处理函数的元素。比如点击按钮里的 span，`target` 可能是 span，而按钮上的 onClick 执行时，`currentTarget` 是 button。事件委托、冒泡、父子元素点击判断时，这两个属性很常用。

一句话总结：

> `target` 是事件源头，`currentTarget` 是当前监听器所在元素。

#### 核心原理

```jsx
<button onClick={e => {
  console.log(e.target)
  console.log(e.currentTarget)
}}>
  <span>保存</span>
</button>
```

点击 `span` 文本时，`target` 指向 `span`，`currentTarget` 指向绑定 `onClick` 的 `button`。

---

## 8. 性能优化高频

<a id="react-项目怎么做性能优化"></a>

### React 项目怎么做性能优化？

#### 面试回答

可以这样答：

> React 性能优化我会先定位瓶颈，再选择方案，而不是一上来就加 memo。常见方向有四类：减少不必要渲染，比如状态下沉、拆分组件、`React.memo`、稳定 props；降低单次渲染成本，比如虚拟列表、懒加载、避免重计算；优化首屏和包体积，比如路由级代码分割、资源压缩、SSR/SSG、预加载关键资源；最后用 React DevTools Profiler 和 Chrome Performance 验证优化是否有效。

一句话总结：

> React 优化 = 先度量瓶颈，再减少渲染次数、降低渲染成本、优化加载链路。

#### 核心原理

```text
定位问题
  → render 次数多？
  → 单次 render 慢？
  → commit / layout 慢？
  → JS 包太大或网络慢？
  → 针对性优化并复测
```

优化前后要看数据：组件渲染次数、耗时、长任务、LCP、INP、包体积等。

---

<a id="reactmemo-有什么用"></a>

### React.memo 有什么用？

#### 面试回答

可以这样答：

> `React.memo` 用来缓存函数组件的渲染结果，当父组件重新渲染但传给子组件的 props 浅比较没有变化时，React 可以跳过这个子组件的重新渲染。它适合纯展示组件、渲染成本较高的组件，或者父组件频繁更新而子组件 props 很稳定的场景。它不是越多越好，因为浅比较也有成本，如果 props 每次都是新对象或新函数，memo 很容易失效。

一句话总结：

> `React.memo` 通过 props 浅比较跳过无意义的子组件重新渲染。

#### 核心原理

```jsx
const UserCard = React.memo(function UserCard({ user }) {
  return <div>{user.name}</div>
})
```

如果父组件每次都这样传值，memo 可能失效：

```jsx
<UserCard user={{ name }} />
```

因为对象引用每次都是新的，需要用稳定数据结构或 `useMemo` 配合。

---

<a id="usememo-有什么用"></a>

### useMemo 有什么用？

#### 面试回答

可以这样答：

> `useMemo` 用来缓存计算结果，依赖项不变时直接复用上一次结果。它常用于缓存昂贵计算，比如大数组过滤排序；也常用于稳定对象或数组引用，避免传给 memo 子组件的 props 每次都变化。但 `useMemo` 不是语义保证，React 可能在特定情况下丢弃缓存；业务逻辑不能依赖它保持状态，只应该把它当性能优化工具。

一句话总结：

> `useMemo` 缓存计算结果，用于减少重计算或稳定引用。

#### 核心原理

```jsx
const sortedList = useMemo(() => {
  return expensiveSort(list)
}, [list])
```

适合用在“计算确实重”或“引用稳定能减少下游渲染”的场景；简单拼字符串、轻量 map 通常没必要。

---

<a id="usecallback-有什么用"></a>

### useCallback 有什么用？

#### 面试回答

可以这样答：

> `useCallback` 用来缓存函数引用，依赖项不变时返回同一个函数。它常见用途是把回调传给 `React.memo` 包裹的子组件，避免父组件每次 render 都创建新函数导致子组件重新渲染；也可以用于稳定 effect 依赖。它不会让函数内部执行更快，只是让函数引用更稳定。

一句话总结：

> `useCallback` 缓存函数引用，不缓存函数执行结果。

#### 核心原理

```jsx
const handleSelect = useCallback((id) => {
  setSelectedId(id)
}, [])

return <MemoList onSelect={handleSelect} />
```

如果子组件没有 memo，或者函数没有作为依赖/props 传递，`useCallback` 通常收益不明显。

---

<a id="怎么避免子组件无意义渲染"></a>

### 怎么避免子组件无意义渲染？

#### 面试回答

可以这样答：

> 避免子组件无意义渲染，首先要减少父组件无关状态对它的影响，比如状态下沉、拆分组件、把变化频繁的区域隔离出去。其次对纯展示且成本较高的子组件使用 `React.memo`，并用 `useMemo`、`useCallback` 稳定传入的对象、数组和函数。Context 场景要拆分 Provider 或稳定 value。最后要用 Profiler 验证，不要为了“看起来高级”到处加缓存。

一句话总结：

> 避免无意义渲染 = 缩小状态影响范围 + 稳定 props + 必要时 memo + Profiler 验证。

#### 核心原理

常见手段：

```text
状态下沉：把 state 放到真正需要它的组件
组件拆分：让频繁更新区域更小
React.memo：props 不变跳过子组件
useMemo/useCallback：稳定对象和函数引用
拆 Context：避免一个 value 变化影响所有消费者
```

优化时优先调整状态结构，再考虑缓存 API。

---

<a id="大列表怎么优化"></a>

### 大列表怎么优化？

#### 面试回答

可以这样答：

> 大列表优化的核心是不要一次性渲染所有 DOM。最常用方案是虚拟列表，只渲染可视区域和少量缓冲区，比如 `react-window`、`react-virtualized`、`react-virtuoso`。如果列表项渲染复杂，可以配合 `React.memo`、稳定 item props、分页或增量加载。还要避免在 render 中做大规模排序过滤，必要时用 `useMemo`、Web Worker 或后端分页。

一句话总结：

> 大列表优化 = 虚拟滚动减少 DOM 数量，配合分页、缓存和稳定渲染降低计算成本。

#### 核心原理

```text
总数据 10000 条
  → 页面只显示 20 条
  → 实际只渲染可视区 + buffer
  → 滚动时复用容器并替换内容
```

大列表瓶颈通常不只是 React render，还包括 DOM 节点数量、布局计算、滚动事件和图片资源。

---

<a id="首屏加载怎么优化"></a>

### 首屏加载怎么优化？

#### 面试回答

可以这样答：

> 首屏优化要从网络、资源、渲染三条线看。网络上减少关键请求、开启缓存和 CDN；资源上做路由级代码分割、Tree Shaking、压缩、图片懒加载和现代格式；渲染上减少首屏不必要组件、避免长任务，必要时用 SSR/SSG 提前输出 HTML。React 项目里常用 `React.lazy`、动态 import、骨架屏、预加载关键资源，并用 Lighthouse、Web Vitals 关注 LCP、FCP、TTI、INP 等指标。

一句话总结：

> 首屏优化 = 减少关键资源体积和请求，让用户更快看到可用内容。

#### 核心原理

```jsx
const SettingsPage = React.lazy(() => import('./SettingsPage'))
```

常见组合：

```text
代码分割
  + 静态资源缓存 / CDN
  + 图片压缩和懒加载
  + SSR / SSG
  + 骨架屏
  + Web Vitals 监控
```

优化不能只看“白屏时间”，还要关注用户能否交互以及交互是否流畅。

---

## 延伸阅读

- [React 进阶高频考点精讲](/md/框架/React/React%20进阶高频考点精讲.md)
- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React & Vue](/md/面试准备/技术/React%20%26%20Vue.md)
