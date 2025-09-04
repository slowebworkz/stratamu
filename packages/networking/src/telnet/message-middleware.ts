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
      emit('error', clientId, { message: err.message })
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
