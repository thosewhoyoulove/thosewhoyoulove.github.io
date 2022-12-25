<!--
 * @Description: 
 * @Author: 曹俊
 * @Date: 2022-12-12 18:00:18
 * @LastEditors: 曹俊
 * @LastEditTime: 2022-12-25 11:32:26
-->

<template>
    <div class="flex w-100vw h-100vh pt-20 justify-center">
        <div class="text-sm">
            <input class="bg-hex-ddd relative" id="document" type="file" accept=".docx" />
            <p class="absolute text-hex-f00 text-xs mt-2">*只能解析.docx文件</p>
            <div class="flex">
                <div class="span8">
                    <div id="output" class="well"></div>
                </div>
            </div>
        </div>
        <div @click="toParse(disabled)" class="flex ml-5"><el-button type="primary" size="small"
                :disabled="disabled">解析文件</el-button></div>
    </div>

</template>
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { onMounted, reactive, ref } from "vue";
import { saveAs } from 'file-saver';
const router = useRouter()
const route = useRoute()
const state = reactive({
    data: []
})
const render = (content: any) => {
    state.data = content
    // let data = JSON.stringify(state.data);
    // saveAs(new Blob([data], { type: 'application/json' }), 'data.json');存为JSON
}
let disabled = ref(true)
const toParse = (disabled: any) => {
    console.log('111');
    if (!disabled) {
        console.log('可以跳转');

        router.push({
            path: '/parse',
            query: {
                data: JSON.stringify(state.data)
            }
        })
    }

}
const main = () => {
    let doc = document.getElementById("document") as any;
    doc.addEventListener("change", handleFileSelect, false);

    const disable = () => {
        disabled.value = false
    }
    doc.addEventListener("change", disable, false);
    const containerDiv = document.getElementById('output') as any;
    containerDiv.style.display = "none";


    function handleFileSelect(event: any) {
        readFileInputEventAsArrayBuffer(event, function (arrayBuffer: any) {
            mammoth.convertToHtml({ arrayBuffer: arrayBuffer }).then(displayResult);
        });
    }

    function displayResult(result: any) {
        // 获取id为output的表格元素
        const outputElement = document.getElementById("output") as any;
        outputElement.innerHTML = result.value;
        const tableElement = outputElement.querySelector("table");
        const tbodyElement = tableElement.querySelector("tbody");
        // console.log(tbodyElement, "tbodyElement");
        // 获取表格中的每一行
        const rows = tbodyElement.getElementsByTagName("tr");

        // 定义一个数组，用来保存表格中的内容
        const tableData = [];

        for (let i = 0; i < rows.length; i++) {
            // 获取每一行的所有单元格
            const cells = rows[i].querySelectorAll("td");

            // 定义一个数组，用来保存每一行的内容
            const rowData = [];

            for (let j = 0; j < cells.length; j++) {
                // 获取单元格中的内容
                const cellContent = cells[j].innerText;

                // 将单元格中的内容添加到行数组中
                rowData.push(cellContent);
            }

            // 将行数组添加到总数组中
            tableData.push(rowData);
        }

        // 输出表格中的内容
        console.log(tableData, 'temp');
        let temp = tableData.reduce((pre, cur) => {
            if (cur.length === 7) {
                return [...pre, { day: cur[0], children: [cur.slice(1)] }]
            } else {
                pre[pre.length - 1].children.push(cur)
                return pre
            }
        }, [])
        console.log(temp, 'temp')
        temp.forEach(item => {
            item.children = item.children.map((i: any) => {

                return {
                    time: i[0],
                    place: i[1],
                    todo: i[2],
                    host: i[3],
                    participants: i[4],
                    preparationUnit: i[5]
                }
            })
        })
        console.log(temp, 'temp')

        render(temp);
        var messageHtml = result.messages
            .map(function (message: any) {
                return (
                    '<li class="' + message.type + '">' + escapeHtml(message.message) + "</li>"
                );
            })
            .join("");
        let messages = document.getElementById("messages") as any;
        messages.innerHTML = "<ul>" + messageHtml + "</ul>";
        return tableData;
    }

    function readFileInputEventAsArrayBuffer(event: any, callback: any) {
        var file = event.target.files[0];

        var reader = new FileReader();

        reader.onload = function (loadEvent: any) {
            var arrayBuffer = loadEvent.target.result;
            callback(arrayBuffer);
        };

        reader.readAsArrayBuffer(file);
    }

    function escapeHtml(value: any) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
};
onMounted(() => {
    main();
});
</script>
  
<style scoped>

</style>
  