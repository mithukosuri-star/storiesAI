import { createServer } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { default: Landing } = await vite.ssrLoadModule('/src/pages/Landing.tsx')
const { StoreProvider } = await vite.ssrLoadModule('/src/lib/store.tsx')
const { ToastProvider } = await vite.ssrLoadModule('/src/components/Overlays.tsx')
const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(StoreProvider, null, React.createElement(ToastProvider, null, React.createElement(Landing)))))
const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
console.log('LEN', text.length)
console.log(text.slice(2900))
console.log('\n--- object leaks:', (html.match(/\[object Object\]/g) || []).length)
await vite.close()
