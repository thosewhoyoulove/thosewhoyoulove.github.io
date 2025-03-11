const fs = require("fs");
const path = require("path");

/**
 * 生成侧边栏内容
 * @param {string} dir - 当前目录路径
 * @param {string} basePath - 基本路径，用于缩进
 * @returns {string} - 生成的侧边栏字符串
 */
function generateSidebar(dir, basePath = "") {
    let sidebar = "";
    let files;
    try {
        files = fs.readdirSync(dir); // 读取目录内容
    } catch (err) {
        console.error(`无法读取目录 ${dir}: ${err.message}`);
        return sidebar; // 如果无法读取目录，则返回空字符串
    }

    const excludeFiles = ["index.md"]; // 排除的文件列表
    const result = files.filter(file => !excludeFiles.includes(file)); // 过滤掉不需要的文件

    // 如果有空格，在URL中对空格进行编码（使用 %20 替换空格）
    result.forEach(file => {
        const fullPath = path.join(dir, file);
        let stat;
        try {
            stat = fs.statSync(fullPath); // 获取文件或目录的状态
        } catch (err) {
            console.error(`无法获取文件状态 ${fullPath}: ${err.message}`);
            return; // 如果获取状态失败，跳过该文件
        }

        // 获取相对路径并做 URL 编码处理
        const relativePath = path
            .relative("md", fullPath)
            .replace(/\\/g, "/") // 将路径中的反斜杠转换为斜杠
            .replace(/ /g, "%20"); // 将空格替换为 URL 编码

        if (stat.isDirectory()) {
            // 处理目录
            sidebar += `  ${basePath}- ${file}\n`;
            // 递归处理子目录
            sidebar += generateSidebar(fullPath, basePath + "  ");
        } else if (path.extname(file) === ".md" || path.extname(file) === ".html") {
            // 处理 markdown 文件或 html 文件
            const title = path.basename(file, path.extname(file)); // 去除扩展名获取文件名
            sidebar += `  ${basePath}- [${title}](/md/${relativePath})\n`;
        }
        // 可以在这里继续添加对其他文件类型的处理逻辑
    });

    return sidebar;
}
// 主函数
function main() {
    const mdDir = path.join(__dirname, "../md");
    const sidebarPath = path.join(__dirname, "../_sidebar.md");

    // 生成目录内容
    const sidebarContent = generateSidebar(mdDir);

    // 写入文件
    fs.writeFileSync(sidebarPath, sidebarContent, "utf-8");
    console.log(sidebarPath);
    console.log("侧边栏配置已更新！");
}

main();
