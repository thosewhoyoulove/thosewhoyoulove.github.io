# CI/CD

## 面试定位

CI/CD 常用于考察候选人是否具备发布和质量保障意识。回答时要讲清流水线阶段、质量卡点、环境隔离、密钥管理、灰度和回滚。

## 核心原理

前端项目的 CI/CD（持续集成/持续交付）流程是现代化开发中非常重要的一环，它可以帮助团队自动化构建、测试和部署，提高开发效率和代码质量。以下是一个典型的前端项目 CI/CD 流程，结合常见的工具和实践进行说明。

## 1. CI/CD 的核心概念

CI（持续集成）: 开发人员将代码频繁地合并到主分支，每次提交都会触发自动化的构建和测试流程，确保代码的稳定性。

CD（持续交付/持续部署）: 在 CI 的基础上，自动将代码部署到测试环境或生产环境，确保快速、可靠的交付。

## 2. 前端 CI/CD 流程的主要步骤

一个完整的前端 CI/CD 流程通常包括以下步骤：

### 1. 代码提交

- 开发人员在本地完成代码编写后，将代码提交到 Git 仓库（如 GitHub、GitLab、Bitbucket 等）。
- 提交的代码会触发 CI/CD 流程。

### 2. 代码拉取

- CI/CD 工具（如 Jenkins、GitHub Actions、GitLab CI/CD 等）从 Git 仓库拉取最新的代码。

### 3. 依赖安装

- 安装项目依赖，通常使用 npm install 或 yarn install。

### 4. 代码格式化与静态检查

- 使用工具（如 ESLint、Prettier）对代码进行格式化和静态检查，确保代码风格一致且没有低级错误。

- 如果检查失败，流程会终止并通知开发人员。

### 5. 单元测试

- 运行单元测试（如 Jest、Mocha），确保代码的功能正确。

- 如果测试失败，流程会终止并通知开发人员。

### 6. 构建项目

- 使用构建工具（如 Webpack、Vite、Rollup）将项目打包为生产环境可用的静态文件。

- 构建过程中可能会进行代码压缩、Tree Shaking、图片优化等操作。

### 7. 集成测试

- 在构建完成后，运行集成测试（如 Cypress、Puppeteer），确保各个模块之间的交互正常。

### 8. 部署到测试环境

- 将构建后的静态文件部署到测试环境（如 S3、Nginx、Docker 容器）。

- 测试环境用于 QA 团队进行手动或自动化测试。

### 9. 人工审批（可选）

- 如果需要，可以设置人工审批环节，由团队负责人确认是否继续部署到生产环境。

### 10. 部署到生产环境

- 将构建后的静态文件部署到生产环境（如 CDN、Nginx、Kubernetes）。

- 部署完成后，自动触发通知（如邮件、Slack 消息）。

### 11. 监控与回滚

- 部署完成后，监控生产环境的运行状态（如使用 Sentry、New Relic）。

- 如果发现问题，可以快速回滚到上一个稳定版本。

## 3. 常用的 CI/CD 工具

- GitHub Actions: GitHub 提供的 CI/CD 工具，直接集成在 GitHub 仓库中。

- GitLab CI/CD: GitLab 提供的 CI/CD 工具，功能强大且易于配置。

- Jenkins: 开源的自动化服务器，支持高度定制化的 CI/CD 流程。

- CircleCI: 云端的 CI/CD 工具，支持快速配置和扩展。

- Travis CI: 另一个流行的云端 CI/CD 工具，适合开源项目。

## 4. 示例：使用 GitHub Actions 实现 CI/CD

以下是一个使用 GitHub Actions 实现前端项目 CI/CD 的示例配置文件（.github/workflows/deploy.yml）：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install dependencies
        run: npm install

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm test

      - name: Build project
        run: npm run build

      - name: Deploy to S3 (Production)
        if: github.ref == 'refs/heads/main'
        run: |
          aws s3 sync ./dist s3://my-bucket-name --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### 流程说明

1. 触发条件: 当代码推送到 main 分支或发起 Pull Request 时触发。

2. 构建环境: 使用 ubuntu-latest 作为运行环境。

3. 步骤:

    - 拉取代码。

    - 安装依赖。

    - 运行代码格式化与静态检查。

    - 运行单元测试。

    - 构建项目。

    - 如果是 main 分支，将构建后的文件部署到 AWS S3。

## 5. 优化 CI/CD 流程的建议

- 缓存依赖: 使用缓存（如 actions/cache）加速依赖安装。

- 并行任务: 将 linting、测试和构建任务并行执行，减少整体耗时。

- 环境变量管理: 使用 CI/CD 工具的环境变量功能管理敏感信息（如 API 密钥）。

- 通知机制: 在流程的关键节点（如失败或成功）添加通知（如 Slack、邮件）。

- 回滚机制: 确保部署失败时可以快速回滚到上一个稳定版本。

## 6. 总结

前端项目的 CI/CD 流程可以显著提高开发效率和代码质量。通过自动化构建、测试和部署，团队可以更快地交付高质量的代码。选择合适的工具（如 GitHub Actions、GitLab CI/CD）并根据项目需求优化流程，是实现高效 CI/CD 的关键。

## 面试回答

可以这样答：

> 前端 CI/CD 的核心是把代码检查、测试、构建和部署自动化。CI 关注持续集成，通常在 PR 或 push 时触发，执行依赖安装、缓存恢复、lint、类型检查、单测、构建，失败就阻断合并。CD 关注持续交付或部署，构建产物通过制品管理上传到 CDN、对象存储或服务器，再按环境部署。成熟流程还要有环境变量和密钥管理、灰度发布、健康检查、失败通知和一键回滚。这样能保证每次发布流程一致、可追踪，也能把问题尽早暴露。

## 高频追问

### CI 为什么要缓存依赖？

依赖安装通常很耗时。缓存 pnpm store、npm cache 或 node_modules 可以显著减少流水线耗时，但要确保 lockfile 变化时缓存能正确失效。

### 前端怎么回滚？

常见方式是保留历史构建产物和版本号，CDN 或 Nginx 指向上一个稳定版本；也可以通过灰度平台或发布系统切换版本。

### 密钥能不能写在配置文件里？

不能。密钥应该放在 CI 平台的 secrets 或环境变量中，避免进入 Git 历史和构建产物。
