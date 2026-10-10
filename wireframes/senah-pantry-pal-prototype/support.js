/* Minimal Design Canvas runtime so Senah's .dc.html prototypes can run in a browser. */
(function () {
  function get(obj, path) {
    if (!path) return undefined
    return String(path)
      .trim()
      .split(".")
      .reduce((cur, key) => (cur == null ? undefined : cur[key]), obj)
  }

  function setAttr(el, name, value) {
    if (value == null || value === false) {
      el.removeAttribute(name)
      return
    }
    if (value === true) el.setAttribute(name, "")
    else el.setAttribute(name, String(value))
  }

  class DCLogic {
    constructor(props) {
      this.props = props || {}
      this.state = {}
      this._root = null
      this._template = null
      this._pending = false
    }

    setState(patch) {
      const next = typeof patch === "function" ? patch(this.state) : patch
      this.state = Object.assign({}, this.state, next)
      if (typeof this.componentDidUpdate === "function") {
        try {
          this.componentDidUpdate()
        } catch (_) {}
      }
      this.scheduleRender()
    }

    scheduleRender() {
      if (this._pending) return
      this._pending = true
      queueMicrotask(() => {
        this._pending = false
        this.mount(this._root)
      })
    }

    mount(root) {
      if (!root || !this._template) return
      this._root = root
      const vals = this.renderVals ? this.renderVals() : {}
      const frag = this._template.cloneNode(true)
      this.bindNode(frag, vals, {})
      root.replaceChildren()
      while (frag.firstChild) root.appendChild(frag.firstChild)
      this.placeApp()
    }

    placeApp() {
      const app = this._root.querySelector(".app")
      if (!app) return
      Object.assign(document.body.style, {
        margin: "0",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#e4ddd0",
      })
      app.style.margin = "16px auto"
      app.style.boxShadow = "0 18px 50px rgba(43,42,39,0.18)"
      app.style.border = "6px solid #2b2a27"
      app.style.borderRadius = "2rem"
    }

    bindNode(node, vals, scope) {
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        Array.from(node.childNodes).forEach((child) => this.bindNode(child, vals, scope))
        return
      }
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.nodeValue && node.nodeValue.includes("{{")) {
          node.nodeValue = this.interpolate(node.nodeValue, vals, scope)
        }
        return
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return

      const tag = node.tagName.toLowerCase()
      if (tag === "helmet") {
        Array.from(node.children).forEach((child) => {
          if (child.tagName === "STYLE" && !document.getElementById("dc-style")) {
            const style = document.createElement("style")
            style.id = "dc-style"
            style.textContent = child.textContent
            document.head.appendChild(style)
          }
          if (child.tagName === "LINK") {
            const href = child.getAttribute("href")
            if (href && !document.querySelector(`link[href="${href}"]`)) {
              document.head.appendChild(child.cloneNode(true))
            }
          }
        })
        node.remove()
        return
      }

      if (tag === "sc-if") {
        const expr = (node.getAttribute("value") || "").replace(/^\{\{\s*|\s*\}\}$/g, "")
        const show = Boolean(this.resolve(expr, vals, scope))
        if (!show) {
          node.remove()
          return
        }
        const parent = node.parentNode
        while (node.firstChild) {
          const child = node.firstChild
          parent.insertBefore(child, node)
          this.bindNode(child, vals, scope)
        }
        node.remove()
        return
      }

      if (tag === "sc-for") {
        const listExpr = (node.getAttribute("list") || "").replace(/^\{\{\s*|\s*\}\}$/g, "")
        const as = node.getAttribute("as") || "item"
        const list = this.resolve(listExpr, vals, scope)
        const parent = node.parentNode
        const templateKids = Array.from(node.childNodes)
        if (Array.isArray(list)) {
          list.forEach((item) => {
            const local = Object.assign({}, scope, { [as]: item })
            templateKids.forEach((kid) => {
              const clone = kid.cloneNode(true)
              parent.insertBefore(clone, node)
              this.bindNode(clone, vals, local)
            })
          })
        }
        node.remove()
        return
      }

      Array.from(node.attributes || []).forEach((attr) => {
        const name = attr.name
        const raw = attr.value
        if (name === "onClick" || name === "onclick") {
          const expr = raw.replace(/^\{\{\s*|\s*\}\}$/g, "")
          const handler = this.resolve(expr, vals, scope)
          node.removeAttribute(name)
          if (typeof handler === "function") {
            node.addEventListener("click", (event) => {
              event.preventDefault()
              handler(event)
            })
          }
          return
        }
        if (name === "onChange" || name === "onchange") {
          const expr = raw.replace(/^\{\{\s*|\s*\}\}$/g, "")
          const handler = this.resolve(expr, vals, scope)
          node.removeAttribute(name)
          if (typeof handler === "function") {
            node.addEventListener("input", (event) => handler(event))
            node.addEventListener("change", (event) => handler(event))
          }
          return
        }
        if (raw.includes("{{")) {
          const value = this.interpolate(raw, vals, scope)
          if (name === "class" || name === "className") node.className = value
          else if (name === "value") node.value = value
          else if (name === "aria-pressed") setAttr(node, "aria-pressed", value)
          else setAttr(node, name, value)
        }
      })

      Array.from(node.childNodes).forEach((child) => this.bindNode(child, vals, scope))
    }

    interpolate(text, vals, scope) {
      return String(text).replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr) => {
        const value = this.resolve(expr, vals, scope)
        if (value == null || typeof value === "function") return ""
        return String(value)
      })
    }

    resolve(expr, vals, scope) {
      const path = String(expr || "").trim()
      if (!path) return undefined
      if (Object.prototype.hasOwnProperty.call(scope, path.split(".")[0])) return get(scope, path)
      return get(vals, path)
    }
  }

  window.DCLogic = DCLogic

  function boot() {
    document.querySelectorAll("x-dc").forEach((host) => {
      const script = host.parentElement
        ? Array.from(host.parentElement.querySelectorAll('script[type="text/x-dc"]')).find(Boolean)
        : null
      const fallback = document.querySelector('script[type="text/x-dc"]')
      const source = script || fallback
      if (!source) return

      const template = document.createDocumentFragment()
      Array.from(host.childNodes).forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === "script") return
        template.appendChild(child.cloneNode(true))
      })

      let props = {}
      try {
        props = JSON.parse(source.getAttribute("data-props") || "{}")
      } catch (_) {}

      const runner = new Function("DCLogic", `${source.textContent}\n;return Component;`)
      const Component = runner(DCLogic)
      const instance = new Component(props)
      instance._template = template
      host.replaceChildren()
      instance.mount(host)
    })
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot)
  else boot()
})()
