// electron/src/requestLogic.ts
import { ipcMain } from 'electron'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { RequestPayload } from '../../src/types/requestLogic'

ipcMain.on('request:send', async (event, payload: RequestPayload) => {
    try {
        console.log('[logic] Received request:send', payload)
        // 构造 axios 请求参数
        const config: AxiosRequestConfig = {
            url: payload.url,
            method: payload.method,
            headers: {},
            params: {},
            data: undefined,
        }
        // 处理 headers
        if (Array.isArray(payload.headers)) {
        for (const h of payload.headers) {
            if (h.enabled && h.key) config.headers![h.key] = h.value
        }
        }
        // 处理 params
        if (Array.isArray(payload.params)) {
            for (const p of payload.params) {
                if (p.enabled && p.key) config.params![p.key] = p.value
            }
        }
        // 处理 body
        if (payload.bodyMode === 'json') {
            config.data = payload.bodyText
            config.headers = config.headers || {}
            if (!config.headers['Content-Type']) config.headers['Content-Type'] = 'application/json'
        } else if (payload.bodyMode === 'form-data' && Array.isArray(payload.bodyFormData)) {
            const formData: Record<string, any> = {}
            for (const f of payload.bodyFormData) {
                if (f.enabled && f.key) formData[f.key] = f.value
            }
            config.data = formData
            config.headers = config.headers || {}
            if (!config.headers['Content-Type']) config.headers['Content-Type'] = 'multipart/form-data'
        } else if (payload.bodyMode === 'text') {
            config.data = payload.bodyText
            config.headers = config.headers || {}
            if (!config.headers['Content-Type']) config.headers['Content-Type'] = 'text/plain'
        } else if (payload.bodyMode === 'xml') {
            config.data = payload.bodyText
            config.headers = config.headers || {}
            if (!config.headers['Content-Type']) config.headers['Content-Type'] = 'application/xml'
        }
        // 发起请求
        let response: AxiosResponse
        try {
            response = await axios(config)
        } catch (err: any) {
            // 返回错误信息
            event.reply('request:send:error', err?.message || String(err))
            return
        }
        // 返回响应数据
        event.reply('request:send:success', {
            ok: true,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
        })
    } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        event.reply('request:send:error', errMsg)
    }
})
