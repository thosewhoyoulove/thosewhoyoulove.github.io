/*
 * @Description: 
 * @Author: 曹俊
 * @Date: 2022-12-12 18:00:18
 * @LastEditors: 曹俊
 * @LastEditTime: 2022-12-16 18:15:20
 */
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import 'virtual:windi.css'
import routes from '~pages'
const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App)
app.use(router)
app.mount('#app')


