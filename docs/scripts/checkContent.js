const fs = require("fs");
const path = require("path");

const docsRoot = path.resolve(__dirname, "..");
const contentRoot = path.join(docsRoot, "md");
const errors = [];
const warnings = [];
const titleOwners = new Map();
const sidebarContent = fs.readFileSync(path.join(docsRoot, "_sidebar.md"), "utf8");
const orphanRoutes = [];

function walk(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(fullPath) : [fullPath];
    });
}

function report(kind, filePath, message) {
    const relativePath = path.relative(docsRoot, filePath).replaceAll(path.sep, "/");
    (kind === "error" ? errors : warnings).push(`${relativePath}: ${message}`);
}

const markdownFiles = walk(contentRoot).filter((filePath) => filePath.endsWith(".md"));

for (const filePath of markdownFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    let inFence = false;
    let fenceCount = 0;
    const documentLines = [];
    for (const line of lines) {
        if (/^\s*```/.test(line)) {
            inFence = !inFence;
            fenceCount += 1;
            continue;
        }
        if (!inFence) {
            documentLines.push(line);
        }
    }
    if (inFence) {
        report("error", filePath, `代码围栏数量为 ${fenceCount}，可能未闭合`);
    }

    const h1List = documentLines
        .filter((line) => /^# /.test(line))
        .map((line) => line.slice(2).trim());
    if (h1List.length !== 1) {
        report("error", filePath, `应有且仅有一个一级标题，当前为 ${h1List.length} 个`);
    } else {
        const owners = titleOwners.get(h1List[0]) || [];
        owners.push(filePath);
        titleOwners.set(h1List[0], owners);
    }

    const linkPattern = /\]\((\/[^)#]+\.md)(?:#[^)]+)?\)/g;
    for (const match of content.matchAll(linkPattern)) {
        const decodedPath = decodeURIComponent(match[1]).replace(/^\/+/, "");
        const targetPath = path.resolve(docsRoot, decodedPath);
        if (!targetPath.startsWith(`${docsRoot}${path.sep}`) || !fs.existsSync(targetPath)) {
            report("error", filePath, `内部链接不存在：${match[1]}`);
        }
    }

    const secretPatterns = [
        /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
        /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
        /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
        /\bAKIA[0-9A-Z]{16}\b/,
    ];
    for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
            report("error", filePath, `疑似包含敏感信息：${pattern}`);
        }
    }

    const route = `/${path.relative(docsRoot, filePath).replaceAll(path.sep, "/")}`;
    const encodedRoute = route.replaceAll(" ", "%20");
    if (!sidebarContent.includes(route) && !sidebarContent.includes(encodedRoute)) {
        orphanRoutes.push(route);
    }
}

const sourceFiles = [
    path.join(docsRoot, "index.html"),
    path.join(docsRoot, "package.json"),
    ...walk(path.join(docsRoot, "scripts")).filter((filePath) => filePath.endsWith(".js")),
];
for (const filePath of sourceFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const assignmentPatterns = [
        /clientSecret\s*[:=]\s*["'][^"']{16,}["']/i,
        /(?:api[_-]?key|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_\-]{20,}["']/i,
    ];
    for (const pattern of assignmentPatterns) {
        if (pattern.test(content)) {
            report("error", filePath, `疑似包含硬编码凭证：${pattern}`);
        }
    }
}

for (const [title, owners] of titleOwners) {
    if (owners.length > 1) {
        const ownerNames = owners
            .map((filePath) => path.relative(docsRoot, filePath).replaceAll(path.sep, "/"))
            .join("、");
        warnings.push(`一级标题重复「${title}」：${ownerNames}`);
    }
}

if (orphanRoutes.length > 0) {
    warnings.push(`${orphanRoutes.length} 篇文章未进入主侧边栏（可作为延伸阅读保留）`);
    if (process.argv.includes("--verbose")) {
        for (const route of orphanRoutes) {
            warnings.push(`未导航：${route}`);
        }
    }
}

for (const warning of warnings) {
    console.warn(`WARN ${warning}`);
}
for (const error of errors) {
    console.error(`ERROR ${error}`);
}

console.log(`检查完成：${markdownFiles.length} 篇文章，${errors.length} 个错误，${warnings.length} 个警告。`);
if (errors.length > 0) {
    process.exitCode = 1;
}
