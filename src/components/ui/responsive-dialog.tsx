"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

interface ResponsiveDialogProps {
  children: React.ReactNode
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
}

interface ResponsiveDialogContentProps {
  className?: string
  children: React.ReactNode
}

interface ResponsiveDialogHeaderProps {
  children: React.ReactNode
}

interface ResponsiveDialogTitleProps {
  children: React.ReactNode
}

interface ResponsiveDialogDescriptionProps {
  children: React.ReactNode
}

interface ResponsiveDialogFooterProps {
  children: React.ReactNode
}

interface ResponsiveDialogTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const ResponsiveDialog = ({ children, ...props }: ResponsiveDialogProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const ResponsiveDialogImpl = isDesktop ? Dialog : Drawer

  return <ResponsiveDialogImpl {...props}>{children}</ResponsiveDialogImpl>
}

const ResponsiveDialogTrigger = ({ children, ...props }: ResponsiveDialogTriggerProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const ResponsiveDialogTriggerImpl = isDesktop ? DialogTrigger : DrawerTrigger

  return <ResponsiveDialogTriggerImpl {...props}>{children}</ResponsiveDialogTriggerImpl>
}

const ResponsiveDialogContent = ({ children, className, ...props }: ResponsiveDialogContentProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <DialogContent className={className} {...props}>
        {children}
      </DialogContent>
    )
  }

  return (
    <DrawerContent className={className} {...props}>
      {children}
    </DrawerContent>
  )
}

const ResponsiveDialogHeader = ({ children }: ResponsiveDialogHeaderProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const ResponsiveDialogHeaderImpl = isDesktop ? DialogHeader : DrawerHeader

  return <ResponsiveDialogHeaderImpl>{children}</ResponsiveDialogHeaderImpl>
}

const ResponsiveDialogTitle = ({ children }: ResponsiveDialogTitleProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const ResponsiveDialogTitleImpl = isDesktop ? DialogTitle : DrawerTitle

  return <ResponsiveDialogTitleImpl>{children}</ResponsiveDialogTitleImpl>
}

const ResponsiveDialogDescription = ({ children }: ResponsiveDialogDescriptionProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const ResponsiveDialogDescriptionImpl = isDesktop ? DialogDescription : DrawerDescription

  return <ResponsiveDialogDescriptionImpl>{children}</ResponsiveDialogDescriptionImpl>
}

const ResponsiveDialogFooter = ({ children }: ResponsiveDialogFooterProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return <div className="flex justify-end space-x-2">{children}</div>
  }

  return <DrawerFooter>{children}</DrawerFooter>
}

const ResponsiveDialogClose = ({ children }: { children: React.ReactNode }) => {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return <>{children}</>
  }

  return <DrawerClose asChild>{children}</DrawerClose>
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogClose,
}