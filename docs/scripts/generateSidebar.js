const fs = require("fs");
const path = require("path");

// 遍历目录生成侧边栏配置
function generateSidebar(dir, basePath = "") {
    let sidebar = "";
    const files = fs.readdirSync(dir);
    const excludeFiles = ["index.md"];
    const result = files.filter(file => !excludeFiles.includes(file));
    //如果有空格，在URL中对空格进行编码（使用 %20 替换空格）
    result.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        const relativePath = path.relative("md", fullPath).replace(/\\/g, "/").replace(/ /g, "%20");
        console.log(relativePath);
        if (stat.isDirectory()) {
            // 处理目录
            sidebar += `  ${basePath}- ${file}\n`;
            sidebar += generateSidebar(fullPath, basePath + "  ");
        } else if (path.extname(file) === ".md") {
            // 处理 markdown 文件
            const title = path.basename(file, ".md");
            sidebar += `  ${basePath}- [${title}](/md/${relativePath})\n`;
        } else if (path.extname(file) === ".html") {
            // 处理 html 文件
            const title = path.basename(file, ".html");
            sidebar += `  ${basePath}- [${title}](/md/${relativePath})\n`;
        }
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
    console.log("侧边栏配置已更新！");
}

main();
