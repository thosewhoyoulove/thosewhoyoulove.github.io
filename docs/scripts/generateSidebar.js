const fs = require("fs");
const path = require("path");

/** 侧边栏目录顺序（未列出的文件夹按中文拼音排在后面） */
const DIR_ORDER = {
    "": ["基础", "网络", "浏览器", "安全", "工程化", "框架", "Node.js", "可视化", "算法", "Git", "面试准备"],
    面试准备: ["技术", "项目与架构", "综合"],
    工程化: ["体系与实践", "Vite", "Webpack"],
    基础: ["HTML", "CSS", "JavaScript", "ES6"],
    框架: ["Vue", "React"],
};

/**
 * @param {string[]} names
 * @param {string} relFromMd 相对 md 根的路径，根目录为 ""
 * @param {(name: string) => fs.Stats} getStat
 */
function sortEntries(names, relFromMd, getStat) {
    const dirs = names.filter((n) => getStat(n).isDirectory());
    const files = names.filter((n) => !getStat(n).isDirectory());
    const order = DIR_ORDER[relFromMd] || null;

    const sortByOrderThenZh = (items, ord) =>
        [...items].sort((a, b) => {
            if (!ord) {
                return a.localeCompare(b, "zh-CN");
            }
            const ia = ord.indexOf(a);
            const ib = ord.indexOf(b);
            if (ia === -1 && ib === -1) {
                return a.localeCompare(b, "zh-CN");
            }
            if (ia === -1) {
                return 1;
            }
            if (ib === -1) {
                return -1;
            }
            return ia - ib;
        });

    let sortedDirs = sortByOrderThenZh(dirs, order);
    if (relFromMd === "浏览器") {
        sortedDirs = sortedDirs.filter((d) => d !== "Web-API");
        if (dirs.includes("Web-API")) {
            sortedDirs.push("Web-API");
        }
    }
    const sortedFiles = sortByOrderThenZh(files, null);
    // 浏览器下一篇篇笔记在前、Web-API 子目录在后，避免 API 专题挤在最上面
    if (relFromMd === "浏览器") {
        return [...sortedFiles, ...sortedDirs];
    }
    return [...sortedDirs, ...sortedFiles];
}

/**
 * @param {string} dir 当前目录绝对路径
 * @param {string} basePath 侧边栏缩进前缀
 * @param {string} relFromMd 当前目录相对 md 根（POSIX）
 * @param {string} mdDir md 根绝对路径
 */
function generateSidebar(dir, basePath, relFromMd, mdDir) {
    let sidebar = "";
    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (err) {
        console.error(`无法读取目录 ${dir}: ${err.message}`);
        return sidebar;
    }

    const excludeFiles = ["index.md"];
    const result = files.filter((file) => !excludeFiles.includes(file));

    const getStat = (name) => fs.statSync(path.join(dir, name));
    const sorted = sortEntries(result, relFromMd, getStat);

    sorted.forEach((file) => {
        const fullPath = path.join(dir, file);
        let stat;
        try {
            stat = fs.statSync(fullPath);
        } catch (err) {
            console.error(`无法获取文件状态 ${fullPath}: ${err.message}`);
            return;
        }

        const relativePath = path
            .relative(mdDir, fullPath)
            .replace(/\\/g, "/")
            .replace(/ /g, "%20");

        if (stat.isDirectory()) {
            sidebar += `  ${basePath}- ${file}\n`;
            const nextRel = relFromMd ? `${relFromMd}/${file}` : file;
            sidebar += generateSidebar(fullPath, basePath + "  ", nextRel, mdDir);
        } else if (path.extname(file) === ".md" || path.extname(file) === ".html") {
            const title = path.basename(file, path.extname(file));
            sidebar += `  ${basePath}- [${title}](/md/${relativePath})\n`;
        }
    });

    return sidebar;
}

function main() {
    const mdDir = path.join(__dirname, "../md");
    const sidebarPath = path.join(__dirname, "../_sidebar.md");
    const sidebarContent = generateSidebar(mdDir, "", "", mdDir);
    fs.writeFileSync(sidebarPath, sidebarContent, "utf-8");
    console.log(sidebarPath);
    console.log("侧边栏配置已更新！");
}

main();
