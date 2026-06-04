# React 核心原理面试题

## 面试定位

这篇用于 React 核心原理的第一轮复习，先覆盖四类最常被问到的问题：**React 基础思想**、**组件与渲染**、**Hooks 高频**和 **useEffect 必考**。回答时不要只背 API 定义，要先给出能口述的结论，再补充背后的更新模型、数据流、状态不可变、Hook 调用顺序、effect 生命周期等原理。

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

## 延伸阅读

- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React & Vue](/md/面试准备/技术/React%20%26%20Vue.md)
