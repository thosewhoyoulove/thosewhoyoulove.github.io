/*
 * @Description: 
 * @Author: 曹俊
 * @Date: 2022-12-02 19:09:57
 * @LastEditors: 曹俊
 * @LastEditTime: 2022-12-15 16:33:52
 */
export default function() {
    let doc = document.getElementById("document");
    doc.addEventListener("change", handleFileSelect, false);
    doc.addEventListener('change', () => {
        const containerDiv = document.querySelector("div.container");
        containerDiv.style.display = "none";

    })

    function handleFileSelect(event) {
        readFileInputEventAsArrayBuffer(event, function(arrayBuffer) {
            mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                .then(displayResult)
                .done();
        });
    }

    function displayResult(result) {
        document.getElementById("output").innerHTML = result.value;

        // 获取id为output的表格元素
        const outputElement = document.getElementById("output");
        const tableElement = outputElement.querySelector("table");
        const tbodyElement = tableElement.querySelector('tbody')
        console.log(tbodyElement, 'tbodyElement')
            // 获取表格中的每一行
        const rows = tbodyElement.getElementsByTagName("tr");

        // 定义一个数组，用来保存表格中的内容
        const tableData = [];

        for (let i = 0; i < rows.length; i++) {
            // 获取每一行的所有单元格
            const cells = rows[i].getElementsByTagName("td");

            // 定义一个数组，用来保存每一行的内容
            const rowData = [];

            for (let j = 0; j < cells.length; j++) {
                // 获取单元格中的内容
                const cellContent = cells[j].innerHTML;

                // 将单元格中的内容添加到行数组中
                rowData.push(cellContent);
            }

            // 将行数组添加到总数组中
            tableData.push(rowData);
        }

        // 输出表格中的内容
        console.log(tableData);

        var messageHtml = result.messages.map(function(message) {
            return '<li class="' + message.type + '">' + escapeHtml(message.message) + "</li>";
        }).join("");

        document.getElementById("messages").innerHTML = "<ul>" + messageHtml + "</ul>";
        return tableData
    }

    function readFileInputEventAsArrayBuffer(event, callback) {
        var file = event.target.files[0];

        var reader = new FileReader();

        reader.onload = function(loadEvent) {
            var arrayBuffer = loadEvent.target.result;
            callback(arrayBuffer);
        };

        reader.readAsArrayBuffer(file);
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

}