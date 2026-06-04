# React 进阶高频考点精讲

## 面试定位

这篇承接 [React 高频考点精讲](/md/框架/React/React%20高频考点精讲.md)，专门放状态管理、表单、组件通信、路由、错误边界、React 18 和项目实践类问题。它们更接近社招中高级面试：面试官不只想听 API，还会追问你为什么这么设计、项目里怎么落地、边界和风险是什么。

---

## 问题导航

### 状态管理高频

- [React 自身怎么做状态管理？](#react-自身怎么做状态管理)
- [useState、useReducer、useContext 区别？](#usestateusereducerusecontext-区别)
- [Redux 是什么？](#redux-是什么)
- [Redux 为什么需要 react-redux？](#redux-为什么需要-react-redux)
- [Redux Toolkit 是什么？](#redux-toolkit-是什么)
- [MobX、Redux、Zustand 区别？](#mobxreduxzustand-区别)
- [什么时候需要状态管理库？](#什么时候需要状态管理库)
- [怎么实现一个状态管理库的基本功能？](#怎么实现一个状态管理库的基本功能)

### 受控组件和非受控组件

- [什么是受控组件？](#什么是受控组件)
- [什么是非受控组件？](#什么是非受控组件)
- [表单为什么推荐受控组件？](#表单为什么推荐受控组件)
- [useRef 可以做什么？](#useref-可以做什么)

### 组件通信高频

- [父子组件怎么通信？](#父子组件怎么通信)
- [兄弟组件怎么通信？](#兄弟组件怎么通信)
- [跨层级组件怎么通信？](#跨层级组件怎么通信)
- [Context 有什么问题？](#context-有什么问题)

### React Router 高频

- [前端路由是什么？](#前端路由是什么)
- [Hash 路由和 History 路由区别？](#hash-路由和-history-路由区别)
- [React Router 怎么做权限路由？](#react-router-怎么做权限路由)
- [路由懒加载怎么做？](#路由懒加载怎么做)

### 错误边界

- [Error Boundary 是什么？](#error-boundary-是什么)
- [它能捕获哪些错误？](#它能捕获哪些错误)
- [不能捕获哪些错误？](#不能捕获哪些错误)

### React 18 高频

- [React 18 有哪些新特性？](#react-18-有哪些新特性)
- [Concurrent Rendering 是什么？](#concurrent-rendering-是什么)
- [自动批处理是什么？](#自动批处理是什么)
- [startTransition 是什么？](#starttransition-是什么)
- [Suspense 是什么？](#suspense-是什么)
- [createRoot 和 ReactDOM.render 区别？](#createroot-和-reactdomrender-区别)

### 项目实践高频

- [你项目里 React 怎么做组件封装？](#你项目里-react-怎么做组件封装)
- [怎么设计一个业务组件？](#怎么设计一个业务组件)
- [怎么封装请求？](#怎么封装请求)
- [怎么处理权限？](#怎么处理权限)
- [怎么处理大表格性能？](#怎么处理大表格性能)
- [怎么做前端缓存？](#怎么做前端缓存)
- [怎么做错误监控？](#怎么做错误监控)
- [怎么做埋点？](#怎么做埋点)
- [怎么做微前端？](#怎么做微前端)
- [怎么做低代码 / 表单配置化？](#怎么做低代码--表单配置化)

---

## 9. 状态管理高频

<a id="react-自身怎么做状态管理"></a>

### React 自身怎么做状态管理？

#### 面试回答

> React 自身的状态管理主要靠组件本地 state、状态提升、`useReducer` 和 `Context`。局部交互状态放在组件内部，用 `useState` 最直接；多个兄弟组件共享时，把状态提升到最近公共父组件；状态更新逻辑复杂时用 `useReducer`；跨层级读取配置、用户信息、主题这类低频共享数据时用 `Context`。如果状态跨页面、高频更新、多人协作维护困难，再考虑 Redux、Zustand 这类状态库。

一句话总结：

> React 内置状态管理优先按作用域设计：局部 state、公共父级、Reducer、Context，最后才是外部状态库。

#### 核心原理

状态管理的关键不是选库，而是先判断状态作用域：

```text
只影响当前组件 → useState
影响兄弟组件 → 状态提升
更新分支复杂 → useReducer
跨层级低频共享 → Context
跨页面/高频/可追踪 → 状态管理库
```

状态放得越高，受影响的组件越多；状态放得越低，复用和联动可能更麻烦。项目里通常先用 React 内置能力，等复杂度真的上来再引入库。

---

<a id="usestateusereducerusecontext-区别"></a>

### useState、useReducer、useContext 区别？

#### 面试回答

> `useState` 适合简单局部状态，比如开关、输入框、计数器；`useReducer` 适合复杂状态迁移，比如表单编辑、筛选条件、购物车，因为它把 action 和状态变化集中管理；`useContext` 解决跨层级传值，避免层层传 props。它们不是替代关系，而是分别解决状态存储、复杂更新和跨层传递三个问题。

一句话总结：

> `useState` 管简单状态，`useReducer` 管复杂状态迁移，`useContext` 管跨层级读取。

#### 核心原理

| API | 解决什么 | 适合场景 | 注意点 |
| --- | --- | --- | --- |
| `useState` | 保存局部状态 | 简单状态 | 多个状态联动时容易分散 |
| `useReducer` | 集中描述状态变化 | 多 action、多分支 | reducer 要保持纯函数 |
| `useContext` | 跨层级传值 | 主题、用户、配置 | value 变化会影响消费者 |

实际项目经常组合使用：`useReducer` 管复杂状态，`Context` 负责把 `state` 和 `dispatch` 传给子树。

---

<a id="redux-是什么"></a>

### Redux 是什么？

#### 面试回答

> Redux 是一个可预测的状态容器，它把应用状态集中放在 store 里，通过 dispatch action 描述发生了什么，再由 reducer 根据旧 state 和 action 计算新 state。它强调单向数据流、不可变更新和纯 reducer，所以状态变化路径清晰，适合复杂业务、多人协作、需要调试追踪或时间旅行的项目。

一句话总结：

> Redux = store 保存状态，action 描述事件，reducer 计算新状态。

#### 核心原理

Redux 的核心链路：

```text
UI 触发事件
  → dispatch(action)
  → reducer(previousState, action)
  → newState
  → store 通知订阅者
  → UI 重新渲染
```

Redux 本身和 React 无强绑定。它只是状态容器，React 项目通常通过 `react-redux` 把 store 和组件连接起来。

---

<a id="redux-为什么需要-react-redux"></a>

### Redux 为什么需要 react-redux？

#### 面试回答

> Redux 本身只负责创建 store、dispatch action 和订阅状态变化，不知道 React 组件怎么渲染。`react-redux` 负责把 Redux store 接入 React：通过 `Provider` 注入 store，通过 `useSelector` 订阅需要的状态片段，通过 `useDispatch` 派发 action。它还会做订阅优化，避免所有组件在任意状态变化时都重新渲染。

一句话总结：

> Redux 管状态，`react-redux` 管 Redux 和 React 组件之间的订阅与更新。

#### 核心原理

典型用法：

```jsx
<Provider store={store}>
  <App />
</Provider>
```

组件中：

```jsx
const user = useSelector(state => state.user)
const dispatch = useDispatch()
```

`useSelector` 不是简单读取全量 store，而是订阅 selector 结果；当 selector 结果变化时，组件才需要更新。

---

<a id="redux-toolkit-是什么"></a>

### Redux Toolkit 是什么？

#### 面试回答

> Redux Toolkit 是 Redux 官方推荐的开发方式，用来降低 Redux 样板代码和配置成本。它提供 `configureStore`、`createSlice`、`createAsyncThunk` 等工具，内置 Redux DevTools、常用中间件和 Immer。开发者可以像“直接修改 state”一样写 reducer，但底层会通过 Immer 生成不可变更新。

一句话总结：

> Redux Toolkit = 官方标准写法，用更少模板代码写 Redux。

#### 核心原理

```js
const userSlice = createSlice({
  name: 'user',
  initialState: { name: '' },
  reducers: {
    setName(state, action) {
      state.name = action.payload
    }
  }
})
```

这里看起来修改了 `state.name`，实际 Immer 会记录变更并返回新状态。RTK 的价值是统一最佳实践，而不是改变 Redux 单向数据流本质。

---

<a id="mobxreduxzustand-区别"></a>

### MobX、Redux、Zustand 区别？

#### 面试回答

> Redux 强调显式 action、纯 reducer 和可预测数据流，适合复杂协作和强调调试追踪的项目；MobX 偏响应式，状态被观察后自动追踪依赖，写法更接近直接修改对象；Zustand 更轻量，用 hook 订阅 store，API 少、接入成本低，适合中小型项目或局部全局状态。选择时看团队习惯、状态复杂度、调试要求和长期维护成本。

一句话总结：

> Redux 重规范和可追踪，MobX 重响应式自动追踪，Zustand 重轻量和简单。

#### 核心原理

| 方案 | 模型 | 优点 | 风险 |
| --- | --- | --- | --- |
| Redux | action + reducer | 可预测、生态成熟、好调试 | 模板代码多，需规范 |
| MobX | observable 响应式 | 写法自然，依赖自动追踪 | 隐式更新多，调试链路可能不直观 |
| Zustand | hook + store | 轻量、简单、选择器订阅 | 大型项目需要自建规范 |

面试里不要只说“哪个更好”，要结合业务规模和团队协作说明取舍。

---

<a id="什么时候需要状态管理库"></a>

### 什么时候需要状态管理库？

#### 面试回答

> 当状态只是组件内部或少数组件共享时，不一定需要状态管理库；状态提升、`useReducer` 和 `Context` 就够了。需要状态库的信号通常是：状态跨多个页面共享、更新路径复杂、多个模块都要读写、需要持久化或调试追踪、Context 导致大量无关渲染，或者团队需要统一状态规范。这时引入 Redux、Zustand 这类库才有收益。

一句话总结：

> 状态管理库解决跨模块复杂共享状态，不应该为简单局部状态过早引入。

#### 核心原理

判断标准：

```text
状态作用域是否跨页面？
读写入口是否分散？
更新链路是否难追踪？
是否需要持久化 / 回放 / DevTools？
Context 是否造成性能问题？
```

如果答案多数为“否”，先保持 React 内置状态更简单。

---

<a id="怎么实现一个状态管理库的基本功能"></a>

### 怎么实现一个状态管理库的基本功能？

#### 面试回答

> 一个最小状态管理库至少需要三件事：保存全局 state，提供 `setState` 修改 state，提供 `subscribe` 让组件或回调订阅变化。React 里还要通过 `useSyncExternalStore` 或类似机制把外部 store 安全接入组件渲染，并用 selector 控制组件只订阅自己关心的片段。再往上才是 middleware、持久化、DevTools、异步 action 等能力。

一句话总结：

> 状态库核心 = state 容器 + 更新函数 + 订阅通知 + React 绑定。

#### 核心原理

最小模型：

```js
function createStore(initialState) {
  let state = initialState
  const listeners = new Set()

  return {
    getState: () => state,
    setState: (partial) => {
      state = { ...state, ...partial }
      listeners.forEach(listener => listener())
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
```

真正用于 React 时，要关注并发渲染一致性、selector 比较、批处理和卸载清理。

---

## 10. 受控组件和非受控组件

<a id="什么是受控组件"></a>

### 什么是受控组件？

#### 面试回答

> 受控组件是指表单值由 React state 控制，输入变化通过 `onChange` 更新 state，再由 state 回填到表单的 `value`。这样 React 始终掌握表单数据，方便做校验、联动、格式化、禁用提交和回显。它的代价是每次输入都会触发状态更新，复杂表单要注意性能和状态拆分。

一句话总结：

> 受控组件 = 表单值由 React state 驱动，输入事件反过来更新 state。

#### 核心原理

```jsx
const [name, setName] = useState('')

<input value={name} onChange={e => setName(e.target.value)} />
```

数据流是单向的：`state → value → 用户输入 → onChange → setState → 新 value`。

---

<a id="什么是非受控组件"></a>

### 什么是非受控组件？

#### 面试回答

> 非受控组件是指表单值主要由 DOM 自己维护，React 不在每次输入时同步 state，而是在需要时通过 ref 读取 DOM 当前值。它适合文件上传、第三方 DOM 表单库、富文本编辑器，或者不需要实时校验和联动的简单场景。缺点是数据不在 React 状态里，做校验、联动、回显会更麻烦。

一句话总结：

> 非受控组件 = DOM 自己保存表单值，React 通过 ref 在需要时读取。

#### 核心原理

```jsx
const inputRef = useRef(null)

function submit() {
  console.log(inputRef.current.value)
}

<input defaultValue="Tungee" ref={inputRef} />
```

`defaultValue` 只设置初始值，后续输入不由 React state 控制。

---

<a id="表单为什么推荐受控组件"></a>

### 表单为什么推荐受控组件？

#### 面试回答

> 大多数业务表单推荐受控组件，因为表单数据通常要参与校验、联动、提交、回显和权限控制。受控组件让所有值都在 React state 中，逻辑更可预测，也方便和表单库、接口数据、错误提示结合。非受控不是不能用，而是更适合文件上传、第三方控件或对实时状态没有要求的场景。

一句话总结：

> 受控组件让表单状态可预测，适合复杂业务表单。

#### 核心原理

受控组件的优势：

```text
输入值可校验
字段之间可联动
提交前可统一收集
接口回填可控
权限禁用和错误提示更直接
```

复杂表单要避免把所有字段都塞在一个超大组件里，可以拆字段组件、使用表单库或局部状态管理。

---

<a id="useref-可以做什么"></a>

### useRef 可以做什么？

#### 面试回答

> `useRef` 可以做两类事：第一，保存 DOM 或组件实例引用，比如聚焦输入框、读取尺寸、调用第三方库实例；第二，保存跨 render 持久存在但变化不需要触发渲染的值，比如定时器 id、上一次值、请求取消标记。它和 state 的区别是：修改 `ref.current` 不会触发重新渲染。

一句话总结：

> `useRef` 是不会触发渲染的可变容器，适合保存 DOM 引用和非 UI 状态。

#### 核心原理

```jsx
const inputRef = useRef(null)

useEffect(() => {
  inputRef.current?.focus()
}, [])
```

如果数据变化需要影响 UI，就用 state；如果只是保存一个外部句柄或最新值，用 ref 更合适。

---

## 11. 组件通信高频

<a id="父子组件怎么通信"></a>

### 父子组件怎么通信？

#### 面试回答

> 父子组件通信最常见是 props 和回调。父组件通过 props 把数据传给子组件，子组件不能直接修改 props，如果要通知父组件更新，就调用父组件传下来的回调函数。必要时父组件也可以通过 ref 暴露少量命令式方法，但默认应该优先使用声明式数据流。

一句话总结：

> 父传子用 props，子通知父用 callback。

#### 核心原理

```jsx
function Parent() {
  const [value, setValue] = useState('')
  return <Child value={value} onChange={setValue} />
}
```

这样状态所有权在父组件，子组件只消费数据和发出事件。

---

<a id="兄弟组件怎么通信"></a>

### 兄弟组件怎么通信？

#### 面试回答

> 兄弟组件通信通常把共享状态提升到最近公共父组件，由父组件分别把数据和更新函数传给两个子组件。如果兄弟组件距离很远，或者多个模块都要读写，可以考虑 Context 或状态管理库。不要让兄弟组件互相直接引用，这会破坏组件边界。

一句话总结：

> 兄弟通信优先状态提升，共享状态放到共同父级。

#### 核心原理

```text
Parent 持有 state
  → ChildA 修改 state
  → Parent 重新渲染
  → ChildB 拿到新 props
```

状态提升的优点是数据流清晰；缺点是层级深时 props 传递会变繁琐。

---

<a id="跨层级组件怎么通信"></a>

### 跨层级组件怎么通信？

#### 面试回答

> 跨层级通信可以用 Context、组合组件、render props、状态管理库或事件总线。React 项目里常用 Context 传主题、语言、用户信息；复杂业务状态更适合 Redux、Zustand 等状态库；组件插槽类场景可以用 children 组合，避免无意义的全局状态。选型关键是看数据是不是全局共享、更新频率高不高、是否需要可追踪。

一句话总结：

> 跨层级通信先看数据性质：配置用 Context，复杂共享状态用状态库，结构复用用组合。

#### 核心原理

```jsx
const AuthContext = createContext(null)

function App() {
  return (
    <AuthContext.Provider value={user}>
      <Page />
    </AuthContext.Provider>
  )
}
```

Context 适合读多写少的共享数据；高频变化数据要注意重渲染范围。

---

<a id="context-有什么问题"></a>

### Context 有什么问题？

#### 面试回答

> Context 最大的问题是更新粒度容易过粗。Provider 的 `value` 引用变化后，消费这个 Context 的组件都会重新渲染，即使它只用了其中一个字段。如果把用户、主题、通知、权限都塞进一个 Context，高频变化字段会拖累无关组件。优化方式是拆分 Context、稳定 value 引用，或者用外部 store 做细粒度订阅。

一句话总结：

> Context 解决跨层传值，但不适合无脑承载所有高频全局状态。

#### 核心原理

```jsx
const value = useMemo(() => ({ user, logout }), [user])
```

变化频率不同的数据应该拆开：

```text
ThemeContext
UserContext
NotificationContext
```

这样能避免一个字段变化导致所有消费者跟着更新。

---

## 12. React Router 高频

<a id="前端路由是什么"></a>

### 前端路由是什么？

#### 面试回答

> 前端路由是在单页应用中由浏览器端根据 URL 渲染不同页面组件，而不是每次跳转都请求服务端返回新 HTML。它通过监听 URL 变化，匹配路由表，再渲染对应组件。前端路由提升了页面切换体验，但也要求处理首屏加载、权限、刷新 404、懒加载和 SEO 等问题。

一句话总结：

> 前端路由 = URL 变化后由前端匹配组件并渲染页面。

#### 核心原理

```text
URL 变化
  → history/hash 监听
  → 匹配 route config
  → 渲染对应组件树
```

React Router 就是把这套匹配和渲染逻辑封装成声明式 API。

---

<a id="hash-路由和-history-路由区别"></a>

### Hash 路由和 History 路由区别？

#### 面试回答

> Hash 路由使用 URL 中 `#` 后面的片段，通过 `hashchange` 监听变化，刷新时不会把 hash 发送给服务端，所以不需要额外服务端配置；缺点是 URL 不够美观。History 路由使用 `pushState` 和 `popstate`，URL 更接近真实路径，但刷新 `/user/1` 时服务端也会收到这个路径，所以需要配置 fallback 到 `index.html`，否则会 404。

一句话总结：

> Hash 简单不需服务端配置，History URL 美观但需要服务端 fallback。

#### 核心原理

| 模式 | URL | 监听 | 服务端要求 |
| --- | --- | --- | --- |
| Hash | `/#/user` | `hashchange` | 低 |
| History | `/user` | `popstate` | 需要 fallback |

生产项目常用 History，但部署时必须配合 Nginx、CDN 或后端路由兜底。

---

<a id="react-router-怎么做权限路由"></a>

### React Router 怎么做权限路由？

#### 面试回答

> 权限路由一般分两层：登录态校验和权限点校验。登录态校验判断用户是否已登录，未登录跳转登录页；权限点校验判断用户角色或权限列表是否允许访问当前路由，不允许则跳 403 或隐藏入口。React Router 里可以用路由 wrapper、loader、`Navigate`、路由 meta 配置来实现。要注意前端权限只能控制体验，真正安全必须由后端接口校验。

一句话总结：

> 权限路由 = 路由匹配后先校验登录态和权限，再决定渲染页面还是重定向。

#### 核心原理

```jsx
function RequireAuth({ children }) {
  const user = useUser()
  if (!user) return <Navigate to="/login" replace />
  return children
}
```

更复杂的项目会在路由配置里加 `roles` 或 `permissions`，统一做菜单过滤和访问拦截。

---

<a id="路由懒加载怎么做"></a>

### 路由懒加载怎么做？

#### 面试回答

> 路由懒加载就是把不同页面拆成独立 chunk，用户访问到对应路由时再加载对应组件。React 里常用 `React.lazy` 配合动态 `import()` 和 `Suspense`，也可以使用框架或路由库提供的数据路由懒加载能力。它能减少首屏 JS 体积，但要配合 loading、错误兜底和预加载策略，避免页面切换时体验差。

一句话总结：

> 路由懒加载 = 按页面拆包，访问时再加载对应组件。

#### 核心原理

```jsx
const UserPage = React.lazy(() => import('./pages/UserPage'))

<Suspense fallback={<Loading />}>
  <UserPage />
</Suspense>
```

对高概率访问的页面，可以在空闲时预加载，平衡首屏体积和后续切换速度。

---

## 13. 错误边界

<a id="error-boundary-是什么"></a>

### Error Boundary 是什么？

#### 面试回答

> Error Boundary 是 React 用来捕获子组件渲染错误并展示降级 UI 的机制。它本质上是一个类组件，通过 `getDerivedStateFromError` 更新降级状态，通过 `componentDidCatch` 记录错误信息。它能避免局部组件异常导致整个应用白屏，通常放在路由级、模块级或关键业务组件外层。

一句话总结：

> Error Boundary = 捕获子树渲染错误并展示 fallback 的 React 兜底机制。

#### 核心原理

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    reportError(error, info)
  }

  render() {
    if (this.state.hasError) return <Fallback />
    return this.props.children
  }
}
```

函数组件目前不能直接定义 Error Boundary，但可以使用第三方库封装。

---

<a id="它能捕获哪些错误"></a>

### 它能捕获哪些错误？

#### 面试回答

> Error Boundary 能捕获子组件在 render 阶段、生命周期方法、构造函数中抛出的错误。比如某个组件读取了 undefined 属性导致 render 报错，Error Boundary 可以捕获并渲染 fallback。实际项目里通常还会在 `componentDidCatch` 中上报错误和组件栈信息。

一句话总结：

> Error Boundary 主要捕获 React 渲染链路里的子树错误。

#### 核心原理

可捕获范围：

```text
子组件 render 报错
类组件生命周期报错
类组件 constructor 报错
```

边界要包在可能出错组件的外层，不能捕获它自己内部的错误。

---

<a id="不能捕获哪些错误"></a>

### 不能捕获哪些错误？

#### 面试回答

> Error Boundary 不能捕获事件处理函数里的错误、异步回调里的错误、Promise reject、setTimeout 报错、服务端渲染错误，以及 Error Boundary 自身抛出的错误。事件和异步错误需要自己 try-catch、统一请求错误处理、全局 `unhandledrejection` / `error` 监听，或者接入监控 SDK。

一句话总结：

> Error Boundary 管渲染错误，不管事件、异步和自身错误。

#### 核心原理

```jsx
function Button() {
  return (
    <button onClick={() => {
      throw new Error('click error')
    }}>
      Click
    </button>
  )
}
```

这种事件错误不会被 Error Boundary 捕获，因为它不发生在 React render 提交流程中。

---

## 14. React 18 高频

<a id="react-18-有哪些新特性"></a>

### React 18 有哪些新特性？

#### 面试回答

> React 18 的核心变化是引入并发渲染能力，并围绕它提供新 API 和行为变化。常见高频点包括 `createRoot`、自动批处理、`startTransition` / `useTransition`、`useDeferredValue`、面向并发的 Suspense 能力，以及 `useId`、`useSyncExternalStore`、`useInsertionEffect` 等新 Hook。面试里重点不是背 API，而是说明 React 18 能把部分更新标记为非紧急，让页面优先响应用户输入。

一句话总结：

> React 18 重点是并发渲染基础能力，以及自动批处理、Transition、Suspense 等配套能力。

#### 核心原理

```text
createRoot 开启新根
  → 支持并发特性
  → 更新可区分优先级
  → 非紧急更新可被打断
```

React 18 的很多能力都建立在 Fiber 和 Scheduler 之上。

---

<a id="concurrent-rendering-是什么"></a>

### Concurrent Rendering 是什么？

#### 面试回答

> Concurrent Rendering 是 React 的一种渲染能力，允许 render 阶段的工作被中断、暂停、恢复或丢弃。它不是多线程，也不是同时渲染多个 DOM，而是 React 可以把低优先级更新放在后台计算，遇到用户输入等高优先级任务时先让出主线程。最终只有 commit 阶段会真正修改 DOM。

一句话总结：

> 并发渲染 = render 阶段可中断和可调度，让高优先级交互先响应。

#### 核心原理

```text
低优先级列表更新开始
  → 用户输入触发高优先级更新
  → React 暂停或丢弃低优先级 render
  → 先处理输入
  → 再继续列表更新
```

它要求 render 阶段保持纯净，因为 render 可能执行多次。

---

<a id="自动批处理是什么"></a>

### 自动批处理是什么？

#### 面试回答

> 自动批处理是 React 18 中把同一轮任务里的多个状态更新合并成一次渲染的能力。React 17 及之前主要在 React 事件中批处理，Promise、setTimeout、原生事件里的更新不一定合并；React 18 使用 `createRoot` 后，多数场景会自动批处理。这样能减少渲染次数，提高性能。如果确实需要同步刷新，可以用 `flushSync`，但要谨慎。

一句话总结：

> 自动批处理 = 多个 setState 合并成更少的 render。

#### 核心原理

```jsx
setTimeout(() => {
  setCount(c => c + 1)
  setFlag(true)
}, 0)
```

React 18 中这类更新通常会被合并处理。批处理改变的是渲染提交次数，不改变状态更新的语义。

---

<a id="starttransition-是什么"></a>

### startTransition 是什么？

#### 面试回答

> `startTransition` 用来把某些状态更新标记为非紧急更新。比如输入框的文字更新是紧急的，必须立刻响应；根据输入过滤大列表是非紧急的，可以稍后渲染或被打断。用 `startTransition` 包裹列表更新后，React 可以优先保证输入流畅，再处理耗时渲染。

一句话总结：

> `startTransition` 把更新标记为低优先级，避免非紧急渲染阻塞交互。

#### 核心原理

```jsx
setKeyword(value)

startTransition(() => {
  setFilteredList(filterList(value))
})
```

它不会让计算本身变快，只是改变更新优先级。特别重的 CPU 计算仍然可能需要 memo、Web Worker 或后端处理。

---

<a id="suspense-是什么"></a>

### Suspense 是什么？

#### 面试回答

> Suspense 是 React 用来为“还没准备好的内容”声明 fallback UI 的机制。最常见场景是组件懒加载：页面 chunk 还没下载完时展示 loading。React 18 之后，Suspense 也和并发渲染、流式 SSR 等能力结合得更紧密。它的核心价值是把 loading 状态声明在组件树里，而不是到处写命令式 loading 判断。

一句话总结：

> Suspense = 用 fallback 声明异步内容未就绪时的 UI。

#### 核心原理

```jsx
<Suspense fallback={<Loading />}>
  <LazyPage />
</Suspense>
```

当子树暂时无法完成渲染时，React 会显示 fallback；等资源准备好后再切换到真实内容。

---

<a id="createroot-和-reactdomrender-区别"></a>

### createRoot 和 ReactDOM.render 区别？

#### 面试回答

> `createRoot` 是 React 18 的新根 API，使用它创建的 root 才能启用 React 18 的并发能力和自动批处理等新行为。`ReactDOM.render` 是旧 API，在 React 18 中会让应用以兼容旧版本的方式运行，无法完整使用新特性。迁移时通常把 `ReactDOM.render(<App />, root)` 改成 `createRoot(root).render(<App />)`。

一句话总结：

> `createRoot` 是 React 18 新根 API，旧 `ReactDOM.render` 主要用于兼容。

#### 核心原理

```jsx
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')).render(<App />)
```

新 root 让 React 可以启用并发渲染相关调度能力。

---

## 15. 项目实践高频

<a id="你项目里-react-怎么做组件封装"></a>

### 你项目里 React 怎么做组件封装？

#### 面试回答

> 我做组件封装会先区分基础组件、业务组件和页面组件。基础组件关注通用交互和样式，比如 Button、Modal；业务组件封装业务语义，比如用户选择器、权限按钮；页面组件负责数据编排和路由上下文。封装时我会控制 props 设计，避免把业务细节泄漏到外部，同时保留必要扩展点，比如 render props、children、插槽区域或受控状态。

一句话总结：

> 组件封装要分层：基础通用、业务语义、页面编排，各自职责不要混。

#### 核心原理

好的组件封装通常满足：

```text
职责单一
props 语义清晰
默认值合理
支持受控 / 非受控边界
暴露必要扩展点
内部副作用可清理
```

不要为了复用过度抽象，三处以上重复并且变化方向一致时再抽。

---

<a id="怎么设计一个业务组件"></a>

### 怎么设计一个业务组件？

#### 面试回答

> 设计业务组件时，我会先明确它解决的业务场景、输入输出、状态归属和扩展点。比如一个用户选择器，需要考虑数据源、搜索、分页、默认值、禁用、权限、回显、错误态。组件内部可以封装请求和交互，但关键状态最好支持受控，方便外部表单或页面接管。最后补齐 loading、empty、error 等边界状态。

一句话总结：

> 业务组件设计 = 明确场景边界、状态归属、数据来源、交互状态和扩展点。

#### 核心原理

设计清单：

```text
输入：value、options、query、权限上下文
输出：onChange、onSearch、onError
状态：受控还是内部维护
边界：loading、empty、error、disabled
扩展：自定义渲染、自定义过滤、自定义 footer
```

面试里最好结合项目例子说，而不是只讲抽象原则。

---

<a id="怎么封装请求"></a>

### 怎么封装请求？

#### 面试回答

> 请求封装一般分三层：底层 HTTP client 统一 baseURL、超时、header、错误码和拦截器；业务 service 层封装具体接口语义；组件层只调用 service 或 hooks，不直接拼 URL。还要处理 token 注入、登录过期、取消请求、重复提交、错误提示、loading 状态和埋点。这样可以避免请求逻辑散落在组件里。

一句话总结：

> 请求封装 = HTTP 基础层 + 业务 service 层 + 组件 hook 层。

#### 核心原理

```text
request client
  → userService.getUser()
  → useUserQuery()
  → Component
```

这样组件只关心数据和状态，不关心 token、错误码、重试、日志等横切逻辑。

---

<a id="怎么处理权限"></a>

### 怎么处理权限？

#### 面试回答

> 前端权限一般包括路由权限、菜单权限、按钮权限和数据权限展示。路由层根据登录态和角色决定是否允许访问；菜单根据权限过滤；按钮或操作根据权限点控制显示或禁用；数据权限最终必须由后端接口保证。前端权限主要改善体验和减少误操作，不能作为安全边界。

一句话总结：

> 前端权限管体验，后端权限管安全。

#### 核心原理

```text
登录态
  → 拉取用户信息和权限点
  → 生成可访问路由 / 菜单
  → 组件内按权限点控制操作
  → 后端接口再次校验
```

常见做法是封装 `usePermission`、`PermissionButton` 或路由守卫。

---

<a id="怎么处理大表格性能"></a>

### 怎么处理大表格性能？

#### 面试回答

> 大表格性能优化我会从数据量、渲染量和交互复杂度三方面处理。数据量大时优先服务端分页、筛选和排序；渲染量大时使用虚拟滚动，只渲染可视区域；列复杂时减少单元格里的重组件，配合 memo 和稳定 rowKey；交互复杂时把编辑状态局部化，避免整表刷新。还要关注固定列、合并单元格、动态高度对虚拟滚动的影响。

一句话总结：

> 大表格优化 = 服务端减数据 + 虚拟滚动减 DOM + 稳定 rowKey 和局部更新。

#### 核心原理

```text
服务端分页/排序/筛选
  → 前端只持有当前页或窗口数据
  → 虚拟列表渲染可视区
  → 单元格 memo
  → 编辑状态按行/单元格隔离
```

表格卡顿往往同时来自 DOM 数量、布局计算和复杂单元格渲染。

---

<a id="怎么做前端缓存"></a>

### 怎么做前端缓存？

#### 面试回答

> 前端缓存要分层看：HTTP 缓存用于静态资源和接口缓存；内存缓存用于当前会话里的请求结果；`localStorage`、`IndexedDB` 可做跨会话持久化；状态库或 React Query 这类工具可以管理服务端状态缓存。缓存必须考虑过期策略、失效时机、用户隔离和数据一致性，不能只存不清。

一句话总结：

> 前端缓存 = 选合适存储层，并设计过期、失效和一致性策略。

#### 核心原理

```text
静态资源 → HTTP cache / CDN
接口数据 → memory cache / React Query
用户偏好 → localStorage
大结构化数据 → IndexedDB
```

用户相关数据要注意退出登录清理，避免账号切换后读到旧缓存。

---

<a id="怎么做错误监控"></a>

### 怎么做错误监控？

#### 面试回答

> 错误监控通常包括 JS 运行时错误、Promise 未处理异常、资源加载失败、接口错误和 React 渲染错误。React 项目里可以用 Error Boundary 捕获组件渲染错误，用 `window.onerror` 和 `unhandledrejection` 捕获全局错误，用请求拦截器记录接口错误。上报时要带页面、用户匿名标识、版本、路由、设备、错误栈和组件栈，方便定位。

一句话总结：

> 错误监控 = 多入口采集错误 + 带上下文上报 + 告警和追踪闭环。

#### 核心原理

```text
Error Boundary
window.onerror
unhandledrejection
资源加载 error
请求拦截器
  → 统一上报 SDK
  → 聚合、告警、定位版本
```

注意脱敏，不要把 token、手机号、身份证等敏感信息直接上报。

---

<a id="怎么做埋点"></a>

### 怎么做埋点？

#### 面试回答

> 埋点一般分页面曝光、点击行为、业务转化、性能和错误几类。实现上可以手动埋点，也可以通过配置化或指令式封装减少侵入。React 项目里常封装 `track(eventName, payload)`，在路由切换、按钮点击、关键业务状态变化时上报。关键是定义统一事件规范、字段命名、用户匿名标识和版本信息，并保证失败不影响主流程。

一句话总结：

> 埋点 = 统一事件规范 + 低侵入采集 + 异步可靠上报。

#### 核心原理

```text
事件触发
  → 组装公共字段
  → 入队
  → 批量或空闲上报
  → 失败重试或降级丢弃
```

埋点要和业务指标绑定，否则数据很多但无法支持决策。

---

<a id="怎么做微前端"></a>

### 怎么做微前端？

#### 面试回答

> 微前端适合多个团队独立开发、独立部署、技术栈不完全一致的大型系统。核心要解决应用加载、路由隔离、样式隔离、状态通信、权限统一和发布治理。常见方案有 qiankun、single-spa、Module Federation。落地时不能只看接入，还要考虑公共依赖、性能、监控、降级、灰度和子应用故障隔离。

一句话总结：

> 微前端 = 多应用独立交付，同时治理路由、样式、通信和发布。

#### 核心原理

```text
主应用
  → 认证 / 菜单 / 路由
  → 加载子应用
  → 注入上下文
  → 子应用独立渲染和卸载
```

如果只是一个团队维护的小系统，微前端可能增加复杂度，不一定值得。

---

<a id="怎么做低代码--表单配置化"></a>

### 怎么做低代码 / 表单配置化？

#### 面试回答

> 低代码或表单配置化的核心是把页面结构、字段、校验、联动和提交逻辑抽象成配置，再由渲染器把配置转换成组件树。比如表单可以用 schema 描述字段类型、label、默认值、校验规则、显示条件和数据源。难点在于联动表达式、异步数据、权限控制、自定义组件扩展、版本管理和调试体验。项目里要避免为了配置化牺牲可维护性，复杂业务仍要允许代码扩展。

一句话总结：

> 表单配置化 = schema 描述业务表单，渲染器负责生成 UI、校验、联动和提交。

#### 核心原理

```js
const schema = [
  { type: 'input', name: 'username', label: '用户名', required: true },
  { type: 'select', name: 'role', label: '角色', dataSource: '/api/roles' }
]
```

渲染链路：

```text
schema
  → 字段组件映射
  → 表单状态管理
  → 校验规则
  → 联动规则
  → 提交转换
```

配置化适合重复度高、规则稳定的场景；强业务定制页面不要过度配置化。

---

## 延伸阅读

- [React 高频考点精讲](/md/框架/React/React%20高频考点精讲.md)
- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React Hooks](/md/框架/React/Hooks.md)
- [React & Vue](/md/面试准备/技术/React%20%26%20Vue.md)
