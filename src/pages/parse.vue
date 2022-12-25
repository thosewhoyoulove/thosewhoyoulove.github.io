<!--
 * @Description: 
 * @Author: 曹俊
 * @Date: 2022-12-16 17:49:11
 * @LastEditors: 曹俊
 * @LastEditTime: 2022-12-25 21:08:46
-->
<template>
    <div class=" h-100vh pt-5">
        <div v-for="(item, index) in data" :key="index">

            <div
                class="flex w-50 h-20 bg-hex-5F9CEF border rounded-xl my-0 mx-auto text-hex-fff items-center justify-center">
                {{ item.day }}
            </div>
            <div class="flex dashed-line text-center"></div>
            <div v-for="it in item?.children" class=" border border-hex-5F9CEF mx-4 my-1">
                <div
                    class="flex w-100% bg-hex-5F9CEF h-15 text-center items-center justify-center text-hex-fff font-600">
                    {{ it?.todo }}
                </div>
                <div class="text-xs p-3">
                    <div class="flex mb-2 items-center "><img class="bg-hex-5F9CEF h-5 w-5" src="../../public/time.png"
                            alt="">
                        <div class="ml-2">
                            {{ item.day.slice(6) }} {{ it?.time }}
                        </div>
                    </div>
                    <div class="flex items-center"><img class="bg-hex-5F9CEF h-5 w-5" src="../../public/space.png"
                            alt="">
                        <div class="ml-2">{{ it?.place }}</div>
                    </div>
                </div>

                <div class="flex rectangle">
                    <div class="absolute w-0 h-0 triangle right-0"></div>
                    <div class="flex text-xs text-hex-fff items-center justify-center ml-1">相关信息</div>
                </div>
                <div class="text-xs p-3">
                    <div class="flex mb-2">主持人：{{ it?.host }}</div>
                    <div class="flex mb-2">准备单位：{{ it?.preparationUnit }}</div>
                    <div class="flex text-left">参加单位或人员：{{ it?.participants }}</div>
                </div>
            </div>
        </div>
    </div>

</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { onMounted, reactive, ref } from "vue";

import { decompressFromEncodedURIComponent as decode, compressToEncodedURIComponent as encode } from 'lz-string'
const route = useRoute()
// const jsonData = [{ "day": "11月28日星期一", "children": [{ "time": "15:00", "place": "立德楼417会议室", "todo": "湖南科技大学党风廉政建设                                                                                              和反腐败工作联席会议", "host": "郭时印", "participants": "党办校办、组织部、宣传部、人事处、研究生院、学工处、财务处、国资处、审计处、基建处、后勤处、继续教育学院、采购中心等单位主要负责人", "preparationUnit": "纪委办监察专员办" }] }, { "day": "11月29日星期二", "children": [{ "time": "全  天", "place": "各党支部自行安排", "todo": "11月份党支部主题党日活动", "host": "各党支部书记", "participants": "各党支部全体党员", "preparationUnit": "各党支部" }, { "time": "8:30", "place": "立言楼4-1会议室", "todo": "汉语言文学专业认证专家见面会", "host": "贺泽龙", "participants": "党办校办、规划与学科处、教务处、人事处、学工处、招就处、财务处、国资处、后勤处、团委、图书馆、网络中心、校友办、校地办、教学评建与教师教学发展中心、外国语学院、马克思主义学院、教育学院、体育学院等主要负责人，人文学院领导班子成员、汉语言文学专业负责人及专业核心课程教师", "preparationUnit": "教学评建与教师教学发展中心" }, { "time": "10:00", "place": "立德楼417会议室", "todo": "湖南科技大学与湘潭市基础教育合作工作推进会", "host": "赵前程郭时印", "participants": "组织部、宣传部、教务处、科技处、社科处、人事处、研究生院、学工处、招就处、财务处、团委、图书馆、网络中心、继续教育学院、校友办、校地办、教学评建与教师教学发展中心、信息与电气工程学院、化学化工学院、马克思主义学院、教育学院、齐白石艺术学院、体育学院等单位主要负责人", "preparationUnit": "校地办" }, { "time": "14:30", "place": "立德楼A附楼五楼报告厅", "todo": "学习二十大精神辅导报告", "host": "郭时印", "participants": "纪委办、监察专员办、审计处、教育学院、生命科学与健康学院全体教职工党员，学生党员代表", "preparationUnit": "纪委办监察专员办马克思主义学院" }] }, { "day": "11月30日星期三", "children": [{ "time": "8:30", "place": "第二教学楼", "todo": "地球科学与空间信息工程学院教学、实验用房相关工作现场办公会", "host": "李  琳", "participants": "教务处、国资处、基建处、后勤处等单位负责人，地球科学与空间信息工程学院相关领导及老师", "preparationUnit": "国资处" }, { "time": "8:30", "place": "立德楼417会议室", "todo": "人事调配小组会议", "host": "谢  慧", "participants": "张琳、何正良、陈春萍、吴亮红、万文、贺胜兵、吴建军、李海萍、赵召平、李宁", "preparationUnit": "人事处" }, { "time": "9:40", "place": "立德楼417会议室", "todo": "湖南科技大学2022年新进人员职称调入认定审核会", "host": "谢  慧", "participants": "张琳、何正良、陈春萍、吴亮红、万文、贺胜兵、吴建军、李海萍、赵召平、李宁", "preparationUnit": "人事处" }, { "time": "10:10", "place": "立德楼417会议室", "todo": "人事制度研讨会", "host": "谢  慧", "participants": "党办校办、组织部、规划与学科处、教务处、科技处、社科处、研究生院、学工处、后勤处、保卫处等单位主要负责人", "preparationUnit": "人事处" }, { "time": "14:30", "place": "立德楼A附楼五楼报告厅", "todo": "工作例会", "host": "朱川曲", "participants": "全体校领导、校党委委员，全体处级干部", "preparationUnit": "党办校办" }, { "time": "19:00", "place": "立德楼A附楼五楼报告厅", "todo": "2022年湖南科技大学“十佳班级”“十佳宿舍”评选会", "host": "廖湘岳", "participants": "评委（另行通知），各教学院党委副书记、学工办主任及学生代表", "preparationUnit": "学工处" }] }, { "day": "12月1日星期四", "children": [{ "time": "9:00", "place": "立德楼211会议室", "todo": "学生工作例会", "host": "廖湘岳", "participants": "研工部、学工部、招就处、后勤处、保卫处、团委、校友办等单位负责人，各教学院党委副书记", "preparationUnit": "学工部" }, { "time": "9:00", "place": "立德楼417会议室", "todo": "人事制度研讨会", "host": "谢  慧", "participants": "另行通知", "preparationUnit": "人事处" }, { "time": "10:30", "place": "立德楼301会议室", "todo": "2022级家庭经济困难新生御寒棉衣发放仪式", "host": "廖湘岳", "participants": "学工处负责人，各教学院分管资助工作辅导员、学生代表，学工处资助办工作人员", "preparationUnit": "学工处" }, { "time": "14:30", "place": "湘潭经开区九华大楼218会议室", "todo": "湘潭经济技术开发区 湖南科技大学“二十大”精神专题联学暨校地深度融合发展工作推进会", "host": "唐亚阳朱川曲", "participants": "校党委委员、校领导，党办校办、组织部、宣传部、统战部、纪委办、教务处、科技处、社科处、人事处、研究生院、学工处、招就处、保卫处、校地办、工会、团委、网络中心、创新创业学院、校友办、教学评建与教师教学发展中心、成果转化中心等单位主要负责人，各二级党组织书记，各教学院院长，陈宇强、张瑞鸿、苏俊铭、谭载花、夏青、荣识广、丁爱霞", "preparationUnit": "党办校办宣传部校地办" }] }, { "day": "12月2日星期五", "children": [{ "time": "9:00", "place": "立言楼4-1会议室", "todo": "汉语言文学专业认证专家意见反馈会", "host": "贺泽龙", "participants": "党办校办、规划与学科处、教务处、人事处、学工处、招就处、财务处、国资处、后勤处、团委、图书馆、网络中心、校友办、校地办、教学评建与教师教学发展中心、外国语学院、马克思主义学院、教育学院、体育学院等主要负责人，人文学院领导班子成员、汉语言文学专业负责人及专业核心课程教师", "preparationUnit": "教学评建与教师教学发展中心" }, { "time": "14:30-17:30", "place": "另行通知", "todo": "处级领导干部学习贯彻党的二十大精神专题读书班分组联合研讨", "host": "唐亚阳", "participants": "全体处级领导干部", "preparationUnit": "组织部" }] }]
let data = JSON.parse(route.query.data as any)
// let data = JSON.parse(JSON.stringify(jsonData))
let encodedUrl = ref()
let decodedUrl = ref()
onMounted(() => {
    console.log(data, '传过来的数据')

    // encodedUrl.value = encode(window.location.search)

    // decodedUrl.value = decode(encodedUrl.value)
    // console.log(decodedUrl.value, 'decodedUrl.value');
})
</script>

<style scoped>
.dashed-line {
    width: 1px;
    height: 5rem;
    border-left: 3px dashed blue;
    margin: 0 auto;
}

.rectangle {
    width: 70px;
    /* Set the width of the rectangle */
    height: 30px;
    /* Set the height of the rectangle */
    background-color: #5F9CEF;
    /* Set the background color of the rectangle */
    position: relative;

}

.triangle {
    border-width: 15px;
    border-style: solid;
    border-color: transparent white transparent transparent;
}
</style>