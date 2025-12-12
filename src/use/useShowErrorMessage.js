import { Dialog } from 'quasar'
export function useShowErrorMessage(message) {
 Dialog.create({
  tittle:'Error',
  message
 })
}