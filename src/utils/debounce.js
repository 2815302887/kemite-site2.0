(function () {
  function debounce(fn, wait = 250) {
    let timer = null
    return function debounced(...args) {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => fn.apply(this, args), wait)
    }
  }

  function throttle(fn, wait = 250) {
    let lastRun = 0
    let timer = null
    return function throttled(...args) {
      const now = Date.now()
      const remaining = wait - (now - lastRun)
      if (remaining <= 0) {
        window.clearTimeout(timer)
        timer = null
        lastRun = now
        fn.apply(this, args)
        return
      }
      if (!timer) {
        timer = window.setTimeout(() => {
          lastRun = Date.now()
          timer = null
          fn.apply(this, args)
        }, remaining)
      }
    }
  }

  window.KemiteTiming = { debounce, throttle }
})()
