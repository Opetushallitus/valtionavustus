import HttpUtil from 'soresu-form/web/HttpUtil'

export const initErrorLogger = () => window.onerror = (message, source, lineno, colno, error) => {
  HttpUtil.post(`/errorlogger`, {userAgent: navigator.userAgent,stacktrace: error.stack})
}
