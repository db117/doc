# everything-claude-code Java 项目接入调研结论

## 推荐决策

建议优先落地 **“3 Agents + 3 Skills + 2 Commands + 2 Rules”** 最小可用组合。

先在 1～2 个 Java / Spring Boot 项目中完成 **两周试点验证**，验证通过后，再按照 **Java 能力白名单** 逐步扩展接入范围。

---

## 1. 调研背景

团队计划评估 `everything-claude-code` 在 Java 项目中的可用能力，重点关注其在 Java / Spring Boot
项目中的代码审查、构建排查、测试补齐、安全检查等场景的复用价值。

本次调研的核心原则是：

1. 优先复用 Java / Spring 相关能力。
2. 避免引入 TypeScript / Node.js 专属链路。
3. 降低接入成本，避免工具能力过宽导致误用。
4. 以最小可用组合先试点，再逐步扩展。

---

## 2. 调研目标

本次调研主要回答以下问题：

1. 哪些 Agents / Skills / Commands / Rules 可以直接复用？
2. 哪些能力适合进入 Java 项目的最小可用组合？
3. 哪些能力需要裁剪、改造后再接入？
4. 哪些能力不建议直接引入？
5. 如何制定后续试点与扩展路径？

---

## 3. 调研结论

### 3.1 总体结论

不建议将 `everything-claude-code` 整套直接引入 Java 项目。

更推荐采用 **“Java 能力白名单”** 的方式分批接入，只引入与 Java / Spring Boot 项目强相关的能力，避免 TypeScript / Node.js
相关规则、命令和流程污染现有研发链路。

### 3.2 接入策略

建议按照以下策略推进：

1. **先试点最小组合**：优先接入 Java 代码审查、构建排查、测试验证、安全检查相关能力。
2. **再扩展中优先级能力**：对通用审查、数据库审查、编码规范、架构模式等能力进行裁剪后接入。
3. **明确排除 TS / Node 专属能力**：避免引入 Next.js、NestJS、Bun、TypeScript 构建等与当前 Java 项目无关的能力。

---

## 4. 最小可用组合

建议优先落地以下组合：

| 类型       | 推荐项                                                              |
|----------|------------------------------------------------------------------|
| Agents   | `java-reviewer`、`java-build-resolver`、`security-reviewer`        |
| Skills   | `springboot-patterns`、`springboot-tdd`、`springboot-verification` |
| Commands | `build-fix`、`test-coverage`                                      |
| Rules    | `rules/java/security.md`、`rules/java/testing.md`                 |

### 4.1 推荐理由

该组合覆盖 Java 项目试点阶段最核心的四类场景：

1. **代码审查**：检查 Java / Spring Boot 代码质量、分层边界、异常处理、事务使用等问题。
2. **构建修复**：辅助排查 Maven / Gradle 依赖冲突、编译失败、测试失败等问题。
3. **测试补齐**：推动 JUnit 5、Mockito、MockMvc、Testcontainers 等测试能力落地。
4. **安全检查**：覆盖常见 Java Web 安全问题，如鉴权、越权、SQL 注入、敏感信息泄露等。

---

## 5. 详细适配清单

### 5.1 Agents 适配清单

| Agent                 | 适配优先级 | 适配建议                                     |
|-----------------------|------:|------------------------------------------|
| `java-reviewer`       |     高 | 可直接用于 Java / Spring Boot 代码审查。           |
| `java-build-resolver` |     高 | 可直接用于 Maven / Gradle 构建、依赖、测试失败等问题排查。    |
| `security-reviewer`   |     中 | 安全审查方法可复用，但需要补充 Java 技术栈相关检查项。           |
| `code-reviewer`       |     中 | 通用审查流程可参考，但需要弱化 TypeScript / Node.js 假设。 |
| `database-reviewer`   |     中 | PostgreSQL 相关能力偏强，建模、索引、SQL 审查方法可参考。     |

#### 重点建议

优先接入：

- `java-reviewer`
- `java-build-resolver`
- `security-reviewer`

暂缓接入：

- `code-reviewer`
- `database-reviewer`

这两个更适合作为第二阶段扩展能力，先完成裁剪后再引入。

---

### 5.2 Skills 适配清单

| Skill                     | 适配优先级 | 适配建议                                                            |
|---------------------------|------:|-----------------------------------------------------------------|
| `springboot-patterns`     |     高 | 可直接复用，用于规范 Spring Boot 分层、Controller / Service / Repository 设计。 |
| `springboot-tdd`          |     高 | 可直接复用，适用于 JUnit 5、Mockito、MockMvc、Testcontainers 等测试场景。         |
| `springboot-verification` |     高 | 可直接复用，用于构建、测试、覆盖率、安全扫描闭环。                                       |
| `springboot-security`     |     中 | 安全基线可参考，但需要结合当前鉴权、网关和权限模型调整。                                    |
| `java-coding-standards`   |     中 | 偏 JDK 17 规范，建议结合团队当前 JDK 版本裁剪。                                  |

#### 重点建议

优先接入：

- `springboot-patterns`
- `springboot-tdd`
- `springboot-verification`

第二阶段接入：

- `springboot-security`
- `java-coding-standards`

---

### 5.3 Commands 适配清单

| Command         | 适配优先级 | 适配建议                                |
|-----------------|------:|-------------------------------------|
| `build-fix`     |     中 | 流程可用，建议补充 Java 常见构建故障场景。            |
| `test-coverage` |     中 | 建议以 JaCoCo + Maven / Gradle 作为主线配置。 |

#### Java 项目建议补充的构建故障场景

`build-fix` 建议补充以下 Java 常见问题：

1. Maven / Gradle 依赖冲突。
2. 多模块项目依赖顺序问题。
3. JDK 版本不一致。
4. Spring Boot 版本与依赖版本不兼容。
5. Lombok / MapStruct / Annotation Processor 编译问题。
6. 单元测试失败导致构建失败。
7. CI 环境与本地环境不一致。

---

### 5.4 Rules 适配清单

| Rule                         | 适配优先级 | 适配建议                   |
|------------------------------|------:|------------------------|
| `rules/java/security.md`     |     高 | 可作为 Java 安全基线。         |
| `rules/java/testing.md`      |     高 | 可作为 Java 测试基线。         |
| `rules/java/coding-style.md` |     中 | 需要结合团队编码规范与 JDK 版本裁剪。  |
| `rules/java/patterns.md`     |     中 | 需要结合现有架构约束调整。          |
| `rules/java/hooks.md`        |     中 | 需要结合现有 CI / Hook 流程落地。 |

#### 重点建议

试点阶段只接入：

- `rules/java/security.md`
- `rules/java/testing.md`

暂缓接入：

- `rules/java/coding-style.md`
- `rules/java/patterns.md`
- `rules/java/hooks.md`

原因是这三类规则与团队既有规范、架构边界、CI 流程关系更强，直接引入容易产生冲突，建议在第二阶段结合团队现状裁剪后再接入。

---

## 6. 不建议直接引入的能力

以下能力不建议直接引入 Java 项目：

- `agents/typescript-reviewer.md`
- `agents/build-error-resolver.md`
- `rules/typescript/*`
- `nextjs-turbopack`
- `nestjs-patterns`
- `bun-runtime`

### 6.1 排除原因

1. 这些能力主要面向 TypeScript / Node.js 技术栈。
2. 与 Java / Spring Boot 项目的研发流程不匹配。
3. 容易引入错误的工程假设，例如 npm、pnpm、bun、tsconfig、Next.js 构建链路等。
4. 会增加团队理解成本和误用风险。
5. 对 Java 项目试点验证价值较低。

---

## 7. 试点落地建议

### 7.1 试点周期

建议试点周期为 **两周**。

### 7.2 试点范围

建议选择 1～2 个 Java / Spring Boot 项目作为试点对象，优先选择满足以下条件的项目：

1. 使用 Maven 或 Gradle 构建。
2. 有一定单元测试或集成测试基础。
3. 存在代码审查、测试补齐、构建排查等实际需求。
4. 项目复杂度适中，不建议一开始选择核心链路最复杂的项目。

### 7.3 试点验证内容

试点期间重点验证以下内容：

1. `java-reviewer` 是否能稳定发现代码质量问题。
2. `java-build-resolver` 是否能辅助定位 Maven / Gradle 构建问题。
3. `security-reviewer` 是否能识别常见 Java Web 安全风险。
4. `springboot-tdd` 是否能提升测试用例补齐效率。
5. `springboot-verification` 是否能形成构建、测试、覆盖率、安全扫描闭环。
6. `build-fix` 和 `test-coverage` 是否适配现有 CI 流程。

---

## 8. 后续计划

### 8.1 补齐 Java 能力映射表

建议补充完整映射关系：

**能力 -> 项目职责 -> 落地位置 -> 使用场景 -> 验收标准**

示例：

| 能力                    | 项目职责      | 落地位置           | 验收标准                       |
|-----------------------|-----------|----------------|----------------------------|
| `java-reviewer`       | Java 代码审查 | Code Review 阶段 | 能识别常见代码质量和 Spring 使用问题。    |
| `java-build-resolver` | 构建问题排查    | 本地构建 / CI 失败后  | 能辅助定位 Maven / Gradle 失败原因。 |
| `springboot-tdd`      | 测试用例生成    | 开发与测试补齐阶段      | 能生成可运行、可维护的 JUnit 5 测试。    |

### 8.2 明确版本前提

需要确认以下版本信息：

1. JDK 版本。
2. Spring Boot 版本。
3. Maven / Gradle 版本。
4. JUnit / Mockito / Testcontainers 版本。
5. JaCoCo 覆盖率工具版本。
6. 安全扫描工具版本。

### 8.3 增加落地检查清单

建议补充以下检查项：

1. Hook 是否接入。
2. CI 是否接入。
3. 测试覆盖率阈值是否明确。
4. 安全扫描规则是否明确。
5. 代码审查门禁是否明确。
6. 误报处理机制是否明确。
7. 白名单扩展流程是否明确。

### 8.4 明确迁移边界

需要提前确认以下边界：

1. 哪些流程沿用 `everything-claude-code`。
2. 哪些流程保留团队现有实现。
3. 哪些规则必须裁剪后才能使用。
4. 哪些能力只作为参考，不进入正式链路。
5. 哪些能力进入试点，哪些能力进入第二阶段。

---

## 9. 最终建议

本次接入不建议追求“大而全”，而应采用 **小范围、白名单、可验证** 的方式推进。

推荐路径如下：

1. 第一阶段：接入最小可用组合。
2. 第二阶段：完成两周试点验证。
3. 第三阶段：沉淀 Java 能力映射表与检查清单。
4. 第四阶段：按白名单扩展更多 Agents / Skills / Rules。

最终目标不是直接复用 `everything-claude-code` 的全部能力，而是沉淀一套适合当前团队 Java / Spring Boot 项目的 AI 辅助研发能力体系。