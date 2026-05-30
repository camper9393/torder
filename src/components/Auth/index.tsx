"use client"
import React from "react"
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog"
import SignIn from "./SignIn"
import Singup from "./Singup"
import toast from "react-hot-toast"
import { ApiResponse } from "@/utils/api"
import { useAppDispatch } from "@/hook/redux"
import { setMerchant } from "@/store/reducer/merchant"
import { getApi } from "@/utils/common"
import { SESSION } from "@/utils/APIConstant"
import { IMerchants } from "@/types/merchant"

function AuthDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [panel, setPanel] = React.useState(false)
  const [checking, setChecking] = React.useState(false)
  const dispatch = useAppDispatch()

  const handleChange = () => setPanel((p) => !p)

  React.useEffect(() => {
    if (!open) return

    const checkSession = async () => {
      setChecking(true)

      try {
        const res = await getApi<ApiResponse<IMerchants>>({
          url: SESSION,
        })

        if (res?.success) {
          toast.success(`Welcome back ${res.data.name} 👋`)
          dispatch(setMerchant(res.data))
          onClose()
        }
      } catch {
        // silent fail
      } finally {
        setChecking(false)
      }
    }

    checkSession()
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl bg-[#F8F5F0] px-6 py-8">
        <DialogTitle className="sr-only">
          {panel ? "Login to Qr Menu" : "Get Started with Qr Menu"}
        </DialogTitle>
        {checking ? (
          <p className="text-center text-sm text-zinc-500">
            Checking session...
          </p>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-zinc-900">
                {!panel ? `Get Started with Qr Menu` : "Login to Qr Menu"}
              </h2>
            </div>

            {panel ? (
              <SignIn onChange={handleChange} onClose={onClose} />
            ) : (
              <Singup onChange={handleChange} onClose={onClose} />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AuthDialog
