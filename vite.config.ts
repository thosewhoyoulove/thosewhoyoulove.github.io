/*
 * @Description: 
 * @Author: 曹俊
 * @Date: 2022-12-12 18:00:18
 * @LastEditors: 曹俊
 * @LastEditTime: 2022-12-16 18:04:35
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import WindiCSS from 'vite-plugin-windicss'
import Pages from 'vite-plugin-pages'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), WindiCSS(), Pages(),
  AutoImport({
    resolvers: [ElementPlusResolver()],
  }),
  Components({
    resolvers: [ElementPlusResolver()],
  }),],

})
