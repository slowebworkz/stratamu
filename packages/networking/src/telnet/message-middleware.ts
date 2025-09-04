/**
 * Async/sync middleware chain handler for TelnetAdapter
 */
export async function handleMessageWithMiddleware(
  middlewares: Array<
    (
      clientId: string,
      message: any,
      next: (err?: Error) => void | Promise<void>
    ) => void | Promise<void>
  >,
  emit: (event: string, clientId: string, data?: any) => void,
  clientId: string,
  message: any
) {
  let index = 0
  const next = async (err?: Error) => {
    if (err) {
      // Emit a richer error object for debugging
      const errorObj: Record<string, any> = {
        message: err.message,
        stack: err.stack
      }
      // Copy all enumerable properties from the error
      for (const key of Object.keys(err)) {
        errorObj[key] = (err as any)[key]
      }
      emit('error', clientId, errorObj)
      return
    }
    const mw = middlewares[index++]
    if (mw) {
      try {
        await Promise.resolve(mw(clientId, message, next))
      } catch (err) {
        await next(err as Error)
      }
    } else {
      emit('message', clientId, message)
    }
  }
  await next()
}
