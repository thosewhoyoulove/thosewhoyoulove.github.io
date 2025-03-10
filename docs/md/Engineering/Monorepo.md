# **什么是 Monorepo？**

**Monorepo（单一代码仓库）**是一种代码管理策略，它将多个项目（如前端、后端、共享库等）存储在 **同一个 Git 仓库** 中，而不是为每个项目创建单独的代码仓库（Multiple Repositories, **MultiRepo**）。  

在 **Monorepo** 结构下，所有相关的代码共享一个版本控制、依赖管理和 CI/CD（持续集成/持续部署）流程。

---

## **Monorepo 的特点**

1. **单一仓库**：所有代码都存放在一个 Git 仓库中，而非多个独立仓库。
2. **多个项目**：可以包含多个相互关联的服务、应用或库，例如：
   - **前端**（React、Vue、Angular）
   - **后端**（Node.js、Go、Python）
   - **共享库**（工具函数、UI 组件库、API SDK）
3. **共享依赖**：多个项目可以共享相同的 npm、yarn、pnpm 依赖，减少重复安装。
4. **一致的开发流程**：统一代码风格、测试框架、构建工具，提升协作效率。

---

## **Monorepo vs. MultiRepo（多仓库）**

| 对比项  | **Monorepo（单仓库）** | **MultiRepo（多仓库）** |
|---------|-----------------|-----------------|
| **代码管理** | 所有代码在同一个仓库 | 每个项目或模块有独立仓库 |
| **依赖管理** | 可以共享依赖 | 依赖管理独立，可能重复 |
| **CI/CD** | 统一 CI/CD 配置 | 每个仓库需要单独配置 |
| **版本控制** | 版本同步管理更方便 | 需要手动同步多个仓库 |
| **团队协作** | 代码变更影响透明，易沟通 | 代码分散，协作成本较高 |
| **适用场景** | 适用于大型项目、微前端、微服务 | 适用于小型、独立项目 |

---

## **Monorepo 的目录结构示例**

```bash
/my-monorepo
  ├── packages
  │   ├── frontend  # 前端应用（React/Vue）
  │   ├── backend   # 后端服务（Node.js）
  │   ├── shared    # 共享库（工具函数、UI 组件）
  ├── package.json  # Monorepo 依赖管理
  ├── pnpm-workspace.yaml  # 适用于 pnpm
  ├── lerna.json    # 适用于 Lerna
  ├── turbo.json    # 适用于 Turborepo
```

---

## **如何管理 Monorepo？**

由于 Monorepo 代码量大，管理多个子项目会带来挑战。因此，通常使用 **Monorepo 工具** 来优化管理：

### **1. Lerna**

- 适用于 **JavaScript/TypeScript** 项目
- 管理多个 npm 包，支持版本控制、发布
- **示例命令**：

  ```bash
  lerna init  # 初始化 Monorepo
  lerna bootstrap  # 安装所有子包依赖
  lerna run build  # 运行所有子包的 build 脚本
  ```
  
### **2. Turborepo**

- 适用于 **前端项目**，比 Lerna 更快
- 主要优化 **构建和缓存**
- **示例 `turbo.json` 配置**：

  ```json
  {
    "pipeline": {
      "build": {
        "dependsOn": ["^build"],
        "outputs": [".next/**"]
      }
    }
  }
  ```

### **3. Nx**

- 适用于 **大型团队、微服务架构**
- 提供 **任务依赖管理、代码分析**
- **示例命令**：

  ```bash
  npx create-nx-workspace@latest my-monorepo
  ```

### **4. pnpm Workspaces**

- 适用于 **高效依赖管理**
- **示例 `pnpm-workspace.yaml`**：

  ```yaml
  packages:
    - "packages/*"
  ```

- 安装依赖：

  ```bash
  pnpm install
  ```

---

## **Monorepo 的优缺点**

### ✅ **优点**

✔ **更好的代码共享**：多个项目可以共享相同的库和工具。  
✔ **更容易管理依赖**：所有子项目的依赖在一个地方管理，避免版本冲突。  
✔ **一致的开发体验**：所有团队成员使用相同的工具和流程。  
✔ **更好的跨团队协作**：代码变更可以一次性影响所有相关项目，而不是手动同步多个仓库。  

### ❌ **缺点**

❌ **构建速度可能变慢**：如果项目庞大，构建时间可能增加（但可以利用 Turborepo、Nx 进行优化）。  
❌ **权限管理复杂**：如果不同团队管理不同子项目，可能需要额外的权限控制。  
❌ **初学者上手难度较高**：需要学习 Lerna、Turborepo、Nx 等工具。  

---

## **Monorepo 适合哪些项目？**

✅ **适合的场景**：

- **大型前端项目（微前端）**：多个前端应用（如 React、Vue）共享组件库。
- **多个 Node.js 服务（微服务架构）**：后端多个 API 服务共享数据库模型、工具库。
- **跨平台应用（Web + Mobile）**：前端 React Web + React Native 共享代码。

❌ **不适合的场景**：

- **完全独立的项目**，代码没有任何共享的部分（MultiRepo 更合适）。
- **团队规模小，项目简单**，不需要复杂的 Monorepo 结构。

---

## **总结**

**Monorepo 是一种代码管理策略，适用于多个相关项目共享代码的场景。**  
它 **简化了依赖管理，提高了团队协作效率**，但需要使用 Lerna、Turborepo、Nx 等工具来优化构建和管理流程。
