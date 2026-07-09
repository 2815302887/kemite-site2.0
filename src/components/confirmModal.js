(function () {
  function confirmAction(message) {
    return Promise.resolve(window.confirm(message))
  }

  window.KemiteComponents = {
    ...(window.KemiteComponents || {}),
    confirmAction,
  }
})()
